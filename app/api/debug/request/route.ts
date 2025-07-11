// app/api/debug/request/route.ts - Create this file for debugging
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const headers = Object.fromEntries(request.headers.entries())
    
    console.log('🔍 DEBUG: Request received')
    console.log('📄 Body:', JSON.stringify(body, null, 2))
    console.log('📋 Headers:', headers)

    // Analyze the request structure
    const analysis = {
      bodyType: typeof body,
      bodyKeys: Object.keys(body || {}),
      hasStep: 'step' in body,
      stepValue: body.step,
      isOTPRequest: body.step === 'send-otp',
      isRegistrationRequest: !body.step && body.username && body.email && body.password,
      missingFields: [] as string[],
      recommendations: [] as string[]
    }

    // Check for required registration fields
    const requiredFields = ['username', 'email', 'password', 'firstName', 'lastName']
    const optionalFields = ['phone', 'organizationId', 'role', 'experience', 'appointerName']
    
    requiredFields.forEach(field => {
      if (!(field in body)) {
        // Check alternative field names
        if (field === 'firstName' && !body.firstName && !body.first_name && !body.name) {
          analysis.missingFields.push(field)
        } else if (field === 'lastName' && !body.lastName && !body.last_name && !body.name) {
          analysis.missingFields.push(field)
        } else if (!body[field]) {
          analysis.missingFields.push(field)
        }
      }
    })

    // Generate recommendations
    if (analysis.isOTPRequest) {
      analysis.recommendations.push('This appears to be an OTP request. Use /api/auth/admin/send-otp endpoint instead.')
      analysis.recommendations.push('Make sure your frontend sends complete registration data to /api/auth/admin/register')
    }

    if (analysis.missingFields.length > 0) {
      analysis.recommendations.push(`Missing required fields: ${analysis.missingFields.join(', ')}`)
    }

    if (!analysis.isRegistrationRequest && !analysis.isOTPRequest) {
      analysis.recommendations.push('Request format not recognized. Check your frontend form submission logic.')
    }

    // Provide expected format
    const expectedFormat = {
      username: 'string (required)',
      email: 'string (required)', 
      password: 'string (required)',
      firstName: 'string (required) OR use "name" field',
      lastName: 'string (required) OR use "name" field',
      phone: 'string (optional)',
      organizationId: 'number (optional)',
      role: 'string (optional, defaults to "admin")',
      experience: 'string (optional)',
      appointerName: 'string (optional)'
    }

    return NextResponse.json({
      success: true,
      message: 'Request debug information',
      receivedData: body,
      analysis,
      expectedFormat,
      recommendations: analysis.recommendations,
      exampleCorrectRequest: {
        username: 'nawab1996',
        email: 'azadintern24@gmail.com',
        password: 'your_password_here',
        firstName: 'azad',
        lastName: 'singh',
        phone: '+918533843521',
        organizationId: 1,
        role: 'senior_admin',
        experience: '3-5',
        appointerName: 'vasd'
      }
    })

  } catch (error) {
    console.error('❌ Debug endpoint error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to parse request',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 400 })
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Debug endpoint for analyzing registration requests',
    usage: 'Send POST request with your registration data to analyze the format',
    endpoints: {
      'POST /api/debug/request': 'Analyze request format',
      'GET /api/debug/database': 'Check database health',
      'POST /api/auth/admin/register': 'Actual registration endpoint',
      'POST /api/auth/admin/send-otp': 'Send OTP for verification',
      'POST /api/auth/admin/verify-otp': 'Verify OTP code'
    }
  })
}