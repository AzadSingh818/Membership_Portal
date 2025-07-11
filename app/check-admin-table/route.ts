// app/check-admin-table/route.ts
import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export async function GET() {
  try {
    console.log('🔍 Checking admin_users table structure...');
    
    // Check exact column structure
    const columnsResult = await sql`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'admin_users'
      ORDER BY ordinal_position
    `;
    
    console.log('📊 admin_users columns:', columnsResult.rows);

    // Try to get sample data structure (if any exists)
    let sampleData = null;
    try {
      const sampleResult = await sql`SELECT * FROM admin_users LIMIT 1`;
      sampleData = sampleResult.rows;
    } catch (error) {
      console.log('No sample data available');
    }

    // Get table definition
    const tableInfo = await sql`
      SELECT table_name, table_schema 
      FROM information_schema.tables 
      WHERE table_name = 'admin_users'
    `;

    return NextResponse.json({
      success: true,
      table_info: tableInfo.rows,
      columns: columnsResult.rows,
      sample_data: sampleData,
      column_names: columnsResult.rows.map(row => row.column_name),
      message: 'admin_users table structure retrieved successfully'
    });
    
  } catch (error) {
    console.error('❌ Error checking table structure:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}