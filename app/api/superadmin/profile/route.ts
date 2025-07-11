import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { updateUser } from "@/lib/database"
import { hashPassword, comparePasswords } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)

    if (!user || user.role !== "superadmin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const profile = {
      id: user.id,
      firstName: user.first_name,
      lastName: user.last_name,
      email: user.email,
      phone: user.phone,
      address: user.address,
      role: user.role,
      createdAt: user.created_at,
      lastLogin: user.last_login,
    }

    return NextResponse.json({ profile })
  } catch (error) {
    console.error("Superadmin profile fetch error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)

    if (!user || user.role !== "superadmin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { firstName, lastName, phone, address, currentPassword, newPassword } = await request.json()

    // Validate required fields
    if (!firstName || !lastName) {
      return NextResponse.json({ error: "First name and last name are required" }, { status: 400 })
    }

    const updateData: any = {
      first_name: firstName,
      last_name: lastName,
      phone: phone || null,
      address: address || null,
    }

    // Handle password change
    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json({ error: "Current password is required" }, { status: 400 })
      }

      const isValidPassword = await comparePasswords(currentPassword, user.password_hash)
      if (!isValidPassword) {
        return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 })
      }

      updateData.password_hash = await hashPassword(newPassword)
    }

    await updateUser(user.id, updateData)

    return NextResponse.json({ success: true, message: "Profile updated successfully" })
  } catch (error) {
    console.error("Superadmin profile update error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
