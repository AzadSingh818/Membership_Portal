// app/api/admin/member-applications/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@vercel/postgres'

export async function GET(request: NextRequest) {
  try {
    console.log('📋 Fetching member applications for admin dashboard')
    
    // Get member applications with organization info
    const result = await sql`
      SELECT 
        ma.id,
        ma.first_name,
        ma.last_name,
        ma.email,
        ma.phone,
        ma.address,
        ma.designation,
        ma.experience,
        ma.achievements,
        ma.payment_method,
        ma.status,
        ma.created_at,
        ma.membership_id,
        ma.organization_id,
        o.name as organization_name
      FROM member_applications ma
      LEFT JOIN organizations o ON ma.organization_id = o.id
      WHERE ma.status = 'pending'
      ORDER BY ma.created_at DESC
    `
    
    console.log('✅ Found member applications:', result.rows.length)
    
    return NextResponse.json({ 
      success: true,
      applications: result.rows 
    })
    
  } catch (error) {
    console.error('❌ Error fetching member applications:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch member applications',
      applications: [] // Return empty array so dashboard doesn't break
    }, { status: 500 })
  }
}