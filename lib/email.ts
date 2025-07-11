// lib/email.ts - Member Registration Email Functions
import nodemailer from 'nodemailer'

interface MemberRegistrationData {
  email: string
  firstName: string
  lastName: string
  membershipId: string
  temporaryPassword: string
  organizationName: string
  submittedAt: string
}

// Main function to send member registration email
export async function sendMemberRegistrationEmail(memberData: MemberRegistrationData): Promise<boolean> {
  try {
    console.log('📧 Starting member registration email process for:', memberData.email)

    // Check environment variables
    const envCheck = {
      SMTP_HOST: process.env.SMTP_HOST,
      SMTP_PORT: process.env.SMTP_PORT,
      SMTP_USER: process.env.SMTP_USER,
      SMTP_PASS: process.env.SMTP_PASSWORD || process.env.SMTP_PASS  // Support both SMTP_PASSWORD and SMTP_PASS
    }

    console.log('🔍 Environment variables check:', {
      SMTP_HOST: envCheck.SMTP_HOST || '❌ MISSING',
      SMTP_PORT: envCheck.SMTP_PORT || '❌ MISSING',
      SMTP_USER: envCheck.SMTP_USER || '❌ MISSING',
      SMTP_PASS: envCheck.SMTP_PASS ? '✅ SET' : '❌ MISSING'
    })

    // Check for missing variables
    const missingVars = Object.entries(envCheck)
      .filter(([key, value]) => !value)
      .map(([key]) => key)

    if (missingVars.length > 0) {
      console.error('❌ Missing environment variables:', missingVars)
      throw new Error(`Missing SMTP environment variables: ${missingVars.join(', ')}`)
    }

    // Create transporter
    const transporter = nodemailer.createTransport({
      host: envCheck.SMTP_HOST,
      port: parseInt(envCheck.SMTP_PORT || '587'),
      secure: envCheck.SMTP_PORT === '465',
      auth: {
        user: envCheck.SMTP_USER,
        pass: envCheck.SMTP_PASS
      },
      debug: process.env.NODE_ENV === 'development',
      logger: process.env.NODE_ENV === 'development'
    })

    // Verify connection
    console.log('🔍 Verifying SMTP connection...')
    await transporter.verify()
    console.log('✅ SMTP connection verified')

    // Create email content
    const emailContent = {
      from: {
        name: 'Membership Portal',
        address: envCheck.SMTP_USER!
      },
      to: memberData.email,
      subject: '🎉 Registration Successful - Your Membership Details',
      html: createMemberRegistrationEmailTemplate(memberData)
    }

    console.log('📤 Sending registration email...')
    const result = await transporter.sendMail(emailContent)
    
    console.log('✅ Member registration email sent successfully!')
    console.log('📊 Email delivery details:', {
      messageId: result.messageId,
      accepted: result.accepted?.length || 0,
      rejected: result.rejected?.length || 0
    })

    // Check if email was delivered successfully
    if (result.rejected && result.rejected.length > 0) {
      console.error('⚠️ Email was rejected:', result.rejected)
      throw new Error(`Email rejected: ${result.rejected.join(', ')}`)
    }

    if (!result.accepted || result.accepted.length === 0) {
      console.error('⚠️ No recipients accepted the email')
      throw new Error('Email was not accepted by any recipients')
    }

    return true

  } catch (error) {
    console.error('❌ Failed to send member registration email:', error)
    
    // Enhanced error reporting
    if (error instanceof Error) {
      console.error('📋 Error details:', {
        name: error.name,
        message: error.message,
        code: (error as any).code || 'unknown'
      })
      
      // Provide helpful solutions
      if (error.message.includes('Missing SMTP environment variables')) {
        console.error('🔧 Fix: Add missing variables to .env.local and restart server')
      } else if (error.message.includes('Invalid login')) {
        console.error('🔧 Fix: Use Gmail App Password, not regular password')
      } else if (error.message.includes('EAUTH')) {
        console.error('🔧 Fix: Enable 2FA and generate App Password for Gmail')
      }
    }
    
    return false
  }
}

// Email template for member registration confirmation
function createMemberRegistrationEmailTemplate(memberData: MemberRegistrationData): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Registration Successful - Your Membership Details</title>
    </head>
    <body style="margin: 0; padding: 20px; background-color: #f0f2f5; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
      <div style="max-width: 650px; margin: 0 auto; background-color: white; border-radius: 16px; overflow: hidden; box-shadow: 0 8px 30px rgba(0,0,0,0.12);">
        
        <!-- Header with Success Icon -->
        <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px 30px; text-align: center; position: relative;">
          <div style="background: rgba(255,255,255,0.2); width: 80px; height: 80px; border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
            <span style="font-size: 40px;">✅</span>
          </div>
          <h1 style="color: white; margin: 0; font-size: 32px; font-weight: 700;">Registration Successful!</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 15px 0 0 0; font-size: 18px; font-weight: 500;">Your membership application has been submitted</p>
        </div>
        
        <!-- Welcome Message -->
        <div style="padding: 40px 30px 30px;">
          <h2 style="color: #1f2937; margin: 0 0 15px 0; font-size: 24px; font-weight: 600;">
            Welcome, ${memberData.firstName} ${memberData.lastName}! 👋
          </h2>
          <p style="color: #6b7280; line-height: 1.6; margin: 0 0 30px 0; font-size: 16px;">
            Thank you for applying to join <strong>${memberData.organizationName}</strong>. Your membership application has been successfully submitted and is now under review.
          </p>
        </div>

        <!-- Login Credentials Section -->
        <div style="margin: 0 30px 30px; background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%); border: 2px solid #3b82f6; border-radius: 12px; padding: 30px;">
          <div style="display: flex; align-items: center; margin-bottom: 20px;">
            <span style="font-size: 24px; margin-right: 10px;">🔐</span>
            <h3 style="color: #1e40af; margin: 0; font-size: 20px; font-weight: 600;">Your Login Credentials</h3>
          </div>
          
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 20px 0;">
            <div>
              <label style="display: block; color: #374151; font-size: 14px; font-weight: 600; margin-bottom: 8px;">Membership ID</label>
              <div style="background: white; border: 2px solid #e5e7eb; border-radius: 8px; padding: 12px; font-family: 'Courier New', monospace; font-size: 16px; font-weight: bold; color: #1f2937; text-align: center; letter-spacing: 1px;">
                ${memberData.membershipId}
              </div>
            </div>
            <div>
              <label style="display: block; color: #374151; font-size: 14px; font-weight: 600; margin-bottom: 8px;">Temporary Password</label>
              <div style="background: white; border: 2px solid #e5e7eb; border-radius: 8px; padding: 12px; font-family: 'Courier New', monospace; font-size: 16px; font-weight: bold; color: #1f2937; text-align: center; letter-spacing: 1px;">
                ${memberData.temporaryPassword}
              </div>
            </div>
          </div>
        </div>

        <!-- Important Security Information -->
        <div style="margin: 0 30px 30px; background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-left: 5px solid #f59e0b; border-radius: 8px; padding: 25px;">
          <div style="display: flex; align-items: center; margin-bottom: 15px;">
            <span style="font-size: 24px; margin-right: 10px;">⚠️</span>
            <h3 style="color: #92400e; margin: 0; font-size: 18px; font-weight: 600;">Important Security Information</h3>
          </div>
          <ul style="color: #78350f; margin: 0; padding-left: 20px; line-height: 1.8; font-size: 14px;">
            <li><strong>Save these credentials securely</strong> - Store them in a safe place</li>
            <li><strong>You can login now, but access is limited</strong> until admin approval</li>
            <li><strong>Change your password after first login</strong> for better security</li>
            <li><strong>Contact your organization</strong> if you lose these credentials</li>
          </ul>
        </div>

        <!-- Application Details -->
        <div style="margin: 0 30px 30px; background: #f9fafb; border-radius: 12px; padding: 25px;">
          <h3 style="color: #1f2937; margin: 0 0 20px 0; font-size: 18px; font-weight: 600; display: flex; align-items: center;">
            <span style="margin-right: 10px;">📋</span>
            Application Details
          </h3>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
            <div>
              <span style="color: #6b7280; font-size: 14px; display: block;">Organization:</span>
              <span style="color: #1f2937; font-weight: 600;">${memberData.organizationName}</span>
            </div>
            <div>
              <span style="color: #6b7280; font-size: 14px; display: block;">Applicant:</span>
              <span style="color: #1f2937; font-weight: 600;">${memberData.firstName} ${memberData.lastName}</span>
            </div>
            <div>
              <span style="color: #6b7280; font-size: 14px; display: block;">Status:</span>
              <span style="background: #fbbf24; color: #92400e; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600;">Pending Admin Approval</span>
            </div>
            <div>
              <span style="color: #6b7280; font-size: 14px; display: block;">Submitted:</span>
              <span style="color: #1f2937; font-weight: 600;">${memberData.submittedAt}</span>
            </div>
          </div>
        </div>

        <!-- What Happens Next -->
        <div style="margin: 0 30px 30px; background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); border-radius: 12px; padding: 25px;">
          <h3 style="color: #0369a1; margin: 0 0 20px 0; font-size: 18px; font-weight: 600; display: flex; align-items: center;">
            <span style="margin-right: 10px;">🚀</span>
            What Happens Next?
          </h3>
          <div style="space-y: 15px;">
            <div style="display: flex; align-items: start; margin-bottom: 15px;">
              <span style="background: #0369a1; color: white; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: bold; margin-right: 15px; margin-top: 2px;">1</span>
              <div>
                <div style="color: #1f2937; font-weight: 600; margin-bottom: 4px;">Your application is sent to the organization's admin</div>
                <div style="color: #6b7280; font-size: 14px;">The admin will review your profile and application details</div>
              </div>
            </div>
            <div style="display: flex; align-items: start; margin-bottom: 15px;">
              <span style="background: #0369a1; color: white; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: bold; margin-right: 15px; margin-top: 2px;">2</span>
              <div>
                <div style="color: #1f2937; font-weight: 600; margin-bottom: 4px;">Admin reviews your application and profile</div>
                <div style="color: #6b7280; font-size: 14px;">This process typically takes 2-5 business days</div>
              </div>
            </div>
            <div style="display: flex; align-items: start; margin-bottom: 15px;">
              <span style="background: #0369a1; color: white; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: bold; margin-right: 15px; margin-top: 2px;">3</span>
              <div>
                <div style="color: #1f2937; font-weight: 600; margin-bottom: 4px;">Once approved, you get full access to member dashboard</div>
                <div style="color: #6b7280; font-size: 14px;">You'll be able to access all member features and benefits</div>
              </div>
            </div>
            <div style="display: flex; align-items: start;">
              <span style="background: #0369a1; color: white; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: bold; margin-right: 15px; margin-top: 2px;">4</span>
              <div>
                <div style="color: #1f2937; font-weight: 600; margin-bottom: 4px;">You'll receive email notification of approval status</div>
                <div style="color: #6b7280; font-size: 14px;">We'll keep you updated throughout the process</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Action Buttons -->
        <div style="padding: 0 30px 40px; text-align: center;">
          <div style="margin-bottom: 20px;">
            <a href="#" style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); color: white; padding: 15px 30px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px; display: inline-block; margin-right: 15px; box-shadow: 0 4px 15px rgba(59, 130, 246, 0.3);">
              🔐 Login to Member Portal
            </a>
            <a href="#" style="background: #f3f4f6; color: #374151; padding: 15px 30px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px; display: inline-block; border: 2px solid #e5e7eb;">
              🏠 Back to Home
            </a>
          </div>
        </div>

        <!-- Support Information -->
        <div style="background: #f9fafb; padding: 25px 30px; border-top: 1px solid #e5e7eb;">
          <div style="text-align: center; margin-bottom: 15px;">
            <h4 style="color: #1f2937; margin: 0 0 10px 0; font-size: 16px; font-weight: 600;">Questions about your application?</h4>
            <p style="color: #6b7280; margin: 0; font-size: 14px;">
              Contact your organization directly or email us at 
              <a href="mailto:support@example.com" style="color: #3b82f6; text-decoration: none; font-weight: 600;">support@example.com</a>
            </p>
          </div>
        </div>

        <!-- Footer -->
        <div style="background: #1f2937; padding: 20px 30px; text-align: center;">
          <p style="color: #9ca3af; margin: 0; font-size: 12px;">
            © ${new Date().getFullYear()} Membership Management System. This is an automated message.
          </p>
          <p style="color: #6b7280; margin: 5px 0 0 0; font-size: 11px;">
            Sent on ${memberData.submittedAt} at ${new Date().toLocaleTimeString('en-IN')}
          </p>
        </div>
      </div>
    </body>
    </html>
  `
}