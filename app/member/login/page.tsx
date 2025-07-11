// app/member/login/page.tsx - Complete Member Login System
"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import {
  Eye, EyeOff, User, Lock, ArrowLeft, Shield, CheckCircle,
  AlertCircle, Smartphone, Clock, UserPlus
} from "lucide-react"
import Link from "next/link"

export default function MemberLoginPage() {
  const [currentStep, setCurrentStep] = useState(1) // 1: Credentials, 2: OTP Verification
  const [membershipId, setMembershipId] = useState("")
  const [password, setPassword] = useState("")
  const [otp, setOtp] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [memberData, setMemberData] = useState(null)
  const [maskedPhone, setMaskedPhone] = useState("")
  const [otpTimer, setOtpTimer] = useState(0)

  // Auto-clear error/success after 5 seconds
  useState(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError("")
        setSuccess("")
      }, 5000)
      return () => clearTimeout(timer)
    }
  })

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    setSuccess("")

    try {
      const response = await fetch("/api/member/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ membershipId, password }),
      })

      const data = await response.json()

      if (response.ok) {
        if (data.requiresOTP) {
          // Member needs OTP verification
          setMemberData(data.member)
          setMaskedPhone(data.maskedPhone)
          setSuccess(data.message)

          // Auto-send OTP
          await sendOTP()
          setCurrentStep(2)
        } else {
          // ✅ Always redirect to pending dashboard from blue page
          setSuccess(data.message)
          setTimeout(() => {
            window.location.href = '/member/pending-dashboard'
          }, 1500)
        }
      } else {
        setError(data.error || "Login failed. Please check your credentials.")
      }
    } catch (error) {
      console.error("Login error:", error)
      setError("Network error. Please check your connection and try again.")
    }

    setIsLoading(false)
  }

  const sendOTP = async () => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/member/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ membershipId }),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(data.message)
        setMaskedPhone(data.maskedPhone)

        // Start 5-minute countdown
        setOtpTimer(300) // 5 minutes in seconds
        const countdown = setInterval(() => {
          setOtpTimer(prev => {
            if (prev <= 1) {
              clearInterval(countdown)
              return 0
            }
            return prev - 1
          })
        }, 1000)
      } else {
        setError(data.error || "Failed to send OTP")
      }
    } catch (error) {
      setError("Failed to send OTP. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleOTPSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const response = await fetch("/api/member/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ membershipId, otp }),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(data.message)
        setTimeout(() => {
          window.location.href = data.redirectUrl || '/member/pending-dashboard'
        }, 2000)
      } else {
        setError(data.error || "Invalid OTP. Please try again.")
      }
    } catch (error) {
      setError("OTP verification failed. Please try again.")
    }

    setIsLoading(false)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handleResendOTP = () => {
    if (otpTimer === 0) {
      sendOTP()
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 to-indigo-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="mx-auto w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center">
            {currentStep === 1 ? (
              <User className="w-8 h-8 text-white" />
            ) : (
              <Smartphone className="w-8 h-8 text-white" />
            )}
          </div>
          <h1 className="text-2xl font-bold text-white">
            Check Status
          </h1>
          <p className="text-blue-200">
            Access your status dashboard
          </p>
        </div>

        {/* Progress Indicator */}
        {/* <div className="space-y-2">
          <div className="flex justify-between text-sm text-blue-200">
            <span>Step {currentStep} of 2</span>
            <span>{currentStep === 1 ? "Credentials" : "OTP Verification"}</span>
          </div>
          <Progress value={(currentStep / 2) * 100} className="h-2" />
        </div> */}

        {/* Login Forms */}
        <Card className="bg-white/95 backdrop-blur">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              {currentStep === 1 ? (
                <>
                  <Lock className="w-5 h-5 text-blue-600" />
                  <span>Enter Credentials</span>
                </>
              ) : (
                <>
                  <Smartphone className="w-5 h-5 text-blue-600" />
                  <span>Verify Your Phone</span>
                </>
              )}
            </CardTitle>
            <CardDescription>
              {currentStep === 1
                ? "Enter your membership ID and password to continue"
                : `We've sent a 6-digit code to ${maskedPhone}`
              }
            </CardDescription>
          </CardHeader>

          <CardContent>
            {currentStep === 1 ? (
              /* Step 1: Credentials */
              <form onSubmit={handleCredentialsSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="membershipId">Membership ID</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      id="membershipId"
                      type="text"
                      placeholder="e.g., ENG24AB123456"
                      value={membershipId}
                      onChange={(e) => setMembershipId(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                  <p className="text-xs text-gray-500">
                    This was provided when you registered for membership
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 pr-10"
                      required
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
                  <p className="text-xs text-gray-500">
                    Use the temporary password provided during registration
                  </p>
                </div>

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

                <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={isLoading}>
                  {isLoading ? "Verifying..." : "Continue"}
                </Button>
              </form>
            ) : (
              /* Step 2: OTP Verification */
              <form onSubmit={handleOTPSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="otp">Enter 6-Digit Code</Label>
                  <Input
                    id="otp"
                    type="text"
                    placeholder="000000"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    maxLength={6}
                    className="text-center text-lg tracking-widest font-mono"
                    required
                  />
                  <div className="flex justify-between items-center text-xs text-gray-500">
                    <span>Code sent to {maskedPhone}</span>
                    {otpTimer > 0 ? (
                      <span className="flex items-center">
                        <Clock className="w-3 h-3 mr-1" />
                        {formatTime(otpTimer)}
                      </span>
                    ) : (
                      <Button
                        type="button"
                        variant="link"
                        size="sm"
                        onClick={handleResendOTP}
                        className="h-auto p-0 text-blue-600"
                      >
                        Resend Code
                      </Button>
                    )}
                  </div>
                </div>

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

                <div className="flex space-x-3">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => setCurrentStep(1)}
                  >
                    Back
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                    disabled={isLoading || otp.length !== 6}
                  >
                    {isLoading ? "Verifying..." : "Verify & Login"}
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>

        {/* Demo Credentials Help */}
        {currentStep === 1 && (
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <div className="text-center space-y-2">
                <h3 className="font-medium text-blue-800">First Time Login?</h3>
                <p className="text-sm text-blue-700">
                  Use the Membership ID and temporary password provided in your registration confirmation email.
                </p>
                <div className="text-xs text-blue-600 mt-2">
                  <p><strong>Example ID:</strong> ENG24AB123456</p>
                  <p><strong>Password:</strong> As provided during registration</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Help Section */}
        <Card className="bg-amber-50 border-amber-200">
          <CardContent className="p-4">
            <div className="flex items-start space-x-2">
              <Shield className="w-4 h-4 text-amber-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-amber-800">Need Help?</p>
                <ul className="text-amber-700 mt-1 space-y-1 text-xs">
                  <li>• Membership ID is provided after registration</li>
                  <li>• For approved members, OTP is sent to registered phone</li>
                  <li>• Pending applications have limited dashboard access</li>
                  <li>• Contact your organization admin for account issues</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Navigation Links */}
        <div className="text-center space-y-2">
          <Link href="/member/register" className="text-blue-200 hover:text-white text-sm inline-flex items-center">
            <UserPlus className="w-4 h-4 mr-1" />
            Apply for Membership
          </Link>
          <br />
          <Link href="/admin/login" className="text-blue-200 hover:text-white text-sm inline-flex items-center">
            <Shield className="w-4 h-4 mr-1" />
            Admin Login
          </Link>
          <br />
          <Link href="/" className="text-blue-200 hover:text-white text-sm inline-flex items-center">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}