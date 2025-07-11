// lib/user.ts - FIXED VERSION
import { sql } from "@vercel/postgres"

export async function getUserByMembershipId(membershipId: string) {
  try {
    console.log('🔍 Looking up user by membership ID:', membershipId)
    
    // Strategy 1: Try 'members' table first
    try {
      const result = await sql`
        SELECT * FROM members 
        WHERE membership_id = ${membershipId} AND is_active = true
      `;

      if (result.rows && result.rows.length > 0) {
        console.log('✅ Member found in members table')
        return result.rows[0]
      }
    } catch (error: any) {
      console.log('❌ members table not found:', error.message)
    }

    // Strategy 2: Try 'users' table as fallback
    try {
      const result = await sql`
        SELECT * FROM users 
        WHERE membership_id = ${membershipId} AND is_active = true
      `;

      if (result.rows && result.rows.length > 0) {
        console.log('✅ User found in users table')
        return result.rows[0]
      }
    } catch (error: any) {
      console.log('❌ users table not found:', error.message)
    }

    console.log('❌ No user found with membership ID:', membershipId)
    return null
    
  } catch (error) {
    console.error('❌ Error getting user by membership ID:', error)
    throw error
  }
}