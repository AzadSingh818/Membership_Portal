// /lib/otp.ts - FIXED VERSION
import nodemailer from 'nodemailer'
import { storeOTPInDB, verifyOTPInDB } from './database'

export function generateOTP(): string {
  // Generate 6-digit random number
  const otp = Math.floor(100000 + Math.random() * 900000).toString()
  console.log('🔢 Generated OTP:', otp)
  return otp
}

export async function storeOTP(contact: string, otp: string, type: string): Promise<void> {
  try {
    console.log('💾 Storing OTP in database...')
    await storeOTPInDB(contact, otp, type)
    console.log('✅ OTP stored successfully in database')
  } catch (error) {
    console.error('❌ Failed to store OTP:', error)
    throw error
  }
}

export async function verifyOTP(contact: string, otp: string, type: string): Promise<boolean> {
  try {
    console.log('🔍 Verifying OTP in database...')
    const isValid = await verifyOTPInDB(contact, otp, type)
    console.log('📊 OTP verification result:', isValid)
    return isValid
  } catch (error) {
    console.error('❌ Failed to verify OTP:', error)
    return false
  }
}

// Replace the sendEmailOTP function in your /lib/otp.ts with this enhanced version

export async function sendEmailOTP(email: string, otp: string): Promise<boolean> {
  try {
    console.log('🔄 Starting SMTP email send process...')
    console.log('📧 Target email:', email)
    console.log('🔢 Email OTP:', otp)

    // Enhanced environment variable checking
    const envCheck = {
      SMTP_HOST: process.env.SMTP_HOST,
      SMTP_PORT: process.env.SMTP_PORT,
      SMTP_USER: process.env.SMTP_USER,
      SMTP_PASSWORD: process.env.SMTP_PASSWORD
    }

    console.log('🔍 Environment variables check:', {
      SMTP_HOST: envCheck.SMTP_HOST || '❌ MISSING',
      SMTP_PORT: envCheck.SMTP_PORT || '❌ MISSING',
      SMTP_USER: envCheck.SMTP_USER || '❌ MISSING',
      SMTP_PASSWORD: envCheck.SMTP_PASSWORD ? `✅ SET (${envCheck.SMTP_PASSWORD.length} chars)` : '❌ MISSING'
    })

    // Check for missing variables
    const missingVars = Object.entries(envCheck)
      .filter(([key, value]) => !value)
      .map(([key]) => key)

    if (missingVars.length > 0) {
      console.error('❌ Missing environment variables:', missingVars)
      console.error('💡 To fix this:')
      console.error('   1. Create/check .env.local file in project root')
      console.error('   2. Add missing variables:')
      missingVars.forEach(varName => {
        console.error(`      ${varName}=your_value_here`)
      })
      console.error('   3. Restart development server: npm run dev')
      
      throw new Error(`Missing SMTP environment variables: ${missingVars.join(', ')}. Check .env.local file and restart server.`)
    }

    // Validate app password format
    if (envCheck.SMTP_PASSWORD && envCheck.SMTP_PASSWORD.length !== 16) {
      console.error('⚠️ Gmail app password should be 16 characters long')
      console.error('💡 Make sure you copied the full app password from Google')
    }

    console.log('🔧 SMTP Configuration:', {
      host: envCheck.SMTP_HOST,
      port: envCheck.SMTP_PORT,
      user: envCheck.SMTP_USER,
      passwordLength: envCheck.SMTP_PASSWORD?.length
    })

    // Create transporter with better error handling
    console.log('🔧 Creating SMTP transporter...')
    const transporterConfig = {
      host: envCheck.SMTP_HOST,
      port: parseInt(envCheck.SMTP_PORT || '587'),
      secure: envCheck.SMTP_PORT === '465',
      auth: {
        user: envCheck.SMTP_USER,
        pass: envCheck.SMTP_PASSWORD
      },
      debug: process.env.NODE_ENV === 'development',
      logger: process.env.NODE_ENV === 'development'
    }

    const transporter = nodemailer.createTransport(transporterConfig)

    // Enhanced connection verification
    console.log('🔍 Verifying SMTP connection...')
    try {
      await transporter.verify()
      console.log('✅ SMTP connection verified successfully')
    } catch (verifyError: any) {
      console.error('❌ SMTP connection verification failed:', verifyError)
      
      // Provide specific error guidance
      if (verifyError.code === 'EAUTH') {
        console.error('🔑 Authentication failed - check your Gmail app password')
        console.error('💡 Make sure you are using an app password, not your regular Gmail password')
      } else if (verifyError.code === 'ENOTFOUND') {
        console.error('🌐 DNS resolution failed - check SMTP_HOST')
      } else if (verifyError.code === 'ECONNECTION') {
        console.error('🔌 Connection failed - check SMTP_PORT and network')
      }
      
      throw new Error(`SMTP connection failed: ${verifyError.message}`)
    }

    // Enhanced email content
    const emailContent = {
      from: {
        name: 'Admin Portal Security',
        address: envCheck.SMTP_USER!
      },
      to: email,
      subject: '🔐 Member Registration - Verification Code',
      text: `Your admin registration verification code is: ${otp}\n\nThis code will expire in 10 minutes.\n\nIf you didn't request this code, please ignore this email.\n\nFor security reasons, do not share this code with anyone.`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Admin Registration - Verification Code</title>
        </head>
        <body style="margin: 0; padding: 20px; background-color: #f5f5f5; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
            
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); padding: 40px 30px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 600;">🔐 Admin Portal</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">Secure Verification</p>
            </div>
            
            <!-- Content -->
            <div style="padding: 40px 30px;">
              <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 24px; font-weight: 600;">Complete Your Admin Registration</h2>
              
              <p style="color: #6b7280; line-height: 1.6; margin: 0 0 30px 0; font-size: 16px;">
                We've received a request to register your admin account. Please use the verification code below to continue:
              </p>
              
              <!-- OTP Code Box -->
              <div style="text-align: center; margin: 40px 0;">
                <div style="display: inline-block; background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); padding: 25px 50px; border-radius: 12px; box-shadow: 0 8px 25px rgba(79, 70, 229, 0.3);">
                  <div style="color: white; font-size: 36px; font-weight: bold; letter-spacing: 12px; font-family: 'Courier New', monospace;">${otp}</div>
                </div>
              </div>
              
              <!-- Security Notice -->
              <div style="background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%); border-left: 4px solid #4f46e5; padding: 20px; margin: 30px 0; border-radius: 8px;">
                <h3 style="color: #1f2937; margin: 0 0 12px 0; font-size: 18px; font-weight: 600;">🛡️ Security Information</h3>
                <ul style="color: #6b7280; margin: 0; padding-left: 20px; line-height: 1.8; font-size: 14px;">
                  <li><strong>Expires in 10 minutes</strong> - Enter this code quickly</li>
                  <li><strong>One-time use only</strong> - Code becomes invalid after use</li>
                  <li><strong>Keep it secure</strong> - Never share with anyone</li>
                  <li><strong>Didn't request this?</strong> - Safely ignore this email</li>
                </ul>
              </div>
              
              <!-- Action Button -->
              <div style="text-align: center; margin: 30px 0;">
                <p style="color: #6b7280; font-size: 14px; margin: 0;">
                  Return to the registration form and enter your verification code
                </p>
              </div>
            </div>
            
            <!-- Footer -->
            <div style="background-color: #f9fafb; padding: 20px 30px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="color: #9ca3af; margin: 0; font-size: 12px;">
                © ${new Date().getFullYear()} Admin Portal. This is an automated security message.
              </p>
              <p style="color: #9ca3af; margin: 5px 0 0 0; font-size: 11px;">
                Sent at ${new Date().toLocaleString()} UTC
              </p>
            </div>
          </div>
        </body>
        </html>
      `
    }

    console.log('📤 Sending enhanced email...')
    console.log('📊 Email details:', {
      from: emailContent.from,
      to: emailContent.to,
      subject: emailContent.subject
    })

    // Send the email with enhanced error handling
    const result = await transporter.sendMail(emailContent)
    
    console.log('✅ Email sent successfully!')
    console.log('📊 Delivery details:', {
      messageId: result.messageId,
      response: result.response,
      accepted: result.accepted?.length || 0,
      rejected: result.rejected?.length || 0
    })

    // Validate delivery
    if (result.rejected && result.rejected.length > 0) {
      console.error('⚠️ Email was rejected for some recipients:', result.rejected)
      throw new Error(`Email rejected: ${result.rejected.join(', ')}`)
    }

    if (!result.accepted || result.accepted.length === 0) {
      console.error('⚠️ No recipients accepted the email')
      throw new Error('Email was not accepted by any recipients')
    }

    console.log('🎉 Email OTP sent successfully to:', email)
    return true

  } catch (error) {
    console.error('❌ Email sending error:', error)
    
    // Enhanced error reporting
    if (error instanceof Error) {
      console.error('📋 Error details:', {
        name: error.name,
        message: error.message,
        code: (error as any).code || 'unknown'
      })
      
      // Provide helpful solutions
      if (error.message.includes('Missing SMTP environment variables')) {
        console.error('🔧 Quick fix:')
        console.error('   1. Check your .env.local file exists in project root')
        console.error('   2. Add the missing SMTP variables')
        console.error('   3. Restart your dev server: npm run dev')
      } else if (error.message.includes('Invalid login')) {
        console.error('🔧 Gmail setup required:')
        console.error('   1. Enable 2-Factor Authentication in Gmail')
        console.error('   2. Generate an App Password (not your regular password)')
        console.error('   3. Use the 16-character app password in SMTP_PASSWORD')
      }
    }
    
    return false
  }
}

export async function sendPhoneOTP(phone: string, otp: string): Promise<boolean> {
  try {
    console.log('📱 SMS OTP sending not yet implemented')
    console.log('📞 Target phone:', phone)
    console.log('🔢 SMS OTP:', otp)
    
    // TODO: Implement SMS sending using Twilio, AWS SNS, or other SMS service
    // For now, just log the OTP and return true for testing
    console.log('⚠️ SMS sending is not implemented yet. OTP would be:', otp)
    
    // Return false to indicate SMS is not working yet
    return false
    
  } catch (error) {
    console.error('❌ SMS sending error:', error)
    return false
  }
}