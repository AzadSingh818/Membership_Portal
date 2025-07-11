import { type NextRequest, NextResponse } from "next/server"
import { createMembershipApplication, getUserByEmail, getUserByPhone } from "@/lib/database"

export async function POST(request: NextRequest) {
  try {
    const {
      organization_id,
      first_name,
      last_name,
      email,
      phone,
      address,
      designation,
      experience,
      achievements,
      proposer_id,
      seconder_id,
      payment_method,
    } = await request.json()

    // Validate required fields
    if (!organization_id || !first_name || !last_name || !email || !phone || !address) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Check if email or phone already exists
    const existingByEmail = await getUserByEmail(email)
    const existingByPhone = await getUserByPhone(phone)
    if (existingByEmail || existingByPhone) {
      return NextResponse.json({ error: "Email or phone already registered" }, { status: 409 })
    }

    // Insert application
    const result = await createMembershipApplication({
      organization_id,
      first_name,
      last_name,
      email,
      phone,
      address,
      designation,
      experience,
      achievements,
      payment_method,
      // proposer_id and seconder_id are not handled in the shared function, so you may want to extend it if needed
    })

    return NextResponse.json({
      success: true,
      message: "Application submitted successfully",
      applicationId: result.id,
    })
  } catch (error) {
    console.error("Error submitting application:", error)
    return NextResponse.json({ error: "Failed to submit application" }, { status: 500 })
  }
}
