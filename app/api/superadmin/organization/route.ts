// app/api/superadmin/organizations/route.ts
import { NextResponse } from 'next/server'
import { Pool } from '@neondatabase/serverless'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })

export async function GET() {
  try {
    const client = await pool.connect()
    
    try {
      // Get all organizations with admin count
      const result = await client.query(`
        SELECT 
          o.id,
          o.name,
          o.description,
          o.created_at,
          COUNT(a.id) FILTER (WHERE a.status = 'approved') as admin_count
        FROM organizations o
        LEFT JOIN admins a ON o.id = a.organization_id
        GROUP BY o.id, o.name, o.description, o.created_at
        ORDER BY o.name
      `)
      
      return NextResponse.json({ 
        success: true,
        organizations: result.rows 
      })
      
    } finally {
      client.release()
    }
    
  } catch (error) {
    console.error('Error fetching organizations:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch organizations' 
    }, { status: 500 })
  }
}