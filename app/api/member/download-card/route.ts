// app/api/member/download-card/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@vercel/postgres'
import jwt from 'jsonwebtoken'

// Helper function to verify JWT token and get member data
async function verifyMemberToken(request: NextRequest) {
  try {
    // Get token from cookie or Authorization header
    const authCookie = request.cookies.get('auth-token')
    const authHeader = request.headers.get('authorization')
    
    let token = authCookie?.value
    if (!token && authHeader?.startsWith('Bearer ')) {
      token = authHeader.substring(7)
    }

    if (!token) {
      console.log('❌ No authentication token found')
      return { error: 'No authentication token', status: 401 }
    }

    // Verify JWT token
    const jwtSecret = process.env.JWT_SECRET
    if (!jwtSecret) {
      console.error('❌ JWT_SECRET not configured')
      return { error: 'Server configuration error', status: 500 }
    }

    const decoded = jwt.verify(token, jwtSecret) as any
    console.log('✅ Token verified for member:', decoded.membershipId || decoded.email)

    return { 
      membershipId: decoded.membershipId,
      email: decoded.email,
      memberId: decoded.id
    }
  } catch (error: any) {
    console.error('❌ Token verification failed:', error.message)
    return { error: 'Invalid or expired token', status: 401 }
  }
}

// Helper function to fetch member data for card generation
async function fetchMemberForCard(membershipId?: string, email?: string, memberId?: number) {
  try {
    console.log('🔍 Fetching member data for card:', { membershipId, email, memberId })

    let member = null

    // Strategy 1: Try member_applications table first
    if (membershipId) {
      try {
        const result = await sql`
          SELECT 
            ma.id,
            ma.first_name,
            ma.last_name,
            ma.email,
            ma.phone,
            ma.membership_id,
            ma.status,
            ma.designation,
            ma.created_at,
            ma.organization_id,
            o.name as organization_name,
            o.address as organization_address,
            o.contact_email as organization_email
          FROM member_applications ma
          LEFT JOIN organizations o ON ma.organization_id = o.id
          WHERE ma.membership_id = ${membershipId}
          AND ma.status IN ('approved', 'active')
          ORDER BY ma.created_at DESC
          LIMIT 1
        `

        if (result.rows.length > 0) {
          member = result.rows[0]
          console.log('✅ Member found for card generation:', member.membership_id)
        }
      } catch (error: any) {
        console.log('❌ member_applications query failed:', error.message)
      }
    }

    // Strategy 2: Try members table
    if (!member && membershipId) {
      try {
        const result = await sql`
          SELECT 
            m.*,
            o.name as organization_name,
            o.address as organization_address,
            o.contact_email as organization_email
          FROM members m
          LEFT JOIN organizations o ON m.organization_id = o.id
          WHERE m.membership_id = ${membershipId}
          LIMIT 1
        `

        if (result.rows.length > 0) {
          member = result.rows[0]
          console.log('✅ Member found in members table for card')
        }
      } catch (error: any) {
        console.log('❌ members table query failed:', error.message)
      }
    }

    return member
  } catch (error: any) {
    console.error('❌ Error fetching member for card:', error)
    throw error
  }
}

// Helper function to generate membership card HTML
function generateMembershipCardHTML(member: any): string {
  const currentDate = new Date().toLocaleDateString()
  const joinDate = new Date(member.created_at || member.join_date || '').toLocaleDateString()
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Membership Card - ${member.first_name} ${member.last_name}</title>
        <style>
            body {
                font-family: 'Arial', sans-serif;
                margin: 0;
                padding: 20px;
                background-color: #f5f5f5;
            }
            .card-container {
                width: 400px;
                height: 250px;
                margin: 0 auto;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                border-radius: 15px;
                padding: 20px;
                box-shadow: 0 10px 25px rgba(0,0,0,0.2);
                color: white;
                position: relative;
                overflow: hidden;
            }
            .card-bg {
                position: absolute;
                top: -50%;
                right: -50%;
                width: 200%;
                height: 200%;
                background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
            }
            .card-header {
                text-align: center;
                margin-bottom: 15px;
                position: relative;
                z-index: 2;
            }
            .org-name {
                font-size: 16px;
                font-weight: bold;
                margin: 0;
                text-transform: uppercase;
                letter-spacing: 1px;
            }
            .card-title {
                font-size: 12px;
                margin: 5px 0;
                opacity: 0.9;
            }
            .member-info {
                position: relative;
                z-index: 2;
            }
            .member-name {
                font-size: 20px;
                font-weight: bold;
                margin: 10px 0;
                text-align: center;
            }
            .member-details {
                display: flex;
                justify-content: space-between;
                margin-top: 15px;
            }
            .detail-group {
                flex: 1;
            }
            .detail-label {
                font-size: 10px;
                opacity: 0.8;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }
            .detail-value {
                font-size: 12px;
                font-weight: bold;
                margin-top: 2px;
            }
            .membership-id {
                text-align: center;
                margin-top: 15px;
                font-family: 'Courier New', monospace;
                font-size: 14px;
                background: rgba(255,255,255,0.2);
                padding: 5px 10px;
                border-radius: 5px;
                display: inline-block;
            }
            .card-footer {
                position: absolute;
                bottom: 10px;
                right: 15px;
                font-size: 8px;
                opacity: 0.7;
            }
            @media print {
                body { background-color: white; padding: 0; }
                .card-container { box-shadow: none; margin: 0; }
            }
        </style>
    </head>
    <body>
        <div class="card-container">
            <div class="card-bg"></div>
            
            <div class="card-header">
                <h1 class="org-name">${member.organization_name || 'Organization'}</h1>
                <p class="card-title">MEMBER IDENTIFICATION CARD</p>
            </div>
            
            <div class="member-info">
                <div class="member-name">
                    ${member.first_name} ${member.last_name}
                </div>
                
                <div class="member-details">
                    <div class="detail-group">
                        <div class="detail-label">Status</div>
                        <div class="detail-value">${member.status === 'approved' ? 'ACTIVE' : member.status.toUpperCase()}</div>
                    </div>
                    <div class="detail-group">
                        <div class="detail-label">Member Since</div>
                        <div class="detail-value">${joinDate}</div>
                    </div>
                    <div class="detail-group">
                        <div class="detail-label">Designation</div>
                        <div class="detail-value">${member.designation || 'Member'}</div>
                    </div>
                </div>
                
                <div style="text-align: center; margin-top: 15px;">
                    <div class="detail-label">Membership ID</div>
                    <div class="membership-id">${member.membership_id}</div>
                </div>
            </div>
            
            <div class="card-footer">
                Generated: ${currentDate}
            </div>
        </div>
    </body>
    </html>
  `
}

// GET - Download membership card
export async function GET(request: NextRequest) {
  try {
    console.log('💳 GET /api/member/download-card - Generating membership card')

    // Verify authentication
    const authResult = await verifyMemberToken(request)
    if ('error' in authResult) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: authResult.status }
      )
    }

    // Fetch member data
    const member = await fetchMemberForCard(
      authResult.membershipId,
      authResult.email,
      authResult.memberId
    )

    if (!member) {
      return NextResponse.json(
        { success: false, error: 'Member not found or not approved' },
        { status: 404 }
      )
    }

    // Check if member is approved for card generation
    if (member.status !== 'approved' && member.status !== 'active') {
      return NextResponse.json(
        { success: false, error: 'Membership card is only available for approved members' },
        { status: 403 }
      )
    }

    // Generate membership card HTML
    const cardHTML = generateMembershipCardHTML(member)

    // For development/testing: return HTML directly
    // In production, you might want to convert to PDF using puppeteer or similar
    const isDevelopment = process.env.NODE_ENV === 'development'
    
    if (isDevelopment) {
      // Return HTML for browser viewing/printing
      return new NextResponse(cardHTML, {
        headers: {
          'Content-Type': 'text/html',
          'Content-Disposition': `inline; filename="membership-card-${member.membership_id}.html"`
        }
      })
    }

    // For production: You would typically generate a PDF here
    // Example with puppeteer (you'd need to install it):
    /*
    const puppeteer = require('puppeteer')
    const browser = await puppeteer.launch()
    const page = await browser.newPage()
    await page.setContent(cardHTML)
    await page.setViewport({ width: 400, height: 250 })
    const pdfBuffer = await page.pdf({
      width: '400px',
      height: '250px',
      printBackground: true
    })
    await browser.close()

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="membership-card-${member.membership_id}.pdf"`
      }
    })
    */

    // Temporary: Return HTML even in production
    return new NextResponse(cardHTML, {
      headers: {
        'Content-Type': 'text/html',
        'Content-Disposition': `attachment; filename="membership-card-${member.membership_id}.html"`
      }
    })

  } catch (error: any) {
    console.error('❌ Error in GET /api/member/download-card:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to generate membership card' },
      { status: 500 }
    )
  }
}