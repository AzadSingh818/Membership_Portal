"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  ArrowLeft,
  Search,
  Filter,
  Users,
  MessageSquare,
  Phone,
  Mail,
  MapPin,
  Building,
  Star,
  Grid,
  List,
} from "lucide-react"
import Link from "next/link"

interface Member {
  id: string
  name: string
  designation: string
  organization: string
  department?: string
  joinDate: string
  status: "active" | "inactive" | "pending"
  location: string
  email: string
  phone: string
  specialization: string[]
  profilePhoto?: string
  isOnline: boolean
  lastSeen: string
  rating: number
  connections: number
}

export default function MemberDirectory() {
  const [searchTerm, setSearchTerm] = useState("")
  const [organizationFilter, setOrganizationFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")

  const members: Member[] = [
    {
      id: "1",
      name: "Dr. Sarah Johnson",
      designation: "Senior Research Engineer",
      organization: "Engineering Association",
      department: "Research & Development",
      joinDate: "2022-03-15",
      status: "active",
      location: "New York, NY",
      email: "sarah.johnson@example.com",
      phone: "+1 (555) 123-4567",
      specialization: ["AI/ML", "Robotics", "IoT"],
      isOnline: true,
      lastSeen: "Online",
      rating: 4.8,
      connections: 156,
    },
    {
      id: "2",
      name: "Prof. Mike Wilson",
      designation: "Department Head",
      organization: "Engineering Association",
      department: "Mechanical Engineering",
      joinDate: "2020-08-22",
      status: "active",
      location: "Boston, MA",
      email: "mike.wilson@example.com",
      phone: "+1 (555) 234-5678",
      specialization: ["Thermodynamics", "Manufacturing", "Design"],
      isOnline: false,
      lastSeen: "2 hours ago",
      rating: 4.9,
      connections: 203,
    },
    {
      id: "3",
      name: "Ms. Emily Brown",
      designation: "Software Architect",
      organization: "Engineering Association",
      department: "Software Engineering",
      joinDate: "2023-01-10",
      status: "active",
      location: "San Francisco, CA",
      email: "emily.brown@example.com",
      phone: "+1 (555) 345-6789",
      specialization: ["Cloud Computing", "DevOps", "Security"],
      isOnline: true,
      lastSeen: "Online",
      rating: 4.7,
      connections: 89,
    },
    {
      id: "4",
      name: "Dr. David Chen",
      designation: "Principal Engineer",
      organization: "Medical Council",
      department: "Biomedical Engineering",
      joinDate: "2021-11-05",
      status: "active",
      location: "Chicago, IL",
      email: "david.chen@example.com",
      phone: "+1 (555) 456-7890",
      specialization: ["Medical Devices", "Biomechanics", "FDA Compliance"],
      isOnline: false,
      lastSeen: "1 day ago",
      rating: 4.6,
      connections: 134,
    },
    {
      id: "5",
      name: "Ms. Lisa Anderson",
      designation: "Project Manager",
      organization: "Business Chamber",
      department: "Operations",
      joinDate: "2022-07-18",
      status: "active",
      location: "Austin, TX",
      email: "lisa.anderson@example.com",
      phone: "+1 (555) 567-8901",
      specialization: ["Project Management", "Agile", "Strategy"],
      isOnline: true,
      lastSeen: "Online",
      rating: 4.5,
      connections: 178,
    },
    {
      id: "6",
      name: "Mr. Robert Taylor",
      designation: "Legal Advisor",
      organization: "Legal Society",
      department: "Corporate Law",
      joinDate: "2019-04-12",
      status: "active",
      location: "Washington, DC",
      email: "robert.taylor@example.com",
      phone: "+1 (555) 678-9012",
      specialization: ["Corporate Law", "Compliance", "Contracts"],
      isOnline: false,
      lastSeen: "3 hours ago",
      rating: 4.8,
      connections: 245,
    },
  ]

  const organizations = ["Engineering Association", "Medical Council", "Business Chamber", "Legal Society"]

  const filteredMembers = members.filter((member) => {
    const matchesSearch =
      member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.designation.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.specialization.some((spec) => spec.toLowerCase().includes(searchTerm.toLowerCase()))

    const matchesOrganization = organizationFilter === "all" || member.organization === organizationFilter
    const matchesStatus = statusFilter === "all" || member.status === statusFilter

    return matchesSearch && matchesOrganization && matchesStatus
  })

  const getStatusBadge = (status: string) => {
    const config = {
      active: { color: "bg-green-100 text-green-800", label: "Active" },
      inactive: { color: "bg-gray-100 text-gray-800", label: "Inactive" },
      pending: { color: "bg-yellow-100 text-yellow-800", label: "Pending" },
    }

    const statusConfig = config[status as keyof typeof config]
    return <Badge className={statusConfig.color}>{statusConfig.label}</Badge>
  }

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-3 h-3 ${i < Math.floor(rating) ? "text-yellow-400 fill-current" : "text-gray-300"}`}
      />
    ))
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div className="flex items-center space-x-4">
            <Link href="/member/dashboard">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Member Directory</h1>
              <p className="text-gray-600">Connect with fellow members across organizations</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Button variant={viewMode === "grid" ? "default" : "outline"} size="sm" onClick={() => setViewMode("grid")}>
              <Grid className="w-4 h-4" />
            </Button>
            <Button variant={viewMode === "list" ? "default" : "outline"} size="sm" onClick={() => setViewMode("list")}>
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search members by name, designation, or specialization..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <Select value={organizationFilter} onValueChange={setOrganizationFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <Building className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Organization" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Organizations</SelectItem>
                  {organizations.map((org) => (
                    <SelectItem key={org} value={org}>
                      {org}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-32">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Results Summary */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-gray-600">
            Showing {filteredMembers.length} of {members.length} members
          </p>
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <Users className="w-4 h-4" />
            <span>{members.filter((m) => m.isOnline).length} online</span>
          </div>
        </div>

        {/* Members Grid/List */}
        {viewMode === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMembers.map((member) => (
              <Card key={member.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start space-x-4">
                    <div className="relative">
                      <Avatar className="w-16 h-16">
                        <AvatarImage src={member.profilePhoto || "/placeholder.svg"} alt={member.name} />
                        <AvatarFallback>
                          {member.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      {member.isOnline && (
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-gray-900 truncate">{member.name}</h3>
                          <p className="text-sm text-gray-600 truncate">{member.designation}</p>
                        </div>
                        {getStatusBadge(member.status)}
                      </div>

                      <div className="mt-2 space-y-1">
                        <div className="flex items-center text-xs text-gray-500">
                          <Building className="w-3 h-3 mr-1" />
                          <span className="truncate">{member.organization}</span>
                        </div>
                        <div className="flex items-center text-xs text-gray-500">
                          <MapPin className="w-3 h-3 mr-1" />
                          <span className="truncate">{member.location}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          {renderStars(member.rating)}
                          <span className="text-xs text-gray-500 ml-1">({member.rating})</span>
                        </div>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-1">
                        {member.specialization.slice(0, 2).map((spec, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {spec}
                          </Badge>
                        ))}
                        {member.specialization.length > 2 && (
                          <Badge variant="secondary" className="text-xs">
                            +{member.specialization.length - 2}
                          </Badge>
                        )}
                      </div>

                      <div className="mt-4 flex space-x-2">
                        <Link href={`/member/chat?contact=${member.id}`}>
                          <Button size="sm" className="flex-1">
                            <MessageSquare className="w-3 h-3 mr-1" />
                            Chat
                          </Button>
                        </Link>
                        <Button variant="outline" size="sm">
                          <Phone className="w-3 h-3" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Mail className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-0">
              <div className="divide-y">
                {filteredMembers.map((member) => (
                  <div key={member.id} className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="relative">
                          <Avatar className="w-12 h-12">
                            <AvatarImage src={member.profilePhoto || "/placeholder.svg"} alt={member.name} />
                            <AvatarFallback>
                              {member.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </AvatarFallback>
                          </Avatar>
                          {member.isOnline && (
                            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                          )}
                        </div>

                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            <h3 className="font-semibold text-gray-900">{member.name}</h3>
                            {getStatusBadge(member.status)}
                            <div className="flex items-center space-x-1">
                              {renderStars(member.rating)}
                              <span className="text-xs text-gray-500">({member.rating})</span>
                            </div>
                          </div>

                          <div className="flex items-center space-x-4 mt-1 text-sm text-gray-600">
                            <span>{member.designation}</span>
                            <span>•</span>
                            <span>{member.organization}</span>
                            <span>•</span>
                            <span>{member.location}</span>
                            <span>•</span>
                            <span>{member.connections} connections</span>
                          </div>

                          <div className="flex items-center space-x-2 mt-2">
                            {member.specialization.map((spec, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {spec}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Link href={`/member/chat?contact=${member.id}`}>
                          <Button size="sm">
                            <MessageSquare className="w-4 h-4 mr-2" />
                            Chat
                          </Button>
                        </Link>
                        <Button variant="outline" size="sm">
                          <Phone className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Mail className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {filteredMembers.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No members found</h3>
              <p className="text-gray-600 mb-4">Try adjusting your search criteria or filters to find more members.</p>
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm("")
                  setOrganizationFilter("all")
                  setStatusFilter("all")
                }}
              >
                Clear Filters
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
