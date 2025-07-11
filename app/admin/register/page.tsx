"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import {
  Eye,
  EyeOff,
  Shield,
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  User,
  Phone,
  Mail,
  Lock,
  Smartphone,
  UserCheck,
  AlertCircle,
  Building,
  Clock,
  Badge,
} from "lucide-react"
import Link from "next/link"

interface AdminData {
  name: string
  phone: string
  email: string
  username: string
  password: string
  confirmPassword: string
  experience: string
  level: string
  appointerName: string
  organizationId: string
}

interface Organization {
  id: number
  name: string
  description?: string
}

export default function AdminRegisterPage() {
  const [currentStep, setCurrentStep] = useState(1) // 1: Basic Info, 2: Credentials, 3: Verification
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [otp, setOtp] = useState("")
  const [verificationMethod, setVerificationMethod] = useState<"phone" | "email">("phone")
  const [isVerified, setIsVerified] = useState(false)
  const [otpSent, setOtpSent] = useState(false)
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [registrationComplete, setRegistrationComplete] = useState(false)

  const [adminData, setAdminData] = useState<AdminData>({
    name: "",
    phone: "",
    email: "",
    username: "",
    password: "",
    confirmPassword: "",
    experience: "",
    level: "admin", // Default to admin level
    appointerName: "",
    organizationId: "",
  })

  const progress = (currentStep / 3) * 100

  const passwordRequirements = [
    { text: "At least 8 characters", met: adminData.password.length >= 8 },
    { text: "Contains uppercase letter", met: /[A-Z]/.test(adminData.password) },
    { text: "Contains lowercase letter", met: /[a-z]/.test(adminData.password) },
    { text: "Contains number", met: /\d/.test(adminData.password) },
    { text: "Contains special character", met: /[!@#$%^&*(),.?":{}|<>]/.test(adminData.password) },
  ]

  const passwordStrength = passwordRequirements.filter((req) => req.met).length
  const strengthPercentage = (passwordStrength / passwordRequirements.length) * 100

  const getStrengthColor = () => {
    if (strengthPercentage < 40) return "bg-red-500"
    if (strengthPercentage < 80) return "bg-yellow-500"
    return "bg-green-500"
  }

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
    }
  }

  const handleNext = () => {
    setError("")
    setSuccess("")

    if (currentStep === 1) {
      // Validate basic info
      if (
        !adminData.name ||
        !adminData.phone ||
        !adminData.email ||
        !adminData.experience ||
        !adminData.level ||
        !adminData.appointerName ||
        !adminData.organizationId
      ) {
        setError("Please fill in all required fields")
        return
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(adminData.email)) {
        setError("Please enter a valid email address")
        return
      }

      // Validate phone format (international format)
      const phoneRegex = /^[+]?[\d\s-()]{10,}$/
      if (!phoneRegex.test(adminData.phone)) {
        setError("Please enter a valid phone number (include country code, e.g., +1-555-123-4567)")
        return
      }
    }

    if (currentStep === 2) {
      // Validate credentials
      if (!adminData.username || !adminData.password || !adminData.confirmPassword) {
        setError("Please fill in all credential fields")
        return
      }

      if (adminData.password !== adminData.confirmPassword) {
        setError("Passwords do not match")
        return
      }

      if (passwordStrength < 5) {
        setError("Password does not meet all requirements")
        return
      }
    }

    setCurrentStep(currentStep + 1)
  }

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
      setError("")
      setSuccess("")
    }
  }

  const handleSendOTP = async () => {
    setIsLoading(true)
    setError("")
    setSuccess("")

    try {
      const response = await fetch("/api/auth/admin/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          step: "send-otp",
          phone: adminData.phone,
          email: adminData.email,
          verificationType: verificationMethod,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(data.message)
        setOtpSent(true)
        if (verificationMethod === "phone") {
          setSuccess(`OTP sent to ${data.maskedContact || adminData.phone}. Check your SMS messages.`)
        } else {
          setSuccess(`OTP sent to ${data.maskedContact || adminData.email}. Check your email inbox.`)
        }
      } else {
        setError(data.error || "Failed to send OTP")
      }
    } catch (error) {
      setError("Failed to send OTP. Please check your internet connection and try again.")
    }

    setIsLoading(false)
  }

  const handleVerifyOTP = async () => {
    setIsLoading(true)
    setError("")
    setSuccess("")

    try {
      const response = await fetch("/api/auth/admin/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          step: "verify-otp",
          phone: adminData.phone,
          email: adminData.email,
          otp: otp,
          verificationType: verificationMethod,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setIsVerified(true)
        setSuccess("Contact verified successfully!")
      } else {
        setError(data.error || "Invalid OTP. Please try again.")
      }
    } catch (error) {
      setError("Failed to verify OTP. Please try again.")
    }

    setIsLoading(false)
  }

  const handleSubmit = async () => {
    if (!isVerified) {
      setError("Please verify your contact information first")
      return
    }

    setIsLoading(true)
    setError("")

    console.log('🔑 Frontend: Submitting admin registration with username:', adminData.username);

    try {
      const response = await fetch("/api/auth/admin/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          step: "complete-registration",
          username: adminData.username, // ✅ ENSURE: Username is sent
          email: adminData.email,
          phone: adminData.phone,
          firstName: adminData.name.split(" ")[0],
          lastName: adminData.name.split(" ").slice(1).join(" ") || adminData.name.split(" ")[0],
          password: adminData.password,
          role: adminData.level,
          organization: adminData.organizationId,
          experience: adminData.experience,
          appointer: adminData.appointerName,
          verificationType: verificationMethod,
          verifiedContact: verificationMethod === "email" ? adminData.email : adminData.phone,
          hasOTP: true,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setRegistrationComplete(true)
        setSuccess("Admin registration submitted successfully! Your application is pending approval from the Superadmin.")
        console.log('✅ Frontend: Registration successful with username:', data.data?.username);
      } else {
        setError(data.error || "Registration failed. Please try again.")
        console.error('❌ Frontend: Registration failed:', data.error);
      }
    } catch (error) {
      setError("Registration failed. Please check your connection and try again.")
      console.error('❌ Frontend: Network error:', error);
    }

    setIsLoading(false)
  }

  const maskContact = (contact: string, type: "phone" | "email") => {
    if (type === "phone") {
      return contact.replace(/(\+?\d{1,3})\d+(\d{4})/, "$1****$2")
    } else {
      const [username, domain] = contact.split("@")
      return `${username.slice(0, 2)}***@${domain}`
    }
  }

  if (registrationComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-700 flex items-center justify-center py-8">
        <div className="max-w-2xl mx-auto px-4">
          <Card className="bg-white/95 backdrop-blur">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Application Submitted!</h2>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <p className="text-blue-800 font-medium mb-2">Your admin registration is pending approval</p>
                <p className="text-blue-700 text-sm">
                  A Superadmin will review your application. You'll receive a notification once approved. 
                  You cannot login until your account is approved.
                </p>
              </div>
              <div className="space-y-2 text-sm text-gray-600 mb-6">
                <p><strong>Application ID:</strong> ADM-{Date.now()}</p>
                <p><strong>Organization:</strong> {organizations.find(org => org.id.toString() === adminData.organizationId)?.name}</p>
                <p><strong>Username:</strong> {adminData.username}</p>
                <p><strong>Status:</strong> <Badge className="bg-yellow-100 text-yellow-800">Pending Approval</Badge></p>
              </div>
              <div className="flex justify-center space-x-4">
                <Link href="/admin/login">
                  <Button variant="outline">Go to Login</Button>
                </Link>
                <Link href="/">
                  <Button>Back to Home</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-700 py-8">
      <div className="max-w-2xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-red-600 rounded-full flex items-center justify-center mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Administrator Registration</h1>
          <p className="text-slate-300">Create a new administrator account</p>
        </div>

        {/* Progress */}
        <div className="mb-8">
          <div className="flex justify-between text-sm text-slate-300 mb-2">
            <span>Step {currentStep} of 3</span>
            <span>{Math.round(progress)}% Complete</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        <Card className="bg-white/95 backdrop-blur">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              {currentStep === 1 && <Building className="w-5 h-5 text-red-600" />}
              {currentStep === 2 && <Lock className="w-5 h-5 text-red-600" />}
              {currentStep === 3 && <Smartphone className="w-5 h-5 text-red-600" />}
              <span>
                {currentStep === 1 && "Organization & Personal Information"}
                {currentStep === 2 && "Account Credentials"}
                {currentStep === 3 && "Contact Verification"}
              </span>
            </CardTitle>
            <CardDescription>
              {currentStep === 1 && "Select your organization and provide personal details"}
              {currentStep === 2 && "Create secure login credentials"}
              {currentStep === 3 && "Verify your contact information"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Step 1: Organization & Personal Info */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="organization">Organization *</Label>
                  <Select
                    value={adminData.organizationId}
                    onValueChange={(value) => setAdminData({ ...adminData, organizationId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select your organization" />
                    </SelectTrigger>
                    <SelectContent>
                      {organizations.map((org) => (
                        <SelectItem key={org.id} value={org.id.toString()}>
                          <div>
                            <div className="font-medium">{org.name}</div>
                            {org.description && (
                              <div className="text-xs text-gray-500 truncate">{org.description}</div>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500 mt-1">
                    Select the organization you will be administering
                  </p>
                </div>

                <div>
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    value={adminData.name}
                    onChange={(e) => setAdminData({ ...adminData, name: e.target.value })}
                    placeholder="Enter your full name"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input
                      id="phone"
                      value={adminData.phone}
                      onChange={(e) => setAdminData({ ...adminData, phone: e.target.value })}
                      placeholder="+1-555-123-4567"
                    />
                    <p className="text-xs text-gray-500 mt-1">Include country code for SMS verification</p>
                  </div>
                  <div>
                    <Label htmlFor="email">Email Address *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={adminData.email}
                      onChange={(e) => setAdminData({ ...adminData, email: e.target.value })}
                      placeholder="admin@example.com"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="experience">Years of Experience *</Label>
                    <Select
                      value={adminData.experience}
                      onValueChange={(value) => setAdminData({ ...adminData, experience: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select experience" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0-2">0-2 years</SelectItem>
                        <SelectItem value="3-5">3-5 years</SelectItem>
                        <SelectItem value="6-10">6-10 years</SelectItem>
                        <SelectItem value="11-15">11-15 years</SelectItem>
                        <SelectItem value="16+">16+ years</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="level">Administrative Level *</Label>
                    <Select
                      value={adminData.level}
                      onValueChange={(value) => setAdminData({ ...adminData, level: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Administrator</SelectItem>
                        {/* <SelectItem value="senior_admin">Senior Administrator</SelectItem> */}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="appointer">Appointer Name *</Label>
                  <Input
                    id="appointer"
                    value={adminData.appointerName}
                    onChange={(e) => setAdminData({ ...adminData, appointerName: e.target.value })}
                    placeholder="Name of the person who appointed you"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Enter the name of the senior administrator or authority who appointed you
                  </p>
                </div>
              </div>
            )}

            {/* Step 2: Account Credentials */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="username">Username *</Label>
                  <Input
                    id="username"
                    value={adminData.username}
                    onChange={(e) => setAdminData({ ...adminData, username: e.target.value.toLowerCase() })}
                    placeholder="Choose a unique username"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Username will be converted to lowercase and must be unique
                  </p>
                </div>

                <div>
                  <Label htmlFor="password">Password *</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={adminData.password}
                      onChange={(e) => setAdminData({ ...adminData, password: e.target.value })}
                      placeholder="Create a strong password"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>

                  {/* Password Strength Indicator */}
                  {adminData.password && (
                    <div className="space-y-2 mt-2">
                      <div className="flex justify-between text-sm">
                        <span>Password Strength</span>
                        <span
                          className={`font-medium ${
                            strengthPercentage < 40
                              ? "text-red-600"
                              : strengthPercentage < 80
                                ? "text-yellow-600"
                                : "text-green-600"
                          }`}
                        >
                          {strengthPercentage < 40 ? "Weak" : strengthPercentage < 80 ? "Medium" : "Strong"}
                        </span>
                      </div>
                      <Progress value={strengthPercentage} className={`h-2 ${getStrengthColor()}`} />
                    </div>
                  )}
                </div>

                <div>
                  <Label htmlFor="confirmPassword">Confirm Password *</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      value={adminData.confirmPassword}
                      onChange={(e) => setAdminData({ ...adminData, confirmPassword: e.target.value })}
                      placeholder="Confirm your password"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                {/* Password Requirements */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Password Requirements</Label>
                  <div className="space-y-1">
                    {passwordRequirements.map((requirement, index) => (
                      <div key={index} className="flex items-center space-x-2 text-sm">
                        {requirement.met ? (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        ) : (
                          <div className="w-4 h-4 rounded-full border-2 border-gray-300" />
                        )}
                        <span className={requirement.met ? "text-green-700" : "text-gray-600"}>{requirement.text}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Contact Verification */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">Verification Required</h4>
                  <p className="text-sm text-blue-800">
                    To complete your registration, please verify your contact information by receiving an OTP.
                  </p>
                </div>

                <div>
                  <Label>Choose Verification Method</Label>
                  <div className="grid grid-cols-2 gap-3 mt-2">
                    <div
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        verificationMethod === "phone"
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                      onClick={() => {
                        setVerificationMethod("phone")
                        setOtpSent(false)
                        setIsVerified(false)
                        setOtp("")
                        setError("")
                        setSuccess("")
                      }}
                    >
                      <div className="flex items-center space-x-2">
                        <Phone className="w-4 h-4 text-blue-600" />
                        <div>
                          <p className="text-sm font-medium">Phone SMS</p>
                          <p className="text-xs text-gray-600">{maskContact(adminData.phone, "phone")}</p>
                        </div>
                      </div>
                    </div>
                    <div
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        verificationMethod === "email"
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                      onClick={() => {
                        setVerificationMethod("email")
                        setOtpSent(false)
                        setIsVerified(false)
                        setOtp("")
                        setError("")
                        setSuccess("")
                      }}
                    >
                      <div className="flex items-center space-x-2">
                        <Mail className="w-4 h-4 text-blue-600" />
                        <div>
                          <p className="text-sm font-medium">Email</p>
                          <p className="text-xs text-gray-600">{maskContact(adminData.email, "email")}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {!isVerified ? (
                  <div className="space-y-4">
                    <Button onClick={handleSendOTP} disabled={isLoading} className="w-full">
                      {isLoading
                        ? "Sending OTP..."
                        : `Send OTP via ${verificationMethod === "phone" ? "SMS" : "Email"}`}
                    </Button>

                    {otpSent && (
                      <div>
                        <Label htmlFor="otp">Enter 6-Digit OTP</Label>
                        <div className="flex space-x-2">
                          <Input
                            id="otp"
                            type="text"
                            placeholder="000000"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                            maxLength={6}
                            className="text-center text-lg tracking-widest font-mono"
                          />
                          <Button onClick={handleVerifyOTP} disabled={isLoading || otp.length !== 6}>
                            {isLoading ? "Verifying..." : "Verify"}
                          </Button>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {verificationMethod === "phone"
                            ? "Check your SMS messages for the verification code"
                            : "Check your email inbox for the verification code"}
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="flex items-center space-x-2 text-green-800">
                      <CheckCircle className="w-5 h-5" />
                      <span className="font-medium">Contact Verified Successfully!</span>
                    </div>
                    <p className="text-sm text-green-700 mt-1">
                      Your {verificationMethod === "phone" ? "phone number" : "email address"} has been verified.
                    </p>
                  </div>
                )}

                {/* Registration Summary */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Registration Summary</h4>
                  <div className="text-sm space-y-1">
                    <p>
                      <strong>Organization:</strong> {organizations.find(org => org.id.toString() === adminData.organizationId)?.name || 'Not selected'}
                    </p>
                    <p>
                      <strong>Name:</strong> {adminData.name}
                    </p>
                    <p>
                      <strong>Email:</strong> {adminData.email}
                    </p>
                    <p>
                      <strong>Phone:</strong> {adminData.phone}
                    </p>
                    <p>
                      <strong>Username:</strong> {adminData.username}
                    </p>
                    <p>
                      <strong>Experience:</strong> {adminData.experience}
                    </p>
                    <p>
                      <strong>Level:</strong> {adminData.level}
                    </p>
                    <p>
                      <strong>Appointer:</strong> {adminData.appointerName}
                    </p>
                  </div>
                </div>
              </div>
            )}

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

            {/* Navigation */}
            <div className="flex justify-between pt-6">
              <div>
                {currentStep > 1 ? (
                  <Button variant="outline" onClick={handlePrev}>
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Previous
                  </Button>
                ) : (
                  <Link href="/admin/login">
                    <Button variant="outline">
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back to Login
                    </Button>
                  </Link>
                )}
              </div>
              <div>
                {currentStep < 3 ? (
                  <Button onClick={handleNext}>
                    Next
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                ) : (
                  <Button
                    onClick={handleSubmit}
                    disabled={!isVerified || isLoading}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {isLoading ? "Submitting Application..." : "Submit for Approval"}
                    <UserCheck className="w-4 h-4 ml-2" />
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card className="mt-6 bg-amber-50 border-amber-200">
          <CardContent className="p-4">
            <div className="flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-amber-800">Important Notice</p>
                <p className="text-amber-700">
                  Your admin registration will be pending approval by a Superadmin. You will not be able to login 
                  until your account is approved. You'll receive a notification once the review is complete.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}