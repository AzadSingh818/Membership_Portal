"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Mail, CheckCircle, AlertCircle, Settings } from "lucide-react"

export default function TestEmailPage() {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState("")

  const handleTestEmail = async () => {
    if (!email) {
      setError("Please enter an email address")
      return
    }

    setIsLoading(true)
    setError("")
    setResult(null)

    try {
      const response = await fetch("/api/test-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (response.ok) {
        setResult(data)
      } else {
        setError(data.error || "Failed to send test email")
        if (data.details) {
          setResult(data)
        }
      }
    } catch (error) {
      setError("Network error occurred")
    }

    setIsLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mb-4">
            <Mail className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">SMTP Email Test</h1>
          <p className="text-gray-600">Test your SMTP email configuration</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Settings className="w-5 h-5 text-blue-600" />
              <span>Email Configuration Test</span>
            </CardTitle>
            <CardDescription>
              This will test your SMTP configuration by sending a test email with an OTP code.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label htmlFor="email">Test Email Address</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
              />
              <p className="text-xs text-gray-500 mt-1">
                Enter the email address where you want to receive the test OTP
              </p>
            </div>

            <Button onClick={handleTestEmail} disabled={isLoading} className="w-full">
              {isLoading ? "Sending Test Email..." : "Send Test Email"}
            </Button>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {result && result.success && (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  <div>
                    <p className="font-medium">Email sent successfully!</p>
                    <p className="mt-1">Check your inbox at: {result.email}</p>
                    <p className="mt-1">Test OTP: {result.testOTP}</p>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {result && result.error === "SMTP not configured" && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <div>
                    <p className="font-medium">SMTP Configuration Missing</p>
                    <p className="mt-2">Required environment variables:</p>
                    <ul className="mt-1 space-y-1 text-sm">
                      <li>• SMTP_HOST: {result.details?.host ? "✅ Configured" : "❌ Missing"}</li>
                      <li>• SMTP_USER: {result.details?.user ? "✅ Configured" : "❌ Missing"}</li>
                      <li>• SMTP_PASS: {result.details?.pass ? "✅ Configured" : "❌ Missing"}</li>
                      <li>• SMTP_PORT: {result.details?.port ? "✅ Configured" : "❌ Missing (will use 587)"}</li>
                    </ul>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* SMTP Configuration Guide */}
            <Card className="bg-gray-50">
              <CardContent className="p-4">
                <h4 className="font-medium mb-2">SMTP Configuration Examples</h4>
                <div className="text-sm space-y-2">
                  <div>
                    <strong>Gmail:</strong>
                    <ul className="ml-4 mt-1 space-y-1">
                      <li>• SMTP_HOST: smtp.gmail.com</li>
                      <li>• SMTP_PORT: 587</li>
                      <li>• SMTP_USER: your-email@gmail.com</li>
                      <li>• SMTP_PASS: your-app-password</li>
                    </ul>
                  </div>
                  <div>
                    <strong>Outlook/Hotmail:</strong>
                    <ul className="ml-4 mt-1 space-y-1">
                      <li>• SMTP_HOST: smtp-mail.outlook.com</li>
                      <li>• SMTP_PORT: 587</li>
                      <li>• SMTP_USER: your-email@outlook.com</li>
                      <li>• SMTP_PASS: your-password</li>
                    </ul>
                  </div>
                  <div>
                    <strong>Custom SMTP:</strong>
                    <ul className="ml-4 mt-1 space-y-1">
                      <li>• SMTP_HOST: your-smtp-server.com</li>
                      <li>• SMTP_PORT: 587 (or 465 for SSL)</li>
                      <li>• SMTP_USER: your-username</li>
                      <li>• SMTP_PASS: your-password</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
