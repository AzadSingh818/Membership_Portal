// app/api/superadmin/check-tables/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { Pool } from '@neondatabase/serverless'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })

export async function GET(request: NextRequest) {
  try {
    const client = await pool.connect()
    
    try {
      console.log('🔍 Checking database tables and schema...')
      
      // Check which admin-related tables exist
      const tablesResult = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN ('admins', 'admin_users', 'admin_requests')
        ORDER BY table_name
      `)
      
      const existingTables = tablesResult.rows.map(row => row.table_name)
      console.log('📋 Found admin-related tables:', existingTables)
      
      const tableSchemas: { [key: string]: any } = {}
      
      // Get schema for each existing table
      for (const tableName of existingTables) {
        try {
          const schemaResult = await client.query(`
            SELECT 
              column_name, 
              data_type, 
              is_nullable, 
              column_default,
              character_maximum_length
            FROM information_schema.columns 
            WHERE table_name = $1
            ORDER BY ordinal_position
          `, [tableName])
          
          tableSchemas[tableName] = schemaResult.rows
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : String(error)
          console.log(`Error getting schema for ${tableName}:`, errorMsg)
          tableSchemas[tableName] = { error: errorMsg }
        }
      }
      
      // Check constraints for each table
      const constraints: { [key: string]: any } = {}
      for (const tableName of existingTables) {
        try {
          const constraintsResult = await client.query(`
            SELECT 
              tc.constraint_name,
              tc.constraint_type,
              cc.check_clause
            FROM information_schema.table_constraints tc
            LEFT JOIN information_schema.check_constraints cc 
              ON tc.constraint_name = cc.constraint_name
            WHERE tc.table_name = $1
          `, [tableName])
          
          constraints[tableName] = constraintsResult.rows
        } catch (error) {
          constraints[tableName] = { error: (error instanceof Error ? error.message : String(error)) }
        }
      }
      
      // Check if there are any existing records in each table
      const sampleData: { [key: string]: any } = {}
      for (const tableName of existingTables) {
        try {
          const sampleResult = await client.query(`
            SELECT * FROM ${tableName} LIMIT 3
          `)
          
          sampleData[tableName] = {
            count: sampleResult.rows.length,
            sample: sampleResult.rows
          }
        } catch (error) {
          sampleData[tableName] = { error: (error instanceof Error ? error.message : String(error)) }
        }
      }
      
      // Check what the admin login expects
      const loginExpectation = {
        table: 'admins',
        note: 'Login API in app/api/auth/admin/login/route.ts queries the "admins" table',
        expectedColumns: [
          'id', 'username', 'email', 'password_hash', 'first_name', 'last_name', 
          'role', 'organization_id', 'status', 'is_active', 'created_at'
        ]
      }
      
      return NextResponse.json({
        success: true,
        existingTables,
        tableSchemas,
        constraints,
        sampleData,
        loginExpectation,
        analysis: {
          hasAdminsTable: existingTables.includes('admins'),
          hasAdminUsersTable: existingTables.includes('admin_users'),
          hasAdminRequestsTable: existingTables.includes('admin_requests'),
          recommendation: existingTables.includes('admins') 
            ? 'Use "admins" table for login credentials (matches login API)'
            : 'Create "admins" table or update login API to use existing table'
        }
      })
      
    } finally {
      client.release()
    }
    
  } catch (error) {
    console.error('❌ Error checking tables:', error)
    return NextResponse.json({
      success: false,
      error: (error as any).message
    }, { status: 500 })
  }
}