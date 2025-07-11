// app/api/admin/fix-usernames/route.ts - ONE-TIME USERNAME FIX
import { NextRequest, NextResponse } from 'next/server'
import { Pool } from '@neondatabase/serverless'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })

export async function POST(request: NextRequest) {
  try {
    console.log('🔧 Starting one-time username fix...')
    
    const client = await pool.connect()
    
    try {
      await client.query('BEGIN')
      
      const results = []
      
      // ✅ STEP 1: Fix specific admin record in admins table
      console.log('🔧 Step 1: Fixing specific admin record...')
      
      const specificFixResult = await client.query(`
        UPDATE admins 
        SET username = 'azad singh'
        WHERE email = 'azad818n.s@gmail.com' 
          AND (username = 'azad818n.s' OR username IS NULL OR username = '')
        RETURNING id, email, username, first_name, last_name
      `)
      
      if (specificFixResult.rows.length > 0) {
        results.push(`✅ Fixed specific admin: ${specificFixResult.rows[0].email} -> username: "${specificFixResult.rows[0].username}"`)
        console.log('✅ Fixed specific admin record')
      } else {
        results.push('⚠️ No specific admin record found to fix')
      }
      
      // ✅ STEP 2: Fix all email-based usernames in admins table
      console.log('🔧 Step 2: Fixing all email-based usernames in admins table...')
      
      const emailBasedAdmins = await client.query(`
        SELECT id, email, first_name, last_name, username
        FROM admins 
        WHERE username = SPLIT_PART(email, '@', 1)
           OR username LIKE '%@%'
           OR username IS NULL
           OR username = ''
      `)
      
      console.log(`🔍 Found ${emailBasedAdmins.rows.length} admins with email-based/missing usernames`)
      
      for (const admin of emailBasedAdmins.rows) {
        let newUsername = ''
        
        // Strategy 1: Look for original username in admin_requests
        const originalRequest = await client.query(`
          SELECT username, password_hash
          FROM admin_requests 
          WHERE email = $1 
            AND username IS NOT NULL 
            AND username != ''
            AND username != SPLIT_PART(email, '@', 1)
          ORDER BY created_at DESC
          LIMIT 1
        `, [admin.email])
        
        if (originalRequest.rows.length > 0 && originalRequest.rows[0].username) {
          newUsername = originalRequest.rows[0].username
          results.push(`✅ Restored original username for ${admin.email}: "${newUsername}"`)
        } else {
          // Strategy 2: Generate from name
          if (admin.first_name && admin.last_name) {
            newUsername = `${admin.first_name.toLowerCase()} ${admin.last_name.toLowerCase()}`
          } else if (admin.first_name) {
            newUsername = admin.first_name.toLowerCase()
          } else {
            newUsername = admin.email.split('@')[0] + '_user'
          }
          results.push(`✅ Generated username for ${admin.email}: "${newUsername}"`)
        }
        
        // Update the admin record
        await client.query(`
          UPDATE admins 
          SET username = $1 
          WHERE id = $2
        `, [newUsername, admin.id])
        
        console.log(`✅ Updated admin ${admin.id}: ${admin.email} -> "${newUsername}"`)
      }
      
      // ✅ STEP 3: Fix admin_requests table too
      console.log('🔧 Step 3: Fixing admin_requests table...')
      
      try {
        const requestsToFix = await client.query(`
          SELECT id, email, first_name, last_name, username
          FROM admin_requests 
          WHERE username IS NULL 
             OR username = ''
             OR username = SPLIT_PART(email, '@', 1)
        `)
        
        console.log(`🔍 Found ${requestsToFix.rows.length} admin_requests to fix`)
        
        for (const request of requestsToFix.rows) {
          let newUsername = ''
          
          if (request.first_name && request.last_name) {
            newUsername = `${request.first_name.toLowerCase()} ${request.last_name.toLowerCase()}`
          } else if (request.first_name) {
            newUsername = request.first_name.toLowerCase()
          } else {
            newUsername = request.email.split('@')[0] + '_user'
          }
          
          await client.query(`
            UPDATE admin_requests 
            SET username = $1 
            WHERE id = $2
          `, [newUsername, request.id])
          
          results.push(`✅ Fixed admin_request ${request.email}: "${newUsername}"`)
        }
        
      } catch (requestsError) {
        if (requestsError instanceof Error) {
          console.log('⚠️ admin_requests table fix failed:', requestsError.message)
        } else {
          console.log('⚠️ admin_requests table fix failed:', requestsError)
        }
        results.push('⚠️ admin_requests table not accessible or missing username column')
      }
      
      // ✅ STEP 4: Fix admin_users table if it exists
      console.log('🔧 Step 4: Checking admin_users table...')
      
      try {
        const adminUsersToFix = await client.query(`
          SELECT id, email, first_name, last_name, username
          FROM admin_users 
          WHERE username = SPLIT_PART(email, '@', 1)
             OR username LIKE '%@%'
             OR username IS NULL
             OR username = ''
        `)
        
        console.log(`🔍 Found ${adminUsersToFix.rows.length} admin_users to fix`)
        
        for (const user of adminUsersToFix.rows) {
          let newUsername = ''
          
          if (user.first_name && user.last_name) {
            newUsername = `${user.first_name.toLowerCase()} ${user.last_name.toLowerCase()}`
          } else if (user.first_name) {
            newUsername = user.first_name.toLowerCase()
          } else {
            newUsername = user.email.split('@')[0] + '_user'
          }
          
          await client.query(`
            UPDATE admin_users 
            SET username = $1 
            WHERE id = $2
          `, [newUsername, user.id])
          
          results.push(`✅ Fixed admin_users ${user.email}: "${newUsername}"`)
        }
        
      } catch (adminUsersError) {
        console.log('⚠️ admin_users table not found or accessible')
        results.push('⚠️ admin_users table not found')
      }
      
      // ✅ STEP 5: Verification
      console.log('🔧 Step 5: Verification...')
      
      const verificationResults: {
        admins?: any,
        sample_fixed?: any
      } = {}
      
      // Check admins table
      const adminsVerification = await client.query(`
        SELECT 
          COUNT(*) as total,
          COUNT(CASE WHEN username IS NOT NULL AND username != '' AND username != SPLIT_PART(email, '@', 1) THEN 1 END) as with_proper_username,
          COUNT(CASE WHEN username = SPLIT_PART(email, '@', 1) THEN 1 END) as email_based
        FROM admins
      `)
      
      verificationResults.admins = adminsVerification.rows[0]
      
      // Get sample of fixed records
      const sampleFixed = await client.query(`
        SELECT id, email, username, first_name, last_name
        FROM admins 
        WHERE email = 'azad818n.s@gmail.com'
        LIMIT 1
      `)
      
      verificationResults.sample_fixed = sampleFixed.rows[0] || null
      
      results.push('📊 Verification Results:')
      results.push(`Total admins: ${verificationResults.admins.total}`)
      results.push(`With proper usernames: ${verificationResults.admins.with_proper_username}`)
      results.push(`Still email-based: ${verificationResults.admins.email_based}`)
      
      if (verificationResults.sample_fixed) {
        results.push(`Sample fixed record: ${verificationResults.sample_fixed.email} -> "${verificationResults.sample_fixed.username}"`)
      }
      
      await client.query('COMMIT')
      
      return NextResponse.json({
        success: true,
        message: 'Username fix completed successfully!',
        results,
        verification: verificationResults,
        summary: {
          adminsFixed: emailBasedAdmins.rows.length,
          specificRecordFixed: specificFixResult.rows.length > 0,
          tablesUpdated: ['admins', 'admin_requests', 'admin_users']
        },
        nextSteps: [
          '1. Refresh your superadmin dashboard',
          '2. Check "All Admins" tab - username should show "azad singh"',
          '3. Verify admin can login with correct credentials',
          '4. Test new admin registration and approval process'
        ]
      })
      
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }
    
  } catch (error) {
    console.error('❌ CRITICAL ERROR in username fix:', error)
    return NextResponse.json({
      success: false,
      error: 'Username fix failed: ' + (error instanceof Error ? error.message : 'Unknown error'),
      suggestion: 'Try manual SQL commands in Neon console'
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Username Fix API',
    description: 'POST to fix all email-based usernames in admin tables',
    purpose: 'Converts email-based usernames to proper usernames',
    usage: 'POST /api/admin/fix-usernames',
    target: 'Fixes "azad818n.s" -> "azad singh"'
  })
}