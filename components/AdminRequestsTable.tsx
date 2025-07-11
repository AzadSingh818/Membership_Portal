'use client'

import { useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'

interface AdminRequest {
  id: number
  email: string
  first_name?: string
  last_name?: string
  organization?: string
  status: 'pending' | 'approved' | 'rejected'
  requested_at?: string
  created_at?: string
  reviewed_at?: string
  reviewed_by?: number
}

export default function AdminRequestsTable() {
  const [requests, setRequests] = useState<AdminRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<number | null>(null)

  const fetchRequests = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/superadmin/admin-requests')
      const data = await response.json()
      
      if (response.ok) {
        setRequests(data.requests || [])
      } else {
        console.error('Failed to fetch admin requests:', data.error)
        toast.error('Failed to load admin requests')
      }
    } catch (error) {
      console.error('Error fetching admin requests:', error)
      toast.error('Error loading admin requests')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRequests()
  }, [])

  const handleAction = async (requestId: number, action: 'approve' | 'reject') => {
    try {
      setActionLoading(requestId)
      
      const response = await fetch(`/api/superadmin/admin-requests/${requestId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action }),
      })

      const data = await response.json()

      if (response.ok) {
        toast.success(data.message)
        await fetchRequests() // Refresh the list
      } else {
        toast.error(data.error || `Failed to ${action} request`)
      }
    } catch (error) {
      console.error(`Error ${action}ing request:`, error)
      toast.error(`Error ${action}ing request`)
    } finally {
      setActionLoading(null)
    }
  }

  const handleDelete = async (requestId: number) => {
    if (!confirm('Are you sure you want to delete this request?')) {
      return
    }

    try {
      setActionLoading(requestId)
      
      const response = await fetch(`/api/superadmin/admin-requests/${requestId}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (response.ok) {
        toast.success('Request deleted successfully')
        await fetchRequests() // Refresh the list
      } else {
        toast.error(data.error || 'Failed to delete request')
      }
    } catch (error) {
      console.error('Error deleting request:', error)
      toast.error('Error deleting request')
    } finally {
      setActionLoading(null)
    }
  }

  const getStatusBadge = (status: string) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800'
    }
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status as keyof typeof colors]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    )
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-12 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Admin Requests</h3>
        <p className="text-sm text-gray-600">Manage pending admin access requests</p>
      </div>

      {requests.length === 0 ? (
        <div className="p-6 text-center text-gray-500">
          <p>No admin requests found</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Organization
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Requested
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {requests.map((request) => (
                <tr key={request.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {request.first_name && request.last_name 
                          ? `${request.first_name} ${request.last_name}`
                          : 'Name not provided'
                        }
                      </div>
                      <div className="text-sm text-gray-500">{request.email}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {request.organization || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(request.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(request.requested_at || request.created_at)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                    {request.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleAction(request.id, 'approve')}
                          disabled={actionLoading === request.id}
                          className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                        >
                          {actionLoading === request.id ? 'Processing...' : 'Approve'}
                        </button>
                        <button
                          onClick={() => handleAction(request.id, 'reject')}
                          disabled={actionLoading === request.id}
                          className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                        >
                          {actionLoading === request.id ? 'Processing...' : 'Reject'}
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => handleDelete(request.id)}
                      disabled={actionLoading === request.id}
                      className="inline-flex items-center px-3 py-1 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
        <button
          onClick={fetchRequests}
          className="text-sm text-indigo-600 hover:text-indigo-900"
        >
          Refresh
        </button>
      </div>
    </div>
  )
}