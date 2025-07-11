// Create this file: /app/api/debug-otp/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@vercel/postgres'
import { debugOTPTable, verifyOTPInDB } from '@/lib/database'

export async function GET() {
  try {
    console.log('🔍 Debugging OTP system...')
    
    const debugInfo = await debugOTPTable()
    
    return NextResponse.json({
      success: true,
      message: 'OTP Debug Information',
      debug: debugInfo,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('❌ Debug failed:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('🧪 Testing OTP verification with:', body)
    
    const { contact, otp, otpType = 'email' } = body
    
    if (!contact || !otp) {
      return NextResponse.json({
        success: false,
        error: 'Missing contact or otp'
      }, { status: 400 })
    }
    
    // Test verification
    console.log('🔍 Testing verification...')
    const isValid = await verifyOTPInDB(contact, otp, otpType)
    
    // Get current OTPs for this contact
    const currentOTPs = await sql`
      SELECT contact, otp_code, created_at, expires_at, is_used
      FROM otp_verifications 
      WHERE contact = ${contact}
      ORDER BY created_at DESC 
      LIMIT 3
    `
    
    return NextResponse.json({
      success: true,
      verification: {
        isValid,
        contact,
        otp,
        otpType
      },
      currentOTPs: currentOTPs.rows,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('❌ Test verification failed:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}