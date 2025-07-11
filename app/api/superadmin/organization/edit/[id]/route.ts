import { type NextRequest, NextResponse } from "next/server"
import { updateOrganization } from "@/lib/database"

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params
    const { name, description, address, contact_email, contact_phone } = await request.json()

    if (!name) {
      return NextResponse.json({ error: "Organization name is required" }, { status: 400 })
    }

    const updatedOrg = await updateOrganization(Number.parseInt(id), {
      name,
      description,
      address,
      contact_email,
      contact_phone,
    })

    if (!updatedOrg) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: "Organization updated successfully",
      organization: updatedOrg,
    })
  } catch (error) {
    console.error("Error updating organization:", error)
    return NextResponse.json({ error: "Failed to update organization" }, { status: 500 })
  }
}
