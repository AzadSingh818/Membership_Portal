"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Bell,
  X,
  CheckCircle,
  MessageSquare,
  UserPlus,
  FileText,
  Calendar,
  Settings,
  BookMarkedIcon as MarkAsRead,
} from "lucide-react"

interface Notification {
  id: string
  type: "approval" | "message" | "connection" | "document" | "event" | "system"
  title: string
  message: string
  timestamp: string
  isRead: boolean
  actionUrl?: string
  avatar?: string
  priority: "low" | "medium" | "high"
}

interface NotificationCenterProps {
  isOpen: boolean
  onClose: () => void
}

export function NotificationCenter({ isOpen, onClose }: NotificationCenterProps) {
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: "1",
      type: "approval",
      title: "Membership Approved",
      message: "Your membership application has been approved by the committee.",
      timestamp: "2 minutes ago",
      isRead: false,
      priority: "high",
    },
    {
      id: "2",
      type: "message",
      title: "New Message from Dr. Sarah Johnson",
      message: "Thanks for sharing the research paper! Looking forward to discussing it.",
      timestamp: "15 minutes ago",
      isRead: false,
      priority: "medium",
      actionUrl: "/member/chat?contact=1",
    },
    {
      id: "3",
      type: "connection",
      title: "New Connection Request",
      message: "Prof. Mike Wilson wants to connect with you.",
      timestamp: "1 hour ago",
      isRead: false,
      priority: "medium",
    },
    {
      id: "4",
      type: "document",
      title: "Document Verification Complete",
      message: "Your Aadhaar card has been successfully verified.",
      timestamp: "2 hours ago",
      isRead: true,
      priority: "low",
    },
    {
      id: "5",
      type: "event",
      title: "Upcoming Conference",
      message: "Engineering Conference 2024 starts in 3 days. Don't forget to register!",
      timestamp: "1 day ago",
      isRead: true,
      priority: "medium",
    },
    {
      id: "6",
      type: "system",
      title: "Profile Completion Reminder",
      message: "Complete your profile to unlock all features. You're 85% done!",
      timestamp: "2 days ago",
      isRead: true,
      priority: "low",
    },
  ])

  const unreadCount = notifications.filter((n) => !n.isRead).length

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "approval":
        return CheckCircle
      case "message":
        return MessageSquare
      case "connection":
        return UserPlus
      case "document":
        return FileText
      case "event":
        return Calendar
      case "system":
        return Settings
      default:
        return Bell
    }
  }

  const getNotificationColor = (type: string, priority: string) => {
    if (priority === "high") return "text-red-600 bg-red-100"
    if (type === "approval") return "text-green-600 bg-green-100"
    if (type === "message") return "text-blue-600 bg-blue-100"
    if (type === "connection") return "text-purple-600 bg-purple-100"
    return "text-gray-600 bg-gray-100"
  }

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((notification) => (notification.id === id ? { ...notification, isRead: true } : notification)),
    )
  }

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((notification) => ({ ...notification, isRead: true })))
  }

  const deleteNotification = (id: string) => {
    setNotifications((prev) => prev.filter((notification) => notification.id !== id))
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm">
      <div className="fixed right-4 top-16 w-96 max-h-[80vh] bg-white rounded-lg shadow-xl border">
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center space-x-2">
            <Bell className="w-5 h-5" />
            <h2 className="font-semibold">Notifications</h2>
            {unreadCount > 0 && (
              <Badge variant="default" className="bg-red-600">
                {unreadCount}
              </Badge>
            )}
          </div>
          <div className="flex items-center space-x-2">
            {unreadCount > 0 && (
              <Button variant="ghost" size="sm" onClick={markAllAsRead}>
                <MarkAsRead className="w-4 h-4" />
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <ScrollArea className="max-h-96">
          <div className="p-2">
            {notifications.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Bell className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p>No notifications</p>
              </div>
            ) : (
              notifications.map((notification) => {
                const Icon = getNotificationIcon(notification.type)
                return (
                  <div
                    key={notification.id}
                    className={`p-3 rounded-lg mb-2 cursor-pointer transition-colors ${
                      notification.isRead ? "bg-gray-50 hover:bg-gray-100" : "bg-blue-50 hover:bg-blue-100"
                    }`}
                    onClick={() => {
                      markAsRead(notification.id)
                      if (notification.actionUrl) {
                        window.location.href = notification.actionUrl
                      }
                    }}
                  >
                    <div className="flex items-start space-x-3">
                      <div
                        className={`p-2 rounded-full ${getNotificationColor(notification.type, notification.priority)}`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <h4
                            className={`text-sm font-medium ${!notification.isRead ? "text-gray-900" : "text-gray-700"}`}
                          >
                            {notification.title}
                          </h4>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                            onClick={(e) => {
                              e.stopPropagation()
                              deleteNotification(notification.id)
                            }}
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>

                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">{notification.message}</p>

                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-gray-500">{notification.timestamp}</span>
                          {!notification.isRead && <div className="w-2 h-2 bg-blue-600 rounded-full" />}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </ScrollArea>

        {notifications.length > 0 && (
          <div className="p-4 border-t">
            <Button variant="outline" className="w-full" size="sm">
              View All Notifications
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

// Hook for managing notifications
export function useNotifications() {
  const [isOpen, setIsOpen] = useState(false)
  const [hasNewNotifications, setHasNewNotifications] = useState(true)

  // Simulate real-time notifications
  useEffect(() => {
    const interval = setInterval(() => {
      // Simulate receiving new notifications
      if (Math.random() > 0.8) {
        setHasNewNotifications(true)
      }
    }, 30000) // Check every 30 seconds

    return () => clearInterval(interval)
  }, [])

  const toggleNotifications = () => {
    setIsOpen(!isOpen)
    if (!isOpen) {
      setHasNewNotifications(false)
    }
  }

  return {
    isOpen,
    hasNewNotifications,
    toggleNotifications,
    closeNotifications: () => setIsOpen(false),
  }
}
