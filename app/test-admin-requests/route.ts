// app/test-admin-requests/route.ts
import { NextResponse } from 'next/server';
import { createAdminRequest } from '@/lib/database';

export async function GET() {
  try {
    console.log('🧪 Creating test admin requests...');

    const testRequests = [
      {
        email: 'john.doe@example.com',
        first_name: 'John',
        last_name: 'Doe',
        organization: 'TechCorp Ltd'
      },
      {
        email: 'jane.smith@company.com',
        first_name: 'Jane',
        last_name: 'Smith',
        organization: 'Innovation Inc'
      },
      {
        email: 'admin@startup.io',
        first_name: 'Admin',
        last_name: 'User',
        organization: 'StartupIO'
      }
    ];

    const created = [];
    for (const request of testRequests) {
      try {
        const result = await createAdminRequest(request);
        created.push(result);
        console.log('✅ Created test request:', request.email);
      } catch (error) {
        console.log(
          '⚠️ Request already exists or failed:',
          request.email,
          error instanceof Error ? error.message : String(error)
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: `✅ Test admin requests setup completed!`,
      created: created.length,
      total_attempted: testRequests.length,
      note: 'You can now test approve/reject functionality in the superadmin dashboard'
    });

  } catch (error) {
    console.error('❌ Test requests setup failed:', error);
    return NextResponse.json({
      success: false,
      error: 'Test requests setup failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}