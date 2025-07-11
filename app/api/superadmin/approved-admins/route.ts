// app/api/superadmin/approved-admins/route.ts - ENHANCED WITH USERNAME VERIFICATION
import { NextResponse } from 'next/server'
import { Pool } from '@neondatabase/serverless'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })

export async function GET() {
  try {
    const client = await pool.connect()
    
    try {
      console.log('🔍 Fetching approved admins with USERNAME verification...')
      
      // ✅ STRATEGY 1: Try to fetch from multiple possible admin tables
      let result = null
      let tableUsed = ''
      
      // Try admin_users table first (most common)
      try {
        console.log('🔧 Strategy 1: Trying admin_users table...')
        result = await client.query(`
          SELECT 
            a.id,
            a.username,              -- ✅ CRITICAL: Username from admin_users
            a.email,
            a.first_name,
            a.last_name,
            a.phone,
            a.role,
            a.status,
            a.organization_id,
            a.created_at,
            a.updated_at as approved_at,
            o.name as organization_name
          FROM admin_users a
          LEFT JOIN organizations o ON a.organization_id = o.id
          WHERE a.status = 'approved' OR a.status = 'active'
          ORDER BY o.name, a.first_name, a.last_name
        `)
        tableUsed = 'admin_users'
        console.log('✅ Strategy 1 SUCCESS: Found approved admins in admin_users')
      } catch (error1) {
        console.log('❌ Strategy 1 failed:', (error1 instanceof Error ? error1.message : String(error1)))
        
        // ✅ STRATEGY 2: Try admins table (alternative naming)
        try {
          console.log('🔧 Strategy 2: Trying admins table...')
          result = await client.query(`
            SELECT 
              a.id,
              a.username,              -- ✅ CRITICAL: Username from admins
              a.email,
              a.first_name,
              a.last_name,
              a.phone,
              a.role,
              a.status,
              a.organization_id,
              a.created_at,
              a.approved_at,
              o.name as organization_name
            FROM admins a
            LEFT JOIN organizations o ON a.organization_id = o.id
            WHERE a.status = 'approved'
            ORDER BY o.name, a.first_name, a.last_name
          `)
          tableUsed = 'admins'
          console.log('✅ Strategy 2 SUCCESS: Found approved admins in admins table')
        } catch (error2) {
          console.log('❌ Strategy 2 failed:', error2 instanceof Error ? error2.message : String(error2))
          
          // ✅ STRATEGY 3: Try admin_requests table with approved status
          try {
            console.log('🔧 Strategy 3: Trying admin_requests table with approved status...')
            result = await client.query(`
              SELECT 
                ar.id,
                ar.username,              -- ✅ CRITICAL: Username from admin_requests
                ar.email,
                ar.first_name,
                ar.last_name,
                ar.phone,
                'admin' as role,
                ar.status,
                ar.organization::integer as organization_id,
                ar.created_at,
                ar.approved_at,
                o.name as organization_name
              FROM admin_requests ar
              LEFT JOIN organizations o ON ar.organization::integer = o.id
              WHERE ar.status = 'approved'
              ORDER BY o.name, ar.first_name, ar.last_name
            `)
            tableUsed = 'admin_requests'
            console.log('✅ Strategy 3 SUCCESS: Found approved admins in admin_requests table')
          } catch (error3) {
            console.log('❌ Strategy 3 failed:', error3 instanceof Error ? error3.message : String(error3))
            throw new Error('No admin table found')
          }
        }
      }
      
      if (!result || !result.rows) {
        throw new Error('No data returned from any admin table')
      }
      
      const approvedAdmins = result.rows
      console.log('📊 CRITICAL: Approved admins with USERNAME analysis:', {
        tableUsed,
        totalAdmins: approvedAdmins.length,
        withUsernames: approvedAdmins.filter(admin => admin.username && admin.username.trim() !== '').length,
        sampleUsernames: approvedAdmins.slice(0, 3).map(admin => ({
          id: admin.id,
          email: admin.email,
          username: admin.username,    // ✅ CRITICAL: Log actual usernames
          emailPrefix: admin.email.split('@')[0]
        }))
      })
      
      // ✅ CRITICAL: Check for username issues
      const usernameIssues = approvedAdmins.filter(admin => {
        if (!admin.username || admin.username.trim() === '') {
          return true // Missing username
        }
        if (admin.email && admin.username === admin.email.split('@')[0]) {
          return true // Username is email prefix (auto-generated issue)
        }
        return false
      })
      
      if (usernameIssues.length > 0) {
        console.warn('🚨 CRITICAL WARNING: Username issues detected in approved admins!', {
          issueCount: usernameIssues.length,
          issues: usernameIssues.map(admin => ({
            id: admin.id,
            email: admin.email,
            username: admin.username,
            issue: !admin.username ? 'Missing username' : 'Username is email prefix'
          }))
        })
      }
      
      return NextResponse.json({ 
        success: true,
        admins: approvedAdmins,
        meta: {
          tableUsed,
          totalCount: approvedAdmins.length,
          usernameAnalysis: {
            withValidUsernames: approvedAdmins.filter(admin => 
              admin.username && 
              admin.username.trim() !== '' && 
              admin.username !== admin.email?.split('@')[0]
            ).length,
            withEmailPrefixUsernames: approvedAdmins.filter(admin => 
              admin.username === admin.email?.split('@')[0]
            ).length,
            missingUsernames: approvedAdmins.filter(admin => 
              !admin.username || admin.username.trim() === ''
            ).length
          }
        }
      })
      
    } finally {
      client.release()
    }
    
  } catch (error) {
    console.error('❌ CRITICAL ERROR: Failed to fetch approved admins:', error)
    
    // ✅ EMERGENCY FALLBACK: Return empty array with error info
    return NextResponse.json({ 
      error: 'Failed to fetch approved admins: ' + (error instanceof Error ? error.message : 'Unknown error'),
      admins: [],
      emergencyFallback: true,
      suggestion: 'Check if admin tables exist and have username columns'
    }, { status: 500 })
  }
}