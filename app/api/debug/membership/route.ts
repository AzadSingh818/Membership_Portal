// Create this file: app/api/debug/membership/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@vercel/postgres'

export async function GET() {
  try {
    console.log('🔍 Debugging membership database...')
    
    const debug: {
      timestamp: string,
      tables: string[],
      membershipIds: Record<string, any>,
      error: string | null,
      specificSearch?: any
    } = {
      timestamp: new Date().toISOString(),
      tables: [],
      membershipIds: {},
      error: null
    }

    // Check what tables exist
    try {
      const tablesResult = await sql`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
        AND (table_name LIKE '%member%' OR table_name LIKE '%user%' OR table_name LIKE '%application%')
        ORDER BY table_name
      `
      
      debug.tables = tablesResult.rows.map(r => r.table_name)
      console.log('📋 Found tables:', debug.tables)
      
    } catch (error) {
      debug.error = `Error fetching tables: ${error instanceof Error ? error.message : String(error)}`
      console.error('❌ Error fetching tables:', error)
    }

    // Check membership IDs in each table
    for (const tableName of debug.tables) {
      try {
        console.log(`🔍 Checking table: ${tableName}`)
        
        // First check if membership_id column exists
        const columnsResult = await sql.query(`
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_name = $1 AND column_name LIKE '%membership%'
        `, [tableName])
        
        if (columnsResult.rows.length > 0) {
          const membershipColumn = columnsResult.rows[0].column_name
          console.log(`✅ Found membership column: ${membershipColumn} in ${tableName}`)
          
          // Get all membership IDs from this table
          const membershipResult = await sql.query(`
            SELECT ${membershipColumn}, id, email, status, is_active, created_at
            FROM ${tableName} 
            WHERE ${membershipColumn} IS NOT NULL
            ORDER BY created_at DESC
            LIMIT 10
          `)
          
          debug.membershipIds[tableName] = {
            column: membershipColumn,
            count: membershipResult.rows.length,
            samples: membershipResult.rows
          }
          
          console.log(`📊 ${tableName}: Found ${membershipResult.rows.length} membership IDs`)
        } else {
          debug.membershipIds[tableName] = {
            column: 'none',
            count: 0,
            samples: []
          }
        }
        
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error)
        console.error(`❌ Error checking ${tableName}:`, errorMsg)
        debug.membershipIds[tableName] = {
          error: errorMsg
        }
      }
    }

    // Special check for the specific membership ID
    const searchMembershipId = 'MIS-AZSI-115361'
    debug.specificSearch = {
      searchId: searchMembershipId,
      foundIn: []
    }

    for (const tableName of debug.tables) {
      if (debug.membershipIds[tableName]?.column && debug.membershipIds[tableName].column !== 'none') {
        try {
          const column = debug.membershipIds[tableName].column
          const searchResult = await sql.query(`
            SELECT * FROM ${tableName} 
            WHERE ${column} = $1 OR ${column} ILIKE $2
          `, [searchMembershipId, `%${searchMembershipId}%`])
          
          if (searchResult.rows.length > 0) {
            debug.specificSearch.foundIn.push({
              table: tableName,
              data: searchResult.rows[0]
            })
          }
        } catch (error) {
          console.error(`❌ Error searching in ${tableName}:`, error instanceof Error ? error.message : String(error))
        }
      }
    }

    return NextResponse.json({
      success: true,
      debug,
      message: 'Database debug completed'
    })
    
  } catch (error) {
    console.error('❌ Debug API error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Failed to debug database'
    }, { status: 500 })
  }
}