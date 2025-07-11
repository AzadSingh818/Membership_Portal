// app/seed/route.ts
import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export async function GET() {
  try {
    console.log('🌱 Starting database setup...');

    // Create admin_requests table
    await sql`
      CREATE TABLE IF NOT EXISTS admin_requests (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) NOT NULL UNIQUE,
        first_name VARCHAR(100),
        last_name VARCHAR(100),
        organization VARCHAR(255),
        status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
        requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        reviewed_at TIMESTAMP,
        reviewed_by INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    console.log('✅ Created admin_requests table');

    // Create otps table
    await sql`
      CREATE TABLE IF NOT EXISTS otps (
        id SERIAL PRIMARY KEY,
        contact VARCHAR(255) NOT NULL,
        otp_code VARCHAR(10) NOT NULL,
        otp_type VARCHAR(50) NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        used BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    console.log('✅ Created otps table');

    // Create admins table
    await sql`
      CREATE TABLE IF NOT EXISTS admins (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role VARCHAR(50) DEFAULT 'admin',
        first_name VARCHAR(100),
        last_name VARCHAR(100),
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    console.log('✅ Created admins table');

    // Create users table
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        first_name VARCHAR(100),
        last_name VARCHAR(100),
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    console.log('✅ Created users table');

    // Create indexes
    await sql`CREATE INDEX IF NOT EXISTS idx_admin_requests_email ON admin_requests(email)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_admin_requests_status ON admin_requests(status)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_otps_contact_type ON otps(contact, otp_type)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_otps_expires_at ON otps(expires_at)`;
    console.log('✅ Created indexes');

    // Create trigger function
    await sql`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ language 'plpgsql'
    `;

    // Create triggers
    await sql`DROP TRIGGER IF EXISTS update_admin_requests_updated_at ON admin_requests`;
    await sql`
      CREATE TRIGGER update_admin_requests_updated_at 
        BEFORE UPDATE ON admin_requests 
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()
    `;

    await sql`DROP TRIGGER IF EXISTS update_admins_updated_at ON admins`;
    await sql`
      CREATE TRIGGER update_admins_updated_at 
        BEFORE UPDATE ON admins 
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()
    `;

    await sql`DROP TRIGGER IF EXISTS update_users_updated_at ON users`;
    await sql`
      CREATE TRIGGER update_users_updated_at 
        BEFORE UPDATE ON users 
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()
    `;
    console.log('✅ Created triggers');

    // Verify tables exist
    const result = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('admin_requests', 'otps', 'admins', 'users', 'organizations')
      ORDER BY table_name
    `;

    const tables = result.rows.map(row => row.table_name);
    console.log('📋 Tables in database:', tables);

    return NextResponse.json({
      message: '🎉 Database setup completed successfully!',
      tables_created: tables,
      success: true
    });

  } catch (error) {
    console.error('❌ Database setup failed:', error);
    return NextResponse.json({
      error: 'Database setup failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      success: false
    }, { status: 500 });
  }
}