// app/api/member/send-otp/route.ts - FIXED VERSION
import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@vercel/postgres'

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

async function sendPhoneSMS(phone: string, otp: string): Promise<boolean> {
  try {
    // In production, integrate with SMS service like Twilio, AWS SNS, etc.
    console.log(`📱 SMS OTP to ${phone}: ${otp}`)
    
    // For demo purposes, we'll simulate successful SMS sending
    console.log(`✅ OTP sent successfully to ${phone}`)
    return true
  } catch (error) {
    console.error('❌ Failed to send SMS:', error)
    return false
  }
}

function generateJWTToken(memberData: any): string {
  // Simple token generation for demo - use proper JWT in production
  const tokenData = {
    id: memberData.id,
    membershipId: memberData.membership_id,
    email: memberData.email,
    role: 'member',
    status: memberData.status,
    exp: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
    iat: Date.now()
  }
  return Buffer.from(JSON.stringify(tokenData)).toString('base64')
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { membershipId, otp } = body

    // If OTP is not provided, treat as OTP send request
    if (!otp) {
      console.log('📱 Sending OTP for member:', membershipId)

      if (!membershipId) {
        return NextResponse.json({ 
          error: 'Membership ID is required' 
        }, { status: 400 })
      }

      // Get member details (try both tables)
      let memberData = null

      // Check approved members first
      const approvedResult = await sql`
        SELECT phone, first_name, last_name FROM members 
        WHERE membership_id = ${membershipId} AND status = 'approved'
      `

      if (approvedResult.rows.length > 0) {
        memberData = approvedResult.rows[0]
      } else {
        // Check pending applications (in case they need OTP too)
        const pendingResult = await sql`
          SELECT phone, first_name, last_name FROM member_applications 
          WHERE membership_id = ${membershipId}
        `
        
        if (pendingResult.rows.length > 0) {
          memberData = pendingResult.rows[0]
        }
      }

      if (!memberData || !memberData.phone) {
        return NextResponse.json({ 
          error: 'Member not found or phone number not available' 
        }, { status: 404 })
      }

      const otpCode = generateOTP()
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000) // 5 minutes

      // Store OTP in database
      try {
        // Delete any existing OTPs for this member
        await sql`
          DELETE FROM otp_verifications 
          WHERE contact = ${memberData.phone} AND contact_type = 'phone'
        `

        // Insert new OTP
        await sql`
          INSERT INTO otp_verifications (
            contact, otp_code, contact_type, expires_at, created_at
          )
          VALUES (
            ${memberData.phone}, ${otpCode}, 'phone', ${expiresAt.toISOString()}, NOW()
          )
        `
      } catch (dbError) {
        console.error('❌ Database error storing OTP:', dbError)
        return NextResponse.json({ 
          error: 'Failed to generate OTP. Please try again.' 
        }, { status: 500 })
      }

      // Send SMS
      const smsSent = await sendPhoneSMS(memberData.phone, otpCode)
      
      if (!smsSent) {
        return NextResponse.json({ 
          error: 'Failed to send OTP. Please try again.' 
        }, { status: 500 })
      }

      const maskedPhone = memberData.phone.replace(/(\+?\d{2,3})\d+(\d{4})/, '$1****$2')

      return NextResponse.json({
        success: true,
        message: `OTP sent to ${maskedPhone}`,
        maskedPhone: maskedPhone,
        expiresInMinutes: 5,
        memberName: `${memberData.first_name} ${memberData.last_name}`
      })
    }

    // OTP is provided, treat as OTP verification request
    console.log('🔐 Verifying OTP for member:', membershipId)

    if (!membershipId || !otp) {
      return NextResponse.json({ 
        error: 'Membership ID and OTP are required' 
      }, { status: 400 })
    }

    // Get member data
    let memberData = null
    
    const approvedResult = await sql`
      SELECT * FROM members 
      WHERE membership_id = ${membershipId} AND status = 'approved'
    `

    if (approvedResult.rows.length > 0) {
      memberData = approvedResult.rows[0]
    }

    if (!memberData) {
      return NextResponse.json({ 
        error: 'Invalid membership ID or member not approved' 
      }, { status: 404 })
    }

    // Verify OTP
    const otpResult = await sql`
      SELECT * FROM otp_verifications 
      WHERE contact = ${memberData.phone} 
        AND otp_code = ${otp} 
        AND contact_type = 'phone'
        AND expires_at > NOW()
        AND used = false
    `

    if (otpResult.rows.length === 0) {
      return NextResponse.json({ 
        error: 'Invalid or expired OTP. Please request a new one.' 
      }, { status: 400 })
    }

    // Mark OTP as used
    await sql`
      UPDATE otp_verifications 
      SET used = true 
      WHERE contact = ${memberData.phone} AND otp_code = ${otp}
    `

    // Generate token
    const token = generateJWTToken(memberData)

    console.log('✅ Member login successful:', memberData.membership_id)

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
        organizationId: memberData.organization_id,
        status: memberData.status
      },
      redirectUrl: '/member/dashboard'
    })

    // Set HTTP-only cookie
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 // 24 hours
    })

    return response

  } catch (error) {
    console.error('❌ Error in POST handler:', error)
    return NextResponse.json({ 
      error: 'Request failed. Please try again.' 
    }, { status: 500 })
  }
}