// Create this file to test your email setup: /app/api/test-email/route.ts
import { NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

export async function GET() {
  try {
    console.log('🧪 Testing email configuration...')
    
    // Check environment variables
    const envCheck = {
      SMTP_HOST: process.env.SMTP_HOST || 'MISSING',
      SMTP_PORT: process.env.SMTP_PORT || 'MISSING', 
      SMTP_USER: process.env.SMTP_USER || 'MISSING',
      SMTP_PASSWORD: process.env.SMTP_PASSWORD ? 'SET' : 'MISSING'
    }
    
    console.log('📊 Environment variables:', envCheck)
    
    const missingVars = Object.entries(envCheck)
      .filter(([key, value]) => value === 'MISSING')
      .map(([key]) => key)
    
    if (missingVars.length > 0) {
      return NextResponse.json({
        success: false,
        error: 'Missing environment variables',
        missing: missingVars,
        current: envCheck
      }, { status: 400 })
    }
    
    // Test nodemailer import
    console.log('📦 Testing nodemailer import...')
    if (!nodemailer.createTransport) {
      throw new Error('nodemailer.createTransport is not available')
    }
    
    // Create test transporter
    console.log('🔧 Creating test transporter...')
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT!),
      secure: process.env.SMTP_PORT === '465',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD
      }
    })
    
    // Test connection
    console.log('🔍 Testing SMTP connection...')
    await transporter.verify()
    
    console.log('✅ All tests passed!')
    
    return NextResponse.json({
      success: true,
      message: '🎉 Email configuration is working correctly!',
      environment: envCheck,
      nodemailer: 'OK',
      smtp_connection: 'OK'
    })
    
  } catch (error) {
    console.error('❌ Email test failed:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      environment: {
        SMTP_HOST: process.env.SMTP_HOST || 'MISSING',
        SMTP_PORT: process.env.SMTP_PORT || 'MISSING', 
        SMTP_USER: process.env.SMTP_USER || 'MISSING',
        SMTP_PASSWORD: process.env.SMTP_PASSWORD ? 'SET' : 'MISSING'
      }
    }, { status: 500 })
  }
}