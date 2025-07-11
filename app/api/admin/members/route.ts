// app/api/admin/members/route.ts - FIXED VERSION
import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@vercel/postgres'

export async function GET(request: NextRequest) {
  try {
    console.log('👥 Fetching approved members for admin dashboard')
    
    // Get approved members with organization info
    const result = await sql`
      SELECT 
        m.id,
        m.first_name,
        m.last_name,
        m.email,
        m.phone,
        m.membership_id,
        m.status,
        m.created_at,
        m.organization_id,
        o.name as organization_name
      FROM members m
      LEFT JOIN organizations o ON m.organization_id = o.id
      WHERE m.status = 'approved'
      ORDER BY m.created_at DESC
    `
    
    console.log('✅ Found approved members:', result.rows.length)
    
    return NextResponse.json({ 
      success: true,
      members: result.rows 
    })
    
  } catch (error) {
    console.error('❌ Error fetching members:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch members',
      members: [] // Return empty array so dashboard doesn't break
    }, { status: 500 })
  }
}