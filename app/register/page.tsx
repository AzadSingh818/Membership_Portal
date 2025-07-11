"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import {
  User,
  Phone,
  Mail,
  Building,
  MapPin,
  Briefcase,
  Award,
  CreditCard,
  CheckCircle,
  AlertCircle,
  Clock,
  ArrowLeft,
  UserPlus,
  Key,
  Shield,
  Users,
} from "lucide-react"
import Link from "next/link"

interface Organization {
  id: number
  name: string
  description?: string
  contact_email?: string
  contact_phone?: string
}

interface MemberData {
  organizationId: string
  firstName: string
  lastName: string
  email: string
  phone: string
  address: string
  designation: string
  experience: string
  achievements: string
  paymentMethod: string
}

export default function MemberRegistrationPage() {
  const [memberData, setMemberData] = useState<MemberData>({
    organizationId: "",
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    designation: "",
    experience: "",
    achievements: "",
    paymentMethod: "",
  })

  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [registrationComplete, setRegistrationComplete] = useState(false)
  const [membershipId, setMembershipId] = useState("")
  const [temporaryPassword, setTemporaryPassword] = useState("")

  // Fetch organizations on component mount
  useEffect(() => {
    fetchOrganizations()
  }, [])

  const fetchOrganizations = async () => {
    try {
      const response = await fetch("/api/organizations")
      if (response.ok) {
        const data = await response.json()
        setOrganizations(data)
      }
    } catch (err) {
      console.error("Failed to fetch organizations:", err)
      setError("Failed to load organizations. Please refresh the page.")
    }
  }

  const handleInputChange = (field: keyof MemberData, value: string) => {
    setMemberData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (error) setError("")
  }

  const validateForm = () => {
    const requiredFields = ['organizationId', 'firstName', 'lastName', 'email', 'phone', 'address']
    
    for (const field of requiredFields) {
      if (!memberData[field as keyof MemberData]) {
        setError(`Please fill in all required fields`)
        return false
      }
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(memberData.email)) {
      setError("Please enter a valid email address")
      return false
    }

    // Validate phone format (more flexible)
    const phoneRegex = /^[+]?[\d\s\-()]{10,}$/
    if (!phoneRegex.test(memberData.phone.replace(/\s/g, ''))) {
      setError("Please enter a valid phone number (minimum 10 digits)")
      return false
    }

    return true
  }

  const generateMembershipId = (orgId: string, firstName: string, lastName: string) => {
    const orgCode = organizations.find(org => org.id.toString() === orgId)?.name
      .substring(0, 3).toUpperCase() || 'ORG'
    const nameCode = (firstName.substring(0, 2) + lastName.substring(0, 2)).toUpperCase()
    const timestamp = Date.now().toString().slice(-6)
    return `${orgCode}-${nameCode}-${timestamp}`
  }

  const generateTemporaryPassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    let password = ''
    for (let i = 0; i < 8; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return password
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")

    if (!validateForm()) {
      return
    }

    setIsLoading(true)

    try {
      // Generate membership ID and temporary password
      const generatedMembershipId = generateMembershipId(
        memberData.organizationId, 
        memberData.firstName, 
        memberData.lastName
      )
      const generatedPassword = generateTemporaryPassword()

      const response = await fetch("/api/member/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organization_id: parseInt(memberData.organizationId),
          first_name: memberData.firstName,
          last_name: memberData.lastName,
          email: memberData.email,
          phone: memberData.phone,
          address: memberData.address,
          designation: memberData.designation,
          experience: memberData.experience,
          achievements: memberData.achievements,
          payment_method: memberData.paymentMethod,
          membership_id: generatedMembershipId,
          temporary_password: generatedPassword,
          status: 'pending' // Member starts as pending, needs admin approval
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setMembershipId(data.membershipId || generatedMembershipId)
        setTemporaryPassword(data.temporaryPassword || generatedPassword)
        setRegistrationComplete(true)
        setSuccess("Membership application submitted successfully!")
      } else {
        setError(data.error || "Registration failed. Please try again.")
      }
    } catch (error) {
      console.error("Registration error:", error)
      setError("Registration failed. Please check your connection and try again.")
    }

    setIsLoading(false)
  }

  if (registrationComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 to-indigo-900 flex items-center justify-center py-8">
        <div className="max-w-3xl mx-auto px-4">
          <Card className="bg-white/95 backdrop-blur">
            <CardContent className="p-8">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Registration Successful!</h2>
                <p className="text-gray-600">Your membership application has been submitted</p>
              </div>

              {/* Login Credentials Card */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
                <div className="flex items-center mb-3">
                  <Key className="w-5 h-5 text-blue-600 mr-2" />
                  <h3 className="text-lg font-semibold text-blue-900">Your Login Credentials</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-blue-800">Membership ID</Label>
                    <div className="bg-white border border-blue-300 rounded px-3 py-2 font-mono text-sm">
                      {membershipId}
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-blue-800">Temporary Password</Label>
                    <div className="bg-white border border-blue-300 rounded px-3 py-2 font-mono text-sm">
                      {temporaryPassword}
                    </div>
                  </div>
                </div>
                <div className="mt-4 p-3 bg-blue-100 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <Shield className="w-4 h-4 text-blue-600 mt-0.5" />
                    <div className="text-sm text-blue-800">
                      <p className="font-medium">Important Security Information:</p>
                      <ul className="mt-1 space-y-1 text-xs">
                        <li>• Save these credentials securely</li>
                        <li>• You can login now, but access is limited until approved</li>
                        <li>• Change your password after first login</li>
                        <li>• Contact your organization if you lose these credentials</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* Application Details */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-gray-900 mb-3">Application Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Organization:</p>
                    <p className="font-medium">{organizations.find(org => org.id.toString() === memberData.organizationId)?.name}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Applicant:</p>
                    <p className="font-medium">{memberData.firstName} {memberData.lastName}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Status:</p>
                    <Badge className="bg-yellow-100 text-yellow-800">Pending Admin Approval</Badge>
                  </div>
                  <div>
                    <p className="text-gray-600">Submitted:</p>
                    <p className="font-medium">{new Date().toLocaleDateString()}</p>
                  </div>
                </div>
              </div>

              {/* Next Steps */}
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
                <div className="flex items-start space-x-2">
                  <Users className="w-5 h-5 text-amber-600 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-amber-800 mb-2">What Happens Next?</p>
                    <div className="space-y-2 text-amber-700">
                      <div className="flex items-center space-x-2">
                        <div className="w-6 h-6 bg-amber-200 rounded-full flex items-center justify-center text-xs font-bold">1</div>
                        <span>Your application is sent to the organization's admin</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-6 h-6 bg-amber-200 rounded-full flex items-center justify-center text-xs font-bold">2</div>
                        <span>Admin reviews your application and profile</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-6 h-6 bg-amber-200 rounded-full flex items-center justify-center text-xs font-bold">3</div>
                        <span>Once approved, you get full access to member dashboard</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-6 h-6 bg-amber-200 rounded-full flex items-center justify-center text-xs font-bold">4</div>
                        <span>You'll receive email notification of approval status</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row justify-center space-y-3 sm:space-y-0 sm:space-x-4">
                <Link href="/member/login">
                  <Button className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700">
                    <User className="w-4 h-4 mr-2" />
                    Login to Member Portal
                  </Button>
                </Link>
                <Link href="/">
                  <Button variant="outline" className="w-full sm:w-auto">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Home
                  </Button>
                </Link>
              </div>

              {/* Contact Information */}
              <div className="mt-6 pt-6 border-t border-gray-200 text-center">
                <p className="text-sm text-gray-600">
                  Questions about your application? 
                  <br />
                  Contact your organization directly or email us at support@example.com
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 to-indigo-900 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mb-4">
            <UserPlus className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Membership Registration</h1>
          <p className="text-blue-200">Join an organization as a member</p>
        </div>

        <Card className="bg-white/95 backdrop-blur">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <User className="w-5 h-5 text-blue-600" />
              <span>Membership Application Form</span>
            </CardTitle>
            <CardDescription>
              Please fill out all required information to apply for membership
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Organization Selection */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <Label htmlFor="organization" className="text-base font-medium">
                  <Building className="w-4 h-4 inline mr-2" />
                  Select Organization *
                </Label>
                <Select
                  value={memberData.organizationId}
                  onValueChange={(value) => handleInputChange('organizationId', value)}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Choose the organization you want to join" />
                  </SelectTrigger>
                  <SelectContent>
                    {organizations.map((org) => (
                      <SelectItem key={org.id} value={org.id.toString()}>
                        <div className="py-1">
                          <div className="font-medium">{org.name}</div>
                          {org.description && (
                            <div className="text-xs text-gray-500 mt-1">{org.description}</div>
                          )}
                          {org.contact_email && (
                            <div className="text-xs text-gray-500">📧 {org.contact_email}</div>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-600 mt-1">
                  Select the organization where you want to apply for membership
                </p>
              </div>

              {/* Personal Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="firstName">
                    <User className="w-4 h-4 inline mr-2" />
                    First Name *
                  </Label>
                  <Input
                    id="firstName"
                    value={memberData.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    placeholder="Enter your first name"
                    className="mt-1"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="lastName">
                    <User className="w-4 h-4 inline mr-2" />
                    Last Name *
                  </Label>
                  <Input
                    id="lastName"
                    value={memberData.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    placeholder="Enter your last name"
                    className="mt-1"
                    required
                  />
                </div>
              </div>

              {/* Contact Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="email">
                    <Mail className="w-4 h-4 inline mr-2" />
                    Email Address *
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={memberData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="your.email@example.com"
                    className="mt-1"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="phone">
                    <Phone className="w-4 h-4 inline mr-2" />
                    Phone Number *
                  </Label>
                  <Input
                    id="phone"
                    value={memberData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="+1-555-123-4567"
                    className="mt-1"
                    required
                  />
                </div>
              </div>

              {/* Address */}
              <div>
                <Label htmlFor="address">
                  <MapPin className="w-4 h-4 inline mr-2" />
                  Full Address *
                </Label>
                <Textarea
                  id="address"
                  value={memberData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  placeholder="Enter your complete address"
                  rows={3}
                  className="mt-1"
                  required
                />
              </div>

              {/* Professional Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="designation">
                    <Briefcase className="w-4 h-4 inline mr-2" />
                    Current Designation
                  </Label>
                  <Input
                    id="designation"
                    value={memberData.designation}
                    onChange={(e) => handleInputChange('designation', e.target.value)}
                    placeholder="Your job title or position"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="experience">
                    <Award className="w-4 h-4 inline mr-2" />
                    Years of Experience
                  </Label>
                  <Select
                    value={memberData.experience}
                    onValueChange={(value) => handleInputChange('experience', value)}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select experience level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0-2">0-2 years</SelectItem>
                      <SelectItem value="3-5">3-5 years</SelectItem>
                      <SelectItem value="6-10">6-10 years</SelectItem>
                      <SelectItem value="11-15">11-15 years</SelectItem>
                      <SelectItem value="16-20">16-20 years</SelectItem>
                      <SelectItem value="20+">20+ years</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Achievements */}
              <div>
                <Label htmlFor="achievements">
                  <Award className="w-4 h-4 inline mr-2" />
                  Achievements & Qualifications
                </Label>
                <Textarea
                  id="achievements"
                  value={memberData.achievements}
                  onChange={(e) => handleInputChange('achievements', e.target.value)}
                  placeholder="List your relevant achievements, qualifications, certifications, or awards"
                  rows={4}
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Optional: Include any relevant professional achievements, qualifications, or certifications
                </p>
              </div>

              {/* Payment Method */}
              <div>
                <Label htmlFor="paymentMethod">
                  <CreditCard className="w-4 h-4 inline mr-2" />
                  Preferred Payment Method
                </Label>
                <Select
                  value={memberData.paymentMethod}
                  onValueChange={(value) => handleInputChange('paymentMethod', value)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select payment method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                    <SelectItem value="credit_card">Credit Card</SelectItem>
                    <SelectItem value="debit_card">Debit Card</SelectItem>
                    <SelectItem value="cash">Cash Payment</SelectItem>
                    <SelectItem value="check">Check</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500 mt-1">
                  Payment will be processed after membership approval
                </p>
              </div>

              {/* Alerts */}
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {success && (
                <Alert className="border-green-200 bg-green-50">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">{success}</AlertDescription>
                </Alert>
              )}

              {/* Submit Button */}
              <div className="flex justify-between items-center pt-6">
                <Link href="/">
                  <Button type="button" variant="outline">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Login
                  </Button>
                </Link>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isLoading ? "Submitting Application..." : "Submit Membership Application"}
                  <UserPlus className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Information Card */}
        <Card className="mt-6 bg-indigo-50 border-indigo-200">
          <CardContent className="p-4">
            <div className="flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 text-indigo-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-indigo-800">Membership Process</p>
                <ul className="text-indigo-700 mt-1 space-y-1">
                  <li>• You'll receive login credentials immediately after registration</li>
                  <li>• Your application will be reviewed by the organization's admin</li>
                  <li>• You can login but access is limited until approval</li>
                  <li>• Approval typically takes 3-5 business days</li>
                  <li>• You'll receive email notification once approved</li>
                  <li>• Contact the organization directly for urgent matters</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}