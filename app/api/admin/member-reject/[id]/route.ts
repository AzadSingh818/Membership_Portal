// app/api/admin/member-reject/[id]/route.ts - NEW FILE
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
    
    console.log('❌ Rejecting member application:', applicationId)
    
    // Update application status to rejected
    const result = await sql`
      UPDATE member_applications 
      SET status = 'rejected', rejected_at = NOW()
      WHERE id = ${applicationId} AND status = 'pending'
      RETURNING first_name, last_name, email
    `
    
    if (result.rows.length === 0) {
      return NextResponse.json({ 
        error: 'Application not found or already processed' 
      }, { status: 404 })
    }
    
    const rejectedApp = result.rows[0]
    
    console.log('✅ Member application rejected successfully')
    
    return NextResponse.json({ 
      success: true,
      message: 'Member application rejected - access denied',
      member: {
        name: `${rejectedApp.first_name} ${rejectedApp.last_name}`,
        email: rejectedApp.email
      }
    })
    
  } catch (error) {
    console.error('❌ Error rejecting member:', error)
    return NextResponse.json({ 
      error: 'Failed to reject member application' 
    }, { status: 500 })
  }
}