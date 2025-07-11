// app/api/superadmin/organization/delete/[id]/route.ts
import { NextRequest, NextResponse } from "next/server"
import { deleteOrganization } from "@/lib/database"

export async function DELETE(
  request: NextRequest, 
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Await params before accessing properties (Next.js 15 requirement)
    const { id } = await params

    console.log('🗑️ DELETE request for organization ID:', id);

    // Validate ID
    const orgId = Number.parseInt(id);
    if (isNaN(orgId) || orgId <= 0) {
      console.log('❌ Invalid organization ID:', id);
      return NextResponse.json(
        { error: "Invalid organization ID" }, 
        { status: 400 }
      );
    }

    // Delete the organization
    const deleted = await deleteOrganization(orgId);

    if (!deleted) {
      console.log('❌ Organization not found or could not be deleted:', orgId);
      return NextResponse.json(
        { error: "Organization not found or could not be deleted" }, 
        { status: 404 }
      );
    }

    console.log('✅ Organization deleted successfully:', orgId);
    return NextResponse.json(
      { 
        message: "Organization deleted successfully",
        id: orgId 
      }, 
      { status: 200 }
    );

  } catch (error) {
    console.error("❌ Error deleting organization:", error);
    
    return NextResponse.json(
      { 
        error: "Failed to delete organization",
        details: error instanceof Error ? error.message : "Unknown error"
      }, 
      { status: 500 }
    );
  }
}