// app/setup-admin-tables/route.ts
import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export async function GET() {
  try {
    console.log('🛠️ Setting up admin tables...');

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
        reviewed_by INTEGER REFERENCES admins(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    console.log('✅ Created admin_requests table');

    // Create users table if not exists (might be needed)
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

    // Create indexes for better performance
    await sql`CREATE INDEX IF NOT EXISTS idx_admins_username ON admins(username)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_admins_email ON admins(email)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_admins_is_active ON admins(is_active)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_admin_requests_email ON admin_requests(email)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_admin_requests_status ON admin_requests(status)`;
    console.log('✅ Created indexes');

    // Create trigger function for updating timestamps
    await sql`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ language 'plpgsql'
    `;

    // Create triggers for automatic timestamp updates
    await sql`DROP TRIGGER IF EXISTS update_admins_updated_at ON admins`;
    await sql`
      CREATE TRIGGER update_admins_updated_at 
        BEFORE UPDATE ON admins 
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()
    `;

    await sql`DROP TRIGGER IF EXISTS update_admin_requests_updated_at ON admin_requests`;
    await sql`
      CREATE TRIGGER update_admin_requests_updated_at 
        BEFORE UPDATE ON admin_requests 
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()
    `;

    await sql`DROP TRIGGER IF EXISTS update_users_updated_at ON users`;
    await sql`
      CREATE TRIGGER update_users_updated_at 
        BEFORE UPDATE ON users 
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()
    `;
    console.log('✅ Created triggers');

    // Verify tables were created
    const result = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('admins', 'admin_requests', 'users', 'organizations', 'otp_verifications')
      ORDER BY table_name
    `;

    const tables = result.rows.map(row => row.table_name);
    console.log('📋 Tables now in database:', tables);

    // Create a default superadmin if none exists
    const adminCount = await sql`SELECT COUNT(*) as count FROM admins WHERE role = 'superadmin'`;
    
    if (adminCount.rows[0].count === '0') {
      console.log('🔧 Creating default superadmin...');
      
      // You might want to change these default credentials
      const defaultPassword = 'admin123'; // Change this!
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash(defaultPassword, 10);
      
      await sql`
        INSERT INTO admins (username, email, password_hash, role, first_name, last_name)
        VALUES ('superadmin', 'superadmin@example.com', ${hashedPassword}, 'superadmin', 'Super', 'Admin')
        ON CONFLICT (username) DO NOTHING
      `;
      console.log('✅ Default superadmin created (username: superadmin, password: admin123)');
      console.log('⚠️ IMPORTANT: Change the default password immediately!');
    }

    return NextResponse.json({
      success: true,
      message: '🎉 Admin tables setup completed successfully!',
      tables_created: tables,
      note: 'You can now register admins and use the admin panel'
    });

  } catch (error) {
    console.error('❌ Admin tables setup failed:', error);
    return NextResponse.json({
      success: false,
      error: 'Admin tables setup failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}