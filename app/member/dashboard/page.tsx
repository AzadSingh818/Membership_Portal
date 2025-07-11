"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  User,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  Building,
  Calendar,
  Settings,
  LogOut,
  Bell,
  Edit,
  CheckCircle,
  AlertCircle,
  Eye,
  EyeOff,
  Lock,
  CreditCard,
  FileText,
  Download,
  Award,
  Loader2,
} from "lucide-react"
import Link from "next/link"

interface Member {
  id: string
  first_name: string
  last_name: string
  email: string
  phone?: string
  address?: string
  designation?: string
  experience?: string
  membership_id: string
  organization_name: string
  organization_id: number
  join_date: string
  status: string
  achievements?: string
  payment_method?: string
  created_at?: string
}

export default function MemberDashboard() {
  const [currentMember, setCurrentMember] = useState<Member | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [isEditing, setIsEditing] = useState(false)
  const [showPasswordDialog, setShowPasswordDialog] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // Profile edit form
  const [profileForm, setProfileForm] = useState({
    phone: "",
    address: "",
    designation: "",
    experience: "",
    achievements: "",
  })

  // Password change form
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })

  // ✅ FETCH REAL MEMBER DATA FROM API
  useEffect(() => {
    fetchMemberData()
  }, [])

  const fetchMemberData = async () => {
    try {
      setLoading(true)
      setError("")
      
      // ✅ Get member data from API (authentication token should be handled by middleware)
      const response = await fetch("/api/member/profile", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // Include cookies for authentication
      })

      if (!response.ok) {
        if (response.status === 401) {
          // Redirect to login if not authenticated
          window.location.href = "/member/login";
          return; // Ensure no further code runs after redirect
        }
        throw new Error("Failed to fetch member data");
      }

      const data = await response.json()
      
      if (data.success && data.member) {
        const member = data.member
        console.log("✅ Member data loaded:", member)
        
        setCurrentMember(member)
        setProfileForm({
          phone: member.phone || "",
          address: member.address || "",
          designation: member.designation || "",
          experience: member.experience || "",
          achievements: member.achievements || "",
        })
      } else {
        throw new Error(data.error || "No member data found")
      }
    } catch (err: any) {
      console.error("❌ Error fetching member data:", err)
      setError(err.message || "Failed to load member data")
      
      // ✅ FALLBACK: Redirect to login if authentication fails
      if (err.message.includes("auth") || err.message.includes("401")) {
        setTimeout(() => {
          window.location.href = "/member/login"
        }, 2000)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleProfileUpdate = async () => {
    if (!currentMember) return

    try {
      setLoading(true)
      setError("")
      setSuccess("")

      const response = await fetch("/api/member/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(profileForm),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setSuccess("Profile updated successfully")
        setIsEditing(false)
        // Update current member data
        setCurrentMember(prev => prev ? { 
          ...prev, 
          phone: profileForm.phone,
          address: profileForm.address, 
          designation: profileForm.designation,
          experience: profileForm.experience,
          achievements: profileForm.achievements,
        } : null)
      } else {
        setError(data.error || "Failed to update profile")
      }
    } catch (err: any) {
      console.error("❌ Error updating profile:", err)
      setError("Error updating profile")
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordChange = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError("New passwords do not match")
      return
    }

    if (passwordForm.newPassword.length < 8) {
      setError("Password must be at least 8 characters long")
      return
    }

    try {
      setLoading(true)
      setError("")
      setSuccess("")

      const response = await fetch("/api/member/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setSuccess("Password changed successfully")
        setShowPasswordDialog(false)
        setPasswordForm({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        })
      } else {
        setError(data.error || "Failed to change password")
      }
    } catch (err: any) {
      console.error("❌ Error changing password:", err)
      setError("Error changing password")
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { 
        method: "POST",
        credentials: "include"
      })
      window.location.href = "/member/login"
    } catch (err) {
      // Force logout even if API call fails
      window.location.href = "/member/login"
    }
  }

  const handleDownloadMembershipCard = async () => {
    try {
      const response = await fetch("/api/member/download-card", {
        method: "GET",
        credentials: "include",
      })
      
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `membership-card-${currentMember?.membership_id}.pdf`
        a.click()
        window.URL.revokeObjectURL(url)
      } else {
        alert("Membership card download is not available yet")
      }
    } catch (err) {
      console.error("Error downloading membership card:", err)
      alert("Error downloading membership card")
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { label: "Active", color: "bg-green-100 text-green-800" },
      approved: { label: "Active", color: "bg-green-100 text-green-800" },
      pending: { label: "Pending", color: "bg-yellow-100 text-yellow-800" },
      inactive: { label: "Inactive", color: "bg-gray-100 text-gray-800" },
      suspended: { label: "Suspended", color: "bg-red-100 text-red-800" },
      rejected: { label: "Rejected", color: "bg-red-100 text-red-800" },
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.active
    return <Badge className={config.color}>{config.label}</Badge>
  }

  const getPaymentMethodDisplay = (method: string) => {
    const paymentMethods: { [key: string]: string } = {
      bank_transfer: "Bank Transfer",
      credit_card: "Credit Card", 
      debit_card: "Debit Card",
      cash: "Cash Payment",
      check: "Check"
    }
    return paymentMethods[method] || method.replace('_', ' ').split(' ').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ')
  }

  const getExperienceDisplay = (exp: string) => {
    const experienceLevels: { [key: string]: string } = {
      "0-2": "0-2 years",
      "3-5": "3-5 years", 
      "6-10": "6-10 years",
      "11-15": "11-15 years",
      "16-20": "16-20 years",
      "20+": "20+ years"
    }
    return experienceLevels[exp] || exp
  }

  // ✅ LOADING STATE
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin h-8 w-8 text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  // ✅ ERROR STATE - NO MEMBER DATA
  if (!currentMember) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
            <h2 className="text-lg font-semibold mb-2">Access Denied</h2>
            <p className="text-gray-600 mb-4">
              {error || "Unable to load member data. Please login again."}
            </p>
            <div className="space-y-2">
              <Link href="/member/login">
                <Button className="w-full">Go to Login</Button>
              </Link>
              <Button variant="outline" onClick={fetchMemberData} className="w-full">
                <Loader2 className="w-4 h-4 mr-2" />
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-blue-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-gray-900">Member Dashboard</h1>
                  <p className="text-xs text-gray-500">Welcome, {currentMember.first_name}</p>
                </div>
              </div>
              {getStatusBadge(currentMember.status)}
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Avatar className="w-8 h-8">
                  <AvatarFallback className="bg-blue-100 text-blue-600">
                    {currentMember.first_name[0]}{currentMember.last_name[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden sm:block">
                  <p className="text-sm font-medium text-gray-900">
                    {currentMember.first_name} {currentMember.last_name}
                  </p>
                  <p className="text-xs text-gray-500">ID: {currentMember.membership_id}</p>
                </div>
              </div>
              <Button variant="ghost" size="sm">
                <Bell className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm">
                <Settings className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Alerts */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-2" 
              onClick={() => setError("")}
            >
              Dismiss
            </Button>
          </Alert>
        )}
        
        {success && (
          <Alert className="mb-6 border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">{success}</AlertDescription>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-2" 
              onClick={() => setSuccess("")}
            >
              Dismiss
            </Button>
          </Alert>
        )}

        {/* Member Info Card */}
        <Card className="mb-6 bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Avatar className="w-16 h-16">
                  <AvatarFallback className="bg-blue-600 text-white text-lg">
                    {currentMember.first_name[0]}{currentMember.last_name[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">
                    {currentMember.first_name} {currentMember.last_name}
                  </h3>
                  <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                    <div className="flex items-center gap-1">
                      <Building className="w-3 h-3" />
                      <span>{currentMember.organization_name}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span>Joined {new Date(currentMember.join_date || currentMember.created_at || '').toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="mt-2">
                    <Badge className="bg-blue-100 text-blue-800">
                      Membership ID: {currentMember.membership_id}
                    </Badge>
                  </div>
                </div>
              </div>
              <Button onClick={handleDownloadMembershipCard} className="bg-blue-600 hover:bg-blue-700">
                <Download className="w-4 h-4 mr-2" />
                Download Card
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Membership Status</p>
                  <p className="text-2xl font-bold text-gray-900 capitalize">
                    {currentMember.status === 'approved' ? 'Active' : currentMember.status}
                  </p>
                </div>
                <CheckCircle className={`w-8 h-8 ${
                  currentMember.status === 'active' || currentMember.status === 'approved' 
                    ? 'text-green-500' 
                    : currentMember.status === 'pending'
                    ? 'text-yellow-500'
                    : 'text-gray-400'
                }`} />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Member Since</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {new Date(currentMember.join_date || currentMember.created_at || '').getFullYear()}
                  </p>
                </div>
                <Calendar className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Organization</p>
                  <p className="text-lg font-bold text-gray-900">{currentMember.organization_name}</p>
                </div>
                <Building className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList>
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="membership">Membership Details</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Personal Information</CardTitle>
                    <CardDescription>Your details as provided during registration</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    {isEditing ? (
                      <>
                        <Button variant="outline" onClick={() => setIsEditing(false)} disabled={loading}>
                          Cancel
                        </Button>
                        <Button onClick={handleProfileUpdate} disabled={loading}>
                          {loading ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Saving...
                            </>
                          ) : (
                            "Save Changes"
                          )}
                        </Button>
                      </>
                    ) : (
                      <Button variant="outline" onClick={() => setIsEditing(true)}>
                        <Edit className="w-4 h-4 mr-2" />
                        Edit Profile
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Basic Information (Read-only from registration) */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label className="text-sm font-medium text-gray-600">First Name</Label>
                      <p className="mt-1 text-sm text-gray-900 font-medium">{currentMember.first_name}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Last Name</Label>
                      <p className="mt-1 text-sm text-gray-900 font-medium">{currentMember.last_name}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Email Address</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <p className="text-sm text-gray-900">{currentMember.email}</p>
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Membership ID</Label>
                      <p className="mt-1 text-sm text-gray-900 font-mono bg-gray-50 px-2 py-1 rounded">
                        {currentMember.membership_id}
                      </p>
                    </div>
                  </div>

                  {/* Editable Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="phone">Phone Number</Label>
                      {isEditing ? (
                        <Input
                          id="phone"
                          value={profileForm.phone}
                          onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                          placeholder="+1-555-123-4567"
                          className="mt-1"
                        />
                      ) : (
                        <div className="flex items-center gap-2 mt-1">
                          <Phone className="w-4 h-4 text-gray-400" />
                          <p className="text-sm text-gray-900">{currentMember.phone || 'Not provided'}</p>
                        </div>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="designation">Current Designation</Label>
                      {isEditing ? (
                        <Input
                          id="designation"
                          value={profileForm.designation}
                          onChange={(e) => setProfileForm({ ...profileForm, designation: e.target.value })}
                          placeholder="Your job title"
                          className="mt-1"
                        />
                      ) : (
                        <div className="flex items-center gap-2 mt-1">
                          <Briefcase className="w-4 h-4 text-gray-400" />
                          <p className="text-sm text-gray-900">{currentMember.designation || 'Not provided'}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="address">Address</Label>
                    {isEditing ? (
                      <Textarea
                        id="address"
                        value={profileForm.address}
                        onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                        placeholder="Your full address"
                        rows={3}
                        className="mt-1"
                      />
                    ) : (
                      <div className="flex items-start gap-2 mt-1">
                        <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                        <p className="text-sm text-gray-900">{currentMember.address || 'Not provided'}</p>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="experience">Years of Experience</Label>
                      {isEditing ? (
                        <Select
                          value={profileForm.experience}
                          onValueChange={(value) => setProfileForm({ ...profileForm, experience: value })}
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
                      ) : (
                        <div className="flex items-center gap-2 mt-1">
                          <Award className="w-4 h-4 text-gray-400" />
                          <p className="text-sm text-gray-900">
                            {currentMember.experience ? getExperienceDisplay(currentMember.experience) : 'Not provided'}
                          </p>
                        </div>
                      )}
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Payment Method</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <CreditCard className="w-4 h-4 text-gray-400" />
                        <p className="text-sm text-gray-900">
                          {currentMember.payment_method ? getPaymentMethodDisplay(currentMember.payment_method) : 'Not specified'}
                        </p>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Contact admin to change payment method</p>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="achievements">Achievements & Qualifications</Label>
                    {isEditing ? (
                      <Textarea
                        id="achievements"
                        value={profileForm.achievements}
                        onChange={(e) => setProfileForm({ ...profileForm, achievements: e.target.value })}
                        placeholder="Your achievements, certifications, etc."
                        rows={4}
                        className="mt-1"
                      />
                    ) : (
                      <div className="mt-1">
                        <p className="text-sm text-gray-900">
                          {currentMember.achievements || 'Not provided'}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Security Section */}
                  <div className="border-t pt-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h4 className="text-lg font-medium">Security</h4>
                        <p className="text-sm text-gray-600">Manage your account security settings</p>
                      </div>
                      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
                        <DialogTrigger asChild>
                          <Button variant="outline">
                            <Lock className="w-4 h-4 mr-2" />
                            Change Password
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Change Password</DialogTitle>
                            <DialogDescription>
                              Enter your current password and choose a new one
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label htmlFor="currentPassword">Current Password</Label>
                              <Input
                                id="currentPassword"
                                type="password"
                                value={passwordForm.currentPassword}
                                onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                              />
                            </div>
                            <div>
                              <Label htmlFor="newPassword">New Password</Label>
                              <div className="relative">
                                <Input
                                  id="newPassword"
                                  type={showPassword ? "text" : "password"}
                                  value={passwordForm.newPassword}
                                  onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                                />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="absolute right-0 top-0 h-full px-3"
                                  onClick={() => setShowPassword(!showPassword)}
                                >
                                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </Button>
                              </div>
                            </div>
                            <div>
                              <Label htmlFor="confirmPassword">Confirm New Password</Label>
                              <div className="relative">
                                <Input
                                  id="confirmPassword"
                                  type={showConfirmPassword ? "text" : "password"}
                                  value={passwordForm.confirmPassword}
                                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                                />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="absolute right-0 top-0 h-full px-3"
                                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                >
                                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </Button>
                              </div>
                            </div>
                          </div>
                          <DialogFooter>
                            <Button variant="outline" onClick={() => setShowPasswordDialog(false)}>
                              Cancel
                            </Button>
                            <Button onClick={handlePasswordChange} disabled={loading}>
                              {loading ? (
                                <>
                                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                  Changing...
                                </>
                              ) : (
                                "Change Password"
                              )}
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Membership Details Tab */}
          <TabsContent value="membership">
            <Card>
              <CardHeader>
                <CardTitle>Membership Details</CardTitle>
                <CardDescription>Your membership information and history</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Membership ID</Label>
                      <p className="mt-1 text-lg font-mono bg-blue-50 px-3 py-2 rounded border">
                        {currentMember.membership_id}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Status</Label>
                      <div className="mt-2">{getStatusBadge(currentMember.status)}</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Organization</Label>
                      <p className="mt-1 font-medium">{currentMember.organization_name}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Join Date</Label>
                      <p className="mt-1">
                        {new Date(currentMember.join_date || currentMember.created_at || '').toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>

                  {currentMember.experience && (
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Experience Level</Label>
                      <p className="mt-1">{getExperienceDisplay(currentMember.experience)}</p>
                    </div>
                  )}

                  {currentMember.payment_method && (
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Payment Method</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <CreditCard className="w-4 h-4 text-gray-400" />
                        <p>{getPaymentMethodDisplay(currentMember.payment_method)}</p>
                      </div>
                    </div>
                  )}

                  {currentMember.achievements && (
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Achievements & Qualifications</Label>
                      <div className="mt-1 p-3 bg-gray-50 rounded border">
                        <p className="text-sm text-gray-900">{currentMember.achievements}</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Documents Tab */}
          <TabsContent value="documents">
            <Card>
              <CardHeader>
                <CardTitle>Documents & Certificates</CardTitle>
                <CardDescription>Download your membership documents</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <FileText className="w-8 h-8 text-blue-500" />
                        <div>
                          <h4 className="font-medium">Membership Certificate</h4>
                          <p className="text-sm text-gray-600">Official membership certificate</p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </Button>
                    </div>
                  </div>

                  <div className="border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <CreditCard className="w-8 h-8 text-green-500" />
                        <div>
                          <h4 className="font-medium">Membership Card</h4>
                          <p className="text-sm text-gray-600">Digital membership ID card</p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" onClick={handleDownloadMembershipCard}>
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </Button>
                    </div>
                  </div>

                  <div className="text-center py-8 text-gray-500">
                    <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <p>Additional documents will appear here as they become available</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}