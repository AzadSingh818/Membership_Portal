"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Eye, EyeOff, Shield, ArrowLeft, Lock, User, Crown } from "lucide-react"
import Link from "next/link"

export default function SuperadminLoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const response = await fetch("/api/auth/superadmin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (response.ok) {
        // Successful login - redirect to superadmin dashboard
        window.location.href = "/superadmin/dashboard"
      } else {
        setError(data.error || "Invalid email or password. Please try again.")
      }
    } catch (error) {
      setError("Network error. Please check your connection and try again.")
    }

    setIsLoading(false)
  }

  // Auto-fill demo credentials for convenience
  const fillDemoCredentials = () => {
    setEmail("superadmin@demo.com")
    setPassword("SuperAdmin@123")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="mx-auto w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center">
            <Crown className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Superadmin Portal</h1>
          <p className="text-purple-200">System administration access</p>
        </div>

        {/* Login Form */}
        <Card className="bg-white/95 backdrop-blur">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="w-5 h-5 text-purple-600" />
              <span>Superadmin Login</span>
            </CardTitle>
            <CardDescription>Enter your superadmin credentials to access the system</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
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
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700" disabled={isLoading}>
                {isLoading ? "Signing in..." : "Sign In as Superadmin"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Demo Credentials */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="text-center space-y-2">
              <h3 className="font-medium text-blue-800">Demo Access</h3>
              <p className="text-sm text-blue-700">Use demo credentials for testing</p>
              <div className="text-xs text-blue-600 space-y-1">
                <p><strong>Email:</strong> superadmin@demo.com</p>
                <p><strong>Password:</strong> SuperAdmin@123</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={fillDemoCredentials}
                className="text-blue-700 border-blue-300 hover:bg-blue-100"
              >
                Fill Demo Credentials
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Security Notice */}
        <Card className="bg-amber-50 border-amber-200">
          <CardContent className="p-4">
            <div className="flex items-start space-x-2">
              <Shield className="w-4 h-4 text-amber-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-amber-800">Security Notice</p>
                <p className="text-amber-700">
                  Superadmin access is highly privileged and monitored. Unauthorized access attempts will be logged and reported.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Navigation Links */}
        <div className="text-center space-y-2">
          <Link href="/admin/login" className="text-purple-200 hover:text-white text-sm inline-flex items-center">
            <User className="w-4 h-4 mr-1" />
            Admin Login
          </Link>
          <br />
          <Link href="/" className="text-purple-200 hover:text-white text-sm inline-flex items-center">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Member Portal
          </Link>
        </div>
      </div>
    </div>
  )
}