import bcrypt from "bcryptjs"
import { getAdminByUsername, createAdminUser as createAdminInDB, getUserByEmail } from "./database"

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

export async function authenticateAdmin(username: string, password: string) {
  try {
    console.log('🔐 Attempting to authenticate admin:', username);
    
    const admin = await getAdminByUsername(username)
    if (!admin) {
      console.log('❌ Admin not found:', username);
      return null
    }

    console.log('✅ Admin found, verifying password');
    if (!admin.password_hash) {
      console.log('❌ Admin password hash missing:', username);
      return null;
    }
    const isValidPassword = await verifyPassword(password, admin.password_hash)
    if (!isValidPassword) {
      console.log('❌ Invalid password for admin:', username);
      return null
    }

    console.log('✅ Admin authenticated successfully:', username);
    return {
      id: admin.id,
      username: admin.username,
      email: admin.email,
      role: admin.role,
      firstName: admin.first_name,
      lastName: admin.last_name,
    }
  } catch (error) {
    console.error("❌ Authentication error:", error)
    return null
  }
}

// Re-export database functions for use in other parts of the app
export { getAdminByUsername, getUserByEmail, createAdminInDB as createAdminUser }

export function generateToken(payload: any): string {
  // Simple base64 encoding for demo purposes
  // In production, use a proper JWT library like jsonwebtoken
  const tokenData = {
    ...payload,
    exp: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
    iat: Date.now(), // issued at
  }
  return Buffer.from(JSON.stringify(tokenData)).toString("base64")
}

export function verifyToken(token: string): any {
  try {
    const decoded = JSON.parse(Buffer.from(token, "base64").toString())
    
    // Check if token is expired
    if (decoded.exp < Date.now()) {
      console.log('❌ Token expired');
      return null
    }
    
    console.log('✅ Token verified successfully');
    return decoded
  } catch (error) {
    console.error('❌ Token verification failed:', error);
    return null
  }
}

// Helper function to create admin user with hashed password
export async function createAdminWithHashedPassword(adminData: {
  username: string;
  email: string;
  password: string; // Plain text password
  role?: string;
  first_name?: string;
  last_name?: string;
}) {
  try {
    console.log('🔐 Creating admin with hashed password:', adminData.username);
    
    const hashedPassword = await hashPassword(adminData.password);
    
    return await createAdminInDB({
      ...adminData,
      password_hash: hashedPassword,
    });
  } catch (error) {
    console.error('❌ Error creating admin with hashed password:', error);
    throw error;
  }
}