// app/api/auth/admin/quick-register/route.ts - CREATE THIS FILE
import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@vercel/postgres'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('🚀 Quick admin registration:', body)

    // Extract data (handle different formats)
    const {
      username,
      email, 
      password,
      firstName,
      lastName,
      phone,
      organizationId,
      role = 'admin',
      experience,
      appointerName
    } = body

    // Validate required fields
    if (!username || !email || !password || !firstName || !lastName) {
      return NextResponse.json({ 
        error: 'Missing required fields: username, email, password, firstName, lastName',
        received: { username: !!username, email: !!email, password: !!password, firstName: !!firstName, lastName: !!lastName }
      }, { status: 400 })
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ 
        error: 'Invalid email format' 
      }, { status: 400 })
    }

    // Validate password
    if (password.length < 6) {
      return NextResponse.json({ 
        error: 'Password must be at least 6 characters long' 
      }, { status: 400 })
    }

    // Check if username or email already exists
    const existingUser = await sql`
      SELECT id, username, email FROM admins 
      WHERE username = ${username.toLowerCase()} OR email = ${email.toLowerCase()}
    `
    
    if (existingUser.rows.length > 0) {
      const existing = existingUser.rows[0]
      if (existing.username === username.toLowerCase()) {
        return NextResponse.json({ 
          error: 'Username already exists. Please choose a different username.' 
        }, { status: 409 })
      }
      if (existing.email === email.toLowerCase()) {
        return NextResponse.json({ 
          error: 'Email already registered. Please use a different email address.' 
        }, { status: 409 })
      }
    }

    // Validate organization if provided
    if (organizationId) {
      const orgCheck = await sql`
        SELECT id, name FROM organizations 
        WHERE id = ${organizationId}
      `
      
      if (orgCheck.rows.length === 0) {
        return NextResponse.json({ 
          error: 'Selected organization not found' 
        }, { status: 400 })
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Insert new admin
    const result = await sql`
      INSERT INTO admins (
        username, 
        email, 
        password_hash, 
        first_name, 
        last_name, 
        phone, 
        organization_id, 
        role, 
        status,
        created_at
      )
      VALUES (
        ${username.toLowerCase()}, 
        ${email.toLowerCase()}, 
        ${hashedPassword}, 
        ${firstName}, 
        ${lastName}, 
        ${phone || null}, 
        ${organizationId || null}, 
        ${role}, 
        'pending',
        NOW()
      )
      RETURNING id, username, email, first_name, last_name, status, created_at
    `
    
    if (result.rows.length === 0) {
      return NextResponse.json({ 
        error: 'Failed to create admin account' 
      }, { status: 500 })
    }

    const newAdmin = result.rows[0]
    console.log('✅ Quick registration successful:', { 
      id: newAdmin.id, 
      username: newAdmin.username 
    })

    // Get organization name
    let organizationName = 'No Organization'
    if (organizationId) {
      try {
        const orgResult = await sql`
          SELECT name FROM organizations WHERE id = ${organizationId}
        `
        if (orgResult.rows.length > 0) {
          organizationName = orgResult.rows[0].name
        }
      } catch (orgError) {
        console.log('⚠️ Could not fetch organization name')
      }
    }

    return NextResponse.json({ 
      success: true,
      message: '🎉 Admin registration completed successfully!',
      admin: {
        id: newAdmin.id,
        username: newAdmin.username,
        email: newAdmin.email,
        firstName: newAdmin.first_name,
        lastName: newAdmin.last_name,
        status: newAdmin.status,
        organizationName: organizationName,
        registeredAt: newAdmin.created_at
      },
      loginCredentials: {
        username: newAdmin.username,
        status: 'pending_approval',
        note: 'Login will work after superadmin approval'
      },
      important_notice: {
        status: 'PENDING APPROVAL',
        message: 'Admin account created! You cannot login until a superadmin approves your account.',
        next_steps: [
          'Your admin account has been successfully created',
          'Status: Pending superadmin approval',
          'You will be notified when approved',
          'After approval, login at /admin/login with your credentials'
        ]
      }
    })

  } catch (error) {
    console.error('❌ Quick registration error:', error)
    return NextResponse.json({ 
      error: 'Registration failed. Please try again.',
      details: process.env.NODE_ENV === 'development' && error instanceof Error ? 
        error.message : undefined
    }, { status: 500 })
  }
}

// GET method for testing
export async function GET() {
  return NextResponse.json({
    message: 'Quick Admin Registration Endpoint',
    purpose: 'Create admin accounts without OTP verification',
    usage: {
      method: 'POST',
      required_fields: ['username', 'email', 'password', 'firstName', 'lastName'],
      optional_fields: ['phone', 'organizationId', 'role', 'experience', 'appointerName']
    },
    example: {
      username: 'nawab1996',
      email: 'azadintern24@gmail.com',
      password: 'your_password',
      firstName: 'azad', 
      lastName: 'singh',
      phone: '+918533843521',
      organizationId: 1,
      role: 'senior_admin',
      experience: '3-5',
      appointerName: 'vasd'
    }
  })
}