// app/api/admin/profile/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@vercel/postgres'

interface Admin {
  id: number
  username: string
  email: string
  first_name?: string
  last_name?: string
  phone?: string
  role?: string
  organization_id?: number
  organization_name?: string
  is_active: boolean
  status?: string
  created_at: string
  experience?: string
  level?: string
  appointer?: string
}

// ✅ FIXED: Use same auth method as middleware (base64 decoding)
function verifyToken(token: string): any {
  try {
    const decoded = JSON.parse(Buffer.from(token, 'base64').toString())
    
    if (decoded.exp && decoded.exp < Math.floor(Date.now() / 1000)) {
      console.log('❌ Token expired')
      return null
    }
    
    console.log('✅ Token verified successfully:', { 
      email: decoded.email, 
      role: decoded.role,
      username: decoded.username 
    })
    return decoded
  } catch (error: any) {
    console.error('❌ Token verification error:', error.message)
    return null
  }
}

async function verifyAdminToken(request: NextRequest) {
  try {
    let authToken = request.cookies.get('auth-token')?.value || 
                   request.cookies.get('auth_token')?.value ||
                   request.cookies.get('admin-token')?.value

    if (!authToken) {
      const authHeader = request.headers.get('authorization')
      if (authHeader?.startsWith('Bearer ')) {
        authToken = authHeader.substring(7)
      }
    }

    if (!authToken) {
      console.log('❌ No authentication token found')
      return { error: 'No authentication token', status: 401 }
    }

    const decoded = verifyToken(authToken)
    if (!decoded) {
      return { error: 'Invalid or expired token', status: 401 }
    }

    return { 
      adminId: decoded.adminId || decoded.id,
      username: decoded.username,
      email: decoded.email,
      role: decoded.role,
      organizationId: decoded.organizationId
    }
  } catch (error: any) {
    console.error('❌ Token verification failed:', error.message)
    return { error: 'Invalid or expired token', status: 401 }
  }
}

// Helper function to fetch admin data from database
async function fetchAdminFromDB(adminId?: number, username?: string, email?: string): Promise<Admin | null> {
  try {
    console.log('🔍 Fetching admin data:', { adminId, username, email })

    let admin = null

    // Strategy 1: Try admin_users table first
    if (adminId || username || email) {
      try {
        let query = `
          SELECT 
            au.*,
            o.name as organization_name
          FROM admin_users au
          LEFT JOIN organizations o ON au.organization_id = o.id
          WHERE 1=1
        `
        const params: any[] = []
        
        if (adminId) {
          query += ` AND au.id = $${params.length + 1}`
          params.push(adminId)
        } else if (username) {
          query += ` AND au.username = $${params.length + 1}`
          params.push(username)
        } else if (email) {
          query += ` AND au.email = $${params.length + 1}`
          params.push(email)
        }
        
        query += ` LIMIT 1`
        
        const result = await sql.query(query, params)

        if (result.rows.length > 0) {
          admin = result.rows[0]
          console.log('✅ Admin found in admin_users table:', admin.username)
        }
      } catch (error: any) {
        console.log('❌ admin_users table query failed:', error.message)
      }
    }

    // Strategy 2: Try admins table (fallback)
    if (!admin && (adminId || username || email)) {
      try {
        let query = `
          SELECT 
            a.*,
            o.name as organization_name
          FROM admins a
          LEFT JOIN organizations o ON a.organization_id = o.id
          WHERE 1=1
        `
        const params: any[] = []
        
        if (adminId) {
          query += ` AND a.id = $${params.length + 1}`
          params.push(adminId)
        } else if (username) {
          query += ` AND a.username = $${params.length + 1}`
          params.push(username)
        } else if (email) {
          query += ` AND a.email = $${params.length + 1}`
          params.push(email)
        }
        
        query += ` LIMIT 1`
        
        const result = await sql.query(query, params)

        if (result.rows.length > 0) {
          admin = result.rows[0]
          console.log('✅ Admin found in admins table:', admin.username)
        }
      } catch (error: any) {
        console.log('❌ admins table query failed:', error.message)
      }
    }

    // Strategy 3: Try admin_requests table (if admin was recently approved)
    if (!admin && (username || email)) {
      try {
        let query = `
          SELECT 
            ar.*,
            'admin' as role,
            ar.status,
            ar.requested_at as created_at
          FROM admin_requests ar
          WHERE ar.status = 'approved'
        `
        const params: any[] = []
        
        if (username) {
          query += ` AND ar.username = $${params.length + 1}`
          params.push(username)
        } else if (email) {
          query += ` AND ar.email = $${params.length + 1}`
          params.push(email)
        }
        
        query += ` ORDER BY ar.requested_at DESC LIMIT 1`
        
        const result = await sql.query(query, params)

        if (result.rows.length > 0) {
          admin = result.rows[0]
          console.log('✅ Admin found in admin_requests table:', admin.username)
        }
      } catch (error: any) {
        console.log('❌ admin_requests table query failed:', error.message)
      }
    }

    if (!admin) {
      console.log('❌ No admin found with provided credentials')
      return null
    }

    console.log('🎉 Admin data fetched successfully:', {
      id: admin.id,
      username: admin.username,
      email: admin.email,
      role: admin.role
    })

    return admin as Admin
  } catch (error: any) {
    console.error('❌ Error fetching admin from database:', error)
    throw error
  }
}

// GET - Fetch admin profile data
export async function GET(request: NextRequest) {
  try {
    console.log('📥 GET /api/admin/profile - Fetching admin data')

    // Verify admin authentication
    const authResult = await verifyAdminToken(request)
    if ('error' in authResult) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: authResult.status }
      )
    }

    // Fetch admin data
    const admin = await fetchAdminFromDB(
      authResult.adminId,
      authResult.username,
      authResult.email
    )

    if (!admin) {
      return NextResponse.json(
        { success: false, error: 'Admin not found' },
        { status: 404 }
      )
    }

    // Return admin data
    return NextResponse.json({
      success: true,
      admin: {
        id: admin.id,
        username: admin.username,
        email: admin.email,
        name: admin.first_name && admin.last_name 
          ? `${admin.first_name} ${admin.last_name}` 
          : admin.username,
        firstName: admin.first_name,
        lastName: admin.last_name,
        phone: admin.phone,
        role: admin.role || 'admin',
        level: admin.role || 'admin',
        organizationId: admin.organization_id,
        organizationName: admin.organization_name,
        experience: admin.experience,
        appointer: admin.appointer,
        status: admin.status || 'active',
        isActive: admin.is_active,
        createdAt: admin.created_at
      }
    })

  } catch (error: any) {
    console.error('❌ Error in GET /api/admin/profile:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch admin data' },
      { status: 500 }
    )
  }
}

// PUT - Update admin profile data
export async function PUT(request: NextRequest) {
  try {
    console.log('📝 PUT /api/admin/profile - Updating admin data')

    // Verify admin authentication
    const authResult = await verifyAdminToken(request)
    if ('error' in authResult) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: authResult.status }
      )
    }

    // Get current admin data first
    const currentAdmin = await fetchAdminFromDB(
      authResult.adminId,
      authResult.username,
      authResult.email
    )

    if (!currentAdmin) {
      return NextResponse.json(
        { success: false, error: 'Admin not found' },
        { status: 404 }
      )
    }

    // Parse request body
    const updateData = await request.json()
    console.log('📋 Update data received:', updateData)

    // Validate and sanitize update data
    const allowedFields = ['first_name', 'last_name', 'phone', 'experience']
    const updates: any = {}

    for (const field of allowedFields) {
      if (updateData[field] !== undefined) {
        updates[field] = updateData[field]?.toString().trim() || null
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { success: false, error: 'No valid fields to update' },
        { status: 400 }
      )
    }

    console.log('✅ Validated updates:', updates)

    // Update in database - try admin_users first, then admins table
    let updateSuccess = false
    
    // Strategy 1: Update in admin_users table
    try {
      const setClause = Object.keys(updates)
        .map((key, index) => `${key} = $${index + 2}`)
        .join(', ')
      
      const values = [currentAdmin.id, ...Object.values(updates)]
      
      const query = `
        UPDATE admin_users 
        SET ${setClause}, updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING *
      `

      const result = await sql.query(query, values)
      
      if (result.rowCount && result.rowCount > 0) {
        updateSuccess = true
        console.log('✅ Admin updated in admin_users table')
      }
    } catch (error: any) {
      console.log('❌ Failed to update admin_users:', error.message)
    }

    // Strategy 2: Try admins table if admin_users failed
    if (!updateSuccess) {
      try {
        const setClause = Object.keys(updates)
          .map((key, index) => `${key} = $${index + 2}`)
          .join(', ')
        
        const values = [currentAdmin.id, ...Object.values(updates)]
        
        const query = `
          UPDATE admins 
          SET ${setClause}, updated_at = CURRENT_TIMESTAMP
          WHERE id = $1
          RETURNING *
        `

        const result = await sql.query(query, values)
        
        if (result.rowCount && result.rowCount > 0) {
          updateSuccess = true
          console.log('✅ Admin updated in admins table')
        }
      } catch (error: any) {
        console.log('❌ Failed to update admins table:', error.message)
      }
    }

    if (!updateSuccess) {
      return NextResponse.json(
        { success: false, error: 'Failed to update admin data' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      updatedFields: Object.keys(updates)
    })

  } catch (error: any) {
    console.error('❌ Error in PUT /api/admin/profile:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update admin data' },
      { status: 500 }
    )
  }
}