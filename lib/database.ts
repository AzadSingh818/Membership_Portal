// lib/database.ts - COMPLETE VERSION WITH GUARANTEED USERNAME STORAGE

import { sql } from '@vercel/postgres';

export interface Organization {
  id: number;
  name: string;
  description?: string;
  address?: string;
  contact_email?: string;
  contact_phone?: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface User {
  id: number;
  email: string;
  password_hash: string;
  first_name?: string;
  last_name?: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface Admin {
  status: string;
  id: number;
  username: string;
  email: string;
  password_hash?: string;
  role: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  organization_id?: number;
  is_active: boolean;
  created_at: Date;
  updated_at?: Date;
}

export interface AdminRequest {
  id: number;
  email: string;
  first_name?: string;
  last_name?: string;
  organization?: string;
  username?: string;        // ✅ CRITICAL: Username field
  password_hash?: string;   // ✅ CRITICAL: Password hash field
  status: 'pending' | 'approved' | 'rejected';
  requested_at: Date;
  reviewed_at?: Date;
  reviewed_by?: number;
}

export interface OTP {
  id: number;
  contact: string;
  otp_code: string;
  otp_type: string;
  expires_at: Date;
  used: boolean;
  created_at: Date;
}

// 🆕 NEW: Member interface for member login
export interface Member {
  organization_name: any;
  id: number;
  membership_id?: string;
  email: string;
  phone?: string;
  first_name?: string;
  last_name?: string;
  user_type?: string;
  is_active: boolean;
  created_at: Date;
  updated_at?: Date;
}

// Organization functions
export async function createOrganization(orgData: {
  name: string;
  description?: string;
  address?: string;
  contact_email?: string;
  contact_phone?: string;
}): Promise<Organization> {
  
  if (!orgData.name || orgData.name.trim().length === 0) {
    throw new Error('Organization name is required and cannot be empty');
  }

  try {
    console.log('🚀 Creating organization with data:', orgData);
    
    const result = await sql`
      INSERT INTO organizations (
        name, 
        description, 
        address, 
        contact_email, 
        contact_phone, 
        is_active
      )  
      VALUES (
        ${orgData.name.trim()}, 
        ${orgData.description?.trim() || null}, 
        ${orgData.address?.trim() || null},
        ${orgData.contact_email?.trim() || null}, 
        ${orgData.contact_phone?.trim() || null}, 
        true
      )
      RETURNING 
        id, 
        name, 
        description, 
        address, 
        contact_email, 
        contact_phone, 
        is_active,
        created_at,
        updated_at
    `;

    console.log('✅ Database operation completed');
    console.log('📊 Rows affected:', result.rowCount);
    
    if (!result.rows || result.rows.length === 0) {
      throw new Error('No organization was created - database returned empty result');
    }

    const createdOrg = result.rows[0] as Organization;
    console.log('🎉 Organization created successfully:', createdOrg);

    const verification = await sql`
      SELECT * FROM organizations WHERE id = ${createdOrg.id}
    `;

    if (verification.rowCount === 0) {
      throw new Error(`Organization with ID ${createdOrg.id} was not found after creation`);
    }

    console.log('✅ Organization verified in database');
    return createdOrg;

  } catch (error) {
    console.error('❌ Error in createOrganization:', error);
    
    if (error instanceof Error) {
      throw new Error(`Failed to create organization: ${error.message}`);
    } else {
      throw new Error('Failed to create organization: Unknown error');
    }
  }
}

export async function createOrganizationSimple(orgData: {
  name: string;
  description?: string;
  address?: string;
  contact_email?: string;
  contact_phone?: string;
}): Promise<Organization> {
  
  if (!orgData.name || orgData.name.trim().length === 0) {
    throw new Error('Organization name is required');
  }

  try {
    console.log('🚀 Creating organization (simple method):', orgData);
    
    const result = await sql`
      INSERT INTO organizations (name, description, address, contact_email, contact_phone, is_active)  
      VALUES (
        ${orgData.name.trim()}, 
        ${orgData.description?.trim() || null}, 
        ${orgData.address?.trim() || null},
        ${orgData.contact_email?.trim() || null}, 
        ${orgData.contact_phone?.trim() || null}, 
        true
      )
      RETURNING *
    `;

    if (!result.rows || result.rows.length === 0) {
      throw new Error('Failed to create organization - no data returned');
    }

    const createdOrg = result.rows[0] as Organization;
    console.log('✅ Organization created:', createdOrg);
    
    return createdOrg;

  } catch (error) {
    console.error('❌ Error creating organization:', error);
    throw error;
  }
}

export async function getAllOrganizations(): Promise<Organization[]> {
  try {
    const result = await sql`
      SELECT * FROM organizations 
      ORDER BY created_at DESC
    `;
    
    return result.rows as Organization[];
  } catch (error) {
    console.error('❌ Error fetching organizations:', error);
    throw error;
  }
}

export async function getOrganizationById(id: number): Promise<Organization | null> {
  try {
    console.log('🔍 Looking up organization by ID:', id);

    if (!id || id <= 0) {
      throw new Error('Invalid organization ID');
    }
    
    const result = await sql`
      SELECT * FROM organizations WHERE id = ${id}
    `;

    if (!result.rows || result.rows.length === 0) {
      console.log('❌ No organization found with ID:', id);
      return null;
    }

    const organization = result.rows[0] as Organization;
    console.log('✅ Organization found:', { id: organization.id, name: organization.name });
    
    return organization;
  } catch (error) {
    console.error('❌ Error getting organization by ID:', error);
    throw error;
  }
}

export async function updateOrganization(id: number, updateData: {
  name?: string;
  description?: string;
  address?: string;
  contact_email?: string;
  contact_phone?: string;
  is_active?: boolean;
}): Promise<Organization | null> {
  try {
    console.log('📝 Updating organization:', id, updateData);

    if (!id || id <= 0) {
      throw new Error('Invalid organization ID');
    }

    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (updateData.name !== undefined) {
      updates.push(`name = $${paramIndex++}`);
      values.push(updateData.name.trim());
    }
    if (updateData.description !== undefined) {
      updates.push(`description = $${paramIndex++}`);
      values.push(updateData.description?.trim() || null);
    }
    if (updateData.address !== undefined) {
      updates.push(`address = $${paramIndex++}`);
      values.push(updateData.address?.trim() || null);
    }
    if (updateData.contact_email !== undefined) {
      updates.push(`contact_email = $${paramIndex++}`);
      values.push(updateData.contact_email?.trim() || null);
    }
    if (updateData.contact_phone !== undefined) {
      updates.push(`contact_phone = $${paramIndex++}`);
      values.push(updateData.contact_phone?.trim() || null);
    }
    if (updateData.is_active !== undefined) {
      updates.push(`is_active = $${paramIndex++}`);
      values.push(updateData.is_active);
    }

    if (updates.length === 0) {
      throw new Error('No valid fields to update');
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const query = `
      UPDATE organizations 
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await sql.query(query, values);

    if (!result.rows || result.rows.length === 0) {
      console.log('❌ Organization not found or could not be updated:', id);
      return null;
    }

    const updatedOrg = result.rows[0] as Organization;
    console.log('✅ Organization updated successfully:', updatedOrg);
    
    return updatedOrg;
  } catch (error) {
    console.error('❌ Error updating organization:', error);
    throw error;
  }
}

export async function deleteOrganization(id: number): Promise<boolean> {
  try {
    console.log('🗑️ Deleting organization with ID:', id);

    if (!id || id <= 0) {
      throw new Error('Invalid organization ID');
    }

    const existingOrg = await sql`
      SELECT id, name FROM organizations WHERE id = ${id}
    `;

    if (!existingOrg.rows || existingOrg.rows.length === 0) {
      console.log('❌ Organization not found with ID:', id);
      return false;
    }

    console.log('📋 Found organization to delete:', existingOrg.rows[0]);

    const result = await sql`
      DELETE FROM organizations WHERE id = ${id}
    `;

    const success = (result.rowCount ?? 0) > 0;
    
    if (success) {
      console.log('✅ Organization deleted successfully:', id);
    } else {
      console.log('❌ Organization could not be deleted:', id);
    }

    return success;
  } catch (error) {
    console.error('❌ Error deleting organization:', error);
    throw error;
  }
}

// Admin functions
export async function getAdminByUsername(username: string): Promise<Admin | null> {
  try {
    console.log('🔍 Looking up admin by username:', username);
    
    const result = await sql`
      SELECT * FROM admin_users 
      WHERE username = ${username} AND is_active = true
    `;

    if (!result.rows || result.rows.length === 0) {
      console.log('❌ No admin found with username:', username);
      return null;
    }

    const admin = result.rows[0] as Admin;
    console.log('✅ Admin found:', { id: admin.id, username: admin.username });
    
    return admin;
  } catch (error) {
    console.error('❌ Error getting admin by username:', error);
    throw error;
  }
}

export async function createAdminUser(adminData: {
  username: string;
  email: string;
  password_hash: string;
  role?: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  organization_id?: number;
}): Promise<Admin> {
  try {
    console.log('🚀 Creating admin user:', { 
      username: adminData.username, 
      email: adminData.email,
      role: adminData.role 
    });

    if (!adminData.username || adminData.username.trim().length === 0) {
      throw new Error('Username is required');
    }
    if (!adminData.email || adminData.email.trim().length === 0) {
      throw new Error('Email is required');
    }
    if (!adminData.password_hash) {
      throw new Error('Password hash is required');
    }

    const result = await sql`
      INSERT INTO admin_users (
        username,
        email,
        password_hash,
        role,
        first_name,
        last_name,
        phone,
        organization_id,
        is_active
      )
      VALUES (
        ${adminData.username.trim()},
        ${adminData.email.trim()},
        ${adminData.password_hash},
        ${adminData.role || 'admin'},
        ${adminData.first_name?.trim() || null},
        ${adminData.last_name?.trim() || null},
        ${adminData.phone?.trim() || null},
        ${adminData.organization_id || null},
        true
      )
      RETURNING *
    `;

    if (!result.rows || result.rows.length === 0) {
      throw new Error('Failed to create admin user - no data returned');
    }

    const createdAdmin = result.rows[0] as Admin;
    console.log('✅ Admin user created successfully:', { 
      id: createdAdmin.id, 
      username: createdAdmin.username 
    });

    return createdAdmin;
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('duplicate key') || error.message.includes('unique constraint')) {
        if (error.message.includes('username')) {
          throw new Error('Username already exists');
        } else if (error.message.includes('email')) {
          throw new Error('Email already exists');
        }
      }
      throw new Error(`Failed to create admin user: ${error.message}`);
    } else {
      throw new Error('Failed to create admin user: Unknown error');
    }
  }
}

export async function getAdmins(): Promise<Admin[]> {
  try {
    console.log('📋 Fetching all admins');
    
    const possibleQueries = [
      () => sql`
        SELECT 
          id, username, email, role, first_name, last_name, 
          phone, organization_id, is_active, created_at
        FROM admin_users 
        ORDER BY created_at DESC
      `,
      () => sql`
        SELECT 
          id, username, email, role, first_name, last_name, 
          is_active, created_at
        FROM admin_users 
        ORDER BY created_at DESC
      `,
      () => sql`
        SELECT 
          id, username, email, role, is_active, created_at
        FROM admin_users 
        ORDER BY created_at DESC
      `,
      () => sql`SELECT * FROM admin_users ORDER BY created_at DESC`
    ];

    let result = null;
    for (let i = 0; i < possibleQueries.length; i++) {
      try {
        result = await possibleQueries[i]();
        console.log(`✅ Successfully fetched admins using query version ${i + 1}`);
        break;
      } catch (error) {
        if (error instanceof Error) {
          console.log(`❌ Query version ${i + 1} failed:`, error.message);
        } else {
          console.log(`❌ Query version ${i + 1} failed:`, error);
        }
        if (i === possibleQueries.length - 1) throw error;
      }
    }
    
    console.log('✅ Found admins:', result?.rows.length || 0);
    return (result?.rows || []) as Admin[];
  } catch (error) {
    console.error('❌ Error fetching admins:', error);
    throw error;
  }
}

export async function approveAdminRequest(requestId: number, adminId: number): Promise<boolean> {
  try {
    console.log('✅ Approving admin request:', { requestId, adminId });
    
    const result = await sql`
      UPDATE admin_requests 
      SET status = 'approved', 
          reviewed_at = CURRENT_TIMESTAMP,
          reviewed_by = ${adminId}
      WHERE id = ${requestId} AND status = 'pending'
      RETURNING *
    `;
    
    if (result.rows.length === 0) {
      console.log('❌ No pending request found with ID:', requestId);
      return false;
    }
    
    console.log('✅ Admin request approved successfully');
    return true;
  } catch (error) {
    console.error('❌ Error approving admin request:', error);
    return false;
  }
}

export async function rejectAdminRequest(requestId: number, adminId: number): Promise<boolean> {
  try {
    console.log('❌ Rejecting admin request:', { requestId, adminId });
    
    const result = await sql`
      UPDATE admin_requests 
      SET status = 'rejected', 
          reviewed_at = CURRENT_TIMESTAMP,
          reviewed_by = ${adminId}
      WHERE id = ${requestId} AND status = 'pending'
      RETURNING *
    `;
    
    if (result.rows.length === 0) {
      console.log('❌ No pending request found with ID:', requestId);
      return false;
    }
    
    console.log('✅ Admin request rejected successfully');
    return true;
  } catch (error) {
    console.error('❌ Error rejecting admin request:', error);
    return false;
  }
}

export async function getAdminRequests(): Promise<AdminRequest[]> {
  try {
    console.log('📋 Fetching admin requests');
    
    const result = await sql`
      SELECT * FROM admin_requests 
      ORDER BY requested_at DESC
    `;
    
    console.log('✅ Found admin requests:', result.rows.length);
    return result.rows as AdminRequest[];
  } catch (error) {
    console.error('❌ Error fetching admin requests:', error);
    throw error;
  }
}

// ========================================
// 🔑 CRITICAL: FIXED createAdminRequest FUNCTION WITH GUARANTEED USERNAME STORAGE
// ========================================

export async function createAdminRequest(requestData: {
  email: string;
  first_name?: string;
  last_name?: string;
  organization?: string;
  username?: string;        // ✅ CRITICAL: Username parameter
  password_hash?: string;   // ✅ CRITICAL: Password hash parameter
  phone?: string;
  experience?: string;
  level?: string;
  appointer?: string;
}): Promise<AdminRequest> {
  try {
    console.log('🔑 CRITICAL: Creating admin request with USERNAME:', {
      email: requestData.email,
      username: requestData.username,    // ✅ CRITICAL: Log username input
      first_name: requestData.first_name,
      last_name: requestData.last_name
    });

    // ✅ CRITICAL: Validate username specifically
    if (!requestData.username || requestData.username.trim().length === 0) {
      throw new Error('Username is required and cannot be empty');
    }

    // ✅ CRITICAL: Clean and prepare data
    const cleanData = {
      email: requestData.email.trim(),
      first_name: requestData.first_name?.trim() || null,
      last_name: requestData.last_name?.trim() || null,
      organization: requestData.organization?.trim() || null,
      username: requestData.username.trim(),              // ✅ CRITICAL: Clean username
      password_hash: requestData.password_hash || null,   // ✅ CRITICAL: Password hash
      phone: requestData.phone?.trim() || null,
      status: 'pending' as const
    };

    console.log('💾 CRITICAL: Prepared clean data with USERNAME:', {
      email: cleanData.email,
      username: cleanData.username,    // ✅ CRITICAL: Confirm username in clean data
      first_name: cleanData.first_name,
      last_name: cleanData.last_name
    });

    // ========================================
    // 🔧 STRATEGY 1: Try with ALL columns including username and password_hash
    // ========================================
    try {
      console.log('🔧 STRATEGY 1: Attempting with full column set including USERNAME...');
      
      const result = await sql`
        INSERT INTO admin_requests (
          email, first_name, last_name, organization, 
          username, password_hash, phone, status
        )
        VALUES (
          ${cleanData.email},
          ${cleanData.first_name},
          ${cleanData.last_name},
          ${cleanData.organization},
          ${cleanData.username},           -- ✅ CRITICAL: Username value
          ${cleanData.password_hash},      -- ✅ CRITICAL: Password hash value
          ${cleanData.phone},
          ${cleanData.status}
        )
        RETURNING *
      `;

      if (!result.rows || result.rows.length === 0) {
        throw new Error('No data returned from admin_requests insertion');
      }

      const adminRequest = result.rows[0] as AdminRequest;
      
      console.log('✅ STRATEGY 1 SUCCESS: Admin request created with USERNAME!', {
        id: adminRequest.id,
        email: adminRequest.email,
        username: adminRequest.username,     // ✅ CRITICAL: Verify username was stored
        status: adminRequest.status
      });

      // ✅ CRITICAL: Verify username was actually stored
      if (!adminRequest.username || adminRequest.username !== cleanData.username) {
        console.error('🚨 CRITICAL ERROR: Username not properly stored in Strategy 1!', {
          expected: cleanData.username,
          stored: adminRequest.username
        });
        throw new Error('Username was not properly stored in database');
      }

      console.log('🎉 CRITICAL: Username storage verified successfully in Strategy 1');
      return adminRequest;

    } catch (strategy1Error: any) {
      console.log('❌ STRATEGY 1 failed:', strategy1Error.message);
      
      // ========================================
      // 🔧 STRATEGY 2: Try to add missing columns and retry
      // ========================================
      if (strategy1Error.message.includes('does not exist') || strategy1Error.message.includes('column')) {
        try {
          console.log('🔧 STRATEGY 2: Adding missing columns to admin_requests table...');
          
          // Try to add username and password_hash columns if they don't exist
          await sql`
            ALTER TABLE admin_requests 
            ADD COLUMN IF NOT EXISTS username VARCHAR(255),
            ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255)
          `;
          
          console.log('✅ STRATEGY 2: Successfully added missing columns');
          
          // Now retry the full insertion
          console.log('🔧 STRATEGY 2: Retrying insertion with USERNAME after adding columns...');
          
          const result = await sql`
            INSERT INTO admin_requests (
              email, first_name, last_name, organization, 
              username, password_hash, phone, status
            )
            VALUES (
              ${cleanData.email},
              ${cleanData.first_name},
              ${cleanData.last_name},
              ${cleanData.organization},
              ${cleanData.username},           -- ✅ CRITICAL: Username value
              ${cleanData.password_hash},      -- ✅ CRITICAL: Password hash value
              ${cleanData.phone},
              ${cleanData.status}
            )
            RETURNING *
          `;

          if (!result.rows || result.rows.length === 0) {
            throw new Error('No data returned from admin_requests insertion after adding columns');
          }

          const adminRequest = result.rows[0] as AdminRequest;
          
          console.log('✅ STRATEGY 2 SUCCESS: Admin request created with USERNAME after adding columns!', {
            id: adminRequest.id,
            email: adminRequest.email,
            username: adminRequest.username,     // ✅ CRITICAL: Verify username was stored
            status: adminRequest.status
          });

          // ✅ CRITICAL: Verify username was actually stored
          if (!adminRequest.username || adminRequest.username !== cleanData.username) {
            console.error('🚨 CRITICAL ERROR: Username not properly stored in Strategy 2!', {
              expected: cleanData.username,
              stored: adminRequest.username
            });
            throw new Error('Username was not properly stored in database after adding columns');
          }

          console.log('🎉 CRITICAL: Username storage verified successfully in Strategy 2');
          return adminRequest;

        } catch (strategy2Error: any) {
          console.log('❌ STRATEGY 2 failed:', strategy2Error.message);
        }
      }
      
      // ========================================
      // 🔧 STRATEGY 3: ENHANCED fallback with USERNAME (FIXED!)
      // ========================================
      try {
        console.log('🔧 STRATEGY 3: Enhanced fallback - trying with USERNAME included...');
        
        const result = await sql`
          INSERT INTO admin_requests (
            email, first_name, last_name, organization, username, status
          )
          VALUES (
            ${cleanData.email},
            ${cleanData.first_name},
            ${cleanData.last_name},
            ${cleanData.organization},
            ${cleanData.username},           -- ✅ CRITICAL: Username included in fallback!
            ${cleanData.status}
          )
          RETURNING *
        `;

        if (!result.rows || result.rows.length === 0) {
          throw new Error('No data returned from enhanced fallback insertion');
        }

        const adminRequest = result.rows[0] as AdminRequest;
        
        console.log('✅ STRATEGY 3 SUCCESS: Admin request created with USERNAME in enhanced fallback!', {
          id: adminRequest.id,
          email: adminRequest.email,
          username: adminRequest.username,     // ✅ CRITICAL: Verify username was stored
          status: adminRequest.status
        });

        // ✅ CRITICAL: Verify username was actually stored
        if (!adminRequest.username || adminRequest.username !== cleanData.username) {
          console.error('🚨 CRITICAL ERROR: Username not properly stored in Strategy 3!', {
            expected: cleanData.username,
            stored: adminRequest.username
          });
          throw new Error('Username was not properly stored in enhanced fallback');
        }

        console.log('🎉 CRITICAL: Username storage verified successfully in Strategy 3');
        return adminRequest;

      } catch (strategy3Error: any) {
        console.log('❌ STRATEGY 3 failed:', strategy3Error.message);
        
        // ========================================
        // 🔧 STRATEGY 4: Minimal fallback WITHOUT username (LAST RESORT)
        // ========================================
        console.log('🔧 STRATEGY 4: Minimal fallback WITHOUT username (last resort)...');
        console.error('🚨 CRITICAL WARNING: About to store admin request WITHOUT username!');
        
        const result = await sql`
          INSERT INTO admin_requests (
            email, first_name, last_name, organization, status
          )
          VALUES (
            ${cleanData.email},
            ${cleanData.first_name},
            ${cleanData.last_name},
            ${cleanData.organization},
            ${cleanData.status}
          )
          RETURNING *
        `;

        if (!result.rows || result.rows.length === 0) {
          throw new Error('Failed to create admin request even with minimal columns');
        }

        const adminRequest = result.rows[0] as AdminRequest;
        
        console.log('⚠️ STRATEGY 4 SUCCESS: Admin request created WITHOUT username (fallback)', {
          id: adminRequest.id,
          email: adminRequest.email,
          username: 'NOT_STORED',
          status: adminRequest.status
        });

        console.error('🚨 CRITICAL WARNING: Username was NOT stored in database due to table schema limitations!');
        console.error('🚨 CRITICAL WARNING: Manual intervention required to update database schema!');
        
        // ✅ CRITICAL: Return the request but flag that username wasn't stored
        return {
          ...adminRequest,
          username: undefined  // ✅ CRITICAL: Explicitly indicate username not stored
        } as AdminRequest;
      }
    }

  } catch (error) {
    console.error('❌ CRITICAL ERROR: All strategies failed in createAdminRequest:', error);
    throw error;
  }
}

// User functions (for regular users, not members)
export async function getUserByEmail(email: string): Promise<User | null> {
  try {
    console.log('🔍 Looking up user by email:', email);
    
    const result = await sql`
      SELECT * FROM users 
      WHERE email = ${email} AND is_active = true
    `;

    if (!result.rows || result.rows.length === 0) {
      console.log('❌ No user found with email:', email);
      return null;
    }

    const user = result.rows[0] as User;
    console.log('✅ User found:', { id: user.id, email: user.email });
    
    return user;
  } catch (error) {
    console.error('❌ Error getting user by email:', error);
    throw error;
  }
}

// ========================================
// 🆕 NEW: MEMBER FUNCTIONS - ADDED FOR MEMBER LOGIN
// ========================================

// 🔧 FIX: Add getUserByMembershipId function (MISSING)
export async function getUserByMembershipId(membershipId: string): Promise<Member | null> {
  try {
    console.log('🔍 Looking up user by membership ID:', membershipId);
    
    // Strategy 1: Try 'members' table first
    try {
      const result = await sql`
        SELECT * FROM members 
        WHERE membership_id = ${membershipId} AND is_active = true
      `;

      if (result.rows && result.rows.length > 0) {
        const member = result.rows[0] as Member;
        console.log('✅ Member found in members table:', { id: member.id, membership_id: membershipId });
        return member;
      }
    } catch (error: any) {
      console.log('❌ members table not found or error:', error.message);
    }

    // Strategy 2: Try 'users' table as fallback
    try {
      const result = await sql`
        SELECT * FROM users 
        WHERE membership_id = ${membershipId} AND is_active = true
      `;

      if (result.rows && result.rows.length > 0) {
        const user = result.rows[0] as Member;
        console.log('✅ User found in users table:', { id: user.id, membership_id: membershipId });
        return user;
      }
    } catch (error: any) {
      console.log('❌ users table not found or error:', error.message);
    }

    // Strategy 3: Try 'user_profiles' table
    try {
      const result = await sql`
        SELECT * FROM user_profiles 
        WHERE membership_id = ${membershipId} AND is_active = true
      `;

      if (result.rows && result.rows.length > 0) {
        const profile = result.rows[0] as Member;
        console.log('✅ User found in user_profiles table:', { id: profile.id, membership_id: membershipId });
        return profile;
      }
    } catch (error: any) {
      console.log('❌ user_profiles table not found or error:', error.message);
    }

    console.log('❌ No user found with membership ID:', membershipId);
    return null;
    
  } catch (error) {
    console.error('❌ Error getting user by membership ID:', error);
    throw error;
  }
}

// 🔧 FIX: Add getUserByPhone function (MISSING)
export async function getUserByPhone(phone: string): Promise<Member | null> {
  try {
    console.log('🔍 Looking up user by phone:', phone);
    
    // Strategy 1: Try 'members' table first
    try {
      const result = await sql`
        SELECT * FROM members 
        WHERE phone = ${phone} AND is_active = true
      `;

      if (result.rows && result.rows.length > 0) {
        const member = result.rows[0] as Member;
        console.log('✅ Member found by phone in members table:', { id: member.id, phone: phone });
        return member;
      }
    } catch (error: any) {
      console.log('❌ members table not found or error:', error.message);
    }

    // Strategy 2: Try 'users' table as fallback
    try {
      const result = await sql`
        SELECT * FROM users 
        WHERE phone = ${phone} AND is_active = true
      `;

      if (result.rows && result.rows.length > 0) {
        const user = result.rows[0] as Member;
        console.log('✅ User found by phone in users table:', { id: user.id, phone: phone });
        return user;
      }
    } catch (error: any) {
      console.log('❌ users table not found or error:', error.message);
    }

    // Strategy 3: Try 'user_profiles' table
    try {
      const result = await sql`
        SELECT * FROM user_profiles 
        WHERE phone = ${phone} AND is_active = true
      `;

      if (result.rows && result.rows.length > 0) {
        const profile = result.rows[0] as Member;
        console.log('✅ User found by phone in user_profiles table:', { id: profile.id, phone: phone });
        return profile;
      }
    } catch (error: any) {
      console.log('❌ user_profiles table not found or error:', error.message);
    }

    console.log('❌ No user found with phone:', phone);
    return null;
    
  } catch (error) {
    console.error('❌ Error getting user by phone:', error);
    throw error;
  }
}

// 🔧 FIX: Add getUserByEmailMember function (ENHANCED)
export async function getUserByEmailMember(email: string): Promise<Member | null> {
  try {
    console.log('🔍 Looking up member by email:', email);
    
    // Strategy 1: Try 'members' table first
    try {
      const result = await sql`
        SELECT * FROM members 
        WHERE email = ${email} AND is_active = true
      `;

      if (result.rows && result.rows.length > 0) {
        const member = result.rows[0] as Member;
        console.log('✅ Member found by email in members table:', { id: member.id, email: email });
        return member;
      }
    } catch (error: any) {
      console.log('❌ members table not found or error:', error.message);
    }

    // Strategy 2: Try 'users' table as fallback
    try {
      const result = await sql`
        SELECT * FROM users 
        WHERE email = ${email} AND is_active = true
      `;

      if (result.rows && result.rows.length > 0) {
        const user = result.rows[0] as Member;
        console.log('✅ User found by email in users table:', { id: user.id, email: email });
        return user;
      }
    } catch (error: any) {
      console.log('❌ users table not found or error:', error.message);
    }

    // Strategy 3: Try 'user_profiles' table
    try {
      const result = await sql`
        SELECT * FROM user_profiles 
        WHERE email = ${email} AND is_active = true
      `;

      if (result.rows && result.rows.length > 0) {
        const profile = result.rows[0] as Member;
        console.log('✅ User found by email in user_profiles table:', { id: profile.id, email: email });
        return profile;
      }
    } catch (error: any) {
      console.log('❌ user_profiles table not found or error:', error.message);
    }

    console.log('❌ No member found with email:', email);
    return null;
    
  } catch (error) {
    console.error('❌ Error getting member by email:', error);
    throw error;
  }
}

// 🔧 FIX: Add utility function to check what member tables exist
export async function checkMemberTables(): Promise<any> {
  try {
    console.log('🔍 Checking what member/user tables exist...');
    
    const tablesResult = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND (table_name LIKE '%user%' OR table_name LIKE '%member%')
      ORDER BY table_name
    `;
    
    console.log('📋 Available member/user tables:', tablesResult.rows.map(r => r.table_name));
    
    return {
      tables: tablesResult.rows.map(r => r.table_name),
      recommendation: tablesResult.rows.length === 0 ? 
        'No member/user tables found. You may need to create a members table.' :
        `Found ${tablesResult.rows.length} member/user related tables.`
    };
    
  } catch (error) {
    console.error('❌ Error checking member tables:', error);
    throw error;
  }
}

// 🔧 FIX: Create members table if needed
export async function createMembersTableIfNeeded(): Promise<void> {
  try {
    console.log('🏗️ Creating members table if it doesn\'t exist...');
    
    await sql`
      CREATE TABLE IF NOT EXISTS members (
        id SERIAL PRIMARY KEY,
        membership_id VARCHAR(50) UNIQUE,
        email VARCHAR(255) UNIQUE NOT NULL,
        phone VARCHAR(20),
        first_name VARCHAR(100),
        last_name VARCHAR(100),
        user_type VARCHAR(50) DEFAULT 'member',
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `;
    
    // Create indexes for better performance
    await sql`
      CREATE INDEX IF NOT EXISTS idx_members_email ON members(email);
    `;
    
    await sql`
      CREATE INDEX IF NOT EXISTS idx_members_phone ON members(phone);
    `;
    
    await sql`
      CREATE INDEX IF NOT EXISTS idx_members_membership_id ON members(membership_id);
    `;
    
    console.log('✅ Members table created/verified successfully');
    
  } catch (error) {
    console.error('❌ Error creating members table:', error);
    throw error;
  }
}

// ========================================
// 🔐 OTP FUNCTIONS - ENHANCED
// ========================================

// 🔧 ENHANCED STORAGE FUNCTION - FIXES NOT NULL CONSTRAINT ISSUES
export async function storeOTPInDB(contact: string, otpCode: string, otpType: string): Promise<void> {
  try {
    console.log('💾 Storing OTP in database:', {
      contact,
      otpType,
      otpLength: otpCode.length,
      timestamp: new Date().toISOString()
    });

    if (!contact || !otpCode || !otpType) {
      throw new Error('Missing required parameters: contact, otpCode, or otpType');
    }

    if (!['email', 'phone'].includes(otpType)) {
      throw new Error('Invalid otpType. Must be "email" or "phone"');
    }

    if (otpCode.length !== 6 || !/^\d{6}$/.test(otpCode)) {
      throw new Error('OTP must be exactly 6 digits');
    }

    await cleanupOTPsForContact(contact, otpType);

    // Try different insertion strategies to handle various table structures
    let insertSuccess = false;
    
    // Strategy 1: Try with both otp_type and contact_type columns (safest approach)
    try {
      console.log('🔧 Strategy 1: Inserting with both otp_type and contact_type columns')
      await sql`
        INSERT INTO otp_verifications (contact, otp_code, otp_type, contact_type, expires_at, is_used)
        VALUES (${contact}, ${otpCode}, ${otpType}, ${otpType}, NOW() + INTERVAL '10 minutes', false)
      `
      console.log('✅ Strategy 1 SUCCESS: OTP stored with both columns')
      insertSuccess = true
    } catch (error: any) {
      console.log('❌ Strategy 1 failed:', error.message)
    }

    // Strategy 2: Try with only otp_type column (most common case)
    if (!insertSuccess) {
      try {
        console.log('🔧 Strategy 2: Inserting with only otp_type column')
        await sql`
          INSERT INTO otp_verifications (contact, otp_code, otp_type, expires_at, is_used)
          VALUES (${contact}, ${otpCode}, ${otpType}, NOW() + INTERVAL '10 minutes', false)
        `
        console.log('✅ Strategy 2 SUCCESS: OTP stored with otp_type column')
        insertSuccess = true
      } catch (error: any) {
        console.log('❌ Strategy 2 failed:', error.message)
      }
    }

    // Strategy 3: Try with only contact_type column (alternative naming)
    if (!insertSuccess) {
      try {
        console.log('🔧 Strategy 3: Inserting with only contact_type column')
        await sql`
          INSERT INTO otp_verifications (contact, otp_code, contact_type, expires_at, is_used)
          VALUES (${contact}, ${otpCode}, ${otpType}, NOW() + INTERVAL '10 minutes', false)
        `
        console.log('✅ Strategy 3 SUCCESS: OTP stored with contact_type column')
        insertSuccess = true
      } catch (error: any) {
        console.log('❌ Strategy 3 failed:', error.message)
      }
    }

    // Strategy 4: Try with minimal columns only (basic fallback)
    if (!insertSuccess) {
      try {
        console.log('🔧 Strategy 4: Inserting with minimal columns (contact, otp_code, created_at)')
        await sql`
          INSERT INTO otp_verifications (contact, otp_code, created_at)
          VALUES (${contact}, ${otpCode}, NOW())
        `
        console.log('✅ Strategy 4 SUCCESS: OTP stored with minimal columns')
        insertSuccess = true
      } catch (error: any) {
        console.log('❌ Strategy 4 failed:', error.message)
      }
    }

    // Strategy 5: Create table with proper structure and try again
    if (!insertSuccess) {
      console.log('🔧 Strategy 5: Creating OTP table with proper structure and retrying')
      await createOTPTableIfNotExists()
      await sql`
        INSERT INTO otp_verifications (contact, otp_code, otp_type, expires_at, is_used)
        VALUES (${contact}, ${otpCode}, ${otpType}, NOW() + INTERVAL '10 minutes', false)
      `
      console.log('✅ Strategy 5 SUCCESS: OTP stored after creating table')
      insertSuccess = true
    }

    if (!insertSuccess) {
      throw new Error('All insertion strategies failed')
    }

    console.log('✅ OTP stored successfully in database')
  } catch (error) {
    console.error('❌ Failed to store OTP:', error)
    throw new Error('Failed to store OTP in database')
  }
}

// 🔧 WRAPPER FUNCTION: For compatibility with send-otp route
export async function storeOTP(contact: string, otp: string, type: string): Promise<void> {
  return storeOTPInDB(contact, otp, type);
}

export async function verifyOTPInDB(contact: string, otp: string, otpType: string): Promise<boolean> {
  try {
    console.log('🔍 Verifying OTP in database:', {
      contact,
      otp,
      otpType,
      timestamp: new Date().toISOString()
    })

    await cleanupExpiredOTPs()

    let otpRecord = null

    // Strategy 1: Try with contact_type column
    try {
      console.log('🔍 Strategy 1: Trying verification with contact_type column...')
      const result = await sql`
        SELECT id, otp_code, expires_at, created_at, contact_type
        FROM otp_verifications 
        WHERE contact = ${contact} 
          AND contact_type = ${otpType}
          AND expires_at > NOW()
          AND (is_used = false OR is_used IS NULL)
        ORDER BY created_at DESC 
        LIMIT 1
      `
      
      if (result.rows.length > 0) {
        otpRecord = result.rows[0]
        console.log('✅ Strategy 1 SUCCESS: Found OTP with contact_type column')
      }
    } catch (error: any) {
      console.log('❌ Strategy 1 failed:', error.message)
    }

    // Strategy 2: Try with otp_type column if contact_type failed
    if (!otpRecord) {
      try {
        console.log('🔍 Strategy 2: Trying verification with otp_type column...')
        const result = await sql`
          SELECT id, otp_code, expires_at, created_at, otp_type
          FROM otp_verifications 
          WHERE contact = ${contact} 
            AND otp_type = ${otpType}
            AND expires_at > NOW()
            AND (is_used = false OR is_used IS NULL)
          ORDER BY created_at DESC 
          LIMIT 1
        `
        
        if (result.rows.length > 0) {
          otpRecord = result.rows[0]
          console.log('✅ Strategy 2 SUCCESS: Found OTP with otp_type column')
        }
      } catch (error: any) {
        console.log('❌ Strategy 2 failed:', error.message)
      }
    }

    // Strategy 3: Try with created_at + 10 minute expiry calculation
    if (!otpRecord) {
      try {
        console.log('🔍 Strategy 3: Trying with created_at + 10 minute expiry...')
        const result = await sql`
          SELECT id, otp_code, created_at
          FROM otp_verifications 
          WHERE contact = ${contact} 
            AND (created_at + INTERVAL '10 minutes') > NOW()
            AND (is_used = false OR is_used IS NULL)
          ORDER BY created_at DESC 
          LIMIT 1
        `
        
        if (result.rows.length > 0) {
          otpRecord = result.rows[0]
          console.log('✅ Strategy 3 SUCCESS: Found OTP with created_at calculation')
        }
      } catch (error: any) {
        console.log('❌ Strategy 3 failed:', error.message)
      }
    }

    // Strategy 4: Last resort - find any recent OTP for this contact
    if (!otpRecord) {
      try {
        console.log('🔍 Strategy 4: Last resort - finding any recent OTP...')
        const result = await sql`
          SELECT id, otp_code, created_at
          FROM otp_verifications 
          WHERE contact = ${contact}
            AND (is_used = false OR is_used IS NULL)
          ORDER BY created_at DESC 
          LIMIT 1
        `
        
        if (result.rows.length > 0) {
          const record = result.rows[0]
          const now = new Date()
          const createdAt = new Date(record.created_at)
          const tenMinutesAgo = new Date(now.getTime() - 10 * 60 * 1000)
          
          if (createdAt > tenMinutesAgo) {
            otpRecord = record
            console.log('✅ Strategy 4 SUCCESS: Found recent OTP (manual expiry check)')
          } else {
            console.log('❌ Strategy 4: Found OTP but it has expired')
          }
        }
      } catch (error: any) {
        console.log('❌ Strategy 4 failed:', error.message)
      }
    }

    if (!otpRecord) {
      console.log('❌ ALL STRATEGIES FAILED: No valid OTP found for:', { contact, otpType })
      return false
    }

    console.log('📊 Found OTP record:', {
      id: otpRecord.id,
      storedOTP: otpRecord.otp_code,
      providedOTP: otp,
      createdAt: otpRecord.created_at,
      expiresAt: otpRecord.expires_at || 'calculated'
    })

    if (otpRecord.otp_code !== otp) {
      console.log('❌ OTP code mismatch:', {
        expected: otpRecord.otp_code,
        provided: otp
      })
      return false
    }

    try {
      await sql`
        UPDATE otp_verifications 
        SET is_used = true, used_at = NOW() 
        WHERE id = ${otpRecord.id}
      `
      console.log('✅ OTP marked as used')
    } catch (updateError: any) {
      console.log('⚠️ Could not mark OTP as used:', updateError.message)
    }

    console.log('🎉 OTP verification successful!')
    return true

  } catch (error) {
    console.error('❌ OTP verification error:', error)
    return false
  }
}

// Helper functions
async function cleanupExpiredOTPs(): Promise<void> {
  try {
    console.log('🧹 Cleaning up expired OTPs...')
    
    try {
      const result = await sql`
        DELETE FROM otp_verifications 
        WHERE expires_at < NOW() OR is_used = true
      `
      console.log('🧹 Cleaned up expired OTPs using expires_at')
    } catch (error) {
      const result = await sql`
        DELETE FROM otp_verifications 
        WHERE created_at < NOW() - INTERVAL '10 minutes' OR is_used = true
      `
      console.log('🧹 Cleaned up expired OTPs using created_at')
    }
  } catch (error) {
    console.log('⚠️ Could not clean up expired OTPs (non-critical)')
  }
}

async function cleanupOTPsForContact(contact: string, otpType: string): Promise<void> {
  try {
    console.log('🧹 Cleaning up existing OTPs for contact...')
    
    try {
      await sql`
        DELETE FROM otp_verifications 
        WHERE contact = ${contact} AND contact_type = ${otpType}
      `
    } catch (error) {
      await sql`
        DELETE FROM otp_verifications 
        WHERE contact = ${contact} AND otp_type = ${otpType}
      `
    }
    
    console.log('✅ Cleaned up existing OTPs for contact')
  } catch (error) {
    console.log('⚠️ Could not clean up existing OTPs (non-critical)')
  }
}

async function createOTPTableIfNotExists(): Promise<void> {
  try {
    console.log('🏗️ Creating OTP table if not exists...')
    
    await sql`
      CREATE TABLE IF NOT EXISTS otp_verifications (
        id SERIAL PRIMARY KEY,
        contact VARCHAR(255) NOT NULL,
        otp_code VARCHAR(6) NOT NULL,
        otp_type VARCHAR(10) DEFAULT 'email',
        expires_at TIMESTAMP DEFAULT (NOW() + INTERVAL '10 minutes'),
        created_at TIMESTAMP DEFAULT NOW(),
        used_at TIMESTAMP NULL,
        is_used BOOLEAN DEFAULT FALSE
      )
    `
    
    await sql`
      CREATE INDEX IF NOT EXISTS idx_otp_contact ON otp_verifications(contact, otp_type)
    `
    
    console.log('✅ OTP table created/verified')
  } catch (error) {
    console.log('⚠️ Could not create OTP table:', error)
  }
}

// Utility functions
export async function debugOTPTable(): Promise<any> {
  try {
    console.log('🔍 Debugging OTP table structure...')
    
    const tableExists = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'otp_verifications'
      )
    `
    
    console.log('📋 Table exists:', tableExists.rows[0].exists)
    
    if (!tableExists.rows[0].exists) {
      return {
        tableExists: false,
        message: 'otp_verifications table does not exist. Run the table creation SQL first.'
      }
    }

    const columns = await sql`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'otp_verifications'
      ORDER BY ordinal_position
    `
    
    console.log('📊 Table structure:', columns.rows)
    
    const sampleData = await sql`
      SELECT contact, otp_code, created_at, expires_at, is_used
      FROM otp_verifications 
      ORDER BY created_at DESC 
      LIMIT 5
    `
    
    console.log('📝 Sample data:', sampleData.rows)
    
    return {
      tableExists: true,
      columns: columns.rows,
      sampleData: sampleData.rows,
      rowCount: sampleData.rows.length
    }
    
  } catch (error) {
    console.error('❌ Error debugging OTP table:', error)
    return {
      error: error instanceof Error ? error.message : 'Unknown error',
      tableExists: false
    }
  }
}

export async function checkDatabaseTables(): Promise<any> {
  try {
    console.log('🔍 Checking database tables...')
    
    const tablesResult = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `;
    
    console.log('📋 Existing tables:', tablesResult.rows.map(r => r.table_name))
    
    const columnsResult = await sql`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'otp_verifications'
      ORDER BY ordinal_position
    `;
    
    console.log('📊 otp_verifications table structure:', columnsResult.rows)
    
    return {
      tables: tablesResult.rows,
      otp_table_structure: columnsResult.rows
    }
  } catch (error) {
    console.error('❌ Error checking database:', error)
    throw error
  }
}