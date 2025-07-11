// app/api/auth/admin/login/route.ts - ENHANCED VERSION
import { NextRequest, NextResponse } from 'next/server'
import { Pool } from '@neondatabase/serverless'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { username, password } = body
    
    if (!username || !password) {
      return NextResponse.json({ 
        error: 'Username and password are required' 
      }, { status: 400 })
    }
    
    const client = await pool.connect()
    
    try {
      let admin = null
      let tableName = ''
      
      // Strategy 1: Try 'admins' table first (primary table)
      try {
        console.log('🔍 Searching in "admins" table...')
        const result = await client.query(`
          SELECT 
            a.*,
            o.name as organization_name
          FROM admins a
          LEFT JOIN organizations o ON a.organization_id = o.id
          WHERE a.username = $1 OR a.email = $1
        `, [username])
        
        if (result.rows.length > 0) {
          admin = result.rows[0]
          tableName = 'admins'
          console.log('✅ Admin found in "admins" table')
        }
      } catch (error) {
        if (error instanceof Error) {
          console.log('❌ Error searching "admins" table:', error.message)
        } else {
          console.log('❌ Error searching "admins" table:', error)
        }
      }
      
      // Strategy 2: Try 'admin_users' table if not found in admins
      if (!admin) {
        try {
          console.log('🔍 Searching in "admin_users" table...')
          const result = await client.query(`
            SELECT 
              au.*,
              o.name as organization_name
            FROM admin_users au
            LEFT JOIN organizations o ON au.organization_id = o.id
            WHERE au.username = $1 OR au.email = $1
          `, [username])
          
          if (result.rows.length > 0) {
            admin = result.rows[0]
            tableName = 'admin_users'
            console.log('✅ Admin found in "admin_users" table')
          }
        } catch (error) {
          if (error instanceof Error) {
            console.log('❌ Error searching "admin_users" table:', error.message)
          } else {
            console.log('❌ Error searching "admin_users" table:', error)
          }
        }
      }
      
      // If no admin found in either table
      if (!admin) {
        console.log('❌ No admin found with username/email:', username)
        return NextResponse.json({ 
          error: 'Invalid credentials' 
        }, { status: 401 })
      }
      
      console.log(`📋 Found admin in "${tableName}" table:`, {
        id: admin.id,
        username: admin.username,
        email: admin.email,
        status: admin.status
      })
      
      // Verify password
      const validPassword = await bcrypt.compare(password, admin.password_hash)
      if (!validPassword) {
        console.log('❌ Invalid password for admin:', admin.username)
        return NextResponse.json({ 
          error: 'Invalid credentials' 
        }, { status: 401 })
      }
      
      console.log('✅ Password verified successfully')
      
      // 🚨 CRITICAL: Check approval status before login
      if (admin.status === 'pending') {
        return NextResponse.json({ 
          error: 'Account Pending Approval',
          message: 'Your admin account is awaiting superadmin approval. You cannot login until approved.',
          status: 'pending',
          details: {
            admin_name: `${admin.first_name} ${admin.last_name}`,
            email: admin.email,
            applied_on: admin.created_at,
            organization: admin.organization_name,
            next_steps: [
              'Wait for superadmin to review your application',
              'You will receive email notification when approved',
              'Contact support if you have questions about the approval process'
            ]
          }
        }, { status: 403 })
      }
      
      if (admin.status === 'rejected') {
        return NextResponse.json({ 
          error: 'Account Access Denied',
          message: 'Your admin application was rejected. You cannot access the admin dashboard.',
          status: 'rejected',
          details: {
            admin_name: `${admin.first_name} ${admin.last_name}`,
            email: admin.email,
            rejected_on: admin.rejected_at,
            contact_support: 'Please contact support for assistance or to reapply'
          }
        }, { status: 403 })
      }
      
      // Check if account is active
      if (admin.is_active === false) {
        return NextResponse.json({ 
          error: 'Account Disabled',
          message: 'Your admin account has been disabled. Please contact support.',
          status: 'disabled'
        }, { status: 403 })
      }
      
      // Only approved/active admins can login
      const allowedStatuses = ['approved', 'active', 'enabled']
      if (allowedStatuses.includes(admin.status) || !admin.status) {
        console.log('✅ Admin status check passed:', admin.status || 'no status (allowed)')
        
        // Generate JWT token
        const token = jwt.sign(
          { 
            adminId: admin.id,
            username: admin.username,
            email: admin.email,
            role: admin.role || 'admin',
            organizationId: admin.organization_id,
            organizationName: admin.organization_name,
            firstName: admin.first_name,
            lastName: admin.last_name,
            status: admin.status || 'active',
            tableSource: tableName  // Track which table the admin came from
          }, 
          process.env.JWT_SECRET!,
          { expiresIn: '24h' }
        )
        
        // Remove sensitive data from response
        const { password_hash, ...adminData } = admin
        
        console.log('🎉 Admin login successful:', admin.username)
        
        return NextResponse.json({ 
          success: true,
          token,
          admin: {
            ...adminData,
            tableSource: tableName
          },
          message: 'Login successful - Welcome to your admin dashboard!',
          redirectTo: '/admin/dashboard'
        })
      }
      
      // Fallback for unknown status
      return NextResponse.json({ 
        error: 'Account status not recognized',
        message: `Your account status is '${admin.status}'. Please contact support.`,
        details: {
          currentStatus: admin.status,
          allowedStatuses: allowedStatuses,
          tableName: tableName
        }
      }, { status: 403 })
      
    } finally {
      client.release()
    }
    
  } catch (error) {
    console.error('❌ Error during admin login:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      message: 'Something went wrong. Please try again later.'
    }, { status: 500 })
  }
}