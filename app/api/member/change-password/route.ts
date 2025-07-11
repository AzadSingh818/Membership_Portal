// app/api/member/change-password/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@vercel/postgres'
import bcrypt from 'bcryptjs'

// ✅ FIXED: Use same auth method as middleware (base64 decoding)
function verifyToken(token: string): any {
  try {
    const decoded = JSON.parse(Buffer.from(token, 'base64').toString())
    
    // Check if token is expired
    if (decoded.exp && decoded.exp < Math.floor(Date.now() / 1000)) {
      console.log('❌ Token expired')
      return null
    }
    
    console.log('✅ Token verified successfully:', { 
      email: decoded.email, 
      role: decoded.role,
      membershipId: decoded.membershipId 
    })
    return decoded
  } catch (error: any) {
    console.error('❌ Token verification error:', error.message)
    return null
  }
}

// ✅ FIXED: Use same token retrieval method as middleware
async function verifyMemberToken(request: NextRequest) {
  try {
    // Get token using same method as middleware
    let authToken = request.cookies.get('auth-token')?.value || 
                   request.cookies.get('auth_token')?.value ||
                   request.cookies.get('member-token')?.value ||
                   request.cookies.get('admin-token')?.value

    // Also check Authorization header as fallback
    if (!authToken) {
      const authHeader = request.headers.get('authorization')
      if (authHeader?.startsWith('Bearer ')) {
        authToken = authHeader.substring(7)
      }
    }

    if (!authToken) {
      console.log('❌ No authentication token found')
      return { error: 'No authentication token', status: 401 }
    }

    // ✅ FIXED: Use same verification method as middleware
    const decoded = verifyToken(authToken)
    if (!decoded) {
      return { error: 'Invalid or expired token', status: 401 }
    }

    return { 
      membershipId: decoded.membershipId,
      email: decoded.email,
      memberId: decoded.id,
      role: decoded.role,
      status: decoded.status,
      organizationId: decoded.organization_id
    }
  } catch (error: any) {
    console.error('❌ Token verification failed:', error.message)
    return { error: 'Invalid or expired token', status: 401 }
  }
}

// Helper function to get member password hash from database
async function getMemberPasswordHash(membershipId?: string, email?: string, memberId?: number): Promise<{id: number, password_hash?: string, temporary_password?: string} | null> {
  try {
    console.log('🔍 Getting member password hash:', { membershipId, email, memberId })

    let member = null

    // Strategy 1: Try member_applications table first
    if (membershipId) {
      try {
        const result = await sql`
          SELECT id, password_hash, temporary_password
          FROM member_applications
          WHERE membership_id = ${membershipId}
          LIMIT 1
        `

        if (result.rows.length > 0) {
          member = result.rows[0]
          console.log('✅ Member password found in member_applications')
        }
      } catch (error: any) {
        console.log('❌ member_applications password query failed:', error.message)
      }
    }

    // Strategy 2: Try members table
    if (!member && membershipId) {
      try {
        const result = await sql`
          SELECT id, password_hash, temporary_password
          FROM members
          WHERE membership_id = ${membershipId}
          LIMIT 1
        `

        if (result.rows.length > 0) {
          member = result.rows[0]
          console.log('✅ Member password found in members table')
        }
      } catch (error: any) {
        console.log('❌ members password query failed:', error.message)
      }
    }

    // Strategy 3: Try by email
    if (!member && email) {
      try {
        const result = await sql`
          SELECT id, password_hash, temporary_password
          FROM member_applications
          WHERE email = ${email}
          ORDER BY created_at DESC
          LIMIT 1
        `

        if (result.rows.length > 0) {
          member = result.rows[0]
          console.log('✅ Member password found by email')
        }
      } catch (error: any) {
        console.log('❌ Email password query failed:', error.message)
      }
    }

    // Strategy 4: Try admin_users table as fallback (if member is also admin)
    if (!member && email) {
      try {
        const result = await sql`
          SELECT id, password_hash
          FROM admin_users
          WHERE email = ${email}
          LIMIT 1
        `

        if (result.rows.length > 0) {
          member = result.rows[0]
          console.log('✅ Member password found in admin_users table')
        }
      } catch (error: any) {
        console.log('❌ admin_users password query failed:', error.message)
      }
    }

    if (member) {
      // Ensure the returned object matches the expected type
      return {
        id: Number(member.id),
        password_hash: member.password_hash,
        temporary_password: member.temporary_password
      }
    }
    return null
  } catch (error: any) {
    console.error('❌ Error getting member password hash:', error)
    throw error
  }
}

// Helper function to update member password in database
async function updateMemberPassword(memberId: number, newPasswordHash: string): Promise<boolean> {
  try {
    console.log('🔐 Updating password for member ID:', memberId)

    let updateSuccess = false

    // Strategy 1: Update in member_applications table
    try {
      const result = await sql`
        UPDATE member_applications 
        SET password_hash = ${newPasswordHash}, 
            temporary_password = NULL,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ${memberId}
        RETURNING id
      `

      if (result.rowCount && result.rowCount > 0) {
        updateSuccess = true
        console.log('✅ Password updated in member_applications table')
      }
    } catch (error: any) {
      console.log('❌ Failed to update password in member_applications:', error.message)
    }

    // Strategy 2: Update in members table if first strategy failed
    if (!updateSuccess) {
      try {
        const result = await sql`
          UPDATE members 
          SET password_hash = ${newPasswordHash},
              temporary_password = NULL,
              updated_at = CURRENT_TIMESTAMP
          WHERE id = ${memberId}
          RETURNING id
        `

        if (result.rowCount && result.rowCount > 0) {
          updateSuccess = true
          console.log('✅ Password updated in members table')
        }
      } catch (error: any) {
        console.log('❌ Failed to update password in members table:', error.message)
      }
    }

    // Strategy 3: Update in admin_users table as fallback
    if (!updateSuccess) {
      try {
        const result = await sql`
          UPDATE admin_users 
          SET password_hash = ${newPasswordHash},
              updated_at = CURRENT_TIMESTAMP
          WHERE id = ${memberId}
          RETURNING id
        `

        if (result.rowCount && result.rowCount > 0) {
          updateSuccess = true
          console.log('✅ Password updated in admin_users table')
        }
      } catch (error: any) {
        console.log('❌ Failed to update password in admin_users table:', error.message)
      }
    }

    return updateSuccess
  } catch (error: any) {
    console.error('❌ Error updating member password:', error)
    return false
  }
}

// POST - Change member password
export async function POST(request: NextRequest) {
  try {
    console.log('🔐 POST /api/member/change-password - Changing member password')

    // ✅ FIXED: Use middleware-compatible authentication
    const authResult = await verifyMemberToken(request)
    if ('error' in authResult) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: authResult.status }
      )
    }

    // Parse request body
    const { currentPassword, newPassword } = await request.json()

    // Validate input
    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { success: false, error: 'Current password and new password are required' },
        { status: 400 }
      )
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { success: false, error: 'New password must be at least 8 characters long' },
        { status: 400 }
      )
    }

    // Get member's current password hash
    const memberData = await getMemberPasswordHash(
      authResult.membershipId,
      authResult.email,
      authResult.memberId
    )

    if (!memberData) {
      return NextResponse.json(
        { success: false, error: 'Member not found' },
        { status: 404 }
      )
    }

    // Check if member has a password hash (some members might only have temporary passwords)
    const currentPasswordHash = memberData.password_hash || memberData.temporary_password
    
    if (!currentPasswordHash) {
      return NextResponse.json(
        { success: false, error: 'No password set for this account. Please contact admin.' },
        { status: 400 }
      )
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, currentPasswordHash)
    
    if (!isCurrentPasswordValid) {
      return NextResponse.json(
        { success: false, error: 'Current password is incorrect' },
        { status: 400 }
      )
    }

    // Hash new password
    const saltRounds = 12
    const newPasswordHash = await bcrypt.hash(newPassword, saltRounds)

    // Update password in database
    const updateSuccess = await updateMemberPassword(memberData.id, newPasswordHash)

    if (!updateSuccess) {
      return NextResponse.json(
        { success: false, error: 'Failed to update password. Please try again.' },
        { status: 500 }
      )
    }

    console.log('🎉 Password changed successfully for member ID:', memberData.id)

    // Return success response (don't include sensitive data)
    return NextResponse.json({
      success: true,
      message: 'Password changed successfully'
    })

  } catch (error: any) {
    console.error('❌ Error in POST /api/member/change-password:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to change password' },
      { status: 500 }
    )
  }
}