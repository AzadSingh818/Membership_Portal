// app/api/member/login/route.ts - FIXED VERSION

import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@vercel/postgres'
import bcrypt from 'bcryptjs'

// ✅ FIXED: Use same token generation as middleware expects (base64)
function generateToken(payload: any): string {
  const tokenData = {
    ...payload,
    exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24 hours
    iat: Math.floor(Date.now() / 1000)
  }
  
  // ✅ Base64 encode instead of JWT
  return Buffer.from(JSON.stringify(tokenData)).toString('base64')
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { membershipId, password } = body

    console.log('🔐 Member login attempt:', { membershipId })

    if (!membershipId || !password) {
      return NextResponse.json({ 
        error: 'Membership ID and password are required' 
      }, { status: 400 })
    }

    // ✅ FIXED: Better database query with proper error handling
    let memberData = null
    let source = null

    // Strategy 1: Try member_applications table first
    try {
      console.log('🔍 Checking member_applications table...')
      const result = await sql`
        SELECT 
          ma.*,
          o.name as organization_name
        FROM member_applications ma
        LEFT JOIN organizations o ON ma.organization_id = o.id
        WHERE ma.membership_id = ${membershipId}
        ORDER BY ma.created_at DESC
        LIMIT 1
      `

      if (result.rows.length > 0) {
        memberData = result.rows[0]
        source = 'member_applications'
        console.log('✅ Member found in member_applications table')
      }
    } catch (error: any) {
      console.log('❌ member_applications query failed:', error.message)
    }

    // Strategy 2: Try members table as fallback
    if (!memberData) {
      try {
        console.log('🔍 Checking members table...')
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
          memberData = result.rows[0]
          source = 'members'
          console.log('✅ Member found in members table')
        }
      } catch (error: any) {
        console.log('❌ members query failed:', error.message)
      }
    }

    // Strategy 3: Try users table as fallback
    if (!memberData) {
      try {
        console.log('🔍 Checking users table...')
        const result = await sql`
          SELECT 
            u.*,
            o.name as organization_name
          FROM users u
          LEFT JOIN organizations o ON u.organization_id = o.id
          WHERE u.membership_id = ${membershipId}
          LIMIT 1
        `

        if (result.rows.length > 0) {
          memberData = result.rows[0]
          source = 'users'
          console.log('✅ Member found in users table')
        }
      } catch (error: any) {
        console.log('❌ users query failed:', error.message)
      }
    }

    if (!memberData) {
      console.log('❌ Member not found:', membershipId)
      return NextResponse.json({ 
        error: 'Invalid membership ID. Please check your credentials.' 
      }, { status: 401 })
    }

    console.log('📋 Member data found:', {
      id: memberData.id,
      membership_id: memberData.membership_id,
      email: memberData.email,
      status: memberData.status,
      source: source,
      hasPasswordHash: !!memberData.password_hash,
      passwordHashType: typeof memberData.password_hash
    })

    // ✅ FIXED: Validate password hash before bcrypt.compare()
    if (!memberData.password_hash) {
      console.log('❌ No password hash found for member')
      return NextResponse.json({ 
        error: 'Account not properly configured. Please contact support.' 
      }, { status: 500 })
    }

    // ✅ FIXED: Ensure password_hash is a string
    let passwordHash = memberData.password_hash
    if (typeof passwordHash !== 'string') {
      console.log('❌ Password hash is not a string:', typeof passwordHash)
      console.log('Password hash value:', passwordHash)
      
      // Try to convert to string if it's an object
      if (passwordHash && typeof passwordHash === 'object') {
        passwordHash = passwordHash.toString()
      } else {
        return NextResponse.json({ 
          error: 'Account data corrupted. Please contact support.' 
        }, { status: 500 })
      }
    }

    // ✅ FIXED: Ensure password is a string
    if (typeof password !== 'string') {
      return NextResponse.json({ 
        error: 'Invalid password format' 
      }, { status: 400 })
    }

    console.log('🔐 About to verify password:', {
      passwordType: typeof password,
      passwordLength: password.length,
      hashType: typeof passwordHash,
      hashLength: passwordHash.length
    })

    // ✅ FIXED: Safe bcrypt comparison with proper error handling
    let isValidPassword = false
    try {
      isValidPassword = await bcrypt.compare(password, passwordHash)
      console.log('🔐 Password verification result:', isValidPassword)
    } catch (bcryptError: any) {
      console.error('❌ Bcrypt comparison error:', bcryptError)
      return NextResponse.json({ 
        error: 'Password verification failed. Please contact support.' 
      }, { status: 500 })
    }

    if (!isValidPassword) {
      console.log('❌ Invalid password for member:', membershipId)
      return NextResponse.json({ 
        error: 'Invalid password. Please check your credentials.' 
      }, { status: 401 })
    }

    // ✅ Check member status and provide appropriate response
    console.log('✅ Password verified, checking status:', memberData.status)

    if (memberData.status === 'rejected') {
      return NextResponse.json({ 
        error: 'Membership Application Rejected',
        message: 'Your membership application was rejected by the admin. Contact your organization for assistance.',
        status: 'rejected'
      }, { status: 403 })
    }

    if (memberData.status === 'pending') {
      // ✅ Generate token for pending members (limited access)
      const token = generateToken({
        id: memberData.id,
        membershipId: memberData.membership_id,
        email: memberData.email,
        role: 'member',
        status: 'pending',
        organizationId: memberData.organization_id
      })

      const response = NextResponse.json({
        success: true,
        message: 'Login successful - Limited access until admin approval',
        member: {
          id: memberData.id,
          membershipId: memberData.membership_id,
          firstName: memberData.first_name,
          lastName: memberData.last_name,
          email: memberData.email,
          phone: memberData.phone,
          organizationName: memberData.organization_name,
          status: memberData.status
        },
        accessLevel: 'limited',
        notice: {
          title: 'Pending Admin Approval',
          message: 'Your application is under review. You have limited access until approved.',
          restrictions: [
            'Cannot access full member dashboard',
            'Cannot download membership certificate',
            'Cannot access member directory',
            'Profile view is read-only'
          ]
        },
        redirectUrl: '/member/dashboard'
      })

      // ✅ Set auth cookie
      response.cookies.set('auth-token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 24 * 60 * 60 // 24 hours
      })

      return response
    }

    if (memberData.status === 'approved' || memberData.status === 'active') {
      // ✅ Generate token for approved members (full access)
      const token = generateToken({
        id: memberData.id,
        membershipId: memberData.membership_id,
        email: memberData.email,
        role: 'member',
        status: memberData.status,
        organizationId: memberData.organization_id
      })

      const response = NextResponse.json({
        success: true,
        message: 'Login successful! Welcome to your member dashboard.',
        member: {
          id: memberData.id,
          membershipId: memberData.membership_id,
          firstName: memberData.first_name,
          lastName: memberData.last_name,
          email: memberData.email,
          phone: memberData.phone,
          organizationName: memberData.organization_name,
          status: memberData.status
        },
        accessLevel: 'full',
        redirectUrl: '/member/dashboard'
      })

      // ✅ Set auth cookie
      response.cookies.set('auth-token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 24 * 60 * 60 // 24 hours
      })

      return response
    }

    // Fallback for unknown status
    return NextResponse.json({ 
      error: 'Account status unknown. Please contact support.',
      status: memberData.status 
    }, { status: 403 })

  } catch (error: any) {
    console.error('❌ Error during member login:', error)
    return NextResponse.json({ 
      error: 'Login failed. Please try again later.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 })
  }
}