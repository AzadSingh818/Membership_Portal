// app/api/auth/send-otp/route.ts - COMPLETE FIXED VERSION
import { type NextRequest, NextResponse } from "next/server"
import { generateOTP, sendPhoneOTP, sendEmailOTP } from "@/lib/otp"
import { 
  getUserByMembershipId, 
  getUserByPhone, 
  getUserByEmailMember,
  storeOTP,
  checkMemberTables,
  createMembersTableIfNeeded
} from "@/lib/database"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { contact, type, membershipId } = body

    console.log('📨 Send OTP request received:', {
      contact: contact ? 'provided' : 'missing',
      type,
      membershipId: membershipId ? 'provided' : 'missing',
      hasContact: !!contact,
      hasMembershipId: !!membershipId
    })

    if (!type || !["phone", "email"].includes(type)) {
      return NextResponse.json({ 
        error: "Invalid OTP type. Must be 'phone' or 'email'" 
      }, { status: 400 })
    }

    let user = null
    let contactValue = contact

    // 🔧 FIX: Enhanced user lookup with proper error handling
    try {
      if (membershipId) {
        // Member login flow with membership ID
        console.log('🔍 Looking up user by membership ID:', membershipId)
        user = await getUserByMembershipId(membershipId)
        if (!user) {
          return NextResponse.json({ 
            error: "Invalid membership ID",
            details: "No active member found with this membership ID"
          }, { status: 404 })
        }
        contactValue = type === "phone" ? user.phone : user.email
        console.log('✅ User found by membership ID:', { id: user.id, type: user.user_type })
        
      } else if (contact) {
        // Direct contact verification
        console.log('🔍 Looking up user by contact:', { type, contact })
        
        if (type === "phone") {
          user = await getUserByPhone(contact)
        } else {
          user = await getUserByEmailMember(contact)
        }
        
        if (user) {
          console.log('✅ User found by contact:', { id: user.id, type: user.user_type })
        } else {
          console.log('⚠️ No user found, but continuing with guest verification')
        }
        
      } else {
        return NextResponse.json({ 
          error: "Missing required parameters",
          details: "Either 'contact' or 'membershipId' must be provided"
        }, { status: 400 })
      }
    } catch (userLookupError: any) {
      console.error('❌ Error during user lookup:', userLookupError)
      
      // Check if it's a missing table error
      if (userLookupError.message?.includes('relation') && userLookupError.message?.includes('does not exist')) {
        console.log('🔍 Checking what member tables exist...')
        
        try {
          const tableCheck = await checkMemberTables()
          console.log('📋 Member tables check result:', tableCheck)
          
          if (tableCheck.tables.length === 0) {
            console.log('🏗️ No member tables found, creating members table...')
            await createMembersTableIfNeeded()
            console.log('✅ Members table created successfully')
            
            // Return response indicating table was created
            return NextResponse.json({
              error: "Member system initialized",
              message: "Member tables were created. Please try again.",
              details: "The member database was set up for the first time.",
              action: "Please send your request again - the system is now ready."
            }, { status: 503 }) // Service Unavailable - try again
          }
        } catch (tableError: any) {
          console.error('❌ Error checking/creating member tables:', tableError)
        }
      }
      
      // For other errors, continue with guest verification if contact is provided
      if (contact) {
        console.log('⚠️ User lookup failed, continuing with guest verification')
        contactValue = contact
      } else {
        return NextResponse.json({ 
          error: "Database error",
          message: "Unable to process request. Please try again later.",
          details: "Member system is not properly configured"
        }, { status: 500 })
      }
    }

    // Validate contact value
    if (!contactValue) {
      return NextResponse.json({ 
        error: `No ${type} provided`,
        details: user ? 
          `User found but no ${type} on file` : 
          `No ${type} contact information available`
      }, { status: 400 })
    }

    // Generate OTP
    const otp = generateOTP()
    console.log('🔐 Generated OTP:', otp, 'for contact:', contactValue)

    // Send OTP
    let sent = false
    try {
      if (type === "phone") {
        sent = await sendPhoneOTP(contactValue, otp)
      } else {
        sent = await sendEmailOTP(contactValue, otp)
      }
      
      console.log('📤 OTP send result:', { sent, type, contact: contactValue })
    } catch (sendError: any) {
      console.error('❌ Error sending OTP:', sendError)
      return NextResponse.json({ 
        error: `Failed to send OTP via ${type}`,
        details: sendError.message || 'Unknown error occurred while sending OTP'
      }, { status: 500 })
    }

    if (!sent) {
      return NextResponse.json({ 
        error: `Failed to send OTP via ${type}`,
        details: "OTP service is currently unavailable"
      }, { status: 500 })
    }

    // Store OTP in database
    try {
      await storeOTP(contactValue, otp, type)
      console.log('💾 OTP stored in database successfully')
    } catch (storeError: any) {
      console.error('❌ Error storing OTP:', storeError)
      return NextResponse.json({ 
        error: "Failed to store OTP",
        details: "OTP was sent but could not be stored for verification"
      }, { status: 500 })
    }

    // Return masked contact info
    const maskedContact =
      type === "phone"
        ? contactValue.replace(/(\+?\d{2,3})\d+(\d{4})/, "$1****$2")
        : contactValue.replace(/(.{2}).*@/, "$1***@")

    return NextResponse.json({
      success: true,
      message: `OTP sent to ${type}`,
      maskedContact,
      userType: user?.user_type || "guest",
      userFound: !!user,
      otpSent: sent,
      // Only include OTP in development for testing
      ...(process.env.NODE_ENV === 'development' && { otp: otp })
    })
    
  } catch (error: any) {
    console.error("❌ Send OTP error:", error)
    return NextResponse.json({ 
      error: "Internal server error",
      message: "Something went wrong while processing your request",
      details: error.message || "Unknown error occurred"
    }, { status: 500 })
  }
}

// Handle GET requests for testing
export async function GET() {
  return NextResponse.json({
    message: "Send OTP endpoint",
    status: "active",
    methods: ["POST"],
    parameters: {
      required: ["type"],
      optional: ["contact", "membershipId"],
      type: "Must be 'phone' or 'email'",
      contact: "Email address or phone number",
      membershipId: "Member's unique ID"
    },
    examples: [
      {
        description: "Send OTP to email",
        body: {
          type: "email",
          contact: "user@example.com"
        }
      },
      {
        description: "Send OTP to member by membership ID",
        body: {
          type: "email",
          membershipId: "MEMBER123"
        }
      },
      {
        description: "Send OTP to phone",
        body: {
          type: "phone",
          contact: "+1234567890"
        }
      }
    ]
  })
}