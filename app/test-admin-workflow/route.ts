// app/test-admin-workflow/route.ts
import { NextResponse } from 'next/server';
import { createAdminUser, getAdminRequests, getAdmins } from '@/lib/database';
import bcrypt from 'bcryptjs';

export async function GET() {
  try {
    console.log('🧪 Testing admin workflow...');

    // Create a test admin request (this simulates someone registering)
    const testAdminData = {
      username: 'testadmin_' + Date.now(),
      email: 'testadmin@example.com',
      password_hash: await bcrypt.hash('password123', 10),
      first_name: 'Test',
      last_name: 'Admin',
      role: 'admin'
    };

    const newAdmin = await createAdminUser(testAdminData);
    console.log('✅ Created test admin:', newAdmin);

    // Check pending requests
    const pendingRequests = await getAdminRequests();
    console.log('📋 Pending requests:', pendingRequests.length);

    // Check all admins
    const allAdmins = await getAdmins();
    console.log('👥 All admins:', allAdmins.length);

    const breakdown = {
      pending: allAdmins.filter(a => (a.status || 'pending') === 'pending').length,
      approved: allAdmins.filter(a => a.status === 'approved').length,
      rejected: allAdmins.filter(a => a.status === 'rejected').length
    };

    return NextResponse.json({
      success: true,
      message: '✅ Admin workflow test completed!',
      test_admin_created: {
        id: newAdmin.id,
        username: newAdmin.username,
        status: newAdmin.status || 'pending'
      },
      current_stats: {
        total_admins: allAdmins.length,
        pending_requests: pendingRequests.length,
        breakdown: breakdown
      },
      workflow_status: {
        '1_registration': '✅ New admin created with pending status',
        '2_pending_requests': `✅ ${pendingRequests.length} requests need approval`,
        '3_approval_ready': '✅ Ready for superadmin to approve/reject',
        '4_dashboard_ready': '✅ Dashboard should show approve/reject buttons'
      },
      next_steps: [
        '1. Visit /superadmin/dashboard',
        '2. Go to Admin Requests tab',
        '3. You should see approve/reject buttons',
        '4. Click approve to move admin to active status'
      ]
    });

  } catch (error) {
    console.error('❌ Admin workflow test failed:', error);
    return NextResponse.json({
      success: false,
      error: 'Admin workflow test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}