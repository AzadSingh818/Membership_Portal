// app/api/debug/setup-database/route.ts - COMPLETE DATABASE SETUP UTILITY
import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@vercel/postgres'
import { 
  checkMemberTables, 
  createMembersTableIfNeeded,
  debugOTPTable,
  checkDatabaseTables
} from '@/lib/database'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Running database setup check...')
    
    // Check what tables exist
    const tableCheck = await checkDatabaseTables()
    
    // Check member tables specifically
    const memberTableCheck = await checkMemberTables()
    
    // Check OTP table
    const otpTableCheck = await debugOTPTable()
    
    const recommendations = []
    
    // Generate recommendations
    if (memberTableCheck.tables.length === 0) {
      recommendations.push('Create members table for member login functionality')
    }
    
    if (!otpTableCheck.tableExists) {
      recommendations.push('Create OTP verification table')
    }
    
    if (tableCheck.tables.length === 0) {
      recommendations.push('Database appears to be empty - run full setup')
    }
    
    return NextResponse.json({
      success: true,
      message: 'Database setup check completed',
      results: {
        allTables: tableCheck.tables.map((t: any) => t.table_name),
        memberTables: memberTableCheck.tables,
        otpTable: {
          exists: otpTableCheck.tableExists,
          structure: otpTableCheck.columns || [],
          sampleCount: otpTableCheck.rowCount || 0
        },
        recommendations
      },
      actions: {
        setupAll: 'POST /api/debug/setup-database with { "action": "setup-all" }',
        createMembers: 'POST /api/debug/setup-database with { "action": "create-members-table" }',
        createSample: 'POST /api/debug/setup-database with { "action": "create-sample-member" }'
      }
    })
    
  } catch (error: any) {
    console.error('❌ Database setup check failed:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Database setup check failed',
      suggestion: 'Check your database connection and credentials'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action } = body
    
    console.log('🛠️ Running database setup action:', action)
    
    if (action === 'create-members-table') {
      await createMembersTableIfNeeded()
      
      return NextResponse.json({
        success: true,
        message: 'Members table created successfully',
        action: 'create-members-table',
        nextSteps: [
          'Table is ready for member data',
          'You can now create sample members',
          'Member login should work after adding members'
        ]
      })
    }
    
    if (action === 'create-sample-member') {
      // Create a sample member for testing
      try {
        await sql`
          INSERT INTO members (email, phone, first_name, last_name, membership_id, user_type)
          VALUES (
            'azad818n.s@gmail.com',
            '+1234567890',
            'Azad',
            'Nawab',
            'MEMBER001',
            'member'
          )
          ON CONFLICT (email) DO UPDATE SET
            phone = EXCLUDED.phone,
            first_name = EXCLUDED.first_name,
            last_name = EXCLUDED.last_name,
            membership_id = EXCLUDED.membership_id,
            updated_at = NOW()
        `
        
        return NextResponse.json({
          success: true,
          message: 'Sample member created/updated successfully',
          member: {
            email: 'azad818n.s@gmail.com',
            phone: '+1234567890',
            membershipId: 'MEMBER001',
            name: 'Azad Nawab'
          },
          testInstructions: {
            emailLogin: {
              type: 'email',
              contact: 'azad818n.s@gmail.com'
            },
            phoneLogin: {
              type: 'phone', 
              contact: '+1234567890'
            },
            membershipLogin: {
              type: 'email',
              membershipId: 'MEMBER001'
            }
          }
        })
      } catch (memberError: any) {
        return NextResponse.json({
          success: false,
          error: 'Failed to create sample member',
          details: memberError.message,
          suggestion: 'Make sure members table exists first'
        }, { status: 500 })
      }
    }
    
    if (action === 'create-otp-table') {
      try {
        await sql`
          CREATE TABLE IF NOT EXISTS otp_verifications (
            id SERIAL PRIMARY KEY,
            contact VARCHAR(255) NOT NULL,
            otp_code VARCHAR(6) NOT NULL,
            otp_type VARCHAR(10) NOT NULL DEFAULT 'email',
            expires_at TIMESTAMP DEFAULT (NOW() + INTERVAL '10 minutes'),
            created_at TIMESTAMP DEFAULT NOW(),
            used_at TIMESTAMP NULL,
            is_used BOOLEAN DEFAULT FALSE
          )
        `
        
        await sql`
          CREATE INDEX IF NOT EXISTS idx_otp_contact ON otp_verifications(contact, otp_type)
        `
        
        await sql`
          CREATE INDEX IF NOT EXISTS idx_otp_expires ON otp_verifications(expires_at)
        `
        
        return NextResponse.json({
          success: true,
          message: 'OTP verification table created successfully',
          action: 'create-otp-table'
        })
      } catch (otpError: any) {
        return NextResponse.json({
          success: false,
          error: 'Failed to create OTP table',
          details: otpError.message
        }, { status: 500 })
      }
    }
    
    if (action === 'setup-all') {
      const results = []
      const errors = []
      
      // Step 1: Create members table
      try {
        await createMembersTableIfNeeded()
        results.push('✅ Members table created/verified')
      } catch (error: any) {
        errors.push('❌ Failed to create members table: ' + error.message)
      }
      
      // Step 2: Create OTP table
      try {
        await sql`
          CREATE TABLE IF NOT EXISTS otp_verifications (
            id SERIAL PRIMARY KEY,
            contact VARCHAR(255) NOT NULL,
            otp_code VARCHAR(6) NOT NULL,
            otp_type VARCHAR(10) NOT NULL DEFAULT 'email',
            expires_at TIMESTAMP DEFAULT (NOW() + INTERVAL '10 minutes'),
            created_at TIMESTAMP DEFAULT NOW(),
            used_at TIMESTAMP NULL,
            is_used BOOLEAN DEFAULT FALSE
          )
        `
        
        await sql`
          CREATE INDEX IF NOT EXISTS idx_otp_contact ON otp_verifications(contact, otp_type)
        `
        
        results.push('✅ OTP verification table created/verified')
      } catch (error: any) {
        errors.push('❌ Failed to create OTP table: ' + error.message)
      }
      
      // Step 3: Create sample member
      try {
        await sql`
          INSERT INTO members (email, phone, first_name, last_name, membership_id, user_type)
          VALUES (
            'azad818n.s@gmail.com',
            '+1234567890',
            'Azad',
            'Nawab',
            'MEMBER001',
            'member'
          )
          ON CONFLICT (email) DO UPDATE SET
            phone = EXCLUDED.phone,
            first_name = EXCLUDED.first_name,
            last_name = EXCLUDED.last_name,
            membership_id = EXCLUDED.membership_id,
            updated_at = NOW()
        `
        results.push('✅ Sample member created/updated')
      } catch (error: any) {
        errors.push('❌ Failed to create sample member: ' + error.message)
      }
      
      // Step 4: Verify admin_requests table has required columns
      try {
        await sql`
          ALTER TABLE admin_requests 
          ADD COLUMN IF NOT EXISTS username VARCHAR(255),
          ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255)
        `
        results.push('✅ Admin requests table updated with username/password columns')
      } catch (error: any) {
        // Non-critical error
        results.push('⚠️ Admin requests table update skipped (may already exist)')
      }
      
      return NextResponse.json({
        success: errors.length === 0,
        message: errors.length === 0 ? 
          'Database setup completed successfully!' : 
          'Database setup completed with some errors',
        results,
        errors,
        testCredentials: {
          email: 'azad818n.s@gmail.com',
          phone: '+1234567890',
          membershipId: 'MEMBER001'
        },
        testEndpoints: {
          sendOTP: 'POST /api/auth/send-otp',
          memberLogin: 'Your member login page'
        },
        nextSteps: [
          '1. Test member login with email: azad818n.s@gmail.com',
          '2. Test member login with phone: +1234567890', 
          '3. Test member login with membership ID: MEMBER001',
          '4. Check OTP generation and verification'
        ]
      })
    }
    
    if (action === 'test-otp') {
      // Test OTP functionality
      try {
        const testEmail = 'azad818n.s@gmail.com'
        const testOTP = '123456'
        
        // Store test OTP
        await sql`
          INSERT INTO otp_verifications (contact, otp_code, otp_type, expires_at)
          VALUES (${testEmail}, ${testOTP}, 'email', NOW() + INTERVAL '10 minutes')
        `
        
        // Verify test OTP
        const verification = await sql`
          SELECT * FROM otp_verifications 
          WHERE contact = ${testEmail} AND otp_code = ${testOTP}
          ORDER BY created_at DESC 
          LIMIT 1
        `
        
        return NextResponse.json({
          success: true,
          message: 'OTP test completed successfully',
          testResults: {
            stored: true,
            retrieved: verification.rows.length > 0,
            otpRecord: verification.rows[0] || null
          }
        })
      } catch (error: any) {
        return NextResponse.json({
          success: false,
          error: 'OTP test failed',
          details: error.message
        }, { status: 500 })
      }
    }
    
    return NextResponse.json({
      error: 'Invalid action',
      validActions: [
        'create-members-table',
        'create-sample-member', 
        'create-otp-table',
        'setup-all',
        'test-otp'
      ]
    }, { status: 400 })
    
  } catch (error: any) {
    console.error('❌ Database setup action failed:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Database setup action failed'
    }, { status: 500 })
  }
}