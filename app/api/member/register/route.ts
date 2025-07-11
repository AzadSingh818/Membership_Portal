// app/api/member/register/route.ts - FIXED VERSION
import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@vercel/postgres'
import bcrypt from 'bcryptjs'

function generateMembershipId(orgName: string, firstName: string, lastName: string): string {
  const orgCode = orgName.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, 'X')
  const nameCode = (firstName.substring(0, 2) + lastName.substring(0, 2)).toUpperCase().replace(/[^A-Z]/g, 'X')
  const timestamp = Date.now().toString().slice(-6)
  const year = new Date().getFullYear().toString().slice(-2)
  
  return `${orgCode}${year}${nameCode}${timestamp}`
}

function generateTemporaryPassword(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let password = ''
  for (let i = 0; i < 8; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return password
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      organization_id,
      first_name,
      last_name,
      email,
      phone,
      address,
      designation,
      experience,
      achievements,
      payment_method,
      membership_id: providedMembershipId,
      temporary_password: providedPassword
    } = body

    console.log('📝 Member registration request received:', {
      organization_id,
      first_name,
      last_name,
      email
    })

    // Validate required fields
    if (!organization_id || !first_name || !last_name || !email || !phone || !address) {
      return NextResponse.json({ 
        error: 'Missing required fields: organization, first name, last name, email, phone, address' 
      }, { status: 400 })
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ 
        error: 'Invalid email format' 
      }, { status: 400 })
    }

    // Check if email or phone already exists
    const existingCheck = await sql`
      SELECT email, phone FROM member_applications 
      WHERE email = ${email} OR phone = ${phone}
      UNION
      SELECT email, phone FROM members 
      WHERE email = ${email} OR phone = ${phone}
    `

    if (existingCheck.rows.length > 0) {
      const existing = existingCheck.rows[0]
      if (existing.email === email) {
        return NextResponse.json({ 
          error: 'Email address is already registered' 
        }, { status: 409 })
      }
      if (existing.phone === phone) {
        return NextResponse.json({ 
          error: 'Phone number is already registered' 
        }, { status: 409 })
      }
    }

    // Get organization details for membership ID generation
    const orgResult = await sql`
      SELECT name FROM organizations WHERE id = ${organization_id}
    `

    if (orgResult.rows.length === 0) {
      return NextResponse.json({ 
        error: 'Invalid organization selected' 
      }, { status: 400 })
    }

    const organizationName = orgResult.rows[0].name

    // Generate membership ID and temporary password
    const membershipId = providedMembershipId || generateMembershipId(organizationName, first_name, last_name)
    const temporaryPassword = providedPassword || generateTemporaryPassword()
    const hashedPassword = await bcrypt.hash(temporaryPassword, 12)

    console.log('🆔 Generated credentials:', {
      membershipId,
      temporaryPassword: '***' // Don't log actual password
    })

    // Insert into member_applications table with pending status
    const result = await sql`
      INSERT INTO member_applications (
        organization_id,
        first_name,
        last_name,
        email,
        phone,
        address,
        designation,
        experience,
        achievements,
        payment_method,
        membership_id,
        password_hash,
        status,
        created_at
      )
      VALUES (
        ${organization_id},
        ${first_name},
        ${last_name},
        ${email},
        ${phone},
        ${address},
        ${designation || null},
        ${experience || null},
        ${achievements || null},
        ${payment_method || null},
        ${membershipId},
        ${hashedPassword},
        'pending',
        NOW()
      )
      RETURNING id, membership_id, first_name, last_name, email, created_at
    `

    if (result.rows.length === 0) {
      return NextResponse.json({ 
        error: 'Failed to create member application' 
      }, { status: 500 })
    }

    const newApplication = result.rows[0]

    console.log('✅ Member application created successfully:', {
      id: newApplication.id,
      membershipId: newApplication.membership_id
    })

    return NextResponse.json({
      success: true,
      message: 'Membership application submitted successfully!',
      membershipId: newApplication.membership_id,
      temporaryPassword: temporaryPassword,
      applicationId: newApplication.id,
      applicant: {
        name: `${newApplication.first_name} ${newApplication.last_name}`,
        email: newApplication.email,
        submittedAt: newApplication.created_at
      },
      important_notice: {
        status: 'PENDING ADMIN APPROVAL',
        message: 'You can login with these credentials, but access is limited until approved',
        next_steps: [
          'Your application has been sent to the organization admin',
          'You can login now but with limited access',
          'Wait for admin approval for full dashboard access',
          'You will receive notification once approved'
        ]
      }
    })

  } catch (error) {
    console.error('❌ Error during member registration:', error)
    
    return NextResponse.json({
      error: 'Registration failed. Please try again later.',
      details: process.env.NODE_ENV === 'development' ? 
        (error instanceof Error ? error.message : 'Unknown error') : 
        undefined
    }, { status: 500 })
  }
}