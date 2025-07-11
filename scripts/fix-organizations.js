// scripts/fix-organizations.js
require('dotenv').config({ path: '.env.local' });

const { sql } = require('@vercel/postgres');

async function fixOrganizationsTable() {
  try {
    console.log('🔧 Adding missing columns to organizations table...');
    
    // Add missing columns to organizations table
    await sql`ALTER TABLE organizations ADD COLUMN IF NOT EXISTS address TEXT`;
    console.log('✅ Added address column');
    
    await sql`ALTER TABLE organizations ADD COLUMN IF NOT EXISTS contact_email VARCHAR(255)`;
    console.log('✅ Added contact_email column');
    
    await sql`ALTER TABLE organizations ADD COLUMN IF NOT EXISTS contact_phone VARCHAR(50)`;
    console.log('✅ Added contact_phone column');
    
    await sql`ALTER TABLE organizations ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true`;
    console.log('✅ Added is_active column');
    
    // Ensure created_at and updated_at exist with proper defaults
    await sql`ALTER TABLE organizations ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`;
    console.log('✅ Added created_at column');
    
    await sql`ALTER TABLE organizations ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`;
    console.log('✅ Added updated_at column');
    
    // Update existing rows to have is_active = true if it's null
    await sql`UPDATE organizations SET is_active = true WHERE is_active IS NULL`;
    console.log('✅ Updated existing rows with default values');
    
    console.log('🎉 Organizations table fixed successfully!');
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error fixing organizations table:', error);
    process.exit(1);
  }
}

fixOrganizationsTable();