// app/api/fix-organizations/route.ts (Quick fix API route)

import { sql } from '@vercel/postgres';

export async function POST() {
  try {
    console.log('🔧 Adding missing columns to organizations table...');
    
    // Add missing columns to organizations table
    await sql`ALTER TABLE organizations ADD COLUMN IF NOT EXISTS address TEXT`;
    await sql`ALTER TABLE organizations ADD COLUMN IF NOT EXISTS contact_email VARCHAR(255)`;
    await sql`ALTER TABLE organizations ADD COLUMN IF NOT EXISTS contact_phone VARCHAR(50)`;
    await sql`ALTER TABLE organizations ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true`;
    
    // Ensure created_at and updated_at exist with proper defaults
    await sql`ALTER TABLE organizations ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`;
    await sql`ALTER TABLE organizations ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`;
    
    // Update existing rows to have is_active = true if it's null
    await sql`UPDATE organizations SET is_active = true WHERE is_active IS NULL`;
    
    console.log('✅ Organizations table columns added successfully!');

    return Response.json({ 
      success: true, 
      message: 'Missing columns added to organizations table successfully!' 
    });
    
  } catch (error) {
    console.error('❌ Error fixing organizations table:', error);
    return Response.json({ 
      success: false, 
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}