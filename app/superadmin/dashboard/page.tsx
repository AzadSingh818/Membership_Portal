"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Users,
  Clock,
  CheckCircle,
  XCircle,
  Search,
  Filter,
  Eye,
  UserCheck,
  Settings,
  LogOut,
  Bell,
  Shield,
  User,
  Building,
  Plus,
  Edit,
  Trash2,
  Mail,
  Phone,
  Loader2,
} from "lucide-react"
import Link from "next/link"

interface Organization {
  id: number
  name: string
  description?: string
  address?: string
  contact_email?: string
  contact_phone?: string
  admin_count?: number
  member_count?: number
}

interface AdminRequest {
  id: number
  username: string
  email: string
  first_name: string
  last_name: string
  phone?: string
  role: string
  status: string
  organization_id?: number
  organization_name?: string
  created_at: string
}

interface CurrentUser {
  id: string
  email: string
  role: string
  first_name?: string
  last_name?: string
}

export default function SuperadminDashboard() {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("pending")
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null)
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [adminRequests, setAdminRequests] = useState<AdminRequest[]>([])
  const [admins, setAdmins] = useState<AdminRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [processingId, setProcessingId] = useState<number | null>(null)

  // Organization form state
  const [showOrgDialog, setShowOrgDialog] = useState(false)
  const [editingOrg, setEditingOrg] = useState<Organization | null>(null)
  const [orgForm, setOrgForm] = useState({
    name: "",
    description: "",
    address: "",
    contact_email: "",
    contact_phone: "",
  })

  useEffect(() => {
    // Set demo user if accessing via demo login
    const demoUser = {
      id: "demo-superadmin-id",
      email: "superadmin@demo.com",
      role: "superadmin",
      first_name: "Demo",
      last_name: "Superadmin",
    }
    setCurrentUser(demoUser)
    
    fetchData()
  }, [])

  // Auto-clear alerts after 5 seconds
  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError("")
        setSuccess("")
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [error, success])

  const fetchData = async () => {
    try {
      setLoading(true)
      await Promise.all([
        fetchOrganizations(),
        fetchAdminRequests(),
        fetchAdmins(),
      ])
    } catch (err) {
      setError("Failed to load dashboard data")
    } finally {
      setLoading(false)
    }
  }

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

  const fetchAdminRequests = async () => {
    try {
      // Try the specific endpoint first, fallback to admins endpoint with filter
      let response = await fetch("/api/superadmin/admin-requests")
      
      if (!response.ok && response.status === 405) {
        // Fallback: try fetching from admins endpoint
        console.log("Admin requests endpoint not available, trying admins endpoint...")
        response = await fetch("/api/superadmin/admins?status=pending")
      }
      
      if (response.ok) {
        const contentType = response.headers.get("content-type")
        if (contentType && contentType.includes("application/json")) {
          const data = await response.json()
          console.log("Admin requests data:", data)
          setAdminRequests(data.requests || data.admins || data || [])
        } else {
          console.error("API returned non-JSON response")
          setError("Invalid response format from admin requests API")
        }
      } else {
        console.error("Failed to fetch admin requests:", response.status, response.statusText)
        setError(`Failed to fetch admin requests: ${response.status} ${response.statusText}`)
      }
    } catch (err) {
      console.error("Failed to fetch admin requests:", err)
      setError("Network error occurred while fetching admin requests")
    }
  }

  const fetchAdmins = async () => {
    try {
      const response = await fetch("/api/superadmin/admins")
      if (response.ok) {
        const contentType = response.headers.get("content-type")
        if (contentType && contentType.includes("application/json")) {
          const data = await response.json()
          console.log("Admins data:", data)
          setAdmins(data.admins || data || [])
        } else {
          console.error("API returned non-JSON response")
          setError("Invalid response format from admins API")
        }
      } else {
        console.error("Failed to fetch admins:", response.status, response.statusText)
        setError(`Failed to fetch admins: ${response.status} ${response.statusText}`)
      }
    } catch (err) {
      console.error("Failed to fetch admins:", err)
      setError("Network error occurred while fetching admins")
    }
  }

  const handleApproveAdmin = async (adminId: number) => {
    try {
      setProcessingId(adminId)
      setError("")
      setSuccess("")

      const response = await fetch(`/api/superadmin/admin-approve/${adminId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })
      
      if (response.ok) {
        const data = await response.json()
        setSuccess(`✅ Admin approved! ${data.admin?.first_name || ''} ${data.admin?.last_name || ''} can now login to their dashboard.`)
        
        // Update the local state immediately for better UX
        setAdmins(prevAdmins => 
          prevAdmins.map(admin => 
            admin.id === adminId 
              ? { ...admin, status: 'approved' }
              : admin
          )
        )
        
        // Refresh data to ensure consistency
        await Promise.all([
          fetchAdminRequests(),
          fetchAdmins()
        ])
      } else {
        const data = await response.json()
        setError(data.error || "Failed to approve admin")
      }
    } catch (err) {
      console.error("Error approving admin:", err)
      setError("Network error occurred while approving admin")
    } finally {
      setProcessingId(null)
    }
  }

  const handleRejectAdmin = async (adminId: number) => {
    try {
      setProcessingId(adminId)
      setError("")
      setSuccess("")

      const response = await fetch(`/api/superadmin/admin-reject/${adminId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })
      
      if (response.ok) {
        const data = await response.json()
        setSuccess(`❌ Admin request rejected. Access denied - user cannot login.`)
        
        // Update the local state immediately for better UX
        setAdmins(prevAdmins => 
          prevAdmins.map(admin => 
            admin.id === adminId 
              ? { ...admin, status: 'rejected' }
              : admin
          )
        )
        
        // Refresh data to ensure consistency
        await Promise.all([
          fetchAdminRequests(),
          fetchAdmins()
        ])
      } else {
        const data = await response.json()
        setError(data.error || "Failed to reject admin")
      }
    } catch (err) {
      console.error("Error rejecting admin:", err)
      setError("Network error occurred while rejecting admin")
    } finally {
      setProcessingId(null)
    }
  }

  const handleCreateOrganization = async () => {
    try {
      const response = await fetch("/api/superadmin/organization/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orgForm),
      })

      if (response.ok) {
        setSuccess("Organization created successfully")
        setShowOrgDialog(false)
        resetOrgForm()
        fetchOrganizations()
      } else {
        setError("Failed to create organization")
      }
    } catch (err) {
      setError("Error creating organization")
    }
  }

  const handleUpdateOrganization = async () => {
    if (!editingOrg) return

    try {
      const response = await fetch(`/api/superadmin/organization/edit/${editingOrg.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orgForm),
      })

      if (response.ok) {
        setSuccess("Organization updated successfully")
        setShowOrgDialog(false)
        setEditingOrg(null)
        resetOrgForm()
        fetchOrganizations()
      } else {
        setError("Failed to update organization")
      }
    } catch (err) {
      setError("Error updating organization")
    }
  }

  const handleDeleteOrganization = async (orgId: number) => {
    if (!confirm("Are you sure you want to delete this organization?")) return

    try {
      const response = await fetch(`/api/superadmin/organization/delete/${orgId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setSuccess("Organization deleted successfully")
        fetchOrganizations()
      } else {
        setError("Failed to delete organization")
      }
    } catch (err) {
      setError("Error deleting organization")
    }
  }

  const resetOrgForm = () => {
    setOrgForm({
      name: "",
      description: "",
      address: "",
      contact_email: "",
      contact_phone: "",
    })
  }

  const openEditDialog = (org: Organization) => {
    setEditingOrg(org)
    setOrgForm({
      name: org.name,
      description: org.description || "",
      address: org.address || "",
      contact_email: org.contact_email || "",
      contact_phone: org.contact_phone || "",
    })
    setShowOrgDialog(true)
  }

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" })
      window.location.href = "/superadmin/login"
    } catch (err) {
      window.location.href = "/superadmin/login"
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: "Pending", variant: "secondary" as const },
      approved: { label: "Approved", variant: "default" as const },
      rejected: { label: "Rejected", variant: "destructive" as const },
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const stats = [
    { title: "Total Organizations", value: organizations.length.toString(), icon: Building, color: "bg-blue-500" },
    { title: "Pending Admin Requests", value: admins.filter(admin => admin.status === 'pending').length.toString(), icon: Clock, color: "bg-yellow-500" },
    { title: "Active Admins", value: admins.filter(admin => admin.status === 'approved').length.toString(), icon: Users, color: "bg-green-500" },
    { title: "Total Admins", value: admins.length.toString(), icon: User, color: "bg-purple-500" },
  ]

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card>
          <CardContent className="p-6 text-center">
            <Shield className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <h2 className="text-lg font-semibold mb-2">Access Denied</h2>
            <p className="text-gray-600 mb-4">Please login to access the superadmin dashboard.</p>
            <Link href="/superadmin/login">
              <Button>Go to Login</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-red-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center">
                  <Shield className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-gray-900">Superadmin Dashboard</h1>
                  <p className="text-xs text-gray-500">Welcome, {currentUser.first_name || 'Superadmin'}</p>
                </div>
              </div>
              <Badge className="bg-purple-100 text-purple-800">Super Admin</Badge>
            </div>
            <div className="flex items-center space-x-4">
              <Avatar className="w-8 h-8">
                <AvatarFallback className="bg-red-100 text-red-600">
                  {(currentUser.first_name || 'S')[0]}{(currentUser.last_name || 'A')[0]}
                </AvatarFallback>
              </Avatar>
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
            <XCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {success && (
          <Alert className="mb-6 border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">{success}</AlertDescription>
          </Alert>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <Card key={index}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  </div>
                  <div className={`p-3 rounded-full ${stat.color}`}>
                    <stat.icon className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Content */}
        <Tabs defaultValue="admin-requests" className="space-y-6">
          <TabsList>
            <TabsTrigger value="admin-requests" className="relative">
              Admin Requests
              {admins.filter(admin => admin.status === 'pending').length > 0 && (
                <Badge variant="destructive" className="ml-2 h-5 w-5 p-0 text-xs">
                  {admins.filter(admin => admin.status === 'pending').length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="organizations">Organizations</TabsTrigger>
            <TabsTrigger value="admins">All Admins</TabsTrigger>
          </TabsList>

          {/* Admin Requests Tab */}
          <TabsContent value="admin-requests">
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      Admin Registration Requests
                      <Badge variant="outline" className="text-xs">
                        {admins.filter(req => req.status === 'pending').length} pending
                      </Badge>
                    </CardTitle>
                    <CardDescription>Review admin applications - approve to grant login access or reject to deny</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={fetchData}>
                      <Search className="w-4 h-4 mr-2" />
                      Refresh
                    </Button>
                    <Input
                      placeholder="Search requests..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-64"
                    />
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="approved">Approved</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Debug Info - Remove in production */}
                {process.env.NODE_ENV === 'development' && (
                  <div className="mb-4 p-3 bg-gray-100 rounded text-xs">
                    <strong>Debug Info:</strong> Total Admin Records: {admins.length} | 
                    Filtered: {admins.filter(req => statusFilter === 'all' || req.status === statusFilter).length} | 
                    Filter: {statusFilter} | 
                    AdminRequests Array: {adminRequests.length}
                  </div>
                )}
                
                <div className="space-y-4">
                  {admins
                    .filter(req => statusFilter === 'all' || req.status === statusFilter)
                    .filter(req => 
                      req.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      req.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      req.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      req.username.toLowerCase().includes(searchTerm.toLowerCase())
                    )
                    .map((request) => (
                    <div key={request.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-3">
                            <h3 className="font-medium text-gray-900">
                              {request.first_name} {request.last_name}
                            </h3>
                            {getStatusBadge(request.status)}
                          </div>
                          <div className="text-sm text-gray-600 space-y-1">
                            <p><strong>Username:</strong> {request.username}</p>
                            <p><strong>Email:</strong> {request.email}</p>
                            {request.phone && <p><strong>Phone:</strong> {request.phone}</p>}
                            <p><strong>Role:</strong> {request.role}</p>
                            {request.organization_name && <p><strong>Organization:</strong> {request.organization_name}</p>}
                            <p><strong>Applied:</strong> {new Date(request.created_at).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {request.status === "pending" && (
                            <>
                              <Button 
                                size="sm" 
                                className="bg-green-600 hover:bg-green-700"
                                onClick={() => handleApproveAdmin(request.id)}
                                disabled={processingId === request.id}
                              >
                                {processingId === request.id ? (
                                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                ) : (
                                  <UserCheck className="w-4 h-4 mr-2" />
                                )}
                                {processingId === request.id ? "Approving..." : "Approve"}
                              </Button>
                              <Button 
                                variant="destructive" 
                                size="sm"
                                onClick={() => handleRejectAdmin(request.id)}
                                disabled={processingId === request.id}
                              >
                                {processingId === request.id ? (
                                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                ) : (
                                  <XCircle className="w-4 h-4 mr-2" />
                                )}
                                {processingId === request.id ? "Rejecting..." : "Reject"}
                              </Button>
                            </>
                          )}
                          {request.status === "approved" && (
                            <Badge variant="default" className="bg-green-100 text-green-800">
                              ✅ Approved - Can Login
                            </Badge>
                          )}
                          {request.status === "rejected" && (
                            <Badge variant="destructive">
                              ❌ Access Denied
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {admins.filter(req => statusFilter === 'all' || req.status === statusFilter).length === 0 && !loading && (
                    <div className="text-center py-8 text-gray-500">
                      <Users className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                      {statusFilter === 'all' ? (
                        <>
                          <p>No admin requests found</p>
                          <p className="text-sm mt-2">New admin registrations will appear here for approval</p>
                        </>
                      ) : (
                        <>
                          <p>No {statusFilter} admin requests found</p>
                          <p className="text-sm mt-2">Try changing the filter to see other requests</p>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="mt-3"
                            onClick={() => setStatusFilter('all')}
                          >
                            Show All Requests
                          </Button>
                        </>
                      )}
                    </div>
                  )}

                  {loading && (
                    <div className="text-center py-8">
                      <Loader2 className="w-8 h-8 mx-auto mb-4 animate-spin text-gray-400" />
                      <p className="text-gray-500">Loading admin requests...</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Organizations Tab */}
          <TabsContent value="organizations">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Organizations</CardTitle>
                    <CardDescription>Manage organizations and their details</CardDescription>
                  </div>
                  <Dialog open={showOrgDialog} onOpenChange={setShowOrgDialog}>
                    <DialogTrigger asChild>
                      <Button onClick={() => { setEditingOrg(null); resetOrgForm(); }}>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Organization
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle>
                          {editingOrg ? "Edit Organization" : "Add New Organization"}
                        </DialogTitle>
                        <DialogDescription>
                          {editingOrg ? "Update organization details" : "Create a new organization"}
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="org-name">Organization Name *</Label>
                          <Input
                            id="org-name"
                            value={orgForm.name}
                            onChange={(e) => setOrgForm({ ...orgForm, name: e.target.value })}
                            placeholder="Enter organization name"
                          />
                        </div>
                        <div>
                          <Label htmlFor="org-description">Description</Label>
                          <Textarea
                            id="org-description"
                            value={orgForm.description}
                            onChange={(e) => setOrgForm({ ...orgForm, description: e.target.value })}
                            placeholder="Organization description"
                          />
                        </div>
                        <div>
                          <Label htmlFor="org-address">Address</Label>
                          <Textarea
                            id="org-address"
                            value={orgForm.address}
                            onChange={(e) => setOrgForm({ ...orgForm, address: e.target.value })}
                            placeholder="Organization address"
                          />
                        </div>
                        <div>
                          <Label htmlFor="org-email">Contact Email</Label>
                          <Input
                            id="org-email"
                            type="email"
                            value={orgForm.contact_email}
                            onChange={(e) => setOrgForm({ ...orgForm, contact_email: e.target.value })}
                            placeholder="contact@organization.com"
                          />
                        </div>
                        <div>
                          <Label htmlFor="org-phone">Contact Phone</Label>
                          <Input
                            id="org-phone"
                            value={orgForm.contact_phone}
                            onChange={(e) => setOrgForm({ ...orgForm, contact_phone: e.target.value })}
                            placeholder="+1-555-123-4567"
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setShowOrgDialog(false)}>
                          Cancel
                        </Button>
                        <Button onClick={editingOrg ? handleUpdateOrganization : handleCreateOrganization}>
                          {editingOrg ? "Update" : "Create"}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {organizations.map((org) => (
                    <Card key={org.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          <div className="flex justify-between items-start">
                            <h3 className="font-semibold text-lg">{org.name}</h3>
                            <div className="flex gap-1">
                              <Button variant="ghost" size="sm" onClick={() => openEditDialog(org)}>
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => handleDeleteOrganization(org.id)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                          
                          {org.description && (
                            <p className="text-sm text-gray-600 line-clamp-2">{org.description}</p>
                          )}
                          
                          <div className="space-y-1 text-sm text-gray-500">
                            {org.contact_email && (
                              <div className="flex items-center gap-2">
                                <Mail className="w-3 h-3" />
                                <span className="truncate">{org.contact_email}</span>
                              </div>
                            )}
                            {org.contact_phone && (
                              <div className="flex items-center gap-2">
                                <Phone className="w-3 h-3" />
                                <span>{org.contact_phone}</span>
                              </div>
                            )}
                          </div>

                          <div className="flex justify-between text-xs text-gray-500 pt-2 border-t">
                            <span>Admins: {org.admin_count || 0}</span>
                            <span>Members: {org.member_count || 0}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                
                {organizations.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Building className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <p>No organizations found</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* All Admins Tab */}
          <TabsContent value="admins">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      All Administrators
                      <Badge variant="outline" className="text-xs">
                        {admins.filter(admin => admin.status === 'pending').length} pending approval
                      </Badge>
                    </CardTitle>
                    <CardDescription>Manage all administrators and their access permissions</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={fetchData}>
                      <Search className="w-4 h-4 mr-2" />
                      Refresh
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {admins.map((admin) => (
                    <div key={admin.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-3">
                            <h3 className="font-medium text-gray-900">
                              {admin.first_name} {admin.last_name}
                            </h3>
                            {getStatusBadge(admin.status)}
                            {admin.status === 'pending' && (
                              <Badge variant="outline" className="bg-orange-50 text-orange-700">
                                ⏳ Awaiting Approval
                              </Badge>
                            )}
                          </div>
                          <div className="text-sm text-gray-600 space-y-1">
                            <p><strong>Username:</strong> {admin.username}</p>
                            <p><strong>Email:</strong> {admin.email}</p>
                            <p><strong>Role:</strong> {admin.role}</p>
                            {admin.organization_name && <p><strong>Organization:</strong> {admin.organization_name}</p>}
                            <p><strong>Registered:</strong> {new Date(admin.created_at).toLocaleDateString()}</p>
                            {admin.phone && <p><strong>Phone:</strong> {admin.phone}</p>}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {admin.status === 'pending' && (
                            <div className="flex gap-2">
                              <Button 
                                size="sm" 
                                className="bg-green-600 hover:bg-green-700 text-white"
                                onClick={() => {
                                  if (confirm(`Approve ${admin.first_name} ${admin.last_name}? They will be able to login immediately.`)) {
                                    handleApproveAdmin(admin.id)
                                  }
                                }}
                                disabled={processingId === admin.id}
                              >
                                {processingId === admin.id ? (
                                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                ) : (
                                  <UserCheck className="w-4 h-4 mr-2" />
                                )}
                                {processingId === admin.id ? "Approving..." : "Approve"}
                              </Button>
                              <Button 
                                variant="destructive" 
                                size="sm"
                                className="bg-red-600 hover:bg-red-700 text-white"
                                onClick={() => {
                                  if (confirm(`Reject ${admin.first_name} ${admin.last_name}? They will not be able to login.`)) {
                                    handleRejectAdmin(admin.id)
                                  }
                                }}
                                disabled={processingId === admin.id}
                              >
                                {processingId === admin.id ? (
                                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                ) : (
                                  <XCircle className="w-4 h-4 mr-2" />
                                )}
                                {processingId === admin.id ? "Rejecting..." : "Reject"}
                              </Button>
                            </div>
                          )}
                          
                          {admin.status === 'approved' && (
                            <div className="flex gap-2">
                              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                ✅ Active - Can Login
                              </Badge>
                            </div>
                          )}
                          
                          {admin.status === 'rejected' && (
                            <div className="flex gap-2">
                              <Badge variant="destructive" className="bg-red-50 text-red-700 border-red-200">
                                ❌ Access Denied
                              </Badge>
                              <Button 
                                size="sm" 
                                variant="outline"
                                className="border-green-300 text-green-700 hover:bg-green-50"
                                onClick={() => {
                                  if (confirm(`Reactivate ${admin.first_name} ${admin.last_name}? They will be able to login again.`)) {
                                    handleApproveAdmin(admin.id)
                                  }
                                }}
                                disabled={processingId === admin.id}
                              >
                                {processingId === admin.id ? (
                                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                ) : (
                                  <UserCheck className="w-4 h-4 mr-2" />
                                )}
                                Reactivate
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {admins.length === 0 && !loading && (
                    <div className="text-center py-8 text-gray-500">
                      <Users className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                      <p>No administrators found</p>
                      <p className="text-sm mt-2">Admin registrations will appear here once submitted</p>
                    </div>
                  )}

                  {loading && (
                    <div className="text-center py-8">
                      <Loader2 className="w-8 h-8 mx-auto mb-4 animate-spin text-gray-400" />
                      <p className="text-gray-500">Loading administrators...</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}