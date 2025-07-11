// app/api/debug/database/route.ts - Create this file to test your database
import { NextResponse } from 'next/server'
import { sql } from '@vercel/postgres'

export async function GET() {
  try {
    console.log('🔍 Testing database connection...')
    
    // Test basic connection
    const testQuery = await sql`SELECT NOW() as current_time, version() as db_version`
    console.log('✅ Database connection successful')
    
    // Check if required tables exist
    const tablesResult = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('organizations', 'admins', 'members', 'member_applications', 'otp_verifications', 'superadmin_users')
      ORDER BY table_name
    `
    
    const existingTables = tablesResult.rows.map(row => row.table_name)
    const requiredTables = ['organizations', 'admins', 'members', 'member_applications', 'otp_verifications', 'superadmin_users']
    const missingTables = requiredTables.filter(table => !existingTables.includes(table))
    
    // Check organizations table specifically
    let organizationsData = []
    try {
      if (existingTables.includes('organizations')) {
        const orgsResult = await sql`
          SELECT id, name, is_active 
          FROM organizations 
          WHERE is_active = true 
          ORDER BY name
        `
        organizationsData = orgsResult.rows
      }
    } catch (orgError) {
      console.error('❌ Error fetching organizations:', orgError)
    }
    
    // Check admins table structure
    let adminsTableInfo = null
    try {
      if (existingTables.includes('admins')) {
        const adminsStructure = await sql`
          SELECT column_name, data_type, is_nullable 
          FROM information_schema.columns 
          WHERE table_name = 'admins' 
          ORDER BY ordinal_position
        `
        adminsTableInfo = adminsStructure.rows
        
        // Count existing admins
        const adminCount = await sql`SELECT COUNT(*) as count FROM admins`
        adminsTableInfo.totalAdmins = adminCount.rows[0].count
      }
    } catch (adminsError) {
      console.error('❌ Error checking admins table:', adminsError)
    }
    
    return NextResponse.json({
      success: true,
      database: {
        connected: true,
        currentTime: testQuery.rows[0].current_time,
        version: testQuery.rows[0].db_version,
      },
      tables: {
        existing: existingTables,
        missing: missingTables,
        allTablesExist: missingTables.length === 0
      },
      organizations: {
        count: organizationsData.length,
        data: organizationsData
      },
      admins: {
        tableExists: existingTables.includes('admins'),
        structure: adminsTableInfo
      },
      recommendations: missingTables.length > 0 ? [
        'Some required tables are missing',
        'Run the database schema SQL script first',
        `Missing tables: ${missingTables.join(', ')}`
      ] : [
        'All required tables exist',
        'Database is properly configured'
      ]
    })
    
  } catch (error) {
    console.error('❌ Database health check failed:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Database connection failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      recommendations: [
        'Check your DATABASE_URL in .env.local',
        'Ensure your Neon database is running',
        'Verify the connection string format',
        'Run the database schema SQL script'
      ]
    }, { status: 500 })
  }
}