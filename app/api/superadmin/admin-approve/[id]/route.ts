// app/api/superadmin/admin-approve/[id]/route.ts - FIXED FOR MISSING COLUMNS
import { NextRequest, NextResponse } from 'next/server'
import { Pool } from '@neondatabase/serverless'
import bcrypt from 'bcryptjs'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const adminRequestId = id
    
    if (!adminRequestId || isNaN(Number(adminRequestId))) {
      return NextResponse.json({ 
        error: 'Invalid admin request ID' 
      }, { status: 400 })
    }
    
    console.log('✅ Approving admin request with ID:', adminRequestId)
    
    const client = await pool.connect()
    
    try {
      // ✅ ENHANCED: Get admin request with column-safe query
      let adminRequest = null
      
      // Strategy 1: Try with all columns
      try {
        const fullResult = await client.query(`
          SELECT 
            ar.*,
            o.name as organization_name
          FROM admin_requests ar
          LEFT JOIN organizations o ON ar.organization::integer = o.id
          WHERE ar.id = $1 AND ar.status = 'pending'
        `, [adminRequestId])
        
        if (fullResult.rows.length > 0) {
          adminRequest = fullResult.rows[0]
          console.log('✅ Got admin request with full data')
        }
        
      } catch (fullError) {
        console.log('⚠️ Full query failed, trying basic query')
        
        // Strategy 2: Basic query without joins
        const basicResult = await client.query(`
          SELECT * FROM admin_requests 
          WHERE id = $1 AND status = 'pending'
        `, [adminRequestId])
        
        if (basicResult.rows.length > 0) {
          adminRequest = basicResult.rows[0]
          adminRequest.organization_name = adminRequest.organization || 'Unknown'
          console.log('✅ Got admin request with basic data')
        }
      }
      
      if (!adminRequest) {
        return NextResponse.json({ 
          error: 'Admin request not found or already processed' 
        }, { status: 404 })
      }
      
      console.log('📋 Processing admin request:', {
        email: adminRequest.email,
        first_name: adminRequest.first_name,
        last_name: adminRequest.last_name,
        hasUsername: !!(adminRequest.username),
        hasPasswordHash: !!(adminRequest.password_hash)
      })
      
      // ✅ SMART CREDENTIAL LOGIC
      let username, hashedPassword, originalPassword = null
      
      // Check if we have original credentials
      if (adminRequest.username && adminRequest.username.trim() !== '' && 
          adminRequest.username !== adminRequest.email?.split('@')[0]) {
        
        // Case 1: We have a proper username (not email-based)
        username = adminRequest.username
        
        if (adminRequest.password_hash && adminRequest.password_hash.trim() !== '') {
          // We have the original password hash
          hashedPassword = adminRequest.password_hash
          console.log('✅ Using ORIGINAL credentials:', { username })
        } else {
          // We have username but no password hash - create new temporary password
          originalPassword = 'ChangeMe123!'
          hashedPassword = await bcrypt.hash(originalPassword, 12)
          console.log('✅ Using original USERNAME with new password:', { username })
        }
        
      } else if (adminRequest.first_name && adminRequest.last_name) {
        
        // Case 2: Generate username from name (BETTER than email)
        username = `${adminRequest.first_name.toLowerCase()} ${adminRequest.last_name.toLowerCase()}`
        originalPassword = 'ChangeMe123!'
        hashedPassword = await bcrypt.hash(originalPassword, 12)
        console.log('✅ Generated username from NAME:', { username })
        
      } else if (adminRequest.first_name) {
        
        // Case 3: Use first name only
        username = adminRequest.first_name.toLowerCase()
        originalPassword = 'ChangeMe123!'
        hashedPassword = await bcrypt.hash(originalPassword, 12)
        console.log('✅ Generated username from FIRST NAME:', { username })
        
      } else {
        
        // Case 4: Last resort - email based (but better formatted)
        const emailUsername = adminRequest.email.split('@')[0]
        username = emailUsername + '_admin'
        originalPassword = 'ChangeMe123!'
        hashedPassword = await bcrypt.hash(originalPassword, 12)
        console.log('⚠️ FALLBACK: Using email-based username:', { username })
      }
      
      console.log('🔐 Final credentials for admin creation:', { 
        username, 
        email: adminRequest.email,
        hasOriginalPassword: !originalPassword,
        credentialsSource: adminRequest.username ? 'original' : 'generated'
      })
      
      // Begin transaction
      await client.query('BEGIN')
      
      try {
        // 1. Update admin_requests status to approved
        await client.query(`
          UPDATE admin_requests 
          SET 
            status = 'approved',
            approved_at = NOW(),
            approved_by = 1,
            updated_at = NOW()
          WHERE id = $1
        `, [adminRequestId])
        
        console.log('✅ Admin request status updated to approved')
        
        // 2. Create admin record
        let adminCreated = false
        let newAdmin = null
        
        // Try to create admin with various strategies
        try {
          console.log('🔄 Creating admin with optimized strategy...')
          
          const createResult = await client.query(`
            INSERT INTO admins (
              username,
              email,
              password_hash,
              first_name,
              last_name,
              role,
              organization_id,
              status,
              is_active,
              created_at
            ) VALUES (
              $1, $2, $3, $4, $5, $6, $7, $8, $9, NOW()
            )
            RETURNING id, username, email, first_name, last_name, status
          `, [
            username,
            adminRequest.email,
            hashedPassword,
            adminRequest.first_name || 'Admin',
            adminRequest.last_name || 'User',
            'admin',
            adminRequest.organization ? parseInt(adminRequest.organization) : 1,
            'approved',
            true
          ])
          
          newAdmin = createResult.rows[0]
          adminCreated = true
          console.log('✅ Admin created successfully:', { 
            id: newAdmin.id, 
            username: newAdmin.username,
            email: newAdmin.email
          })
          
        } catch (createError) {
          console.error('❌ Admin creation failed:', createError instanceof Error ? createError.message : createError)
          
          // Try with minimal fields
          try {
            console.log('🔄 Trying with minimal fields...')
            
            const minimalResult = await client.query(`
              INSERT INTO admins (username, email, password_hash, role, status)
              VALUES ($1, $2, $3, $4, $5)
              RETURNING id, username, email, role, status
            `, [username, adminRequest.email, hashedPassword, 'admin', 'approved'])
            
            newAdmin = minimalResult.rows[0]
            adminCreated = true
            console.log('✅ Admin created with minimal fields')
            
          } catch (minimalError) {
            if (minimalError instanceof Error) {
              console.error('❌ Minimal admin creation also failed:', minimalError.message)
            } else {
              console.error('❌ Minimal admin creation also failed:', minimalError)
            }
          }
        }
        
        if (adminCreated && newAdmin) {
          // Commit transaction
          await client.query('COMMIT')
          
          const responseCredentials = originalPassword ? {
            username: username,
            tempPassword: originalPassword,
            loginUrl: '/admin/login',
            note: 'Please change password after first login'
          } : {
            username: username,
            note: 'Use your original password from registration',
            loginUrl: '/admin/login'
          }
          
          return NextResponse.json({ 
            success: true,
            admin: {
              id: adminRequest.id,
              first_name: adminRequest.first_name,
              last_name: adminRequest.last_name,
              email: adminRequest.email,
              username: username,
              organization_name: adminRequest.organization_name,
              status: 'approved',
              login_created: true,
              admin_user_id: newAdmin.id
            },
            loginCredentials: responseCredentials,
            message: originalPassword ? 
              `✅ Admin approved! Login: Username="${username}", Password="${originalPassword}"` :
              `✅ Admin approved! Login with Username="${username}" and your original password`
          })
          
        } else {
          // If admin creation failed, still commit the approval
          await client.query('COMMIT')
          
          return NextResponse.json({ 
            success: true,
            admin: {
              id: adminRequest.id,
              first_name: adminRequest.first_name,
              last_name: adminRequest.last_name,
              email: adminRequest.email,
              organization_name: adminRequest.organization_name,
              status: 'approved',
              login_created: false
            },
            error: 'Admin request approved but login credentials could not be created',
            message: '⚠️ Admin request approved but login access needs manual setup'
          })
        }
        
      } catch (transactionError) {
        await client.query('ROLLBACK')
        throw transactionError
      }
      
    } finally {
      client.release()
    }
    
  } catch (error) {
    console.error('❌ Error approving admin:', error)
    return NextResponse.json({ 
      error: 'Failed to approve admin: ' + (error instanceof Error ? error.message : 'Unknown error')
    }, { status: 500 })
  }
}