// app/api/auth/admin/register/route.ts - FIXED VERSION
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { createAdminRequest, createAdminUser, storeOTPInDB, verifyOTPInDB } from '@/lib/database';
import { sendEmailOTP } from '@/lib/otp';

// Generate 6-digit OTP
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('📨 Admin registration request received:', {
      step: body.step,
      email: body.email,
      username: body.username, // ✅ Log username too
      phone: body.phone,
      verificationType: body.verificationType,
      hasOTP: body.hasOTP
    });

    const { step } = body;

    // ========================================
    // STEP 1: SEND OTP
    // ========================================
    if (step === 'send-otp') {
      const { verificationType, email, phone } = body;

      if (!verificationType || !['email', 'phone'].includes(verificationType)) {
        console.error('❌ Invalid or missing verificationType:', verificationType);
        return NextResponse.json({
          error: 'Invalid verification type. Must be "email" or "phone"'
        }, { status: 400 });
      }

      const contact = verificationType === 'email' ? email : phone;
      if (!contact) {
        console.error('❌ Missing contact information for verificationType:', verificationType);
        return NextResponse.json({
          error: `${verificationType === 'email' ? 'Email' : 'Phone'} is required for ${verificationType} verification`
        }, { status: 400 });
      }

      try {
        // Generate and store OTP
        const otpCode = generateOTP();
        console.log('🔐 Generated OTP:', otpCode, 'for', contact, 'via', verificationType);

        // Store OTP in database
        await storeOTPInDB(contact, otpCode, verificationType);
        console.log('💾 OTP stored in database successfully');

        // Send OTP based on verification type
        if (verificationType === 'email') {
          await sendEmailOTP(email, otpCode);
          console.log('📧 OTP sent via email to:', email);
        } else if (verificationType === 'phone') {
          console.log('📱 SMS OTP sending not implemented yet. OTP for testing:', otpCode);
        }

        return NextResponse.json({
          success: true,
          message: `OTP sent to your ${verificationType}`,
          ...(process.env.NODE_ENV === 'development' && { otp: otpCode })
        });

      } catch (error) {
        console.error('❌ Error in send-otp step:', error);
        return NextResponse.json({
          error: error instanceof Error ? error.message : 'Failed to send OTP'
        }, { status: 500 });
      }
    }

    // ========================================
    // STEP 2: VERIFY OTP
    // ========================================
    else if (step === 'verify-otp') {
      const { otp, email, phone, verificationType } = body;

      const contact = verificationType === 'email' ? email : verificationType === 'phone' ? phone : undefined;

      if (!otp || !contact || !verificationType) {
        console.error('❌ Missing required fields for OTP verification:', { otp, contact, verificationType });
        return NextResponse.json({
          error: 'Missing required fields for OTP verification',
          received: { otp, contact, verificationType }
        }, { status: 400 });
      }

      const verified = await verifyOTPInDB(contact, otp, verificationType);
      if (!verified) {
        return NextResponse.json({ success: false, error: 'Invalid or expired OTP' }, { status: 400 });
      }

      return NextResponse.json({ success: true, message: 'OTP verified successfully' });
    }

    // ========================================
    // STEP 3: COMPLETE REGISTRATION - FIXED!
    // ========================================
    else if (step === 'complete-registration') {
      const {
        organization,
        firstName,
        lastName,
        email,
        phone,
        username,        // ✅ FIXED: Now we capture username
        password,        // ✅ FIXED: Now we capture password
        experience,
        level,
        appointer,
        verificationType,
        verifiedContact,
        hasOTP
      } = body;

      console.log('📝 Processing complete registration with credentials:', {
        email,
        username,        // ✅ FIXED: Log the chosen username
        verificationType,
        verifiedContact,
        hasOTP
      });

      if (!verificationType || !['email', 'phone'].includes(verificationType)) {
        console.error('❌ Invalid or missing verificationType in final step:', verificationType);
        return NextResponse.json({
          error: 'Invalid verification type. Must be "email" or "phone"'
        }, { status: 400 });
      }

      if (!hasOTP || !verifiedContact) {
        console.error('❌ Contact verification required:', { hasOTP, verifiedContact });
        return NextResponse.json({
          error: 'Contact verification is required. Please verify your email or phone first.'
        }, { status: 400 });
      }

      // ✅ FIXED: Include username and password in validation
      const requiredFields = {
        organization,
        firstName,
        lastName,
        email,
        phone,
        username,        // ✅ FIXED: Required field
        password         // ✅ FIXED: Required field
      };

      const missingFields = Object.entries(requiredFields)
        .filter(([key, value]) => !value)
        .map(([key]) => key);

      if (missingFields.length > 0) {
        console.error('❌ Missing required fields:', missingFields);
        return NextResponse.json({
          error: `Missing required fields: ${missingFields.join(', ')}`
        }, { status: 400 });
      }

      try {
        // ✅ FIXED: Hash password
        const hashedPassword = await bcrypt.hash(password, 12);
        console.log('🔐 Password hashed successfully for username:', username);

        // ✅ FIXED: Create admin request WITH username and password
        const adminRequest = await createAdminRequest({
          email,
          first_name: firstName,
          last_name: lastName,
          organization,
          username,              // ✅ FIXED: Store chosen username
          password_hash: hashedPassword,  // ✅ FIXED: Store hashed password
          phone,
          experience,
          level,
          appointer
        });

        console.log('✅ Admin request created with credentials:', {
          id: adminRequest.id,
          email: adminRequest.email,
          username: username,    // ✅ FIXED: Log stored username
          status: adminRequest.status
        });

        return NextResponse.json({
          success: true,
          message: 'Registration submitted successfully! Please wait for admin approval.',
          data: {
            requestId: adminRequest.id,
            email: adminRequest.email,
            username: username,  // ✅ FIXED: Return username
            status: adminRequest.status,
            verificationType,
            verifiedContact,
            note: 'Your chosen username and password will be transferred when approved'
          }
        }, { status: 201 });

      } catch (error) {
        console.error('❌ Error in complete-registration step:', error);
        
        if (error instanceof Error) {
          if (error.message.includes('duplicate') || error.message.includes('unique')) {
            return NextResponse.json({
              error: 'An account with this email or username already exists'
            }, { status: 409 });
          }
        }

        return NextResponse.json({
          error: error instanceof Error ? error.message : 'Registration failed'
        }, { status: 500 });
      }
    }

    // ========================================
    // INVALID STEP
    // ========================================
    else {
      console.error('❌ Invalid step provided:', step);
      return NextResponse.json({
        error: 'Invalid step. Must be "send-otp", "verify-otp", or "complete-registration"'
      }, { status: 400 });
    }

  } catch (error) {
    console.error('❌ Unexpected error in admin registration:', error);
    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 });
  }
}

// Handle GET requests (optional - for testing)
export async function GET() {
  return NextResponse.json({
    message: 'Admin registration endpoint',
    methods: ['POST'],
    steps: [
      { step: 'send-otp', description: 'Send OTP to email or phone' },
      { step: 'verify-otp', description: 'Verify the received OTP' },
      { step: 'complete-registration', description: 'Submit complete registration with username/password' }
    ]
  });
}