// app/member/pending-dashboard/page.tsx
"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Clock,
  AlertTriangle,
  User,
  Building,
  Mail,
  Phone,
  Shield,
  LogOut,
  Eye,
  EyeOff,
  CheckCircle,
  XCircle,
  Calendar,
  FileText,
  Users,
  Lock,
} from "lucide-react"
import Link from "next/link"

interface PendingMember {
  id: string
  membershipId: string
  firstName: string
  lastName: string
  email: string
  phone: string
  organizationName: string
  status: string
  submittedAt: string
}

export default function MemberPendingDashboard() {
  const [memberData, setMemberData] = useState<PendingMember | null>(null)
  const [loading, setLoading] = useState(true)
  const [showContactInfo, setShowContactInfo] = useState(false)

  useEffect(() => {
    // In production, fetch from API using auth token
    const demoData = {
      id: "demo-pending-member",
      membershipId: "ENG24AB123456",
      firstName: "John",
      lastName: "Doe",
      email: "john.doe@example.com",
      phone: "+1-555-123-4567",
      organizationName: "Engineering Association",
      status: "pending",
      submittedAt: "2024-01-15T10:30:00Z"
    }
    
    setMemberData(demoData)
    setLoading(false)
  }, [])

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" })
      window.location.href = "/member/login"
    } catch (err) {
      window.location.href = "/member/login"
    }
  }

  const daysSinceApplication = memberData 
    ? Math.floor((Date.now() - new Date(memberData.submittedAt).getTime()) / (1000 * 60 * 60 * 24))
    : 0

  const estimatedProcessingTime = 7 // days
  const progressPercentage = Math.min((daysSinceApplication / estimatedProcessingTime) * 100, 90)

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading your application status...</p>
        </div>
      </div>
    )
  }

  if (!memberData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card>
          <CardContent className="p-6 text-center">
            <Shield className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <h2 className="text-lg font-semibold mb-2">Access Denied</h2>
            <p className="text-gray-600 mb-4">Please login to access your application status.</p>
            <Link href="/member/login">
              <Button>Go to Login</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-amber-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center">
                  <Clock className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-gray-900">Application Status</h1>
                  <p className="text-xs text-gray-500">Welcome, {memberData.firstName}</p>
                </div>
              </div>
              <Badge className="bg-amber-100 text-amber-800">Pending Review</Badge>
            </div>
            <div className="flex items-center space-x-4">
              <Avatar className="w-8 h-8">
                <AvatarFallback className="bg-amber-100 text-amber-600">
                  {memberData.firstName[0]}{memberData.lastName[0]}
                </AvatarFallback>
              </Avatar>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Status Alert */}
        <Alert className="mb-6 border-amber-200 bg-amber-50">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800">
            <strong>Application Under Review:</strong> Your membership application is being processed by the organization admin. 
            You currently have limited access until approval.
          </AlertDescription>
        </Alert>

        {/* Application Progress */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="w-5 h-5 text-amber-600" />
              <span>Application Progress</span>
            </CardTitle>
            <CardDescription>Track the status of your membership application</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between text-sm">
                <span>Processing Progress</span>
                <span>{Math.round(progressPercentage)}% Complete</span>
              </div>
              <Progress value={progressPercentage} className="h-3" />
              <div className="flex justify-between text-xs text-gray-500">
                <span>Submitted {daysSinceApplication} days ago</span>
                <span>Est. {Math.max(0, estimatedProcessingTime - daysSinceApplication)} days remaining</span>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              <div className="flex items-center space-x-3">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <div>
                  <p className="font-medium">Application Submitted</p>
                  <p className="text-sm text-gray-600">
                    {new Date(memberData.submittedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <Clock className="w-5 h-5 text-amber-500" />
                <div>
                  <p className="font-medium">Admin Review</p>
                  <p className="text-sm text-gray-600">Your application is being reviewed by the organization admin</p>
                </div>
              </div>

              <div className="flex items-center space-x-3 opacity-50">
                <div className="w-5 h-5 border-2 border-gray-300 rounded-full" />
                <div>
                  <p className="font-medium">Approval Decision</p>
                  <p className="text-sm text-gray-600">You'll receive notification once a decision is made</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Member Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="w-5 h-5 text-blue-600" />
                <span>Your Information</span>
              </CardTitle>
              <CardDescription>Application details submitted for review</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-600">Full Name</p>
                <p className="text-lg">{memberData.firstName} {memberData.lastName}</p>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-600">Membership ID</p>
                <p className="text-lg font-mono">{memberData.membershipId}</p>
                <p className="text-xs text-gray-500 mt-1">This will be your login ID once approved</p>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-600">Organization</p>
                <div className="flex items-center gap-2 mt-1">
                  <Building className="w-4 h-4 text-gray-400" />
                  <span>{memberData.organizationName}</span>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-600">Contact Information</p>
                <div className="mt-2 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <span className="text-sm">{showContactInfo ? memberData.email : '••••••@••••••.com'}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowContactInfo(!showContactInfo)}
                    >
                      {showContactInfo ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <span className="text-sm">{showContactInfo ? memberData.phone : '••••••••••'}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Access Limitations */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Lock className="w-5 h-5 text-red-600" />
                <span>Current Access Level</span>
              </CardTitle>
              <CardDescription>Features available during review period</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-sm">View application status</span>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-sm">Update contact information</span>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <XCircle className="w-4 h-4 text-red-600" />
                    <span className="text-sm">Full member dashboard</span>
                  </div>
                  <Badge variant="secondary" className="text-xs">Locked</Badge>
                </div>

                <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <XCircle className="w-4 h-4 text-red-600" />
                    <span className="text-sm">Member directory access</span>
                  </div>
                  <Badge variant="secondary" className="text-xs">Locked</Badge>
                </div>

                <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <XCircle className="w-4 h-4 text-red-600" />
                    <span className="text-sm">Download certificates</span>
                  </div>
                  <Badge variant="secondary" className="text-xs">Locked</Badge>
                </div>
              </div>

              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Full access unlocked after approval!</strong><br />
                  You'll receive an email notification when your application is approved.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Help & Contact */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-purple-600" />
              <span>Need Help?</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium mb-2">Contact Organization Admin</h4>
                <p className="text-sm text-gray-600 mb-3">
                  For questions about your application status, contact the admin of {memberData.organizationName}.
                </p>
                <Button variant="outline" size="sm">
                  <Mail className="w-4 h-4 mr-2" />
                  Contact Admin
                </Button>
              </div>

              <div>
                <h4 className="font-medium mb-2">Application Guidelines</h4>
                <p className="text-sm text-gray-600 mb-3">
                  Review the membership requirements and application process.
                </p>
                <Button variant="outline" size="sm">
                  <FileText className="w-4 h-4 mr-2" />
                  View Guidelines
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Status Footer */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            Application submitted on {new Date(memberData.submittedAt).toLocaleDateString()} • 
            Status: <span className="font-medium text-amber-600">Under Review</span>
          </p>
        </div>
      </div>
    </div>
  )
}