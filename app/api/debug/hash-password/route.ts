// Create this file temporarily: app/api/debug/hash-password/route.ts
import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const password = searchParams.get('password') || '123Azad@'
    
    // Generate hash for the password
    const hash = await bcrypt.hash(password, 12)
    
    // Verify the hash works
    const verified = await bcrypt.compare(password, hash)
    
    return NextResponse.json({
      success: true,
      password: password,
      hash: hash,
      verified: verified,
      sqlCommand: `
-- Use this exact SQL to fix your admin credentials:
UPDATE admins 
SET 
    username = 'nawab1996',
    password_hash = '${hash}'
WHERE email = 'azad818n.s@gmail.com';

-- After running this SQL, you can login with:
-- Username: nawab1996
-- Password: ${password}
      `
    })
    
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Hash generation failed'
    }, { status: 500 })
  }
}

// Instructions:
// 1. Create this file at: app/api/debug/hash-password/route.ts
// 2. Visit: http://localhost:3000/api/debug/hash-password?password=123Azad@
// 3. Copy the generated hash and use it in the SQL update
// 4. DELETE this file after fixing your password (for security)