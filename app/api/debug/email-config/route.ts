import { NextResponse } from "next/server"
import { sendEmailOTP } from "@/lib/otp"

export async function GET() {
  const config = {
    environment: process.env.NODE_ENV,
    emailServices: {
      resend: {
        configured: !!process.env.RESEND_API_KEY,
        keyLength: process.env.RESEND_API_KEY?.length || 0
      },
      sendgrid: {
        configured: !!process.env.SENDGRID_API_KEY,
        keyLength: process.env.SENDGRID_API_KEY?.length || 0,
        fromEmail: process.env.SENDGRID_FROM_EMAIL || 'not-set'
      },
      smtp: {
        configured: !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS),
        host: process.env.SMTP_HOST || 'not-set',
        port: process.env.SMTP_PORT || 'not-set',
        user: process.env.SMTP_USER || 'not-set',
        hasPassword: !!process.env.SMTP_PASS
      }
    },
    recommendation: getRecommendation()
  }

  return NextResponse.json(config)
}

export async function POST(request: Request) {
  try {
    const { email } = await request.json()
    
    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    // Test sending OTP
    const testOTP = "123456"
    const success = await sendEmailOTP(email, testOTP)

    return NextResponse.json({
      success,
      message: success ? "Test email sent successfully!" : "Failed to send test email",
      testOTP,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error("Email test error:", error)
    return NextResponse.json({ 
      error: "Email test failed", 
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}

function getRecommendation() {
  if (process.env.RESEND_API_KEY) {
    return "✅ Resend API configured - Ready to go!"
  }
  
  if (process.env.SENDGRID_API_KEY) {
    return "✅ SendGrid API configured - Ready to go!"
  }
  
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    return "✅ SMTP configured - Ready to go!"
  }
  
  return "❌ No email service configured. Add one of: RESEND_API_KEY, SENDGRID_API_KEY, or SMTP credentials to .env.local"
}