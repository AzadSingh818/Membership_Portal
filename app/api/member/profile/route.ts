// app/api/member/profile/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@vercel/postgres'

interface Member {
  id: number
  first_name: string
  last_name: string
  email: string
  phone?: string
  address?: string
  designation?: string
  experience?: string
  membership_id: string
  organization_name: string
  organization_id: number
  join_date: string
  status: string
  achievements?: string
  payment_method?: string
  created_at: string
}

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

// Helper function to fetch member data from database
async function fetchMemberFromDB(membershipId?: string, email?: string, memberId?: number): Promise<Member | null> {
  try {
    console.log('🔍 Fetching member data:', { membershipId, email, memberId })

    let member = null

    // Strategy 1: Try member_applications table first (most common for new registrations)
    if (membershipId) {
      try {
        const result = await sql`
          SELECT 
            ma.id,
            ma.first_name,
            ma.last_name,
            ma.email,
            ma.phone,
            ma.address,
            ma.designation,
            ma.experience,
            ma.membership_id,
            ma.status,
            ma.achievements,
            ma.payment_method,
            ma.created_at,
            ma.organization_id,
            o.name as organization_name
          FROM member_applications ma
          LEFT JOIN organizations o ON ma.organization_id = o.id
          WHERE ma.membership_id = ${membershipId}
          ORDER BY ma.created_at DESC
          LIMIT 1
        `

        if (result.rows.length > 0) {
          member = result.rows[0]
          member.join_date = member.created_at
          console.log('✅ Member found in member_applications:', member.membership_id)
        }
      } catch (error: any) {
        console.log('❌ member_applications table query failed:', error.message)
      }
    }

    // Strategy 2: Try members table (for approved members)
    if (!member && membershipId) {
      try {
        const result = await sql`
          SELECT 
            m.*,
            o.name as organization_name
          FROM members m
          LEFT JOIN organizations o ON m.organization_id = o.id
          WHERE m.membership_id = ${membershipId}
          LIMIT 1
        `

        if (result.rows.length > 0) {
          member = result.rows[0]
          console.log('✅ Member found in members table:', member.membership_id)
        }
      } catch (error: any) {
        console.log('❌ members table query failed:', error.message)
      }
    }

    // Strategy 3: Try by email if membership ID search failed
    if (!member && email) {
      try {
        const result = await sql`
          SELECT 
            ma.id,
            ma.first_name,
            ma.last_name,
            ma.email,
            ma.phone,
            ma.address,
            ma.designation,
            ma.experience,
            ma.membership_id,
            ma.status,
            ma.achievements,
            ma.payment_method,
            ma.created_at,
            ma.organization_id,
            o.name as organization_name
          FROM member_applications ma
          LEFT JOIN organizations o ON ma.organization_id = o.id
          WHERE ma.email = ${email}
          ORDER BY ma.created_at DESC
          LIMIT 1
        `

        if (result.rows.length > 0) {
          member = result.rows[0]
          member.join_date = member.created_at
          console.log('✅ Member found by email in member_applications:', member.email)
        }
      } catch (error: any) {
        console.log('❌ Email search in member_applications failed:', error.message)
      }
    }

    // Strategy 4: Try users table as fallback
    if (!member && email) {
      try {
        const result = await sql`
          SELECT 
            u.*,
            o.name as organization_name
          FROM users u
          LEFT JOIN organizations o ON u.organization_id = o.id
          WHERE u.email = ${email}
          LIMIT 1
        `

        if (result.rows.length > 0) {
          member = result.rows[0]
          console.log('✅ Member found in users table:', member.email)
        }
      } catch (error: any) {
        console.log('❌ users table query failed:', error.message)
      }
    }

    if (!member) {
      console.log('❌ No member found with provided credentials')
      return null
    }

    // Ensure required fields are present
    if (!member.join_date && member.created_at) {
      member.join_date = member.created_at
    }

    console.log('🎉 Member data fetched successfully:', {
      id: member.id,
      membership_id: member.membership_id,
      email: member.email,
      status: member.status
    })

    return member as Member
  } catch (error: any) {
    console.error('❌ Error fetching member from database:', error)
    throw error
  }
}

// GET - Fetch member profile data
export async function GET(request: NextRequest) {
  try {
    console.log('📥 GET /api/member/profile - Fetching member data')

    // ✅ FIXED: Use middleware-compatible authentication
    const authResult = await verifyMemberToken(request)
    if ('error' in authResult) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: authResult.status }
      )
    }

    // Fetch member data
    const member = await fetchMemberFromDB(
      authResult.membershipId,
      authResult.email,
      authResult.memberId
    )

    if (!member) {
      return NextResponse.json(
        { success: false, error: 'Member not found' },
        { status: 404 }
      )
    }

    // Return member data
    return NextResponse.json({
      success: true,
      member: member
    })

  } catch (error: any) {
    console.error('❌ Error in GET /api/member/profile:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch member data' },
      { status: 500 }
    )
  }
}

// PUT - Update member profile data
export async function PUT(request: NextRequest) {
  try {
    console.log('📝 PUT /api/member/profile - Updating member data')

    // ✅ FIXED: Use middleware-compatible authentication
    const authResult = await verifyMemberToken(request)
    if ('error' in authResult) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: authResult.status }
      )
    }

    // Get current member data first
    const currentMember = await fetchMemberFromDB(
      authResult.membershipId,
      authResult.email,
      authResult.memberId
    )

    if (!currentMember) {
      return NextResponse.json(
        { success: false, error: 'Member not found' },
        { status: 404 }
      )
    }

    // Parse request body
    const updateData = await request.json()
    console.log('📋 Update data received:', updateData)

    // Validate and sanitize update data
    const allowedFields = ['phone', 'address', 'designation', 'experience', 'achievements']
    const updates: any = {}

    for (const field of allowedFields) {
      if (updateData[field] !== undefined) {
        updates[field] = updateData[field]?.toString().trim() || null
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { success: false, error: 'No valid fields to update' },
        { status: 400 }
      )
    }

    console.log('✅ Validated updates:', updates)

    // Update in database - try member_applications first, then members table
    let updateSuccess = false
    
    // Strategy 1: Update in member_applications table
    try {
      const setClause = Object.keys(updates)
        .map((key, index) => `${key} = $${index + 2}`)
        .join(', ')
      
      const values = [currentMember.id, ...Object.values(updates)]
      
      const query = `
        UPDATE member_applications 
        SET ${setClause}, updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING *
      `

      const result = await sql.query(query, values)
      
      if (result.rowCount && result.rowCount > 0) {
        updateSuccess = true
        console.log('✅ Member updated in member_applications table')
      }
    } catch (error: any) {
      console.log('❌ Failed to update member_applications:', error.message)
    }

    // Strategy 2: Try members table if member_applications failed
    if (!updateSuccess) {
      try {
        const setClause = Object.keys(updates)
          .map((key, index) => `${key} = $${index + 2}`)
          .join(', ')
        
        const values = [currentMember.id, ...Object.values(updates)]
        
        const query = `
          UPDATE members 
          SET ${setClause}, updated_at = CURRENT_TIMESTAMP
          WHERE id = $1
          RETURNING *
        `

        const result = await sql.query(query, values)
        
        if (result.rowCount && result.rowCount > 0) {
          updateSuccess = true
          console.log('✅ Member updated in members table')
        }
      } catch (error: any) {
        console.log('❌ Failed to update members table:', error.message)
      }
    }

    if (!updateSuccess) {
      return NextResponse.json(
        { success: false, error: 'Failed to update member data' },
        { status: 500 }
      )
    }

    // Return success response
    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      updatedFields: Object.keys(updates)
    })

  } catch (error: any) {
    console.error('❌ Error in PUT /api/member/profile:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update member data' },
      { status: 500 }
    )
  }
}