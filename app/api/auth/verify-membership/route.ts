// 🔧 COMPLETELY REPLACE app/api/auth/verify-membership/route.ts with this

import { type NextRequest, NextResponse } from "next/server"
import { generateJWT } from "@/lib/jwt"
import { getUserByMembershipId } from "@/lib/database"  // ✅ CHANGED: Import from database

export async function POST(request: NextRequest) {
  try {
    const { membershipId } = await request.json()

    console.log('🔍 Verifying membership ID:', membershipId);

    if (!membershipId || typeof membershipId !== 'string') {
      return NextResponse.json({ 
        error: "Please enter a valid membership ID" 
      }, { status: 400 })
    }

    // Clean and validate membership ID format
    const cleanMembershipId = membershipId.trim().toUpperCase();
    
    if (cleanMembershipId.length < 5) {
      return NextResponse.json({ 
        error: "Membership ID seems too short. Please check and try again." 
      }, { status: 400 })
    }

    console.log('🔍 Looking up membership ID:', cleanMembershipId);
    
    const user = await getUserByMembershipId(cleanMembershipId)

    if (!user) {
      console.log('❌ No user found with membership ID:', cleanMembershipId);
      return NextResponse.json({ 
        error: "Invalid membership ID. Please check your ID and try again." 
      }, { status: 404 })
    }

    console.log('✅ User found:', { 
      id: user.id, 
      email: user.email, 
      status: user.status,
      is_active: user.is_active 
    });

    // ✅ NEW: Handle different member statuses
    if (user.status === 'pending') {
      return NextResponse.json({
        success: true,
        userType: "pending_member",
        user: {
          id: user.id,
          membershipId: user.membership_id,
          firstName: user.first_name,
          lastName: user.last_name,
          email: user.email,
          phone: user.phone,
          status: user.status,
          organizationName: user.organization_name,
        },
        message: "Your membership application is under review. You have limited access.",
        redirectUrl: "/member/pending-dashboard",
        accessLevel: "limited"
      });
    }

    if (user.status === 'rejected') {
      return NextResponse.json({ 
        error: "Your membership application was not approved. Please contact the organization for more information." 
      }, { status: 403 })
    }

    if (!user.is_active && user.status !== 'approved') {
      return NextResponse.json({ 
        error: "This membership is currently inactive. Please contact support." 
      }, { status: 403 })
    }

    // ✅ Generate JWT token for approved/active members
    const token = generateJWT(user, "member")

    console.log('✅ Login successful for membership ID:', cleanMembershipId);

    const response = NextResponse.json({
      success: true,
      userType: "member",
      user: {
        id: user.id,
        membershipId: user.membership_id,
        firstName: user.first_name,
        lastName: user.last_name,
        email: user.email,
        phone: user.phone,
        status: user.status || 'approved',
        organizationName: user.organization_name,
      },
      message: "Login successful! Welcome to your member dashboard.",
      redirectUrl: "/member/dashboard",
    })

    // Set secure HTTP-only cookie
    response.cookies.set("auth-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 24 * 60 * 60, // 24 hours
    })

    return response
    
  } catch (error) {
    console.error("❌ Verify membership error:", error)
    
    // Better error handling
    if (error instanceof Error) {
      if (error.message.includes('database') || error.message.includes('connection')) {
        return NextResponse.json({ 
          error: "Database connection issue. Please try again in a moment." 
        }, { status: 503 })
      }
      
      return NextResponse.json({ 
        error: "Unable to verify membership. Please try again or contact support." 
      }, { status: 500 })
    }
    
    return NextResponse.json({ 
      error: "Internal server error. Please try again." 
    }, { status: 500 })
  }
}