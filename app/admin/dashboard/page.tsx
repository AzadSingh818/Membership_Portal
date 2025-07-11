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
  Mail,
  Phone,
  MapPin,
  Briefcase,
  Building,
  AlertCircle,
} from "lucide-react"
import Link from "next/link"
import { Label } from "@radix-ui/react-label"

interface MemberApplication {
  id: number
  first_name: string
  last_name: string
  email: string
  phone: string
  address: string
  designation?: string
  experience?: string
  achievements?: string
  payment_method?: string
  status: string
  created_at: string
  organization_name?: string
}

interface Member {
  id: number
  first_name: string
  last_name: string
  email: string
  phone?: string
  membership_id?: string
  status: string
  created_at: string
}

interface CurrentAdmin {
  id: string
  name: string
  username: string
  level: string
  email: string
  phone?: string
  experience?: string
  appointerName?: string
  organizationId?: number
  organizationName?: string
}

export default function AdminDashboard() {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [currentAdmin, setCurrentAdmin] = useState<CurrentAdmin | null>(null)
  const [memberApplications, setMemberApplications] = useState<MemberApplication[]>([])
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [selectedApplication, setSelectedApplication] = useState<MemberApplication | null>(null)
  const [showDetailsDialog, setShowDetailsDialog] = useState(false)

  useEffect(() => {
    // In a real app, get this from authentication context
    const demoAdmin = {
      id: "demo-admin-id",
      name: "Demo Admin",
      username: "demoadmin",
      level: "admin",
      email: "admin@demo.com",
      experience: "5 years",
      appointerName: "System Administrator",
      organizationId: 1,
      organizationName: "Demo Organization",
    }
    setCurrentAdmin(demoAdmin)
    
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      await Promise.all([
        fetchMemberApplications(),
        fetchMembers(),
      ])
    } catch (err) {
      setError("Failed to load dashboard data")
    } finally {
      setLoading(false)
    }
  }

  const fetchMemberApplications = async () => {
    try {
      // In a real app, this would use the admin's organization ID
      const response = await fetch("/api/admin/member-applications")
      if (response.ok) {
        const data = await response.json()
        setMemberApplications(data.applications || [])
      }
    } catch (err) {
      console.error("Failed to fetch member applications:", err)
    }
  }

  const fetchMembers = async () => {
    try {
      const response = await fetch("/api/admin/members")
      if (response.ok) {
        const data = await response.json()
        setMembers(data.members || [])
      }
    } catch (err) {
      console.error("Failed to fetch members:", err)
    }
  }

  const handleApproveMember = async (applicationId: number) => {
    try {
      const response = await fetch(`/api/admin/member-approve/${applicationId}`, {
        method: "POST",
      })
      
      if (response.ok) {
        setSuccess("Member application approved successfully")
        fetchMemberApplications()
        fetchMembers()
      } else {
        const data = await response.json()
        setError(data.error || "Failed to approve member application")
      }
    } catch (err) {
      setError("Error approving member application")
    }
  }

  const handleRejectMember = async (applicationId: number) => {
    try {
      const response = await fetch(`/api/admin/member-reject/${applicationId}`, {
        method: "POST",
      })
      
      if (response.ok) {
        setSuccess("Member application rejected")
        fetchMemberApplications()
      } else {
        const data = await response.json()
        setError(data.error || "Failed to reject member application")
      }
    } catch (err) {
      setError("Error rejecting member application")
    }
  }

  const handleViewDetails = (application: MemberApplication) => {
    setSelectedApplication(application)
    setShowDetailsDialog(true)
  }

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" })
      window.location.href = "/admin/login"
    } catch (err) {
      window.location.href = "/admin/login"
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: "Pending Review", variant: "secondary" as const },
      approved: { label: "Approved", variant: "default" as const },
      rejected: { label: "Rejected", variant: "destructive" as const },
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const getLevelBadge = (level: string) => {
    const config = {
      admin: { color: "bg-blue-100 text-blue-800", label: "Administrator" },
      senior_admin: { color: "bg-purple-100 text-purple-800", label: "Senior Admin" },
    }

    const levelConfig = config[level as keyof typeof config] || config.admin
    return <Badge className={levelConfig.color}>{levelConfig.label}</Badge>
  }

  const stats = [
    { 
      title: "Pending Applications", 
      value: memberApplications.filter(app => app.status === 'pending').length.toString(), 
      icon: Clock, 
      color: "bg-yellow-500" 
    },
    { 
      title: "Total Members", 
      value: members.length.toString(), 
      icon: Users, 
      color: "bg-blue-500" 
    },
    { 
      title: "Approved Today", 
      value: memberApplications.filter(app => 
        app.status === 'approved' && 
        new Date(app.created_at).toDateString() === new Date().toDateString()
      ).length.toString(), 
      icon: CheckCircle, 
      color: "bg-green-500" 
    },
    { 
      title: "Total Applications", 
      value: memberApplications.length.toString(), 
      icon: User, 
      color: "bg-purple-500" 
    },
  ]

  if (!currentAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card>
          <CardContent className="p-6 text-center">
            <Shield className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <h2 className="text-lg font-semibold mb-2">Access Denied</h2>
            <p className="text-gray-600 mb-4">Please login to access the admin dashboard.</p>
            <Link href="/admin/login">
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
                  <h1 className="text-xl font-semibold text-gray-900">Admin Dashboard</h1>
                  <p className="text-xs text-gray-500">Welcome, {currentAdmin.name}</p>
                </div>
              </div>
              {getLevelBadge(currentAdmin.level)}
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Avatar className="w-8 h-8">
                  <AvatarFallback className="bg-red-100 text-red-600">
                    {currentAdmin.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden sm:block">
                  <p className="text-sm font-medium text-gray-900">{currentAdmin.name}</p>
                  <p className="text-xs text-gray-500">@{currentAdmin.username}</p>
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

        {/* Admin Info Card */}
        <Card className="mb-6 bg-gradient-to-r from-red-50 to-red-100 border-red-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Avatar className="w-12 h-12">
                  <AvatarFallback className="bg-red-600 text-white">
                    {currentAdmin.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold text-gray-900">{currentAdmin.name}</h3>
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <span>@{currentAdmin.username}</span>
                    <span>•</span>
                    <span>{currentAdmin.email}</span>
                    {currentAdmin.experience && (
                      <>
                        <span>•</span>
                        <span>{currentAdmin.experience} experience</span>
                      </>
                    )}
                  </div>
                  {currentAdmin.organizationName && (
                    <div className="flex items-center text-xs text-gray-500 mt-1">
                      <Building className="w-3 h-3 mr-1" />
                      <span>{currentAdmin.organizationName}</span>
                    </div>
                  )}
                </div>
              </div>
              {getLevelBadge(currentAdmin.level)}
            </div>
          </CardContent>
        </Card>

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
        <Tabs defaultValue="applications" className="space-y-6">
          <TabsList>
            <TabsTrigger value="applications">Member Applications</TabsTrigger>
            <TabsTrigger value="members">Current Members</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          {/* Member Applications Tab */}
          <TabsContent value="applications">
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <CardTitle>Membership Applications</CardTitle>
                    <CardDescription>Review and approve/reject membership applications</CardDescription>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        placeholder="Search applications..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 w-full sm:w-64"
                      />
                    </div>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-full sm:w-40">
                        <Filter className="w-4 h-4 mr-2" />
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
                <div className="space-y-4">
                  {memberApplications
                    .filter(app => statusFilter === 'all' || app.status === statusFilter)
                    .filter(app => 
                      app.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      app.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      app.email.toLowerCase().includes(searchTerm.toLowerCase())
                    )
                    .map((application) => (
                    <div key={application.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-3">
                            <h3 className="font-medium text-gray-900">
                              {application.first_name} {application.last_name}
                            </h3>
                            {getStatusBadge(application.status)}
                          </div>
                          <div className="text-sm text-gray-600 space-y-1">
                            <div className="flex items-center gap-4">
                              <div className="flex items-center gap-1">
                                <Mail className="w-3 h-3" />
                                <span>{application.email}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Phone className="w-3 h-3" />
                                <span>{application.phone}</span>
                              </div>
                            </div>
                            {application.designation && (
                              <div className="flex items-center gap-1">
                                <Briefcase className="w-3 h-3" />
                                <span>{application.designation}</span>
                              </div>
                            )}
                            <p><strong>Applied:</strong> {new Date(application.created_at).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleViewDetails(application)}
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            View Details
                          </Button>
                          {application.status === "pending" && (
                            <>
                              <Button 
                                size="sm" 
                                className="bg-green-600 hover:bg-green-700"
                                onClick={() => handleApproveMember(application.id)}
                              >
                                <UserCheck className="w-4 h-4 mr-2" />
                                Approve
                              </Button>
                              <Button 
                                variant="destructive" 
                                size="sm"
                                onClick={() => handleRejectMember(application.id)}
                              >
                                <XCircle className="w-4 h-4 mr-2" />
                                Reject
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {memberApplications.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <Users className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                      <p>No membership applications found</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Current Members Tab */}
          <TabsContent value="members">
            <Card>
              <CardHeader>
                <CardTitle>Current Members</CardTitle>
                <CardDescription>View and manage organization members</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {members.map((member) => (
                    <div key={member.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-center">
                        <div className="space-y-1">
                          <h3 className="font-medium">
                            {member.first_name} {member.last_name}
                          </h3>
                          <div className="text-sm text-gray-600">
                            <div className="flex items-center gap-4">
                              <div className="flex items-center gap-1">
                                <Mail className="w-3 h-3" />
                                <span>{member.email}</span>
                              </div>
                              {member.phone && (
                                <div className="flex items-center gap-1">
                                  <Phone className="w-3 h-3" />
                                  <span>{member.phone}</span>
                                </div>
                              )}
                            </div>
                            {member.membership_id && (
                              <p><strong>Membership ID:</strong> {member.membership_id}</p>
                            )}
                            <p><strong>Joined:</strong> {new Date(member.created_at).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(member.status)}
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {members.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <Users className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                      <p>No members found</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>Administrator Settings</CardTitle>
                <CardDescription>Manage your admin account settings</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-500">
                  <Settings className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p>Admin settings will be displayed here</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Application Details Dialog */}
        <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Application Details</DialogTitle>
              <DialogDescription>
                Complete membership application information
              </DialogDescription>
            </DialogHeader>
            {selectedApplication && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Full Name</Label>
                    <p className="font-medium">{selectedApplication.first_name} {selectedApplication.last_name}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Status</Label>
                    <div className="mt-1">{getStatusBadge(selectedApplication.status)}</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Email</Label>
                    <p>{selectedApplication.email}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Phone</Label>
                    <p>{selectedApplication.phone}</p>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-600">Address</Label>
                  <p>{selectedApplication.address}</p>
                </div>

                {selectedApplication.designation && (
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Designation</Label>
                    <p>{selectedApplication.designation}</p>
                  </div>
                )}

                {selectedApplication.experience && (
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Experience</Label>
                    <p>{selectedApplication.experience}</p>
                  </div>
                )}

                {selectedApplication.achievements && (
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Achievements</Label>
                    <p className="text-sm">{selectedApplication.achievements}</p>
                  </div>
                )}

                {selectedApplication.payment_method && (
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Preferred Payment Method</Label>
                    <p>{selectedApplication.payment_method}</p>
                  </div>
                )}

                <div>
                  <Label className="text-sm font-medium text-gray-600">Application Date</Label>
                  <p>{new Date(selectedApplication.created_at).toLocaleDateString()}</p>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDetailsDialog(false)}>
                Close
              </Button>
              {selectedApplication?.status === "pending" && (
                <div className="flex gap-2">
                  <Button 
                    variant="destructive"
                    onClick={() => {
                      handleRejectMember(selectedApplication.id)
                      setShowDetailsDialog(false)
                    }}
                  >
                    Reject
                  </Button>
                  <Button 
                    className="bg-green-600 hover:bg-green-700"
                    onClick={() => {
                      handleApproveMember(selectedApplication.id)
                      setShowDetailsDialog(false)
                    }}
                  >
                    Approve
                  </Button>
                </div>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}