// app/api/superadmin/organization/add/route.ts - Dynamic version that checks columns

import { sql } from '@vercel/postgres';

export async function POST(request: Request) {
  try {
    console.log('🚀 Starting organization creation...');
    
    const body = await request.json();
    console.log('📝 Received data:', body);

    // Validate required fields
    if (!body.name || body.name.trim().length === 0) {
      return Response.json({ 
        success: false, 
        error: 'Organization name is required' 
      }, { status: 400 });
    }

    // Step 1: Check what columns actually exist in the organizations table
    console.log('🔍 Checking table structure...');
    
    const columnsResult = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'organizations' 
      AND table_schema = 'public'
      ORDER BY ordinal_position
    `;

    const existingColumns = columnsResult.rows.map(row => row.column_name);
    console.log('📋 Existing columns:', existingColumns);

    // Step 2: Build INSERT query with only existing columns
    const insertColumns = [];
    const insertValues = [];

    // Always include required columns
    insertColumns.push('name');
    insertValues.push(body.name.trim());

    // Add optional columns only if they exist in the table
    if (existingColumns.includes('description')) {
      insertColumns.push('description');
      insertValues.push(body.description?.trim() || null);
    }

    if (existingColumns.includes('address')) {
      insertColumns.push('address');
      insertValues.push(body.address?.trim() || null);
    }

    if (existingColumns.includes('contact_email')) {
      insertColumns.push('contact_email');
      insertValues.push(body.contact_email?.trim() || null);
    }

    if (existingColumns.includes('contact_phone')) {
      insertColumns.push('contact_phone');
      insertValues.push(body.contact_phone?.trim() || null);
    }

    if (existingColumns.includes('is_active')) {
      insertColumns.push('is_active');
      insertValues.push(true);
    }

    // Step 3: Create the INSERT query dynamically but safely
    let insertQuery;
    let returningColumns = existingColumns.filter(col => 
      ['id', 'name', 'description', 'address', 'contact_email', 'contact_phone', 'is_active', 'created_at', 'updated_at'].includes(col)
    ).join(', ');

    // Create a safe insert based on available columns
    if (existingColumns.includes('is_active')) {
      insertQuery = sql`
        INSERT INTO organizations (name, description, address, contact_email, contact_phone, is_active)  
        VALUES (
          ${body.name.trim()}, 
          ${body.description?.trim() || null}, 
          ${body.address?.trim() || null},
          ${body.contact_email?.trim() || null}, 
          ${body.contact_phone?.trim() || null}, 
          true
        )
      `;
    } else {
      insertQuery = sql`
        INSERT INTO organizations (name, description, address, contact_email, contact_phone)  
        VALUES (
          ${body.name.trim()}, 
          ${body.description?.trim() || null}, 
          ${body.address?.trim() || null},
          ${body.contact_email?.trim() || null}, 
          ${body.contact_phone?.trim() || null}
        )
      `;
    }

    console.log('💾 Executing insert...');
    const result = await insertQuery;

    console.log('✅ Insert completed, rows affected:', result.rowCount);
    
    if (result.rowCount === 0) {
      return Response.json({ 
        success: false, 
        error: 'Failed to create organization - no rows affected' 
      }, { status: 500 });
    }

    // Step 4: Fetch the created organization
    const fetchResult = await sql`
      SELECT * FROM organizations 
      WHERE name = ${body.name.trim()} 
      ORDER BY id DESC 
      LIMIT 1
    `;

    const createdOrg = fetchResult.rows[0];
    console.log('🎉 Organization created:', createdOrg);

    return Response.json({ 
      success: true, 
      message: 'Organization created successfully!',
      organization: createdOrg
    });

  } catch (error) {
    console.error('❌ Error creating organization:', error);
    
    let errorMessage = 'Unknown error';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    return Response.json({ 
      success: false, 
      error: `Failed to create organization: ${errorMessage}`
    }, { status: 500 });
  }
}