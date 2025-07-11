"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  CheckCircle,
  FileText,
  CreditCard,
  Users,
  Eye,
  Download,
  Home,
  Mail,
  Phone,
  Clock,
  AlertCircle,
} from "lucide-react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"

export default function ApplicationSuccessPage() {
  const searchParams = useSearchParams()
  const applicationId = searchParams.get("applicationId")
  const membershipId = searchParams.get("membershipId")

  const [applicationData, setApplicationData] = useState({
    applicationId: applicationId || "APPFZQNYK",
    membershipId: membershipId || "ENG-24-0001",
    submissionDate: new Date().toLocaleDateString(),
    status: "Processing Started",
  })

  const processSteps = [
    {
      step: 1,
      title: "Document Verification",
      description: "Our admin will review your submitted documents",
      timeline: "Expected completion: 3-5 business days",
      status: "in_progress",
      icon: FileText,
    },
    {
      step: 2,
      title: "Payment Verification",
      description: "Verification of membership fee payment",
      timeline: "Expected completion: 1-2 business days",
      status: "pending",
      icon: CreditCard,
    },
    {
      step: 3,
      title: "Proposer & Seconder Approval",
      description: "Your appointed proposer and seconder will review and approve",
      timeline: "Expected completion: 3-5 business days",
      status: "pending",
      icon: Users,
    },
    {
      step: 4,
      title: "Committee Review",
      description: "Final review and approval by the membership committee",
      timeline: "Expected completion: 5-7 business days",
      status: "pending",
      icon: Eye,
    },
  ]

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "in_progress":
        return <Clock className="w-4 h-4 text-blue-600" />
      case "completed":
        return <CheckCircle className="w-4 h-4 text-green-600" />
      default:
        return <AlertCircle className="w-4 h-4 text-gray-400" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "in_progress":
        return "bg-blue-100 text-blue-800"
      case "completed":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-600"
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl space-y-6">
        {/* Success Header */}
        <div className="text-center space-y-4">
          <div className="mx-auto w-20 h-20 bg-green-500 rounded-full flex items-center justify-center">
            <CheckCircle className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Application Submitted Successfully!</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Thank you for applying for membership. Your application is now under review.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Application Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Application Info Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  <span>Application Details</span>
                </CardTitle>
                <CardDescription>Your application has been assigned the following ID</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Application ID</Label>
                    <div className="text-lg font-bold text-blue-600">{applicationData.applicationId}</div>
                    <p className="text-xs text-gray-500">Save this ID for tracking your application</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Submission Date</Label>
                    <div className="text-lg font-semibold">{applicationData.submissionDate}</div>
                    <Badge className="bg-green-100 text-green-800 mt-1">{applicationData.status}</Badge>
                  </div>
                </div>
                <Separator />
                <div>
                  <Label className="text-sm font-medium text-gray-600">Assigned Membership ID</Label>
                  <div className="text-lg font-bold text-purple-600">{applicationData.membershipId}</div>
                  <p className="text-xs text-gray-500">This will be your official membership ID once approved</p>
                </div>
              </CardContent>
            </Card>

            {/* Process Steps */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Clock className="w-5 h-5 text-orange-600" />
                  <span>What Happens Next?</span>
                </CardTitle>
                <CardDescription>Your application will go through the following stages</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {processSteps.map((step, index) => (
                  <div key={step.step} className="flex space-x-4">
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          step.status === "in_progress"
                            ? "bg-blue-100"
                            : step.status === "completed"
                              ? "bg-green-100"
                              : "bg-gray-100"
                        }`}
                      >
                        <step.icon
                          className={`w-5 h-5 ${
                            step.status === "in_progress"
                              ? "text-blue-600"
                              : step.status === "completed"
                                ? "text-green-600"
                                : "text-gray-400"
                          }`}
                        />
                      </div>
                      {index < processSteps.length - 1 && <div className="w-px h-12 bg-gray-200 mt-2"></div>}
                    </div>
                    <div className="flex-1 pb-8">
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className="font-semibold text-gray-900">
                          {step.step}. {step.title}
                        </h3>
                        <Badge className={getStatusColor(step.status)}>
                          {getStatusIcon(step.status)}
                          <span className="ml-1 capitalize">{step.status.replace("_", " ")}</span>
                        </Badge>
                      </div>
                      <p className="text-gray-600 text-sm mb-1">{step.description}</p>
                      <p className="text-xs text-gray-500">{step.timeline}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Email Notifications */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-lg">
                  <Mail className="w-5 h-5 text-blue-600" />
                  <span>Email Notifications</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-gray-600">
                  You will receive email updates at each stage of the review process. Please check your inbox regularly.
                </p>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>Application received confirmation</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span>Document verification updates</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span>Payment approval notifications</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span>Final decision notification</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-lg">
                  <Phone className="w-5 h-5 text-green-600" />
                  <span>Contact Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-gray-600">
                  If you have any questions about your application, please contact us:
                </p>
                <div className="space-y-2 text-sm">
                  <div>
                    <Label className="font-medium">Email Support</Label>
                    <p className="text-blue-600">support@membership.com</p>
                  </div>
                  <div>
                    <Label className="font-medium">Phone Support</Label>
                    <p>+1 (555) 123-4567</p>
                  </div>
                  <div>
                    <Label className="font-medium">Office Hours</Label>
                    <p>Monday - Friday: 9:00 AM - 5:00 PM</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="space-y-3">
              <Button className="w-full" variant="default">
                <Eye className="w-4 h-4 mr-2" />
                Track Application Status
              </Button>
              <Button className="w-full" variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Download Application Copy
              </Button>
              <Link href="/" className="block">
                <Button className="w-full" variant="outline">
                  <Home className="w-4 h-4 mr-2" />
                  Back to Home
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Important Notes */}
        <Card className="bg-amber-50 border-amber-200">
          <CardContent className="p-6">
            <h3 className="font-semibold text-amber-800 mb-3">Important Notes</h3>
            <ul className="space-y-2 text-sm text-amber-700">
              <li>• Please ensure your contact details are accurate for any future reference</li>
              <li>• Keep your application ID ({applicationData.applicationId}) safe for future reference</li>
              <li>• Check your email regularly for updates and requests for additional information</li>
              <li>• The total processing time is typically 10-15 business days</li>
              <li>• You will receive your membership card and welcome packet upon approval</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function Label({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`text-sm font-medium ${className}`}>{children}</div>
}
