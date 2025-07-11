// app/api/superadmin/admins/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { Pool } from '@neondatabase/serverless'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })

export async function GET(request: NextRequest) {
  try {
    console.log('📋 Fetching all admins from admin_requests table (Neon DB)')
    
    // Get status filter from query params
    const { searchParams } = new URL(request.url)
    const statusFilter = searchParams.get('status')
    
    const client = await pool.connect()
    
    try {
      // Build query with status filter
      // Using correct column names: created_at, updated_at, approved_at, approved_by
      let query = `
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
          o.name as organization_name,
          'admin' as role,
          '' as username,
          '' as phone
        FROM admin_requests ar
        LEFT JOIN organizations o ON ar.organization::integer = o.id
      `
      
      // Add status filter if provided
      if (statusFilter && statusFilter !== 'all') {
        query += ` WHERE ar.status = '${statusFilter}'`
      }
      
      query += ` ORDER BY ar.created_at DESC`
      
      console.log('🔍 Executing admin query with status filter:', statusFilter)
      
      const result = await client.query(query)
      const admins = result.rows
      
      console.log('✅ Found admins from admin_requests:', {
        total: admins.length,
        pending: admins.filter(a => a.status === 'pending').length,
        approved: admins.filter(a => a.status === 'approved').length,
        rejected: admins.filter(a => a.status === 'rejected').length
      })

      return NextResponse.json({
        success: true,
        admins: admins,
        count: admins.length,
        stats: {
          total: admins.length,
          pending: admins.filter(a => a.status === 'pending').length,
          approved: admins.filter(a => a.status === 'approved').length,
          rejected: admins.filter(a => a.status === 'rejected').length
        }
      })
      
    } finally {
      client.release()
    }

  } catch (error) {
    console.error('❌ Error fetching admins:', error)
    
    // Fallback: try simple query without organization join
    try {
      const client = await pool.connect()
      try {
        let fallbackQuery = `
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
            notes,
            'admin' as role,
            '' as username,
            '' as phone
          FROM admin_requests
        `
        
        const statusFilter = new URL(request.url).searchParams.get('status')
        if (statusFilter && statusFilter !== 'all') {
          fallbackQuery += ` WHERE status = '${statusFilter}'`
        }
        
        fallbackQuery += ` ORDER BY created_at DESC`
        
        const fallbackResult = await client.query(fallbackQuery)
        const fallbackAdmins = fallbackResult.rows
        
        console.log('✅ Fallback query successful, found admins:', fallbackAdmins.length)
        
        return NextResponse.json({
          success: true,
          admins: fallbackAdmins,
          count: fallbackAdmins.length,
          note: 'Retrieved without organization names'
        })
        
      } finally {
        client.release()
      }
      
    } catch (fallbackError) {
      console.error('❌ Fallback query also failed:', fallbackError)
      
      return NextResponse.json({ 
        error: 'Failed to fetch admins: ' + (error instanceof Error ? error.message : 'Unknown error'),
        admins: [],
        count: 0
      }, { status: 500 })
    }
  }
}