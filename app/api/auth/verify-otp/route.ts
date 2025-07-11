// app/api/auth/verify-otp/route.ts - FIXED VERSION
import { type NextRequest, NextResponse } from "next/server"
import { verifyOTP } from "@/lib/otp"
import { 
  getUserByMembershipId, 
  getUserByPhone, 
  getUserByEmailMember  // ✅ CHANGED: Use getUserByEmailMember instead of getUserByEmail
} from "@/lib/database"
import { generateToken } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const { contact, otp, type, membershipId } = await request.json()

    console.log('🔍 Verify OTP request:', { 
      hasContact: !!contact, 
      hasOTP: !!otp, 
      type, 
      hasMembershipId: !!membershipId 
    })

    if (!otp || !type || !["phone", "email"].includes(type)) {
      return NextResponse.json({ error: "Invalid parameters" }, { status: 400 })
    }

    let user = null
    let contactValue = contact

    try {
      if (membershipId) {
        console.log('🔍 Looking up user by membership ID:', membershipId)
        user = await getUserByMembershipId(membershipId)
        if (!user) {
          return NextResponse.json({ error: "Invalid membership ID" }, { status: 404 })
        }
        contactValue = type === "phone" ? user.phone : user.email
      } else if (contact) {
        console.log('🔍 Looking up user by contact:', { type, contact })
        // ✅ FIXED: Use the proper member lookup functions
        if (type === "phone") {
          user = await getUserByPhone(contact)
        } else {
          user = await getUserByEmailMember(contact)  // ✅ CHANGED: Use getUserByEmailMember
        }
        
        if (user) {
          console.log('✅ Registered user found:', { id: user.id, type: user.user_type })
          contactValue = type === "phone" ? user.phone : user.email
        } else {
          console.log('⚠️ No registered user found, proceeding with guest verification')
          // Allow guest verification - use the provided contact
          contactValue = contact
        }
      } else {
        return NextResponse.json({ error: "Missing contact or membershipId" }, { status: 400 })
      }
    } catch (userLookupError: any) {
      console.error('❌ Error during user lookup:', userLookupError)
      return NextResponse.json({ 
        error: "Database error",
        message: "Unable to find user. Please ensure member tables are set up correctly.",
        details: userLookupError.message
      }, { status: 500 })
    }

    if (!contactValue) {
      return NextResponse.json({ error: `No ${type} found for user` }, { status: 400 })
    }

    console.log('🔐 Verifying OTP for contact:', contactValue)

    // Verify OTP
    const isValidOTP = await verifyOTP(contactValue, otp, type)
    if (!isValidOTP) {
      return NextResponse.json({ error: "Invalid or expired OTP" }, { status: 400 })
    }

    console.log('✅ OTP verified successfully')

    // Handle response based on user type
    if (user) {
      // Registered member login
      console.log('🎯 Processing registered member login')
      
      // Generate JWT token for registered user
      const token = generateToken({
        id: user.id,
        membershipId: user.membership_id,
        type: "member",
      })

      const response = NextResponse.json({
        success: true,
        userType: "member",
        user: {
          id: user.id,
          firstName: user.first_name,
          lastName: user.last_name,
          email: user.email,
          phone: user.phone,
          membershipId: user.membership_id,
          organizationName: user.organization_name,
        },
      })

      response.cookies.set("auth-token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 24 * 60 * 60, // 24 hours
      })

      return response
      
    } else {
      // Guest verification
      console.log('🎯 Processing guest verification')
      
      // Generate basic token for guest
      const token = generateToken({
        id: `guest_${Date.now()}`,
        contact: contactValue,
        type: "guest",
      })

      const response = NextResponse.json({
        success: true,
        userType: "guest",
        verified: true,
        contact: contactValue,
        contactType: type,
        message: "OTP verified successfully. You are verified as a guest user.",
      })

      response.cookies.set("auth-token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 2 * 60 * 60, // 2 hours for guests
      })

      return response
    }
  } catch (error) {
    console.error("❌ Verify OTP error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}