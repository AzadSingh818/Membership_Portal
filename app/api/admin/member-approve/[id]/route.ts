// app/api/admin/member-approve/[id]/route.ts - NEW FILE
import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@vercel/postgres'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const applicationId = id
    
    if (!applicationId || isNaN(Number(applicationId))) {
      return NextResponse.json({ 
        error: 'Invalid application ID' 
      }, { status: 400 })
    }
    
    console.log('✅ Approving member application:', applicationId)
    
    // Get the application details first
    const appResult = await sql`
      SELECT * FROM member_applications 
      WHERE id = ${applicationId} AND status = 'pending'
    `
    
    if (appResult.rows.length === 0) {
      return NextResponse.json({ 
        error: 'Application not found or already processed' 
      }, { status: 404 })
    }
    
    const application = appResult.rows[0]
    
    // Start transaction by inserting into members table
    const insertResult = await sql`
      INSERT INTO members (
        membership_id, first_name, last_name, email, phone, address,
        designation, experience, achievements, payment_method,
        organization_id, status, created_at
      )
      VALUES (
        ${application.membership_id},
        ${application.first_name},
        ${application.last_name},
        ${application.email},
        ${application.phone},
        ${application.address},
        ${application.designation || null},
        ${application.experience || null},
        ${application.achievements || null},
        ${application.payment_method || null},
        ${application.organization_id},
        'approved',
        NOW()
      )
      RETURNING id
    `
    
    if (insertResult.rows.length === 0) {
      return NextResponse.json({ 
        error: 'Failed to create member record' 
      }, { status: 500 })
    }
    
    // Update application status
    await sql`
      UPDATE member_applications 
      SET status = 'approved', approved_at = NOW()
      WHERE id = ${applicationId}
    `
    
    console.log('✅ Member application approved successfully')
    
    return NextResponse.json({ 
      success: true,
      message: 'Member approved successfully - they can now login!',
      member: {
        name: `${application.first_name} ${application.last_name}`,
        email: application.email,
        membership_id: application.membership_id
      }
    })
    
  } catch (error) {
    console.error('❌ Error approving member:', error)
    return NextResponse.json({ 
      error: 'Failed to approve member application' 
    }, { status: 500 })
  }
}