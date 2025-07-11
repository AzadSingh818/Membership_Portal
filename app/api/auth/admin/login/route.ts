// app/api/auth/admin/login/route.ts - FIXED VERSION

import { NextRequest, NextResponse } from 'next/server'
import { Pool } from '@neondatabase/serverless'
import bcrypt from 'bcryptjs'

const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL 
})

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

// ✅ FIXED: Set cookies with same names as middleware expects
function setAuthCookie(response: NextResponse, token: string): NextResponse {
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: 24 * 60 * 60 // 24 hours
  }

  // ✅ Set multiple cookie names for middleware compatibility
  response.cookies.set('auth-token', token, cookieOptions)
  response.cookies.set('admin-token', token, cookieOptions)
  response.cookies.set('auth_token', token, cookieOptions)
  
  return response
}

export async function POST(request: NextRequest) {
  try {
    console.log('🔐 Admin login attempt started')

    // Parse request body
    const { username, password } = await request.json()

    // Validate input
    if (!username || !password) {
      console.log('❌ Missing username or password')
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      )
    }

    const normalizedUsername = username.trim()
    console.log('🔍 Login attempt for username:', normalizedUsername)

    // ✅ Database connection
    const client = await pool.connect()
    
    try {
      let admin = null
      let tableName = ''

      // ✅ Strategy 1: Try admin_users table first
      try {
        console.log('🔍 Checking admin_users table...')
        const result = await client.query(`
          SELECT 
            au.*,
            o.name as organization_name
          FROM admin_users au
          LEFT JOIN organizations o ON au.organization_id = o.id
          WHERE au.username = $1
          LIMIT 1
        `, [normalizedUsername])

        if (result.rows.length > 0) {
          admin = result.rows[0]
          tableName = 'admin_users'
          console.log('✅ Admin found in admin_users table:', admin.username)
        }
      } catch (error: any) {
        console.log('❌ admin_users table query failed:', error.message)
      }

      // ✅ Strategy 2: Try admins table (fallback)
      if (!admin) {
        try {
          console.log('🔍 Checking admins table...')
          const result = await client.query(`
            SELECT 
              a.*,
              o.name as organization_name
            FROM admins a
            LEFT JOIN organizations o ON a.organization_id = o.id
            WHERE a.username = $1
            LIMIT 1
          `, [normalizedUsername])

          if (result.rows.length > 0) {
            admin = result.rows[0]
            tableName = 'admins'
            console.log('✅ Admin found in admins table:', admin.username)
          }
        } catch (error: any) {
          console.log('❌ admins table query failed:', error.message)
        }
      }

      // ✅ Strategy 3: Try by email as fallback
      if (!admin) {
        try {
          console.log('🔍 Trying login by email in admin_users...')
          const result = await client.query(`
            SELECT 
              au.*,
              o.name as organization_name
            FROM admin_users au
            LEFT JOIN organizations o ON au.organization_id = o.id
            WHERE au.email = $1
            LIMIT 1
          `, [normalizedUsername])

          if (result.rows.length > 0) {
            admin = result.rows[0]
            tableName = 'admin_users'
            console.log('✅ Admin found by email in admin_users table:', admin.email)
          }
        } catch (error: any) {
          console.log('❌ Email search in admin_users failed:', error.message)
        }
      }

      if (!admin) {
        console.log('❌ Admin not found:', normalizedUsername)
        return NextResponse.json({ 
          error: 'Invalid username or password' 
        }, { status: 401 })
      }

      // ✅ Password verification
      if (!admin.password_hash) {
        console.log('❌ No password hash found for admin')
        return NextResponse.json({ 
          error: 'Account configuration error. Please contact support.' 
        }, { status: 500 })
      }

      const isPasswordValid = await bcrypt.compare(password, admin.password_hash)
      if (!isPasswordValid) {
        console.log('❌ Invalid password for admin:', normalizedUsername)
        return NextResponse.json({ 
          error: 'Invalid username or password' 
        }, { status: 401 })
      }

      // ✅ Status checks
      if (admin.status === 'rejected') {
        return NextResponse.json({ 
          error: 'Account Rejected',
          message: 'Your admin account has been rejected. You cannot access the admin dashboard.',
          status: 'rejected'
        }, { status: 403 })
      }
      
      if (admin.is_active === false) {
        return NextResponse.json({ 
          error: 'Account Disabled',
          message: 'Your admin account has been disabled. Please contact support.',
          status: 'disabled'
        }, { status: 403 })
      }
      
      // ✅ Check for approved status
      const allowedStatuses = ['approved', 'active', 'enabled']
      if (!allowedStatuses.includes(admin.status) && admin.status) {
        return NextResponse.json({ 
          error: 'Account Pending',
          message: `Your account status is '${admin.status}'. Please wait for approval.`,
          status: admin.status
        }, { status: 403 })
      }

      console.log('✅ Admin status check passed:', admin.status || 'no status (allowed)')

      // ✅ FIXED: Generate base64 token instead of JWT
      const token = generateToken({
        id: admin.id,
        adminId: admin.id,
        username: admin.username,
        email: admin.email,
        role: admin.role || 'admin',
        organizationId: admin.organization_id,
        organizationName: admin.organization_name,
        firstName: admin.first_name,
        lastName: admin.last_name,
        status: admin.status || 'active',
        tableSource: tableName
      })

      // Remove sensitive data from response
      const { password_hash, ...adminData } = admin
      
      console.log('🎉 Admin login successful:', admin.username)
      
      // ✅ FIXED: Create response with cookie set
      const response = NextResponse.json({ 
        success: true,
        token,
        admin: {
          ...adminData,
          tableSource: tableName
        },
        message: 'Login successful - Welcome to your admin dashboard!',
        redirectTo: '/admin/dashboard'
      })

      // ✅ FIXED: Set auth cookies properly
      return setAuthCookie(response, token)
      
    } finally {
      client.release()
    }
    
  } catch (error: any) {
    console.error('❌ Error during admin login:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      message: 'Something went wrong. Please try again later.'
    }, { status: 500 })
  }
}