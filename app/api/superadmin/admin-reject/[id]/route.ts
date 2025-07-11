// app/api/superadmin/admin-reject/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { Pool } from '@neondatabase/serverless'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    // Fix: Await params to resolve Next.js warning
    const { id } = await params
    const adminRequestId = id
    
    if (!adminRequestId || isNaN(Number(adminRequestId))) {
      return NextResponse.json({ 
        error: 'Invalid admin request ID' 
      }, { status: 400 })
    }
    
    console.log('❌ Rejecting admin request with ID:', adminRequestId)
    
    const client = await pool.connect()
    
    try {
      // Update admin_requests status to rejected
      const updateResult = await client.query(`
        UPDATE admin_requests 
        SET 
          status = 'rejected',
          approved_at = NOW(),
          approved_by = 1,
          updated_at = NOW()
        WHERE id = $1 AND status = 'pending'
        RETURNING 
          id,
          email,
          first_name,
          last_name,
          organization,
          status,
          created_at,
          approved_at,
          updated_at
      `, [adminRequestId])
      
      if (updateResult.rows.length === 0) {
        return NextResponse.json({ 
          error: 'Admin request not found or already processed' 
        }, { status: 404 })
      }
      
      const rejectedRequest = updateResult.rows[0]
      
      console.log('✅ Admin request rejected successfully')
      
      return NextResponse.json({ 
        success: true,
        admin: {
          id: rejectedRequest.id,
          first_name: rejectedRequest.first_name,
          last_name: rejectedRequest.last_name,
          email: rejectedRequest.email,
          organization: rejectedRequest.organization,
          status: 'rejected',
          approved_at: rejectedRequest.approved_at,
          updated_at: rejectedRequest.updated_at
        },
        message: '❌ Admin request rejected - access denied'
      })
      
    } finally {
      client.release()
    }
    
  } catch (error) {
    console.error('❌ Error rejecting admin request:', error)
    return NextResponse.json({ 
      error: 'Failed to reject admin request: ' + (error instanceof Error ? error.message : 'Unknown error')
    }, { status: 500 })
  }
}