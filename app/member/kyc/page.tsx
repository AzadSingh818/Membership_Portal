"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  ArrowLeft,
  CheckCircle,
  Clock,
  AlertTriangle,
  Camera,
  FileText,
  Shield,
  Eye,
  Download,
  RefreshCw,
} from "lucide-react"
import Link from "next/link"

interface KYCDocument {
  id: string
  type: string
  name: string
  status: "pending" | "verified" | "rejected" | "expired"
  uploadDate: string
  expiryDate?: string
  fileSize: string
  verificationDate?: string
  rejectionReason?: string
}

export default function KYCPage() {
  const [activeTab, setActiveTab] = useState("overview")
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  const kycDocuments: KYCDocument[] = [
    {
      id: "1",
      type: "aadhaar",
      name: "Aadhaar Card",
      status: "verified",
      uploadDate: "2024-01-15",
      verificationDate: "2024-01-16",
      fileSize: "2.3 MB",
    },
    {
      id: "2",
      type: "pan",
      name: "PAN Card",
      status: "verified",
      uploadDate: "2024-01-15",
      verificationDate: "2024-01-16",
      fileSize: "1.8 MB",
    },
    {
      id: "3",
      type: "passport",
      name: "Passport",
      status: "pending",
      uploadDate: "2024-01-20",
      expiryDate: "2030-05-15",
      fileSize: "3.2 MB",
    },
    {
      id: "4",
      type: "driving_license",
      name: "Driving License",
      status: "rejected",
      uploadDate: "2024-01-18",
      fileSize: "2.1 MB",
      rejectionReason: "Document image is not clear. Please upload a clearer image.",
    },
  ]

  const getStatusBadge = (status: string) => {
    const config = {
      verified: { icon: CheckCircle, color: "bg-green-100 text-green-800", label: "Verified" },
      pending: { icon: Clock, color: "bg-yellow-100 text-yellow-800", label: "Pending" },
      rejected: { icon: AlertTriangle, color: "bg-red-100 text-red-800", label: "Rejected" },
      expired: { icon: AlertTriangle, color: "bg-orange-100 text-orange-800", label: "Expired" },
    }

    const statusConfig = config[status as keyof typeof config]
    const Icon = statusConfig.icon

    return (
      <Badge className={statusConfig.color}>
        <Icon className="w-3 h-3 mr-1" />
        {statusConfig.label}
      </Badge>
    )
  }

  const handleFileUpload = async (documentType: string) => {
    setIsUploading(true)
    setUploadProgress(0)

    // Simulate file upload with progress
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval)
          setIsUploading(false)
          alert(`${documentType} uploaded successfully!`)
          return 100
        }
        return prev + 10
      })
    }, 200)
  }

  const kycCompletionPercentage =
    (kycDocuments.filter((doc) => doc.status === "verified").length / kycDocuments.length) * 100

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Link href="/member/dashboard">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">KYC Verification</h1>
              <p className="text-gray-600">Know Your Customer - Identity Verification</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">Completion Status</p>
            <div className="flex items-center space-x-2">
              <Progress value={kycCompletionPercentage} className="w-24 h-2" />
              <span className="text-sm font-medium">{Math.round(kycCompletionPercentage)}%</span>
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="upload">Upload Documents</TabsTrigger>
            <TabsTrigger value="verification">Verification Status</TabsTrigger>
            <TabsTrigger value="help">Help & Guidelines</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* KYC Status Summary */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>KYC Status Overview</CardTitle>
                  <CardDescription>Your identity verification status and required documents</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {kycDocuments.map((doc) => (
                      <div key={doc.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-blue-100 rounded-lg">
                            <FileText className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <h4 className="font-medium">{doc.name}</h4>
                            <p className="text-sm text-gray-500">
                              Uploaded: {doc.uploadDate} • {doc.fileSize}
                            </p>
                            {doc.rejectionReason && <p className="text-sm text-red-600 mt-1">{doc.rejectionReason}</p>}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {getStatusBadge(doc.status)}
                          <Button variant="outline" size="sm">
                            <Eye className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Quick Stats */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Verification Stats</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Verified Documents</span>
                      <Badge className="bg-green-100 text-green-800">
                        {kycDocuments.filter((doc) => doc.status === "verified").length}/{kycDocuments.length}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Pending Review</span>
                      <Badge className="bg-yellow-100 text-yellow-800">
                        {kycDocuments.filter((doc) => doc.status === "pending").length}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Rejected</span>
                      <Badge className="bg-red-100 text-red-800">
                        {kycDocuments.filter((doc) => doc.status === "rejected").length}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Security Level</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center space-x-3">
                      <Shield
                        className={`w-8 h-8 ${kycCompletionPercentage === 100 ? "text-green-600" : "text-yellow-600"}`}
                      />
                      <div>
                        <p className="font-medium">
                          {kycCompletionPercentage === 100 ? "High Security" : "Medium Security"}
                        </p>
                        <p className="text-sm text-gray-600">
                          {kycCompletionPercentage === 100 ? "All documents verified" : "Complete KYC for full access"}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="upload">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Upload New Document</CardTitle>
                  <CardDescription>Select document type and upload clear, readable images</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Document Type Selection */}
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { type: "aadhaar", label: "Aadhaar Card", icon: FileText },
                      { type: "pan", label: "PAN Card", icon: FileText },
                      { type: "passport", label: "Passport", icon: FileText },
                      { type: "driving_license", label: "Driving License", icon: FileText },
                      { type: "voter_id", label: "Voter ID", icon: FileText },
                      { type: "bank_statement", label: "Bank Statement", icon: FileText },
                    ].map((docType) => (
                      <Button
                        key={docType.type}
                        variant="outline"
                        className="h-20 flex flex-col items-center justify-center space-y-2"
                        onClick={() => handleFileUpload(docType.label)}
                        disabled={isUploading}
                      >
                        <docType.icon className="w-6 h-6" />
                        <span className="text-xs text-center">{docType.label}</span>
                      </Button>
                    ))}
                  </div>

                  {/* Upload Progress */}
                  {isUploading && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Uploading...</span>
                        <span>{uploadProgress}%</span>
                      </div>
                      <Progress value={uploadProgress} className="h-2" />
                    </div>
                  )}

                  {/* Camera Upload Option */}
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <Camera className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Take Photo</h3>
                    <p className="text-gray-600 mb-4">Use your camera to capture document images</p>
                    <Button variant="outline">
                      <Camera className="w-4 h-4 mr-2" />
                      Open Camera
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Upload Guidelines</CardTitle>
                  <CardDescription>Follow these guidelines for faster verification</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-start space-x-3">
                      <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                      <div>
                        <h4 className="font-medium">Image Quality</h4>
                        <p className="text-sm text-gray-600">Ensure images are clear, well-lit, and readable</p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                      <div>
                        <h4 className="font-medium">File Format</h4>
                        <p className="text-sm text-gray-600">Upload JPG, PNG, or PDF files only</p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                      <div>
                        <h4 className="font-medium">File Size</h4>
                        <p className="text-sm text-gray-600">Maximum 5MB per document</p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                      <div>
                        <h4 className="font-medium">Document Validity</h4>
                        <p className="text-sm text-gray-600">Ensure documents are not expired</p>
                      </div>
                    </div>
                  </div>

                  <Alert>
                    <Shield className="h-4 w-4" />
                    <AlertDescription>
                      All uploaded documents are encrypted and stored securely. We never share your personal information
                      with third parties.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="verification">
            <Card>
              <CardHeader>
                <CardTitle>Verification Timeline</CardTitle>
                <CardDescription>Track the status of your document verification process</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {kycDocuments.map((doc, index) => (
                    <div key={doc.id} className="relative">
                      {index !== kycDocuments.length - 1 && (
                        <div className="absolute left-4 top-8 w-0.5 h-16 bg-gray-200" />
                      )}

                      <div className="flex items-start space-x-4">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            doc.status === "verified"
                              ? "bg-green-100"
                              : doc.status === "pending"
                                ? "bg-yellow-100"
                                : doc.status === "rejected"
                                  ? "bg-red-100"
                                  : "bg-gray-100"
                          }`}
                        >
                          {doc.status === "verified" && <CheckCircle className="w-4 h-4 text-green-600" />}
                          {doc.status === "pending" && <Clock className="w-4 h-4 text-yellow-600" />}
                          {doc.status === "rejected" && <AlertTriangle className="w-4 h-4 text-red-600" />}
                        </div>

                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h3 className="font-medium">{doc.name}</h3>
                            {getStatusBadge(doc.status)}
                          </div>

                          <div className="mt-2 space-y-1 text-sm text-gray-600">
                            <p>Uploaded: {doc.uploadDate}</p>
                            {doc.verificationDate && <p>Verified: {doc.verificationDate}</p>}
                            {doc.rejectionReason && <p className="text-red-600">Reason: {doc.rejectionReason}</p>}
                          </div>

                          <div className="mt-3 flex space-x-2">
                            <Button variant="outline" size="sm">
                              <Eye className="w-4 h-4 mr-2" />
                              View
                            </Button>
                            <Button variant="outline" size="sm">
                              <Download className="w-4 h-4 mr-2" />
                              Download
                            </Button>
                            {doc.status === "rejected" && (
                              <Button variant="outline" size="sm">
                                <RefreshCw className="w-4 h-4 mr-2" />
                                Re-upload
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="help">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Frequently Asked Questions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Why is KYC verification required?</h4>
                    <p className="text-sm text-gray-600">
                      KYC verification helps us ensure the security and authenticity of our members, comply with
                      regulations, and prevent fraud.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">How long does verification take?</h4>
                    <p className="text-sm text-gray-600">
                      Most documents are verified within 24-48 hours. Complex cases may take up to 5 business days.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">What if my document is rejected?</h4>
                    <p className="text-sm text-gray-600">
                      You can re-upload the document with better quality or contact support for assistance.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Is my data secure?</h4>
                    <p className="text-sm text-gray-600">
                      Yes, all documents are encrypted and stored securely. We follow industry-standard security
                      practices.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Contact Support</CardTitle>
                  <CardDescription>Need help with KYC verification?</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <Button className="w-full justify-start" variant="outline">
                      <FileText className="w-4 h-4 mr-3" />
                      Submit Support Ticket
                    </Button>
                    <Button className="w-full justify-start" variant="outline">
                      <Camera className="w-4 h-4 mr-3" />
                      Schedule Video Call
                    </Button>
                    <Button className="w-full justify-start" variant="outline">
                      <Download className="w-4 h-4 mr-3" />
                      Download KYC Guide
                    </Button>
                  </div>

                  <div className="pt-4 border-t">
                    <h4 className="font-medium mb-2">Support Hours</h4>
                    <p className="text-sm text-gray-600">Monday - Friday: 9:00 AM - 6:00 PM</p>
                    <p className="text-sm text-gray-600">Saturday: 10:00 AM - 4:00 PM</p>
                    <p className="text-sm text-gray-600">Sunday: Closed</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
