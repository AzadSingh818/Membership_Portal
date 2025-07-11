// scripts/setup-db.js
require('dotenv').config({ path: '.env.local' });

const { sql } = require('@vercel/postgres');
// Or use your database connection method

async function setupDatabase() {
  try {
    console.log('🚀 Setting up database schema...');
    
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
    console.log('✅ Organizations table created');

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
    console.log('✅ Users table created');

    // Create indexes
    await sql`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_users_role ON users(role)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_users_organization_id ON users(organization_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_users_is_approved ON users(is_approved)`;
    console.log('✅ Indexes created');

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
    console.log('✅ Triggers created');

    // Create default superadmin user
    const bcrypt = require('bcryptjs');
    const defaultPassword = await bcrypt.hash('password123', 12);
    
    await sql`
      INSERT INTO users (email, password_hash, first_name, last_name, role, is_approved)
      VALUES ('admin@example.com', ${defaultPassword}, 'Super', 'Admin', 'superadmin', true)
      ON CONFLICT (email) DO NOTHING
    `;
    console.log('✅ Default superadmin user created');

    console.log('🎉 Database setup completed successfully!');
    console.log('📧 Default admin credentials:');
    console.log('   Email: admin@example.com');
    console.log('   Password: password123');
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error setting up database:', error);
    process.exit(1);
  }
}

setupDatabase();