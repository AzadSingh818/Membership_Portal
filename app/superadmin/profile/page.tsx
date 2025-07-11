"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Crown,
  LogOut,
  Bell,
  Settings,
  Edit,
  Save,
  X,
  CheckCircle,
  Shield,
  Calendar,
  Mail,
  Phone,
  MapPin,
  ArrowLeft,
} from "lucide-react"
import Link from "next/link"

interface SuperadminData {
  id: number
  firstName: string
  lastName: string
  email: string
  phone?: string
  address?: string
  role: string
  createdAt: string
  lastLogin?: string
}

export default function SuperadminProfile() {
  const [superadminData, setSuperadminData] = useState<SuperadminData | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const [editData, setEditData] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    address: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })

  useEffect(() => {
    fetchSuperadminData()
  }, [])

  const fetchSuperadminData = async () => {
    try {
      const response = await fetch("/api/superadmin/profile")
      const data = await response.json()
      if (response.ok) {
        setSuperadminData(data.profile)
        setEditData({
          firstName: data.profile.firstName,
          lastName: data.profile.lastName,
          phone: data.profile.phone || "",
          address: data.profile.address || "",
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        })
      }
    } catch (error) {
      console.error("Failed to fetch superadmin data:", error)
    }
  }

  const handleSave = async () => {
    setIsLoading(true)
    setError("")

    // Validate passwords if changing
    if (editData.newPassword) {
      if (editData.newPassword !== editData.confirmPassword) {
        setError("New passwords do not match")
        setIsLoading(false)
        return
      }
      if (!editData.currentPassword) {
        setError("Current password is required to change password")
        setIsLoading(false)
        return
      }
    }

    try {
      const response = await fetch("/api/superadmin/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editData),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess("Profile updated successfully!")
        setIsEditing(false)
        await fetchSuperadminData()
        setTimeout(() => setSuccess(""), 3000)
      } else {
        setError(data.error || "Failed to update profile")
      }
    } catch (error) {
      setError("Network error. Please try again.")
    }

    setIsLoading(false)
  }

  const handleCancel = () => {
    setIsEditing(false)
    setError("")
    if (superadminData) {
      setEditData({
        firstName: superadminData.firstName,
        lastName: superadminData.lastName,
        phone: superadminData.phone || "",
        address: superadminData.address || "",
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      })
    }
  }

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" })
      window.location.href = "/superadmin/login"
    } catch (error) {
      console.error("Logout failed:", error)
    }
  }

  if (!superadminData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-purple-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link href="/superadmin/dashboard">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
                  <Crown className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-gray-900">Superadmin Profile</h1>
                  <p className="text-xs text-gray-500">System Administrator</p>
                </div>
              </div>
              <Badge className="bg-yellow-100 text-yellow-800">
                <Crown className="w-3 h-3 mr-1" />
                Super Administrator
              </Badge>
            </div>
            <div className="flex items-center space-x-4">
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

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Card */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader className="text-center">
                <Avatar className="w-24 h-24 mx-auto mb-4">
                  <AvatarFallback className="text-2xl bg-yellow-100 text-yellow-800">
                    {superadminData.firstName[0]}
                    {superadminData.lastName[0]}
                  </AvatarFallback>
                </Avatar>
                <CardTitle>
                  {superadminData.firstName} {superadminData.lastName}
                </CardTitle>
                <CardDescription>Super Administrator</CardDescription>
                <Badge variant="default" className="mt-2 bg-yellow-500">
                  <Crown className="w-3 h-3 mr-1" />
                  Highest Access Level
                </Badge>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3 text-sm">
                  <div className="flex items-center space-x-3">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <span>{superadminData.email}</span>
                  </div>
                  {superadminData.phone && (
                    <div className="flex items-center space-x-3">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <span>{superadminData.phone}</span>
                    </div>
                  )}
                  {superadminData.address && (
                    <div className="flex items-center space-x-3">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <span>{superadminData.address}</span>
                    </div>
                  )}
                  <div className="flex items-center space-x-3">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span>Joined {new Date(superadminData.createdAt).toLocaleDateString()}</span>
                  </div>
                  {superadminData.lastLogin && (
                    <div className="flex items-center space-x-3">
                      <Shield className="w-4 h-4 text-gray-400" />
                      <span>Last login {new Date(superadminData.lastLogin).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>

                <Button
                  className="w-full"
                  variant={isEditing ? "destructive" : "outline"}
                  onClick={isEditing ? handleCancel : () => setIsEditing(true)}
                >
                  {isEditing ? (
                    <>
                      <X className="w-4 h-4 mr-2" />
                      Cancel
                    </>
                  ) : (
                    <>
                      <Edit className="w-4 h-4 mr-2" />
                      Edit Profile
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Profile Details */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>
                  {isEditing ? "Update your profile information" : "View your profile details"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {isEditing ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="firstName">First Name</Label>
                        <Input
                          id="firstName"
                          value={editData.firstName}
                          onChange={(e) => setEditData((prev) => ({ ...prev, firstName: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName">Last Name</Label>
                        <Input
                          id="lastName"
                          value={editData.lastName}
                          onChange={(e) => setEditData((prev) => ({ ...prev, lastName: e.target.value }))}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        value={editData.phone}
                        onChange={(e) => setEditData((prev) => ({ ...prev, phone: e.target.value }))}
                        placeholder="Enter phone number"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="address">Address</Label>
                      <Input
                        id="address"
                        value={editData.address}
                        onChange={(e) => setEditData((prev) => ({ ...prev, address: e.target.value }))}
                        placeholder="Enter address"
                      />
                    </div>

                    <div className="border-t pt-4">
                      <h3 className="text-lg font-medium mb-4">Change Password</h3>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="currentPassword">Current Password</Label>
                          <Input
                            id="currentPassword"
                            type="password"
                            value={editData.currentPassword}
                            onChange={(e) => setEditData((prev) => ({ ...prev, currentPassword: e.target.value }))}
                            placeholder="Enter current password"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="newPassword">New Password</Label>
                          <Input
                            id="newPassword"
                            type="password"
                            value={editData.newPassword}
                            onChange={(e) => setEditData((prev) => ({ ...prev, newPassword: e.target.value }))}
                            placeholder="Enter new password"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="confirmPassword">Confirm New Password</Label>
                          <Input
                            id="confirmPassword"
                            type="password"
                            value={editData.confirmPassword}
                            onChange={(e) => setEditData((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                            placeholder="Confirm new password"
                          />
                        </div>
                      </div>
                    </div>

                    {error && (
                      <Alert variant="destructive">
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    )}

                    {success && (
                      <Alert className="border-green-200 bg-green-50">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <AlertDescription className="text-green-800">{success}</AlertDescription>
                      </Alert>
                    )}

                    <Button onClick={handleSave} disabled={isLoading} className="w-full">
                      <Save className="w-4 h-4 mr-2" />
                      {isLoading ? "Saving..." : "Save Changes"}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 mb-1">First Name</h3>
                        <p className="text-lg">{superadminData.firstName}</p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 mb-1">Last Name</h3>
                        <p className="text-lg">{superadminData.lastName}</p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 mb-1">Email</h3>
                        <p className="text-lg">{superadminData.email}</p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 mb-1">Role</h3>
                        <p className="text-lg">{superadminData.role}</p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 mb-1">Phone</h3>
                        <p className="text-lg">{superadminData.phone || "Not provided"}</p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 mb-1">Address</h3>
                        <p className="text-lg">{superadminData.address || "Not provided"}</p>
                      </div>
                    </div>

                    <div className="border-t pt-6">
                      <h3 className="text-lg font-medium mb-4">Account Information</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <h4 className="text-sm font-medium text-gray-500 mb-1">Account Created</h4>
                          <p className="text-lg">{new Date(superadminData.createdAt).toLocaleDateString()}</p>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-gray-500 mb-1">Last Login</h4>
                          <p className="text-lg">
                            {superadminData.lastLogin
                              ? new Date(superadminData.lastLogin).toLocaleDateString()
                              : "Never"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
