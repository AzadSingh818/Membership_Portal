// app/api/admin/fix-database/route.ts - DATABASE MIGRATION SCRIPT
import { NextRequest, NextResponse } from 'next/server'
import { Pool } from '@neondatabase/serverless'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })

export async function POST(request: NextRequest) {
  try {
    console.log('🔧 Starting database migration to fix username issues...')
    
    const client = await pool.connect()
    
    try {
      await client.query('BEGIN')
      
      const results = []
      
      // ✅ STEP 1: Add missing columns to admin_requests if they don't exist
      console.log('📋 Step 1: Checking admin_requests table structure...')
      
      try {
        const columnsResult = await client.query(`
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_name = 'admin_requests' AND table_schema = 'public'
        `)
        
        const existingColumns = columnsResult.rows.map(row => row.column_name)
        console.log('📊 Existing admin_requests columns:', existingColumns)
        
        if (!existingColumns.includes('username')) {
          await client.query(`ALTER TABLE admin_requests ADD COLUMN username VARCHAR(255)`)
          results.push('✅ Added username column to admin_requests table')
          console.log('✅ Added username column to admin_requests')
        } else {
          results.push('✓ Username column already exists in admin_requests')
        }
        
        if (!existingColumns.includes('password_hash')) {
          await client.query(`ALTER TABLE admin_requests ADD COLUMN password_hash VARCHAR(255)`)
          results.push('✅ Added password_hash column to admin_requests table')
          console.log('✅ Added password_hash column to admin_requests')
        } else {
          results.push('✓ Password_hash column already exists in admin_requests')
        }
        
      } catch (error) {
        console.error('❌ Error in Step 1:', error)
        results.push('❌ Error adding columns: ' + (error instanceof Error ? error.message : 'Unknown error'))
      }
      
      // ✅ STEP 2: Fix existing admin_requests records with missing usernames
      console.log('📋 Step 2: Fixing admin_requests records...')
      
      try {
        // Find records with missing or email-based usernames
        const problemRecords = await client.query(`
          SELECT id, email, first_name, last_name, username
          FROM admin_requests 
          WHERE username IS NULL 
             OR username = '' 
             OR username = SPLIT_PART(email, '@', 1)
        `)
        
        console.log('🔍 Found problem records:', problemRecords.rows.length)
        
        for (const record of problemRecords.rows) {
          // Generate proper username from name
          let newUsername = ''
          if (record.first_name && record.last_name) {
            newUsername = (record.first_name + '_' + record.last_name).toLowerCase().replace(/\s+/g, '_')
          } else if (record.first_name) {
            newUsername = record.first_name.toLowerCase().replace(/\s+/g, '_')
          } else {
            // Fallback to email prefix but mark it as temporary
            newUsername = record.email.split('@')[0] + '_temp'
          }
          
          await client.query(`
            UPDATE admin_requests 
            SET username = $1 
            WHERE id = $2
          `, [newUsername, record.id])
          
          results.push(`✅ Fixed username for ${record.email}: "${newUsername}"`)
          console.log(`✅ Fixed username for ${record.email}: "${newUsername}"`)
        }
        
      } catch (error) {
        console.error('❌ Error in Step 2:', error)
        results.push('❌ Error fixing admin_requests: ' + (error instanceof Error ? error.message : 'Unknown error'))
      }
      
      // ✅ STEP 3: Fix existing admins table records
      console.log('📋 Step 3: Fixing admins table records...')
      
      try {
        // Check if admins table exists and get its structure
        const adminsTableExists = await client.query(`
          SELECT table_name 
          FROM information_schema.tables 
          WHERE table_name = 'admins' AND table_schema = 'public'
        `)
        
        if (adminsTableExists.rows.length > 0) {
          const adminsColumns = await client.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'admins' AND table_schema = 'public'
          `)
          
          const adminCols = adminsColumns.rows.map(row => row.column_name)
          console.log('📊 Admins table columns:', adminCols)
          
          if (adminCols.includes('username')) {
            // Find and fix email-based usernames in admins table
            const adminProblems = await client.query(`
              SELECT id, email, first_name, last_name, username
              FROM admins 
              WHERE username = SPLIT_PART(email, '@', 1)
                 OR username LIKE '%@%'
            `)
            
            console.log('🔍 Found admin records with email-based usernames:', adminProblems.rows.length)
            
            for (const admin of adminProblems.rows) {
              // Look for the original username in admin_requests
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
              
              let newUsername = ''
              if (originalRequest.rows.length > 0 && originalRequest.rows[0].username) {
                // Use original username from request
                newUsername = originalRequest.rows[0].username
                results.push(`✅ Restored original username for ${admin.email}: "${newUsername}"`)
              } else {
                // Generate from name
                if (admin.first_name && admin.last_name) {
                  newUsername = (admin.first_name + '_' + admin.last_name).toLowerCase().replace(/\s+/g, '_')
                } else if (admin.first_name) {
                  newUsername = admin.first_name.toLowerCase().replace(/\s+/g, '_')
                } else {
                  newUsername = admin.email.split('@')[0] + '_fixed'
                }
                results.push(`✅ Generated new username for ${admin.email}: "${newUsername}"`)
              }
              
              await client.query(`
                UPDATE admins 
                SET username = $1 
                WHERE id = $2
              `, [newUsername, admin.id])
              
              console.log(`✅ Updated admin username: ${admin.email} -> "${newUsername}"`)
            }
          } else {
            results.push('⚠️ Admins table exists but no username column found')
          }
        } else {
          results.push('⚠️ Admins table does not exist')
        }
        
      } catch (error) {
        console.error('❌ Error in Step 3:', error)
        results.push('❌ Error fixing admins table: ' + (error instanceof Error ? error.message : 'Unknown error'))
      }
      
      // ✅ STEP 4: Check admin_users table as well
      console.log('📋 Step 4: Checking admin_users table...')
      
      try {
        const adminUsersExists = await client.query(`
          SELECT table_name 
          FROM information_schema.tables 
          WHERE table_name = 'admin_users' AND table_schema = 'public'
        `)
        
        if (adminUsersExists.rows.length > 0) {
          // Similar fix for admin_users table
          const adminUsersProblems = await client.query(`
            SELECT id, email, first_name, last_name, username
            FROM admin_users 
            WHERE username = SPLIT_PART(email, '@', 1)
               OR username LIKE '%@%'
          `)
          
          console.log('🔍 Found admin_users with email-based usernames:', adminUsersProblems.rows.length)
          
          for (const user of adminUsersProblems.rows) {
            // Look for original username
            const originalRequest = await client.query(`
              SELECT username 
              FROM admin_requests 
              WHERE email = $1 AND username IS NOT NULL AND username != ''
              ORDER BY created_at DESC LIMIT 1
            `, [user.email])
            
            let newUsername = ''
            if (originalRequest.rows.length > 0) {
              newUsername = originalRequest.rows[0].username
            } else if (user.first_name && user.last_name) {
              newUsername = (user.first_name + '_' + user.last_name).toLowerCase().replace(/\s+/g, '_')
            } else if (user.first_name) {
              newUsername = user.first_name.toLowerCase().replace(/\s+/g, '_')
            } else {
              newUsername = user.email.split('@')[0] + '_fixed'
            }
            
            await client.query(`
              UPDATE admin_users 
              SET username = $1 
              WHERE id = $2
            `, [newUsername, user.id])
            
            results.push(`✅ Fixed admin_users username: ${user.email} -> "${newUsername}"`)
            console.log(`✅ Fixed admin_users username: ${user.email} -> "${newUsername}"`)
          }
        } else {
          results.push('⚠️ Admin_users table does not exist')
        }
        
      } catch (error) {
        console.error('❌ Error in Step 4:', error)
        results.push('❌ Error fixing admin_users: ' + (error instanceof Error ? error.message : 'Unknown error'))
      }
      
      // ✅ STEP 5: Verification
      console.log('📋 Step 5: Verification...')
      
      try {
        // Count records by username status
        const verificationResults: Record<string, any> = {}
        
        // Check admin_requests
        try {
          const requestsCount = await client.query(`
            SELECT 
              COUNT(*) as total,
              COUNT(CASE WHEN username IS NOT NULL AND username != '' THEN 1 END) as with_username,
              COUNT(CASE WHEN username = SPLIT_PART(email, '@', 1) THEN 1 END) as email_based
            FROM admin_requests
          `)
          verificationResults.admin_requests = requestsCount.rows[0]
        } catch (e) {
          verificationResults.admin_requests = { error: 'Table not accessible' }
        }
        
        // Check admins
        try {
          const adminsCount = await client.query(`
            SELECT 
              COUNT(*) as total,
              COUNT(CASE WHEN username IS NOT NULL AND username != '' THEN 1 END) as with_username,
              COUNT(CASE WHEN username = SPLIT_PART(email, '@', 1) THEN 1 END) as email_based
            FROM admins
          `)
          verificationResults.admins = adminsCount.rows[0]
        } catch (e) {
          verificationResults.admins = { error: 'Table not accessible' }
        }
        
        results.push('📊 Verification Results:')
        results.push(JSON.stringify(verificationResults, null, 2))
        
      } catch (error) {
        console.error('❌ Error in verification:', error)
        results.push('❌ Verification error: ' + (error instanceof Error ? error.message : 'Unknown error'))
      }
      
      await client.query('COMMIT')
      
      return NextResponse.json({
        success: true,
        message: 'Database migration completed successfully!',
        results,
        summary: {
          tablesChecked: ['admin_requests', 'admins', 'admin_users'],
          columnsAdded: ['username', 'password_hash'],
          recordsFixed: results.filter(r => r.startsWith('✅ Fixed') || r.startsWith('✅ Generated')).length
        },
        nextSteps: [
          '1. Refresh your superadmin dashboard',
          '2. Check that usernames are now displayed',
          '3. Test admin approval process',
          '4. Verify admin login works with correct credentials'
        ]
      })
      
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }
    
  } catch (error) {
    console.error('❌ CRITICAL ERROR in database migration:', error)
    return NextResponse.json({
      success: false,
      error: 'Migration failed: ' + (error instanceof Error ? error.message : 'Unknown error'),
      suggestion: 'Check database connection and table permissions'
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Database Migration API',
    description: 'POST to this endpoint to fix username issues in admin tables',
    purpose: 'Adds missing columns and fixes email-based usernames',
    usage: 'POST /api/admin/fix-database'
  })
}