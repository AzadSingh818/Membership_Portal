"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ArrowLeft, Download, Share, QrCode, Shield, Calendar, MapPin, Mail, Phone } from "lucide-react"
import Link from "next/link"

export default function DigitalIDCard() {
  const [isGenerating, setIsGenerating] = useState(false)

  const memberData = {
    id: "MEM001",
    name: "John Doe",
    designation: "Senior Engineer",
    organization: "Engineering Association",
    joinDate: "January 15, 2024",
    validUntil: "January 14, 2025",
    status: "Active",
    email: "john.doe@example.com",
    phone: "+1 (555) 123-4567",
    address: "123 Main Street, City, State 12345",
    profilePhoto: "/placeholder.svg?height=120&width=120",
    qrCode: "/placeholder.svg?height=100&width=100",
  }

  const handleDownloadPDF = async () => {
    setIsGenerating(true)
    // Simulate PDF generation
    setTimeout(() => {
      setIsGenerating(false)
      // In real implementation, this would generate and download a PDF
      alert("Digital ID Card PDF downloaded successfully!")
    }, 2000)
  }

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: "My Digital Membership Card",
        text: `${memberData.name} - ${memberData.organization}`,
        url: window.location.href,
      })
    } else {
      // Fallback for browsers that don't support Web Share API
      navigator.clipboard.writeText(window.location.href)
      alert("Link copied to clipboard!")
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Link href="/member/dashboard">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Digital Membership Card</h1>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={handleShare}>
              <Share className="w-4 h-4 mr-2" />
              Share
            </Button>
            <Button onClick={handleDownloadPDF} disabled={isGenerating}>
              <Download className="w-4 h-4 mr-2" />
              {isGenerating ? "Generating..." : "Download PDF"}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Digital ID Card Preview */}
          <div className="space-y-6">
            <Card className="overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-blue-800 p-6 text-white">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <Shield className="w-6 h-6" />
                    <span className="font-semibold">MEMBERSHIP CARD</span>
                  </div>
                  <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                    {memberData.status}
                  </Badge>
                </div>

                <div className="flex items-start space-x-4">
                  <Avatar className="w-20 h-20 border-2 border-white/30">
                    <AvatarImage src={memberData.profilePhoto || "/placeholder.svg"} alt={memberData.name} />
                    <AvatarFallback className="bg-white/20 text-white text-lg">
                      {memberData.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1">
                    <h2 className="text-xl font-bold mb-1">{memberData.name}</h2>
                    <p className="text-blue-100 mb-2">{memberData.designation}</p>
                    <div className="text-sm text-blue-100">
                      <p>ID: {memberData.id}</p>
                      <p>{memberData.organization}</p>
                    </div>
                  </div>
                </div>
              </div>

              <CardContent className="p-6">
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Member Since</p>
                    <p className="font-medium">{memberData.joinDate}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Valid Until</p>
                    <p className="font-medium">{memberData.validUntil}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Scan for verification</p>
                    <div className="w-16 h-16 bg-gray-100 rounded border-2 border-dashed border-gray-300 flex items-center justify-center">
                      <QrCode className="w-8 h-8 text-gray-400" />
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">Issued by</p>
                    <p className="font-medium text-sm">{memberData.organization}</p>
                    <p className="text-xs text-gray-500 mt-1">Digital Certificate</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Card Back Preview */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Card Back - Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <span className="text-sm">{memberData.email}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <span className="text-sm">{memberData.phone}</span>
                </div>
                <div className="flex items-start space-x-3">
                  <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                  <span className="text-sm">{memberData.address}</span>
                </div>

                <div className="pt-4 border-t">
                  <p className="text-xs text-gray-500 mb-2">Terms & Conditions</p>
                  <ul className="text-xs text-gray-600 space-y-1">
                    <li>• This card is non-transferable and remains property of the organization</li>
                    <li>• Report lost or stolen cards immediately</li>
                    <li>• Valid only when accompanied by photo identification</li>
                    <li>• Subject to annual renewal and fee payment</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Card Details & Features */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Digital Features</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <QrCode className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-medium">QR Code Verification</h4>
                    <p className="text-sm text-gray-600">Instant verification of membership status and authenticity</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <Download className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-medium">PDF Download</h4>
                    <p className="text-sm text-gray-600">High-quality PDF for printing or digital storage</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                    <Shield className="w-4 h-4 text-purple-600" />
                  </div>
                  <div>
                    <h4 className="font-medium">Security Features</h4>
                    <p className="text-sm text-gray-600">Encrypted data and tamper-proof digital signatures</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                    <Calendar className="w-4 h-4 text-orange-600" />
                  </div>
                  <div>
                    <h4 className="font-medium">Auto-Renewal Alerts</h4>
                    <p className="text-sm text-gray-600">Automatic notifications before expiration</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Usage Instructions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">For Digital Use:</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Save to your phone's wallet app</li>
                    <li>• Show QR code for quick verification</li>
                    <li>• Share via email or messaging apps</li>
                  </ul>
                </div>

                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="font-medium text-green-900 mb-2">For Physical Use:</h4>
                  <ul className="text-sm text-green-800 space-y-1">
                    <li>• Download and print on cardstock</li>
                    <li>• Laminate for durability</li>
                    <li>• Carry with photo ID</li>
                  </ul>
                </div>

                <div className="bg-amber-50 p-4 rounded-lg">
                  <h4 className="font-medium text-amber-900 mb-2">Security Tips:</h4>
                  <ul className="text-sm text-amber-800 space-y-1">
                    <li>• Never share your QR code publicly</li>
                    <li>• Report suspicious activity immediately</li>
                    <li>• Update contact information regularly</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button className="w-full justify-start" variant="outline">
                  <Mail className="w-4 h-4 mr-3" />
                  Email Card to Myself
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <Phone className="w-4 h-4 mr-3" />
                  Add to Phone Wallet
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <Shield className="w-4 h-4 mr-3" />
                  Verify Card Status
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
