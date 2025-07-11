// app/api/superadmin/admin-requests/route.ts - COLUMN-SAFE VERSION
import { NextRequest, NextResponse } from 'next/server'
import { Pool } from '@neondatabase/serverless'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })

export async function GET(request: NextRequest) {
  try {
    console.log('📋 Fetching admin requests - Column-safe approach')
    
    const client = await pool.connect()
    
    try {
      // ✅ STEP 1: Check what columns exist in admin_requests table
      const columnsResult = await client.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'admin_requests' AND table_schema = 'public'
        ORDER BY ordinal_position
      `)
      
      const availableColumns = columnsResult.rows.map(row => row.column_name)
      console.log('📊 Available admin_requests columns:', availableColumns)
      
      // ✅ STEP 2: Build dynamic query based on available columns
      const baseColumns = ['id', 'email', 'first_name', 'last_name', 'status', 'created_at', 'organization']
      const optionalColumns = ['username', 'phone', 'password_hash', 'approved_at', 'notes']
      
      const selectColumns = []
      
      // Add base columns (always present)
      baseColumns.forEach(col => {
        if (availableColumns.includes(col)) {
          selectColumns.push(`ar.${col}`)
        }
      })
      
      // Add optional columns if they exist
      optionalColumns.forEach(col => {
        if (availableColumns.includes(col)) {
          selectColumns.push(`ar.${col}`)
        } else {
          // Add default values for missing columns
          switch(col) {
            case 'username':
              selectColumns.push(`'' as ${col}`)
              break
            case 'phone':
              selectColumns.push(`'' as ${col}`)
              break
            case 'password_hash':
              selectColumns.push(`'' as ${col}`)
              break
            default:
              selectColumns.push(`NULL as ${col}`)
          }
        }
      })
      
      // Always add computed fields
      selectColumns.push(`'admin' as role`)
      
      console.log('🔧 Using columns:', selectColumns)
      
      // ✅ STEP 3: Execute dynamic query
      const query = `
        SELECT ${selectColumns.join(', ')}
        FROM admin_requests ar
        ORDER BY ar.created_at DESC
      `
      
      const result = await client.query(query)
      console.log('✅ Dynamic query successful, rows:', result.rows.length)
      
      let adminRequests = result.rows
      
      // ✅ STEP 4: Try to enhance with organization names (but don't fail)
      try {
        const enhancedQuery = `
          SELECT ${selectColumns.join(', ')},
                 COALESCE(o.name, ar.organization, 'Unknown') as organization_name
          FROM admin_requests ar
          LEFT JOIN organizations o ON CAST(ar.organization AS INTEGER) = o.id
          ORDER BY ar.created_at DESC
        `
        
        const enhancedResult = await client.query(enhancedQuery)
        adminRequests = enhancedResult.rows
        console.log('✅ Enhanced with organization names')
        
      } catch (orgError) {
        console.log('⚠️ Organization enhancement failed, using basic data')
        // Add default organization_name
        adminRequests = adminRequests.map(req => ({
          ...req,
          organization_name: req.organization || 'Unknown'
        }))
      }
      
      // ✅ STEP 5: Clean and format data
      adminRequests = adminRequests.map(req => {
        // Generate better username if current one is email-based or missing
        let displayUsername = req.username || ''
        
        if (!displayUsername || displayUsername === '' || 
            displayUsername === req.email?.split('@')[0]) {
          
          if (req.first_name && req.last_name) {
            displayUsername = `${req.first_name.toLowerCase()} ${req.last_name.toLowerCase()}`
          } else if (req.first_name) {
            displayUsername = req.first_name.toLowerCase()
          } else {
            displayUsername = 'Not specified'
          }
        }
        
        return {
          id: req.id,
          email: req.email,
          first_name: req.first_name || '',
          last_name: req.last_name || '',
          username: displayUsername,
          phone: req.phone || '',
          role: req.role || 'admin',
          status: req.status || 'pending',
          organization_id: req.organization,
          organization_name: req.organization_name || 'Unknown',
          created_at: req.created_at,
          approved_at: req.approved_at || null,
          notes: req.notes || ''
        }
      })
      
      // ✅ STEP 6: Calculate statistics
      const stats = {
        total: adminRequests.length,
        pending: adminRequests.filter(req => req.status === 'pending').length,
        approved: adminRequests.filter(req => req.status === 'approved').length,
        rejected: adminRequests.filter(req => req.status === 'rejected').length
      }
      
      console.log('📊 Final admin requests stats:', stats)
      console.log('📊 Sample request:', adminRequests[0] ? {
        id: adminRequests[0].id,
        email: adminRequests[0].email,
        username: adminRequests[0].username,
        status: adminRequests[0].status
      } : 'No requests')
      
      return NextResponse.json({
        success: true,
        requests: adminRequests,
        count: adminRequests.length,
        stats,
        meta: {
          availableColumns,
          columnsUsed: selectColumns.length,
          enhancedWithOrganizations: adminRequests[0]?.organization_name !== 'Unknown'
        }
      })
      
    } finally {
      client.release()
    }

  } catch (error) {
    console.error('❌ Error fetching admin requests:', error)
    
    return NextResponse.json({ 
      error: 'Failed to fetch admin requests: ' + (error instanceof Error ? error.message : 'Unknown error'),
      requests: [],
      count: 0,
      stats: { total: 0, pending: 0, approved: 0, rejected: 0 }
    }, { status: 500 })
  }
}