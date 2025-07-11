// app/api/superadmin/pending-admins/route.ts - FIXED VERSION
import { NextResponse } from 'next/server'
import { sql } from '@vercel/postgres'

export async function GET() {
  try {
    console.log('📋 Fetching pending admins for superadmin dashboard')
    
    // Get only pending admins with organization info
    const result = await sql`
      SELECT 
        a.id,
        a.username,
        a.email,
        a.first_name,
        a.last_name,
        a.phone,
        a.role,
        a.status,
        a.organization_id,
        a.created_at,
        o.name as organization_name
      FROM admins a
      LEFT JOIN organizations o ON a.organization_id = o.id
      WHERE a.status = 'pending'
      ORDER BY a.created_at DESC
    `
    
    console.log('✅ Found pending admins:', result.rows.length)
    
    return NextResponse.json({ 
      success: true,
      admins: result.rows 
    })
    
  } catch (error) {
    console.error('❌ Error fetching pending admins:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch pending admins',
      admins: []
    }, { status: 500 })
  }
}

// app/api/superadmin/admin-approve/[id]/route.ts - FIXED VERSION
import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@vercel/postgres'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const adminId = id
    
    if (!adminId || isNaN(Number(adminId))) {
      return NextResponse.json({ 
        error: 'Invalid admin ID' 
      }, { status: 400 })
    }
    
    console.log('✅ Approving admin request:', adminId)
    
    // Update admin status to approved
    const updateResult = await sql`
      UPDATE admins 
      SET 
        status = 'approved',
        approved_at = NOW()
      WHERE id = ${adminId} AND status = 'pending'
      RETURNING *
    `
    
    if (updateResult.rows.length === 0) {
      return NextResponse.json({ 
        error: 'Admin not found or already processed' 
      }, { status: 404 })
    }
    
    // Get updated admin with organization info
    const adminResult = await sql`
      SELECT 
        a.*,
        o.name as organization_name
      FROM admins a
      LEFT JOIN organizations o ON a.organization_id = o.id
      WHERE a.id = ${adminId}
    `
    
    const approvedAdmin = adminResult.rows[0]
    
    console.log('✅ Admin approved successfully:', approvedAdmin.username)
    
    return NextResponse.json({ 
      success: true,
      admin: approvedAdmin,
      message: `✅ Admin approved! ${approvedAdmin.first_name} ${approvedAdmin.last_name} can now login to their dashboard.`
    })
    
  } catch (error) {
    console.error('❌ Error approving admin:', error)
    return NextResponse.json({ 
      error: 'Failed to approve admin' 
    }, { status: 500 })
  }
}

// app/api/superadmin/admin-reject/[id]/route.ts - FIXED VERSION
import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@vercel/postgres'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const adminId = id
    
    if (!adminId || isNaN(Number(adminId))) {
      return NextResponse.json({ 
        error: 'Invalid admin ID' 
      }, { status: 400 })
    }
    
    console.log('❌ Rejecting admin request:', adminId)
    
    // Update admin status to rejected
    const updateResult = await sql`
      UPDATE admins 
      SET 
        status = 'rejected',
        rejected_at = NOW()
      WHERE id = ${adminId} AND status = 'pending'
      RETURNING *
    `
    
    if (updateResult.rows.length === 0) {
      return NextResponse.json({ 
        error: 'Admin not found or already processed' 
      }, { status: 404 })
    }
    
    const rejectedAdmin = updateResult.rows[0]
    
    console.log('✅ Admin rejected successfully:', rejectedAdmin.username)
    
    return NextResponse.json({ 
      success: true,
      admin: {
        id: rejectedAdmin.id,
        first_name: rejectedAdmin.first_name,
        last_name: rejectedAdmin.last_name,
        email: rejectedAdmin.email,
        status: rejectedAdmin.status
      },
      message: `❌ Admin request rejected. ${rejectedAdmin.first_name} ${rejectedAdmin.last_name} cannot login.`
    })
    
  } catch (error) {
    console.error('❌ Error rejecting admin:', error)
    return NextResponse.json({ 
      error: 'Failed to reject admin' 
    }, { status: 500 })
  }
}

// app/api/superadmin/admins/route.ts - FIXED VERSION
import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@vercel/postgres'

export async function GET(request: NextRequest) {
  try {
    console.log('📋 Fetching all admins for superadmin dashboard')
    
    // Get query parameters
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    
    let query = `
      SELECT 
        a.id,
        a.username,
        a.email,
        a.first_name,
        a.last_name,
        a.phone,
        a.role,
        a.status,
        a.organization_id,
        a.created_at,
        a.approved_at,
        a.rejected_at,
        o.name as organization_name
      FROM admins a
      LEFT JOIN organizations o ON a.organization_id = o.id
    `
    
    if (status && status !== 'all') {
      query += ` WHERE a.status = '${status}'`
    }
    
    query += ` ORDER BY a.created_at DESC`
    
    const result = await sql.query(query)
    
    console.log('✅ Found admins:', result.rows.length)
    
    return NextResponse.json({ 
      success: true,
      admins: result.rows 
    })
    
  } catch (error) {
    console.error('❌ Error fetching admins:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch admins',
      admins: []
    }, { status: 500 })
  }
}

// app/api/superadmin/organizations/route.ts - ENHANCED VERSION
import { NextResponse } from 'next/server'
import { sql } from '@vercel/postgres'

export async function GET() {
  try {
    console.log('🏢 Fetching organizations for superadmin dashboard')
    
    // Get all organizations with admin and member counts
    const result = await sql`
      SELECT 
        o.id,
        o.name,
        o.description,
        o.address,
        o.contact_email,
        o.contact_phone,
        o.is_active,
        o.created_at,
        COUNT(DISTINCT CASE WHEN a.status = 'approved' THEN a.id END) as admin_count,
        COUNT(DISTINCT m.id) as member_count,
        COUNT(DISTINCT CASE WHEN ma.status = 'pending' THEN ma.id END) as pending_applications
      FROM organizations o
      LEFT JOIN admins a ON o.id = a.organization_id
      LEFT JOIN members m ON o.id = m.organization_id
      LEFT JOIN member_applications ma ON o.id = ma.organization_id
      WHERE o.is_active = true
      GROUP BY o.id, o.name, o.description, o.address, o.contact_email, o.contact_phone, o.is_active, o.created_at
      ORDER BY o.name
    `
    
    console.log('✅ Found organizations:', result.rows.length)
    
    return NextResponse.json({ 
      success: true,
      organizations: result.rows 
    })
    
  } catch (error) {
    console.error('❌ Error fetching organizations:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch organizations',
      organizations: []
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, description, address, contact_email, contact_phone } = body
    
    console.log('🏢 Creating new organization:', { name })

    if (!name || name.trim().length === 0) {
      return NextResponse.json({ 
        error: 'Organization name is required' 
      }, { status: 400 })
    }

    // Check if organization name already exists
    const existingOrg = await sql`
      SELECT id FROM organizations WHERE name = ${name.trim()}
    `

    if (existingOrg.rows.length > 0) {
      return NextResponse.json({ 
        error: 'Organization name already exists' 
      }, { status: 409 })
    }

    // Insert new organization
    const result = await sql`
      INSERT INTO organizations (
        name, description, address, contact_email, contact_phone, is_active
      )
      VALUES (
        ${name.trim()}, 
        ${description?.trim() || null}, 
        ${address?.trim() || null},
        ${contact_email?.trim() || null}, 
        ${contact_phone?.trim() || null}, 
        true
      )
      RETURNING *
    `

    if (result.rows.length === 0) {
      return NextResponse.json({ 
        error: 'Failed to create organization' 
      }, { status: 500 })
    }

    const newOrg = result.rows[0]
    console.log('✅ Organization created successfully:', newOrg.name)

    return NextResponse.json({
      success: true,
      message: 'Organization created successfully!',
      organization: newOrg
    })

  } catch (error) {
    console.error('❌ Error creating organization:', error)
    return NextResponse.json({ 
      error: 'Failed to create organization' 
    }, { status: 500 })
  }
}