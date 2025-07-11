// app/api/superadmin/check-constraints/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { Pool } from '@neondatabase/serverless'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })

export async function GET(request: NextRequest) {
  try {
    const client = await pool.connect()
    
    try {
      console.log('🔍 Checking database constraints for admin_users table')
      
      // Check the check constraints
      const constraintsResult = await client.query(`
        SELECT 
          tc.table_name, 
          tc.constraint_name, 
          cc.check_clause
        FROM information_schema.table_constraints tc
        JOIN information_schema.check_constraints cc 
          ON tc.constraint_name = cc.constraint_name
        WHERE tc.table_name = 'admin_users' 
          AND tc.constraint_type = 'CHECK'
      `)
      
      // Get table structure
      const columnsResult = await client.query(`
        SELECT 
          column_name, 
          data_type, 
          is_nullable, 
          column_default
        FROM information_schema.columns 
        WHERE table_name = 'admin_users'
        ORDER BY ordinal_position
      `)
      
      // Check existing status values
      let existingStatuses = []
      try {
        const statusResult = await client.query(`
          SELECT DISTINCT status FROM admin_users WHERE status IS NOT NULL
        `)
        existingStatuses = statusResult.rows.map(row => row.status)
      } catch (error) {
        if (error instanceof Error) {
          console.log('Could not fetch existing status values:', error.message)
        } else {
          console.log('Could not fetch existing status values:', String(error))
        }
      }
      
      // Get all constraints
      const allConstraintsResult = await client.query(`
        SELECT 
          tc.constraint_name,
          tc.constraint_type,
          kcu.column_name,
          tc.table_name
        FROM information_schema.table_constraints tc
        LEFT JOIN information_schema.key_column_usage kcu
          ON tc.constraint_name = kcu.constraint_name
        WHERE tc.table_name = 'admin_users'
      `)
      
      return NextResponse.json({
        success: true,
        checkConstraints: constraintsResult.rows,
        tableStructure: columnsResult.rows,
        existingStatusValues: existingStatuses,
        allConstraints: allConstraintsResult.rows,
        analysis: {
          hasCheckConstraint: constraintsResult.rows.length > 0,
          statusColumn: columnsResult.rows.find(col => col.column_name === 'status'),
          constraintDetails: constraintsResult.rows.find(c => c.constraint_name === 'chk_admin_status')
        }
      })
      
    } finally {
      client.release()
    }
    
  } catch (error) {
    console.error('❌ Error checking constraints:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}