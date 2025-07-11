// app/api/superadmin/approved-admins/route.ts
import { NextResponse } from 'next/server'
import { Pool } from '@neondatabase/serverless'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })

export async function GET() {
  try {
    const client = await pool.connect()
    
    try {
      // Get only approved admins with organization info
      const result = await client.query(`
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
          o.name as organization_name
        FROM admins a
        LEFT JOIN organizations o ON a.organization_id = o.id
        WHERE a.status = 'approved'
        ORDER BY o.name, a.first_name, a.last_name
      `)
      
      return NextResponse.json({ 
        success: true,
        admins: result.rows 
      })
      
    } finally {
      client.release()
    }
    
  } catch (error) {
    console.error('Error fetching approved admins:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch approved admins' 
    }, { status: 500 })
  }
}