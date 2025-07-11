// Create this file: /app/api/debug-env/route.ts
import { NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

export async function GET() {
  try {
    console.log('🔍 Debugging environment variables...')
    
    // Check all environment variables
    const envVars = {
      SMTP_HOST: process.env.SMTP_HOST,
      SMTP_PORT: process.env.SMTP_PORT,
      SMTP_USER: process.env.SMTP_USER,
      SMTP_PASSWORD: process.env.SMTP_PASSWORD
    }
    
    console.log('📊 Raw environment check:', {
      SMTP_HOST: envVars.SMTP_HOST || 'MISSING',
      SMTP_PORT: envVars.SMTP_PORT || 'MISSING',
      SMTP_USER: envVars.SMTP_USER || 'MISSING',
      SMTP_PASSWORD: envVars.SMTP_PASSWORD ? `SET (${envVars.SMTP_PASSWORD.length} characters)` : 'MISSING'
    })
    
    // Check what's missing
    const missing = Object.entries(envVars)
      .filter(([key, value]) => !value)
      .map(([key]) => key)
    
    if (missing.length > 0) {
      return NextResponse.json({
        success: false,
        error: 'Missing environment variables',
        missing: missing,
        found: Object.entries(envVars)
          .filter(([key, value]) => value)
          .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {}),
        help: {
          message: 'Add missing variables to .env.local file',
          example: {
            'SMTP_HOST': 'smtp.gmail.com',
            'SMTP_PORT': '587',
            'SMTP_USER': 'your-email@gmail.com',
            'SMTP_PASSWORD': 'your-16-char-app-password'
          }
        }
      }, { status: 400 })
    }
    
    // Test SMTP connection if all vars are present
    console.log('🔧 Testing SMTP connection...')
    const transporter = nodemailer.createTransport({
      host: envVars.SMTP_HOST,
      port: parseInt(envVars.SMTP_PORT!),
      secure: envVars.SMTP_PORT === '465',
      auth: {
        user: envVars.SMTP_USER,
        pass: envVars.SMTP_PASSWORD
      }
    })
    
    // Verify connection
    await transporter.verify()
    
    return NextResponse.json({
      success: true,
      message: '🎉 All environment variables are set and SMTP connection works!',
      environment: {
        SMTP_HOST: envVars.SMTP_HOST,
        SMTP_PORT: envVars.SMTP_PORT,
        SMTP_USER: envVars.SMTP_USER,
        SMTP_PASSWORD: `***${envVars.SMTP_PASSWORD!.slice(-4)}` // Show last 4 chars only
      },
      smtp_status: 'Connected successfully'
    })
    
  } catch (error) {
    console.error('❌ Environment debug failed:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      help: {
        common_issues: [
          'App password not generated in Gmail',
          'Wrong app password (should be 16 characters)',
          '.env.local file not in project root',
          'Development server not restarted after env changes',
          'Using regular Gmail password instead of app password'
        ]
      }
    }, { status: 500 })
  }
}