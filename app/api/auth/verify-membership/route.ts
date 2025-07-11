import { type NextRequest, NextResponse } from "next/server"
import { generateJWT } from "@/lib/jwt"
import { getUserByMembershipId } from "@/lib/user"

export async function POST(request: NextRequest) {
  try {
    const { membershipId } = await request.json()

    if (!membershipId) {
      return NextResponse.json({ error: "Membership ID is required" }, { status: 400 })
    }

    const user = await getUserByMembershipId(membershipId)

    if (!user) {
      return NextResponse.json({ error: "Invalid membership ID" }, { status: 404 })
    }

    if (!user.is_active) {
      return NextResponse.json({ error: "This membership is inactive" }, { status: 403 })
    }

    const token = generateJWT(user, "user")

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        membershipId: user.membership_id,
        firstName: user.first_name,
        lastName: user.last_name,
        email: user.email,
        phone: user.phone,
        userType: user.user_type,
        organizationId: user.organization_id,
      },
      redirectUrl: user.user_type === "member" ? "/member/dashboard" : "/guest/dashboard",
    })

    response.cookies.set("auth-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60,
    })

    return response
  } catch (error) {
    console.error("Verify membership error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
