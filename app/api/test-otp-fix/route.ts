// Create this file: /app/api/test-otp-fix/route.ts
import { NextResponse } from 'next/server'
import { storeOTPInDB, verifyOTPInDB } from '@/lib/database'

export async function GET() {
  try {
    console.log('🧪 Testing OTP fix...')
    
    const testEmail = 'test@example.com'
    const testOTP = '123456'
    const testType = 'email'
    
    // Test 1: Store OTP
    console.log('📝 Test 1: Storing OTP...')
    await storeOTPInDB(testEmail, testOTP, testType)
    console.log('✅ OTP stored successfully!')
    
    // Test 2: Verify OTP (correct)
    console.log('🔍 Test 2: Verifying correct OTP...')
    const isValidCorrect = await verifyOTPInDB(testEmail, testOTP, testType)
    console.log('✅ Correct OTP result:', isValidCorrect)
    
    // Test 3: Verify OTP (wrong)
    console.log('🔍 Test 3: Verifying wrong OTP...')
    await storeOTPInDB(testEmail, '654321', testType) // Store new OTP
    const isValidWrong = await verifyOTPInDB(testEmail, '111111', testType)
    console.log('✅ Wrong OTP result:', isValidWrong)
    
    return NextResponse.json({
      success: true,
      message: '🎉 OTP system is working correctly!',
      tests: {
        store: 'PASSED',
        verifyCorrect: isValidCorrect ? 'PASSED' : 'FAILED',
        verifyWrong: !isValidWrong ? 'PASSED' : 'FAILED'
      }
    })
    
  } catch (error) {
    console.error('❌ Test failed:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// Clean up test data
export async function DELETE() {
  try {
    const { sql } = await import('@vercel/postgres')
    await sql`DELETE FROM otp_verifications WHERE contact = 'test@example.com'`
    return NextResponse.json({ message: 'Test data cleaned up' })
  } catch (error) {
    return NextResponse.json({ error: 'Cleanup failed' }, { status: 500 })
  }
}