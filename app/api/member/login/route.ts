// app/api/member/login/route.ts - FIXED VERSION
import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@vercel/postgres'
import bcrypt from 'bcryptjs'

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

    // Check in approved members first
    let memberData = null
    let source = null

    const approvedResult = await sql`
      SELECT 
        m.*,
        o.name as organization_name
      FROM members m
      LEFT JOIN organizations o ON m.organization_id = o.id
      WHERE m.membership_id = ${membershipId}
    `

    if (approvedResult.rows.length > 0) {
      memberData = approvedResult.rows[0]
      source = 'members'
    } else {
      // Try pending applications
      const pendingResult = await sql`
        SELECT 
          ma.*,
          o.name as organization_name
        FROM member_applications ma
        LEFT JOIN organizations o ON ma.organization_id = o.id
        WHERE ma.membership_id = ${membershipId}
      `

      if (pendingResult.rows.length > 0) {
        memberData = pendingResult.rows[0]
        source = 'applications'
      }
    }

    if (!memberData) {
      return NextResponse.json({ 
        error: 'Invalid membership ID. Please check your credentials.' 
      }, { status: 401 })
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, memberData.password_hash)
    if (!isValidPassword) {
      return NextResponse.json({ 
        error: 'Invalid password. Please check your credentials.' 
      }, { status: 401 })
    }

    // Check status and provide appropriate response
    if (memberData.status === 'rejected') {
      return NextResponse.json({ 
        error: 'Membership Application Rejected',
        message: 'Your membership application was rejected by the admin. Contact your organization for assistance.',
        status: 'rejected'
      }, { status: 403 })
    }

    if (memberData.status === 'pending') {
      return NextResponse.json({
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
        redirectUrl: '/member/pending-dashboard'
      })
    }

    if (memberData.status === 'approved') {
      // For approved members, we'll send OTP to phone
      return NextResponse.json({
        success: true,
        requiresOTP: true,
        message: 'Password verified. OTP will be sent to your registered phone number.',
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
        maskedPhone: memberData.phone ? memberData.phone.replace(/(\+?\d{2,3})\d+(\d{4})/, '$1****$2') : null,
        nextStep: 'otp_verification'
      })
    }

    // Fallback for unknown status
    return NextResponse.json({ 
      error: 'Account status unknown. Please contact support.' 
    }, { status: 403 })

  } catch (error) {
    console.error('❌ Error during member login:', error)
    return NextResponse.json({ 
      error: 'Login failed. Please try again later.' 
    }, { status: 500 })
  }
}