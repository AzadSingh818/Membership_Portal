import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Public routes that don't require authentication
const publicRoutes = [
  '/',
  '/register',
  '/login',                      // ✅ FIX: Added general login
  '/member/login',               // ✅ FIX: Added member login
  '/member-login',               // ✅ FIX: Added alternative member login
  '/admin/login',
  '/admin/register',
  '/superadmin/login',
  '/forgot-password',
  '/reset-password',
  '/application-success',
  '/unauthorized',
  '/member/inactive',
  '/admin/pending-approval'
]

// Public API routes that don't require authentication
const publicApiRoutes = [
  '/api/auth/send-otp',
  '/api/auth/verify-otp',
  '/api/auth/verify-membership',
  '/api/auth/member/login',      // ✅ FIX: Added member login API
  '/api/auth/admin/login',
  '/api/auth/admin/register',
  '/api/auth/superadmin/login',
  '/api/auth/logout',
  '/api/organizations',
  '/api/membership/apply',
  '/api/member/register',
  '/api/send-otp',
  '/api/verify-otp'
]

// Protected route configurations
const protectedRoutes = {
  member: ['/member/dashboard', '/member/profile'], // ✅ FIX: Specific member routes only
  admin: ['/admin/dashboard', '/admin/profile', '/admin/applications', '/admin/members'],
  superadmin: ['/superadmin/dashboard', '/superadmin/profile']
}

// Protected API route configurations
const protectedApiRoutes = {
  member: ['/api/member/dashboard', '/api/member/profile'], // ✅ FIX: Specific API routes
  admin: ['/api/admin'],
  superadmin: ['/api/superadmin']
}

function verifyToken(token: string): any {
  try {
    const decoded = JSON.parse(Buffer.from(token, 'base64').toString())
    
    // Check if token is expired
    if (decoded.exp && decoded.exp < Math.floor(Date.now() / 1000)) {
      return null
    }
    
    return decoded
  } catch (error) {
    console.error('Token verification error:', error)
    return null
  }
}

function isPublicRoute(pathname: string): boolean {
  // ✅ FIX: Check public API routes FIRST 
  const isPublicApi = publicApiRoutes.some(route => pathname.startsWith(route))
  if (isPublicApi) {
    return true
  }
  
  // Then check public page routes
  return publicRoutes.some(route => {
    if (route === '/') return pathname === '/'
    return pathname.startsWith(route)
  })
}

function getRequiredRole(pathname: string): string | null {
  // ✅ FIX: Double-check that login/registration routes are truly public
  const alwaysPublicRoutes = [
    '/api/member/register',
    '/api/auth/member/login',
    '/member/login',
    '/member-login',
    '/login',
    '/api/send-otp',
    '/api/verify-otp'
  ]
  
  if (alwaysPublicRoutes.some(route => pathname.startsWith(route))) {
    console.log('✅ Always public route detected:', pathname)
    return null
  }
  
  // Check page routes
  for (const [role, routes] of Object.entries(protectedRoutes)) {
    if (routes.some(route => pathname.startsWith(route))) {
      return role
    }
  }
  
  // Check API routes
  for (const [role, routes] of Object.entries(protectedApiRoutes)) {
    if (routes.some(route => pathname.startsWith(route))) {
      return role
    }
  }
  
  return null
}

function hasRequiredRole(userRole: string, requiredRole: string): boolean {
  // Role hierarchy: superadmin > admin > member
  const roleHierarchy = {
    member: 1,
    admin: 2,
    senior_admin: 2,
    superadmin: 3
  }
  
  const userLevel = roleHierarchy[userRole as keyof typeof roleHierarchy] || 0
  const requiredLevel = roleHierarchy[requiredRole as keyof typeof roleHierarchy] || 0
  
  return userLevel >= requiredLevel
}

function getRedirectUrl(requiredRole: string, pathname: string, request: NextRequest): string {
  if (requiredRole === 'superadmin') {
    return new URL('/superadmin/login', request.url).toString()
  } else if (requiredRole === 'admin') {
    return new URL('/admin/login', request.url).toString()
  } else if (requiredRole === 'member') {
    return new URL('/member/login', request.url).toString() // ✅ FIX: Member login redirect
  } else {
    return new URL('/', request.url).toString()
  }
}

function createErrorResponse(pathname: string, request: NextRequest, error: string, status: number = 401) {
  if (pathname.startsWith('/api/')) {
    return NextResponse.json({ error }, { status })
  } else {
    return NextResponse.redirect(new URL('/unauthorized', request.url))
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  console.log('🔍 Middleware checking path:', pathname)

  // ✅ FIX: Allow public routes (this will now catch member login routes)
  if (isPublicRoute(pathname)) {
    console.log('✅ Public route, allowing access:', pathname)
    return NextResponse.next()
  }

  // Check if route requires authentication
  const requiredRole = getRequiredRole(pathname)
  if (!requiredRole) {
    console.log('✅ No authentication required for:', pathname)
    return NextResponse.next()
  }

  console.log('🔐 Protected route detected, required role:', requiredRole)

  // Get authentication token based on required role
  let authToken: string | undefined

  if (requiredRole === 'superadmin') {
    // Check for superadmin token with multiple cookie names for compatibility
    authToken = request.cookies.get('superadmin-token')?.value || 
                request.cookies.get('superadmin_token')?.value ||
                request.cookies.get('auth_token')?.value ||
                request.cookies.get('auth-token')?.value
  } else {
    // Check for regular auth token
    authToken = request.cookies.get('auth-token')?.value || 
                request.cookies.get('auth_token')?.value ||
                request.cookies.get('member-token')?.value ||
                request.cookies.get('admin-token')?.value
  }

  if (!authToken) {
    console.log('❌ No auth token found for protected route:', pathname)
    
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
    
    return NextResponse.redirect(new URL(getRedirectUrl(requiredRole, pathname, request)))
  }

  // Verify token
  const tokenData = verifyToken(authToken)
  if (!tokenData) {
    console.log('❌ Invalid or expired token for:', pathname)
    
    const response = pathname.startsWith('/api/')
      ? NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 })
      : NextResponse.redirect(new URL(getRedirectUrl(requiredRole, pathname, request)))
    
    // Clear invalid cookies
    response.cookies.delete('auth-token')
    response.cookies.delete('auth_token')
    response.cookies.delete('superadmin-token')
    response.cookies.delete('superadmin_token')
    response.cookies.delete('member-token')
    response.cookies.delete('admin-token')
    
    return response
  }

  // Check role permissions
  const userRole = tokenData.role || tokenData.type
  if (!hasRequiredRole(userRole, requiredRole)) {
    console.log('❌ Insufficient permissions. User role:', userRole, 'Required:', requiredRole)
    return createErrorResponse(pathname, request, 'Insufficient permissions', 403)
  }

  // Additional status checks based on role
  if (requiredRole === 'admin') {
    // Check if admin is approved
    if (tokenData.status && tokenData.status !== 'approved' && tokenData.status !== 'active') {
      console.log('❌ Admin account not approved:', tokenData.status)
      
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'Account pending approval' }, { status: 403 })
      }
      
      return NextResponse.redirect(new URL('/admin/pending-approval', request.url))
    }
  }

  if (requiredRole === 'member') {
    // Check if member account is active
    if (tokenData.status && tokenData.status !== 'active' && tokenData.status !== 'approved') {
      console.log('❌ Member account not active:', tokenData.status)
      
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'Account not active' }, { status: 403 })
      }
      
      return NextResponse.redirect(new URL('/member/inactive', request.url))
    }
  }

  console.log('✅ Valid access granted for:', pathname, 'User role:', userRole)

  // Create response and add user context headers for API routes
  const response = NextResponse.next()
  
  if (pathname.startsWith('/api/')) {
    response.headers.set('x-user-id', tokenData.id?.toString() || '')
    response.headers.set('x-user-role', userRole || '')
    response.headers.set('x-user-email', tokenData.email || '')
    response.headers.set('x-user-status', tokenData.status || '')
    
    if (tokenData.organization_id) {
      response.headers.set('x-user-org-id', tokenData.organization_id.toString())
    }
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}