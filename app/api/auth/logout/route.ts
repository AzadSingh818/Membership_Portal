// app/api/auth/logout/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@vercel/postgres'

// ✅ FIXED: Use same auth method as middleware (base64 decoding)
function verifyToken(token: string): any {
  try {
    const decoded = JSON.parse(Buffer.from(token, 'base64').toString())
    
    // Check if token is expired (but for logout, we don't care much about expiry)
    console.log('✅ Token verified for logout:', { 
      email: decoded.email, 
      role: decoded.role,
      membershipId: decoded.membershipId 
    })
    return decoded
  } catch (error: any) {
    console.log('⚠️ Token verification failed during logout:', error.message)
    return null
  }
}

// ✅ FIXED: Use same token retrieval method as middleware
function getAuthToken(request: NextRequest): string | null {
  // Get token using same method as middleware
  let authToken = request.cookies.get('auth-token')?.value || 
                 request.cookies.get('auth_token')?.value ||
                 request.cookies.get('member-token')?.value ||
                 request.cookies.get('admin-token')?.value ||
                 request.cookies.get('superadmin-token')?.value ||
                 request.cookies.get('superadmin_token')?.value

  // Also check Authorization header as fallback
  if (!authToken) {
    const authHeader = request.headers.get('authorization')
    if (authHeader?.startsWith('Bearer ')) {
      authToken = authHeader.substring(7)
    }
  }

  return authToken ?? null
}

// Helper function to blacklist token (optional - store invalidated tokens)
async function blacklistToken(token: string, expiresAt?: Date): Promise<void> {
  try {
    // Create blacklisted_tokens table if it doesn't exist
    await sql`
      CREATE TABLE IF NOT EXISTS blacklisted_tokens (
        id SERIAL PRIMARY KEY,
        token_hash VARCHAR(64) UNIQUE NOT NULL,
        blacklisted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP
      )
    `

    // Create a hash of the token for storage (don't store full token)
    const crypto = require('crypto')
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex')

    // Store the blacklisted token hash
    await sql`
      INSERT INTO blacklisted_tokens (token_hash, expires_at)
      VALUES (${tokenHash}, ${(expiresAt ? expiresAt.toISOString() : new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString())})
      ON CONFLICT (token_hash) DO NOTHING
    `

    console.log('🚫 Token blacklisted successfully')
  } catch (error: any) {
    console.error('⚠️ Failed to blacklist token (non-critical):', error.message)
  }
}

// Helper function to log logout activity (optional)
async function logLogoutActivity(userInfo: any): Promise<void> {
  try {
    // Create user_activity table if it doesn't exist
    await sql`
      CREATE TABLE IF NOT EXISTS user_activity (
        id SERIAL PRIMARY KEY,
        user_id INTEGER,
        user_type VARCHAR(20),
        activity_type VARCHAR(50),
        details TEXT,
        ip_address VARCHAR(45),
        user_agent TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `

    // Log the logout activity
    await sql`
      INSERT INTO user_activity (
        user_id, 
        user_type, 
        activity_type, 
        details,
        created_at
      )
      VALUES (
        ${userInfo.memberId || userInfo.id || null},
        ${userInfo.role || 'member'},
        'logout',
        ${JSON.stringify({ 
          membershipId: userInfo.membershipId,
          email: userInfo.email,
          logoutTime: new Date().toISOString()
        })},
        CURRENT_TIMESTAMP
      )
    `

    console.log('📝 Logout activity logged')
  } catch (error: any) {
    console.error('⚠️ Failed to log logout activity (non-critical):', error.message)
  }
}

// POST - Logout user/member
export async function POST(request: NextRequest) {
  try {
    console.log('🚪 POST /api/auth/logout - Logging out user')

    // ✅ FIXED: Use middleware-compatible token retrieval
    const authToken = getAuthToken(request)
    
    if (authToken) {
      // ✅ FIXED: Use middleware-compatible token verification
      const tokenData = verifyToken(authToken)
      
      if (tokenData) {
        console.log('🔍 Valid token found during logout:', {
          membershipId: tokenData.membershipId,
          email: tokenData.email,
          role: tokenData.role
        })

        // Blacklist the token (optional security measure)
        await blacklistToken(authToken)

        // Log logout activity (optional)
        await logLogoutActivity(tokenData)
      } else {
        console.log('⚠️ Invalid token during logout - proceeding anyway')
      }
    } else {
      console.log('⚠️ No token found during logout - proceeding anyway')
    }

    // Create response with success message
    const response = NextResponse.json({
      success: true,
      message: 'Logged out successfully'
    })

    // ✅ FIXED: Clear all possible authentication cookies (same as middleware)
    const cookiesToClear = [
      'auth-token',
      'auth_token',
      'member-token', 
      'admin-token',
      'user-token',
      'session-token',
      'superadmin-token',
      'superadmin_token'
    ]

    cookiesToClear.forEach(cookieName => {
      response.cookies.set(cookieName, '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
        expires: new Date(0) // Set expiry to past date to delete cookie
      })
    })

    console.log('✅ Logout successful - cookies cleared')

    return response

  } catch (error: any) {
    console.error('❌ Error in POST /api/auth/logout:', error)
    
    // Even if there's an error, we should still try to clear cookies
    const response = NextResponse.json({
      success: true,
      message: 'Logged out successfully'
    })

    // Clear authentication cookies anyway
    const cookiesToClear = [
      'auth-token',
      'auth_token',
      'member-token', 
      'admin-token',
      'user-token',
      'session-token',
      'superadmin-token',
      'superadmin_token'
    ]

    cookiesToClear.forEach(cookieName => {
      response.cookies.set(cookieName, '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
        expires: new Date(0)
      })
    })

    return response
  }
}

// GET - Check logout status or redirect
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 GET /api/auth/logout - Logout status check')

    // This endpoint can be used to check if user is logged out
    // or to perform logout via GET request (though POST is preferred)

    return NextResponse.json({
      success: true,
      message: 'User is logged out',
      redirectTo: '/member/login'
    })

  } catch (error: any) {
    console.error('❌ Error in GET /api/auth/logout:', error)
    return NextResponse.json(
      { success: false, error: 'Logout check failed' },
      { status: 500 }
    )
  }
}