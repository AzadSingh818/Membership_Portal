// app/api/superadmin/admins/route.ts - EMERGENCY SIMPLE VERSION
import { NextRequest, NextResponse } from 'next/server'
import { Pool } from '@neondatabase/serverless'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })

export async function GET(request: NextRequest) {
  try {
    console.log('🚨 EMERGENCY: Fetching all admins - simple guaranteed version')
    
    const client = await pool.connect()
    
    try {
      let allAdmins: any[] = []
      
      // ✅ STEP 1: Get ALL records from admin_requests (THIS IS WHAT SHOWS ON DASHBOARD)
      try {
        console.log('🔧 Getting admin_requests (PRIMARY SOURCE)...')
        const requestsResult = await client.query(`
          SELECT 
            id,
            email,
            first_name,
            last_name,
            status,
            created_at,
            organization
          FROM admin_requests
          ORDER BY created_at DESC
        `)
        
        allAdmins = requestsResult.rows.map(row => ({
          id: row.id,
          email: row.email,
          first_name: row.first_name || '',
          last_name: row.last_name || '',
          username: '', // Default
          phone: '',
          role: 'admin',
          status: row.status || 'pending',
          organization_id: row.organization,
          organization_name: row.organization || 'Unknown',
          created_at: row.created_at,
          source_table: 'admin_requests'
        }))
        
        console.log('✅ PRIMARY SUCCESS: Got admin_requests:', allAdmins.length)
        
        // Try to enhance with username
        try {
          const enhancedResult = await client.query(`
            SELECT 
              id,
              email,
              first_name,
              last_name,
              username,
              phone,
              status,
              created_at,
              organization
            FROM admin_requests
            ORDER BY created_at DESC
          `)
          
          allAdmins = enhancedResult.rows.map(row => ({
            id: row.id,
            email: row.email,
            first_name: row.first_name || '',
            last_name: row.last_name || '',
            username: row.username || '',
            phone: row.phone || '',
            role: 'admin',
            status: row.status || 'pending',
            organization_id: row.organization,
            organization_name: row.organization || 'Unknown',
            created_at: row.created_at,
            source_table: 'admin_requests'
          }))
          
          console.log('✅ Enhanced admin_requests with username/phone')
          
        } catch (enhanceError) {
          console.log('⚠️ Username enhancement failed, using basic data')
        }
        
      } catch (requestsError) {
        const errorMsg = (requestsError instanceof Error) ? requestsError.message : String(requestsError)
        console.error('❌ admin_requests query failed:', errorMsg)
        return NextResponse.json({
          success: false,
          error: 'Cannot access admin_requests table: ' + errorMsg,
          admins: [],
          count: 0
        }, { status: 500 })
      }
      
      // ✅ STEP 2: Try to get approved admins from admins table and merge
      try {
        console.log('🔧 Getting approved admins from admins table...')
        const approvedResult = await client.query(`
          SELECT 
            id,
            email,
            first_name,
            last_name,
            username,
            phone,
            role,
            status,
            organization_id,
            created_at
          FROM admins
          WHERE status = 'approved'
          ORDER BY created_at DESC
        `)
        
        console.log('✅ Got approved admins:', approvedResult.rows.length)
        
        // Merge approved admins with admin_requests
        for (const approvedAdmin of approvedResult.rows) {
          const existingIndex = allAdmins.findIndex(admin => admin.email === approvedAdmin.email)
          
          if (existingIndex >= 0) {
            // Update existing record with approved status and better data
            allAdmins[existingIndex] = {
              ...allAdmins[existingIndex],
              username: approvedAdmin.username || allAdmins[existingIndex].username,
              phone: approvedAdmin.phone || allAdmins[existingIndex].phone,
              status: 'approved', // Override with approved status
              organization_id: approvedAdmin.organization_id || allAdmins[existingIndex].organization_id,
              source_table: 'both'
            }
          } else {
            // Add new approved admin (might be old record not in admin_requests)
            allAdmins.push({
              id: approvedAdmin.id,
              email: approvedAdmin.email,
              first_name: approvedAdmin.first_name || '',
              last_name: approvedAdmin.last_name || '',
              username: approvedAdmin.username || '',
              phone: approvedAdmin.phone || '',
              role: approvedAdmin.role || 'admin',
              status: 'approved',
              organization_id: approvedAdmin.organization_id,
              organization_name: 'Unknown',
              created_at: approvedAdmin.created_at,
              source_table: 'admins'
            })
          }
        }
        
        console.log('✅ Merged approved admins, total now:', allAdmins.length)
        
      } catch (adminsError) {
        console.log('⚠️ Admins table query failed, using only admin_requests:', adminsError instanceof Error ? adminsError.message : String(adminsError))
      }
      
      // ✅ STEP 3: Try to add organization names
      try {
        for (let i = 0; i < allAdmins.length; i++) {
          const admin = allAdmins[i]
          if (admin.organization_id) {
            try {
              const orgResult = await client.query(`
                SELECT name FROM organizations WHERE id = $1
              `, [parseInt(admin.organization_id)])
              
              if (orgResult.rows.length > 0) {
                allAdmins[i].organization_name = orgResult.rows[0].name
              }
            } catch (orgError) {
              // Ignore individual org errors
            }
          }
        }
        console.log('✅ Added organization names')
      } catch (orgError) {
        console.log('⚠️ Organization lookup failed')
      }
      
      // ✅ FINAL CLEANUP
      allAdmins = allAdmins.map(admin => ({
        ...admin,
        username: admin.username || 'Not specified'
      }))
      
      // Sort by date (newest first)
      allAdmins.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      
      const stats = {
        total: allAdmins.length,
        pending: allAdmins.filter(a => a.status === 'pending').length,
        approved: allAdmins.filter(a => a.status === 'approved').length,
        rejected: allAdmins.filter(a => a.status === 'rejected').length
      }
      
      console.log('📊 EMERGENCY SUCCESS - Final stats:', stats)
      console.log('📊 Sample admin:', allAdmins[0] ? {
        email: allAdmins[0].email,
        username: allAdmins[0].username,
        status: allAdmins[0].status,
        source: allAdmins[0].source_table
      } : 'No admins')
      
      return NextResponse.json({
        success: true,
        admins: allAdmins,
        count: allAdmins.length,
        stats,
        note: 'Emergency simple version - admin requests should show now'
      })
      
    } finally {
      client.release()
    }
    
  } catch (error) {
    console.error('❌ CRITICAL EMERGENCY ERROR:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Emergency error: ' + (error instanceof Error ? error.message : 'Unknown error'),
      admins: [],
      count: 0,
      stats: { total: 0, pending: 0, approved: 0, rejected: 0 }
    }, { status: 200 }) // Return 200 so dashboard doesn't crash
  }
}