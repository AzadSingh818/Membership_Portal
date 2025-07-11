// app/check-db/route.ts
import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export async function GET() {
  try {
    console.log('🔍 Checking database structure...');
    
    // Check what tables exist
    const tablesResult = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `;
    
    console.log('📋 Existing tables:', tablesResult.rows.map(r => r.table_name));
    
    // Check otp_verifications table structure
    const columnsResult = await sql`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'otp_verifications'
      ORDER BY ordinal_position
    `;
    
    console.log('📊 otp_verifications table structure:', columnsResult.rows);

    // Also check if there are any existing records to see the data format
    let sampleData = null;
    try {
      const sampleResult = await sql`
        SELECT * FROM otp_verifications 
        LIMIT 1
      `;
      sampleData = sampleResult.rows;
    } catch (error) {
      console.log('No sample data or error reading data:', error);
    }
    
    return NextResponse.json({
      success: true,
      tables: tablesResult.rows.map(r => r.table_name),
      otp_table_columns: columnsResult.rows,
      sample_data: sampleData,
      message: 'Database structure retrieved successfully'
    });
    
  } catch (error) {
    console.error('❌ Error checking database:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Failed to check database structure'
    }, { status: 500 });
  }
}