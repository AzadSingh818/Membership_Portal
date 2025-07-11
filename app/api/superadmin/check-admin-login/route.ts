// app/api/superadmin/check-admin-login/route.ts - FIXED: NO HARDCODED PASSWORD
import { NextRequest, NextResponse } from 'next/server'
import { Pool } from '@neondatabase/serverless'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email') || ''
    
    const client = await pool.connect()
    
    try {
      console.log('🔍 Checking admin login status for:', email)
      
      // Check admin_requests table (approval status) - ✅ FIXED: Include username and password_hash
      const requestResult = await client.query(`
        SELECT id, email, first_name, last_name, username, password_hash, status, approved_at 
        FROM admin_requests 
        WHERE email = $1
      `, [email])
      
      // Check admins table (login credentials)
      const adminResult = await client.query(`
        SELECT id, username, email, first_name, last_name, status, is_active, created_at
        FROM admins 
        WHERE email = $1
      `, [email])
      
      // Check admin_users table (if it exists)
      let adminUsersResult = { rows: [] }
      try {
        adminUsersResult = await client.query(`
          SELECT id, username, email, first_name, last_name, status, is_active, created_at
          FROM admin_users 
          WHERE email = $1
        `, [email])
      } catch (error) {
        console.log('admin_users table might not exist or has different schema')
      }
      
      const analysis: {
        email: string,
        adminRequest: any,
        adminLogin: any,
        adminUsers: any,
        canLogin: boolean,
        issues: string[],
        solutions: string[]
      } = {
        email: email,
        adminRequest: requestResult.rows[0] || null,
        adminLogin: adminResult.rows[0] || null,
        adminUsers: adminUsersResult.rows[0] || null,
        canLogin: false,
        issues: [],
        solutions: []
      }
      
      // Analyze the situation
      if (!analysis.adminRequest) {
        analysis.issues.push('No admin request found in admin_requests table')
        analysis.solutions.push('Admin needs to register first')
      } else if (analysis.adminRequest.status !== 'approved') {
        analysis.issues.push(`Admin request status is '${analysis.adminRequest.status}', not 'approved'`)
        analysis.solutions.push('Admin request needs to be approved by superadmin')
      }
      
      if (!analysis.adminLogin) {
        analysis.issues.push('No login credentials found in admins table')
        analysis.solutions.push('Run the approval process to transfer credentials from admin_requests to admins table')
      } else {
        if (analysis.adminLogin.status && analysis.adminLogin.status !== 'approved' && analysis.adminLogin.status !== 'active') {
          analysis.issues.push(`Admin login status is '${analysis.adminLogin.status}'`)
          analysis.solutions.push('Update admin status to approved/active in admins table')
        }
        
        if (!analysis.adminLogin.is_active) {
          analysis.issues.push('Admin account is not active')
          analysis.solutions.push('Set is_active = true in admins table')
        }
        
        if (analysis.issues.length === 0) {
          analysis.canLogin = true
        }
      }
      
      // ✅ FIXED: Generate SQL using original credentials from admin_requests
      let fixGuidance = null
      if (!analysis.adminLogin && analysis.adminRequest && analysis.adminRequest.status === 'approved') {
        // ✅ FIXED: Use original credentials if available
        const originalUsername = analysis.adminRequest.username
        const originalPasswordHash = analysis.adminRequest.password_hash
        
        if (originalUsername && originalPasswordHash) {
          fixGuidance = {
            message: 'Original credentials found in admin_requests - ready to transfer',
            originalCredentials: {
              username: originalUsername,
              note: 'This is the username the admin chose during registration'
            },
            sqlFix: `
-- ✅ Transfer original credentials from admin_requests to admins table
INSERT INTO admins (
    username, email, password_hash, first_name, last_name, 
    role, organization_id, status, is_active, created_at
) VALUES (
    '${originalUsername}',           -- ✅ Original chosen username
    '${email}',
    '${originalPasswordHash}',       -- ✅ Original hashed password
    '${analysis.adminRequest.first_name || ''}',
    '${analysis.adminRequest.last_name || ''}',
    'admin',
    1,
    'approved',
    true,
    NOW()
);

-- ✅ Admin can then login with their ORIGINAL credentials:
-- Username: ${originalUsername}
-- Password: [their original password from registration]
            `
          }
        } else {
          fixGuidance = {
            message: 'Original credentials not found in admin_requests - database schema may need updating',
            issues: [
              !originalUsername ? 'username column missing in admin_requests' : null,
              !originalPasswordHash ? 'password_hash column missing in admin_requests' : null
            ].filter(Boolean),
            solutions: [
              'Update admin_requests table to include username and password_hash columns',
              'Modify registration process to store chosen credentials',
              'Contact admin to re-register if necessary'
            ]
          }
        }
      }
      
      return NextResponse.json({
        success: true,
        analysis,
        fixGuidance,
        originalCredentialsFound: !!(analysis.adminRequest?.username && analysis.adminRequest?.password_hash),
        testLogin: analysis.canLogin ? {
          username: analysis.adminLogin?.username,
          note: 'Admin should be able to login with their original credentials'
        } : null,
        recommendations: [
          'Ensure admin_requests table stores username and password_hash during registration',
          'Approval process should transfer original credentials (not generate new ones)',
          'Never hardcode passwords - always use original user choices'
        ]
      })
      
    } finally {
      client.release()
    }
    
  } catch (error) {
    console.error('❌ Error checking admin login status:', error)
    return NextResponse.json({
      success: false,
      error: typeof error === 'object' && error !== null && 'message' in error ? (error as any).message : String(error)
    }, { status: 500 })
  }
}