import { NextRequest, NextResponse } from "next/server"
import { sendEmailOTP } from "@/lib/otp"
import { sql } from '@vercel/postgres'

export async function GET() {
  console.log('🔍 Testing complete registration flow...')
  
  const config = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    
    // Check SMTP configuration
    smtp: {
      host: process.env.SMTP_HOST || '❌ NOT SET',
      port: process.env.SMTP_PORT || '❌ NOT SET',
      user: process.env.SMTP_USER || '❌ NOT SET',
      hasPassword: !!process.env.SMTP_PASS,
      passwordLength: process.env.SMTP_PASS?.length || 0,
      isConfigured: !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS)
    },
    
    // Check Twilio configuration
    twilio: {
      hasAccountSid: !!process.env.TWILIO_ACCOUNT_SID,
      hasAuthToken: !!process.env.TWILIO_AUTH_TOKEN,
      hasPhoneNumber: !!process.env.TWILIO_PHONE_NUMBER,
      isConfigured: !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_PHONE_NUMBER)
    },
    
    // Check database connection
    database: {
      hasUrl: !!process.env.DATABASE_URL,
      urlPreview: process.env.DATABASE_URL ? 
        process.env.DATABASE_URL.substring(0, 20) + '...' : 'NOT SET',
      connection: undefined as string | undefined,
      error: undefined as string | undefined,
      otpTable: undefined as string | undefined
    },
    
    status: getOverallStatus(),
    nextSteps: getNextSteps()
  }

  // Test database connection
  try {
    await sql`SELECT 1 as test`
    config.database.connection = '✅ Connected'
  } catch (error) {
    config.database.connection = '❌ Failed'
    config.database.error = error instanceof Error ? error.message : 'Unknown error'
  }

  // Check if OTP table exists
  try {
    const result = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'otp_verifications'
      )
    `
    config.database.otpTable = result.rows[0].exists ? '✅ Exists' : '❌ Missing'
  } catch (error) {
    config.database.otpTable = '❌ Check failed'
  }

  return NextResponse.json(config)
}

export async function POST(request: NextRequest) {
  try {
    const { action, email } = await request.json()
    
    if (action === 'test-email-otp') {
      if (!email) {
        return NextResponse.json({ error: "Email is required" }, { status: 400 })
      }

      console.log(`🧪 Testing complete email OTP flow for: ${email}`)

      // Step 1: Test email sending
      const testOTP = "123456"
      const startTime = Date.now()
      
      console.log('📧 Step 1: Testing email sending...')
      const emailSuccess = await sendEmailOTP(email, testOTP)
      const endTime = Date.now()
      
      if (!emailSuccess) {
        return NextResponse.json({
          success: false,
          error: "Email sending failed",
          step: "email-sending",
          duration: `${endTime - startTime}ms`,
          troubleshooting: [
            "Check SMTP configuration in .env.local",
            "Verify Gmail App Password setup",
            "Check server console for detailed errors",
            "Ensure 2FA is enabled on Gmail account"
          ]
        }, { status: 500 })
      }

      console.log('✅ Email sending test passed!')

      // Step 2: Test database storage
      console.log('💾 Step 2: Testing database operations...')
      try {
        // Store test OTP
        await sql`
          INSERT INTO otp_verifications (contact, otp_code, otp_type, created_at, expires_at, is_used)
          VALUES (${email}, ${testOTP}, 'email', NOW(), NOW() + INTERVAL '10 minutes', FALSE)
        `

        // Verify it can be retrieved
        const result = await sql`
          SELECT * FROM otp_verifications 
          WHERE contact = ${email} AND otp_code = ${testOTP} AND otp_type = 'email'
          ORDER BY created_at DESC LIMIT 1
        `

        if (result.rows.length === 0) {
          throw new Error('OTP not found after insertion')
        }

        // Clean up test data
        await sql`
          DELETE FROM otp_verifications 
          WHERE contact = ${email} AND otp_code = ${testOTP}
        `

        console.log('✅ Database operations test passed!')

        return NextResponse.json({
          success: true,
          message: "🎉 Complete OTP flow test successful!",
          results: {
            emailSending: "✅ PASSED",
            databaseOperations: "✅ PASSED",
            duration: `${endTime - startTime}ms`,
            testOTP: testOTP
          },
          instructions: [
            "✅ Email OTP system is working correctly",
            "📧 Check the test email in your inbox",
            "📁 Also check spam/junk folder",
            "🔄 You can now test the full registration flow"
          ],
          nextSteps: [
            "Test the registration form with real data",
            "Verify OTP codes are received",
            "Complete the registration process",
            "Check admin account creation"
          ]
        })

      } catch (dbError) {
        console.error('❌ Database test failed:', dbError)
        return NextResponse.json({
          success: false,
          error: "Database operations failed",
          step: "database-operations",
          details: dbError instanceof Error ? dbError.message : 'Unknown database error',
          troubleshooting: [
            "Check DATABASE_URL in .env.local",
            "Verify otp_verifications table exists",
            "Run the table creation SQL script",
            "Check database connection and permissions"
          ]
        }, { status: 500 })
      }
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })

  } catch (error) {
    console.error("❌ Test endpoint error:", error)
    return NextResponse.json({ 
      success: false,
      error: "Test failed", 
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}

function getOverallStatus() {
  const hasSmtp = !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS)
  const hasTwilio = !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN)
  const hasDatabase = !!process.env.DATABASE_URL
  
  if (hasSmtp && hasTwilio && hasDatabase) {
    return "✅ All services configured and ready"
  }
  
  const missing = []
  if (!hasSmtp) missing.push("SMTP")
  if (!hasTwilio) missing.push("Twilio")  
  if (!hasDatabase) missing.push("Database")
  
  return `⚠️ Missing: ${missing.join(', ')}`
}

function getNextSteps() {
  const steps = []
  
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    steps.push("Configure SMTP settings in .env.local")
  }
  
  if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
    steps.push("Configure Twilio settings in .env.local")
  }
  
  if (!process.env.DATABASE_URL) {
    steps.push("Configure DATABASE_URL in .env.local")
  }
  
  if (steps.length === 0) {
    steps.push("Run test: POST /api/test/registration-flow with {\"action\": \"test-email-otp\", \"email\": \"test@example.com\"}")
    steps.push("Test complete registration flow")
  }
  
  return steps
}