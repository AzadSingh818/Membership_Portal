import { NextRequest, NextResponse } from "next/server"
import { sendEmailOTP } from "@/lib/otp"

export async function GET() {
  console.log('🔍 SMTP Configuration Check...')
  
  const config = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    smtp: {
      host: process.env.SMTP_HOST || '❌ NOT SET',
      port: process.env.SMTP_PORT || '❌ NOT SET (default: 587)',
      user: process.env.SMTP_USER || '❌ NOT SET',
      hasPassword: !!process.env.SMTP_PASS,
      passwordLength: process.env.SMTP_PASS?.length || 0,
      isGmail: (process.env.SMTP_HOST || '').includes('gmail.com'),
    },
    twilio: {
      hasAccountSid: !!process.env.TWILIO_ACCOUNT_SID,
      hasAuthToken: !!process.env.TWILIO_AUTH_TOKEN,
      hasPhoneNumber: !!process.env.TWILIO_PHONE_NUMBER,
      accountSidPreview: process.env.TWILIO_ACCOUNT_SID ? 
        process.env.TWILIO_ACCOUNT_SID.substring(0, 8) + '...' : 'NOT SET',
      phoneNumber: process.env.TWILIO_PHONE_NUMBER || 'NOT SET'
    },
    status: getConfigStatus(),
    recommendations: getRecommendations()
  }

  console.log('📊 Configuration:', config)
  
  return NextResponse.json(config)
}

export async function POST(request: NextRequest) {
  try {
    const { email, type = 'email' } = await request.json()
    
    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    console.log(`🧪 Testing ${type} OTP to: ${email}`)

    if (type === 'email') {
      // Test email OTP
      const testOTP = "123456"
      const startTime = Date.now()
      
      console.log('🚀 Starting email OTP test...')
      const success = await sendEmailOTP(email, testOTP)
      const endTime = Date.now()
      
      console.log('📊 Email test completed:', {
        success,
        duration: `${endTime - startTime}ms`,
        testOTP
      })

      return NextResponse.json({
        success,
        type: 'email',
        message: success ? "Email OTP sent successfully!" : "Email OTP failed to send",
        testOTP,
        duration: `${endTime - startTime}ms`,
        timestamp: new Date().toISOString(),
        instructions: success ? [
          "✅ Email sent successfully!",
          "📧 Check the recipient's inbox",
          "📁 Also check spam/junk folder",
          "⏰ Allow 1-2 minutes for delivery"
        ] : [
          "❌ Email failed to send",
          "🔧 Check SMTP configuration in .env.local",
          "📝 Review server console logs for errors",
          "🔑 For Gmail: ensure you're using App Password"
        ]
      })
    }

    return NextResponse.json({ error: "Invalid type. Use 'email'" }, { status: 400 })

  } catch (error) {
    console.error("❌ SMTP test error:", error)
    
    return NextResponse.json({ 
      success: false,
      error: "Test failed", 
      details: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString(),
      troubleshooting: [
        "Check SMTP configuration in .env.local",
        "Verify environment variables are loaded",
        "Restart development server",
        "Check server console for detailed logs"
      ]
    }, { status: 500 })
  }
}

function getConfigStatus() {
  const hasSmtp = !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS)
  const hasTwilio = !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_PHONE_NUMBER)
  
  if (hasSmtp && hasTwilio) {
    return "✅ Both SMTP and Twilio configured"
  }
  
  if (hasSmtp && !hasTwilio) {
    return "⚠️ SMTP configured, Twilio missing"
  }
  
  if (!hasSmtp && hasTwilio) {
    return "⚠️ Twilio configured, SMTP missing"
  }
  
  return "❌ Both SMTP and Twilio missing"
}

function getRecommendations() {
  const recommendations = []
  
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    recommendations.push("Configure SMTP in .env.local for email OTP")
  }
  
  if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
    recommendations.push("Configure Twilio in .env.local for SMS OTP")
  }
  
  if (process.env.SMTP_HOST?.includes('gmail') && process.env.SMTP_PASS?.length !== 16) {
    recommendations.push("Use 16-character App Password for Gmail SMTP")
  }
  
  if (recommendations.length === 0) {
    recommendations.push("Configuration looks good! Test email sending below.")
  }
  
  return recommendations
}