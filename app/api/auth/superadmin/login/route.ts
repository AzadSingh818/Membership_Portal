import { compare } from "bcryptjs"
import { generateToken } from "@/lib/auth"
import { getUserByEmail } from "@/lib/database"
import { NextRequest, NextResponse } from "next/server"

// Helper to set the auth cookie on the response
function setAuthCookie(response: NextResponse, token: string): NextResponse {
  // Set multiple cookie formats for better compatibility
  response.cookies.set('auth_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 86400 // 24 hours
  })
  
  // Also set superadmin-specific cookie
  response.cookies.set('superadmin-token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 86400 // 24 hours
  })
  
  return response
}

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    // Validate input
    if (!email || !password) {
      console.log("❌ Missing email or password")
      return NextResponse.json(
        { error: "Email and password are required" }, 
        { status: 400 }
      )
    }

    // Normalize email
    const normalizedEmail = email.trim().toLowerCase()
    console.log("🔍 Login attempt for email:", normalizedEmail)

    // ✅ Check if demo credentials are used
    if (normalizedEmail === "superadmin@demo.com" && password === "SuperAdmin@123") {
      console.log("🎯 Demo superadmin login detected")

      const demoUser = {
        id: "demo-superadmin-id",
        email: "superadmin@demo.com",
        role: "superadmin",
        type: "internal",
        first_name: "Demo",
        last_name: "Superadmin",
        status: "active"
      }

      const token = generateToken({
        id: demoUser.id,
        email: demoUser.email,
        role: demoUser.role,
        type: demoUser.type,
      })

      console.log("✅ Demo login successful, token generated")

      const response = NextResponse.json({
        success: true,
        message: "Demo login successful",
        user: demoUser,
        token,
      }, { status: 200 })

      return setAuthCookie(response, token)
    }

    // 👉 Regular login flow for other users
    console.log("🔄 Attempting database lookup for:", normalizedEmail)
    const user = await getUserByEmail(normalizedEmail)

    if (!user) {
      console.log("❌ User not found for email:", normalizedEmail)
      return NextResponse.json(
        { error: "Invalid email or password" }, 
        { status: 401 }
      )
    }

    console.log("✅ Found user:", { 
      id: user.id, 
      email: user.email, 
      role: user.role, 
      status: user.status || 'undefined'
    })

    // Check if user is active
    if (user.status && user.status !== 'active') {
      console.log("❌ User account is not active:", user.status)
      return NextResponse.json(
        { error: "Account is not active. Please contact administrator." }, 
        { status: 403 }
      )
    }

    // Check role
    if (user.role !== "superadmin") {
      console.log("❌ Access denied: user role is", user.role)
      return NextResponse.json(
        { error: "Access denied: insufficient permissions" }, 
        { status: 403 }
      )
    }

    // Validate password
    if (!user.password_hash) {
      console.log("❌ No password hash found for user")
      return NextResponse.json(
        { error: "Account configuration error. Please contact administrator." }, 
        { status: 500 }
      )
    }

    const isPasswordValid = await compare(password, user.password_hash)
    console.log("🔐 Password validation result:", isPasswordValid)

    if (!isPasswordValid) {
      console.log("❌ Invalid password for user:", normalizedEmail)
      return NextResponse.json(
        { error: "Invalid email or password" }, 
        { status: 401 }
      )
    }

    // Generate token
    const token = generateToken({
      id: String(user.id),
      email: user.email,
      role: user.role,
      type: user.type || "internal",
    })

    console.log("✅ Login successful for superadmin:", user.email)

    // Remove sensitive data from response
    const { password_hash, ...userWithoutPassword } = user
    
    const response = NextResponse.json({
      success: true,
      message: "Login successful",
      user: userWithoutPassword,
      token,
    }, { status: 200 })

    return setAuthCookie(response, token)

  } catch (error) {
    console.error("💥 Login error:", error)
    
    // Log more details about the error for debugging
    if (error instanceof Error) {
      console.error("Error name:", error.name)
      console.error("Error message:", error.message)
      console.error("Error stack:", error.stack)
    }
    
    return NextResponse.json(
      { error: "Internal server error" }, 
      { status: 500 }
    )
  }
}

// Handle OPTIONS request for CORS
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': process.env.NODE_ENV === 'production' 
        ? 'https://yourdomain.com' 
        : 'http://localhost:3000',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Credentials': 'true',
    },
  })
}

// Handle GET request - for debugging only (remove in production)
export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: "Method not allowed" }, 
      { status: 405 }
    )
  }
  
  return NextResponse.json({
    message: "Superadmin login endpoint is working",
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
    endpoints: {
      POST: "/api/auth/superadmin/login - Login with email and password",
      demo: {
        email: "superadmin@demo.com",
        password: "SuperAdmin@123"
      }
    }
  }, { status: 200 })
}