import { type NextRequest, NextResponse } from "next/server"
import { getOrganizationMembers } from "@/lib/database"

export async function GET(request: NextRequest) {
  try {
    const { pathname } = request.nextUrl
    // Extract the organization ID from the pathname
    // Example: /api/organizations/123/members
    const match = pathname.match(/organizations\/(\d+)\/members/)
    const organizationId = match ? Number.parseInt(match[1]) : NaN

    if (isNaN(organizationId)) {
      return NextResponse.json({ error: "Invalid organization ID" }, { status: 400 })
    }

    const members = await getOrganizationMembers(organizationId)

    return NextResponse.json({ members })
  } catch (error) {
    console.error("Error fetching members:", error)
    return NextResponse.json({ error: "Failed to fetch members" }, { status: 500 })
  }
}
