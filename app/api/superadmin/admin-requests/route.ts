// app/api/superadmin/admin-requests/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { Pool } from '@neondatabase/serverless'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })

export async function GET(request: NextRequest) {
  try {
    console.log('📋 Fetching admin requests from admin_requests table (Neon DB)')
    
    const client = await pool.connect()
    
    try {
      // Get all admin requests from admin_requests table
      // Using correct column names: created_at, updated_at, approved_at, approved_by
      const result = await client.query(`
        SELECT 
          ar.id,
          ar.email,
          ar.first_name,
          ar.last_name,
          ar.organization,
          ar.status,
          ar.created_at,
          ar.updated_at,
          ar.approved_at,
          ar.approved_by,
          ar.notes,
          o.name as organization_name
        FROM admin_requests ar
        LEFT JOIN organizations o ON ar.organization::integer = o.id
        ORDER BY ar.created_at DESC
      `)
      
      const adminRequests = result.rows
      console.log('✅ Found admin requests from admin_requests table:', adminRequests.length)
      
      // Add status counts for dashboard
      const statusCounts = {
        total: adminRequests.length,
        pending: adminRequests.filter(req => req.status === 'pending').length,
        approved: adminRequests.filter(req => req.status === 'approved').length,
        rejected: adminRequests.filter(req => req.status === 'rejected').length
      }
      
      return NextResponse.json({
        success: true,
        requests: adminRequests,
        count: adminRequests.length,
        stats: statusCounts
      })
      
    } finally {
      client.release()
    }

  } catch (error) {
    console.error('❌ Error fetching admin requests:', error)
    
    // Fallback: try without organization join
    try {
      const client = await pool.connect()
      try {
        const fallbackResult = await client.query(`
          SELECT 
            id,
            email,
            first_name,
            last_name,
            organization,
            status,
            created_at,
            updated_at,
            approved_at,
            approved_by,
            notes
          FROM admin_requests 
          ORDER BY created_at DESC
        `)
        
        const adminRequests = fallbackResult.rows
        console.log('✅ Fallback query successful, found requests:', adminRequests.length)
        
        return NextResponse.json({
          success: true,
          requests: adminRequests,
          count: adminRequests.length,
          note: 'Retrieved without organization names'
        })
        
      } finally {
        client.release()
      }
    } catch (fallbackError) {
      console.error('❌ Fallback query also failed:', fallbackError)
      
      return NextResponse.json({ 
        error: 'Failed to fetch admin requests: ' + (error instanceof Error ? error.message : 'Unknown error'),
        requests: [],
        count: 0
      }, { status: 500 })
    }
  }
}