// app/api/setup-database/route.ts (or pages/api/setup-database.js for pages router)

import { sql } from '@vercel/postgres';
// Or whatever database connection you're using
// import { db } from '@/lib/database';

export async function POST() {
  try {
    console.log('Setting up database schema...');
    
    // Create organizations table
    await sql`
      CREATE TABLE IF NOT EXISTS organizations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Create users table
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255),
        first_name VARCHAR(100),
        last_name VARCHAR(100),
        role VARCHAR(50) DEFAULT 'user',
        organization_id INTEGER REFERENCES organizations(id),
        is_approved BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Create indexes
    await sql`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_users_role ON users(role)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_users_organization_id ON users(organization_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_users_is_approved ON users(is_approved)`;

    // Create update trigger function
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
    await sql`
      CREATE TRIGGER update_organizations_updated_at 
        BEFORE UPDATE ON organizations 
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()
    `;

    await sql`
      CREATE TRIGGER update_users_updated_at 
        BEFORE UPDATE ON users 
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()
    `;

    // Optional: Create a default superadmin user
    const bcrypt = require('bcryptjs');
    const defaultPassword = await bcrypt.hash('password123', 12);
    
    await sql`
      INSERT INTO users (email, password_hash, first_name, last_name, role, is_approved)
      VALUES ('admin@example.com', ${defaultPassword}, 'Super', 'Admin', 'superadmin', true)
      ON CONFLICT (email) DO NOTHING
    `;

    return Response.json({ 
      success: true, 
      message: 'Database schema created successfully! Default admin: admin@example.com / password123' 
    });
    
  } catch (error) {
    console.error('Error setting up database:', error);
    return Response.json({ 
      success: false, 
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}