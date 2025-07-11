"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ArrowLeft, Send, Paperclip, Search, MoreVertical, Phone, Video, MessageSquare } from "lucide-react"
import Link from "next/link"

interface Message {
  id: string
  senderId: string
  content: string
  timestamp: string
  type: "text" | "file"
  fileName?: string
}

interface Contact {
  id: string
  name: string
  organization: string
  status: "online" | "offline" | "away"
  lastSeen: string
  avatar?: string
  unreadCount: number
  lastMessage: string
}

export default function ChatPage() {
  const [selectedContact, setSelectedContact] = useState<string | null>("2")
  const [message, setMessage] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const contacts: Contact[] = [
    {
      id: "1",
      name: "Dr. Sarah Johnson",
      organization: "Engineering Association",
      status: "online",
      lastSeen: "Online",
      unreadCount: 2,
      lastMessage: "Thanks for sharing the research paper!",
    },
    {
      id: "2",
      name: "Prof. Mike Wilson",
      organization: "Engineering Association",
      status: "away",
      lastSeen: "5 minutes ago",
      unreadCount: 0,
      lastMessage: "Looking forward to the conference",
    },
    {
      id: "3",
      name: "Ms. Emily Brown",
      organization: "Engineering Association",
      status: "offline",
      lastSeen: "2 hours ago",
      unreadCount: 1,
      lastMessage: "Can we schedule a meeting?",
    },
    {
      id: "4",
      name: "Mr. David Chen",
      organization: "Engineering Association",
      status: "online",
      lastSeen: "Online",
      unreadCount: 0,
      lastMessage: "Great presentation today!",
    },
  ]

  const messages: Record<string, Message[]> = {
    "2": [
      {
        id: "1",
        senderId: "2",
        content: "Hi John! How are you doing?",
        timestamp: "10:30 AM",
        type: "text",
      },
      {
        id: "2",
        senderId: "me",
        content: "Hey Mike! I'm doing well, thanks. How about you?",
        timestamp: "10:32 AM",
        type: "text",
      },
      {
        id: "3",
        senderId: "2",
        content: "I'm great! Looking forward to the upcoming conference. Are you planning to attend?",
        timestamp: "10:35 AM",
        type: "text",
      },
      {
        id: "4",
        senderId: "me",
        content: "I've already registered. It should be very informative.",
        timestamp: "10:37 AM",
        type: "text",
      },
      {
        id: "5",
        senderId: "2",
        content: "Conference_Schedule_2024.pdf",
        timestamp: "10:40 AM",
        type: "file",
        fileName: "Conference_Schedule_2024.pdf",
      },
    ],
  }

  const currentContact = contacts.find((c) => c.id === selectedContact)
  const currentMessages = selectedContact ? messages[selectedContact] || [] : []

  const handleSendMessage = () => {
    if (message.trim() && selectedContact) {
      // Add message logic here
      setMessage("")
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "online":
        return "bg-green-500"
      case "away":
        return "bg-yellow-500"
      case "offline":
        return "bg-gray-400"
      default:
        return "bg-gray-400"
    }
  }

  const filteredContacts = contacts.filter(
    (contact) =>
      contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.organization.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [currentMessages])

  return (
    <div className="h-screen bg-gray-50 flex">
      {/* Sidebar - Contacts List */}
      <div className="w-80 bg-white border-r flex flex-col">
        {/* Header */}
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-4">
            <Link href="/member/dashboard">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </Link>
            <h1 className="text-lg font-semibold">Messages</h1>
            <Button variant="ghost" size="sm">
              <MoreVertical className="w-4 h-4" />
            </Button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search contacts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Contacts List */}
        <ScrollArea className="flex-1">
          <div className="p-2">
            {filteredContacts.map((contact) => (
              <div
                key={contact.id}
                className={`p-3 rounded-lg cursor-pointer transition-colors mb-1 ${
                  selectedContact === contact.id ? "bg-blue-50 border border-blue-200" : "hover:bg-gray-50"
                }`}
                onClick={() => setSelectedContact(contact.id)}
              >
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={contact.avatar || "/placeholder.svg"} alt={contact.name} />
                      <AvatarFallback>
                        {contact.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div
                      className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${getStatusColor(contact.status)}`}
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium text-gray-900 truncate">{contact.name}</h3>
                      {contact.unreadCount > 0 && (
                        <Badge
                          variant="default"
                          className="bg-blue-600 text-white text-xs px-1.5 py-0.5 min-w-[20px] h-5"
                        >
                          {contact.unreadCount}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 truncate">{contact.organization}</p>
                    <p className="text-xs text-gray-600 truncate mt-0.5">{contact.lastMessage}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedContact && currentContact ? (
          <>
            {/* Chat Header */}
            <div className="bg-white border-b p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={currentContact.avatar || "/placeholder.svg"} alt={currentContact.name} />
                      <AvatarFallback>
                        {currentContact.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div
                      className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${getStatusColor(currentContact.status)}`}
                    />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">{currentContact.name}</h2>
                    <p className="text-sm text-gray-500">{currentContact.lastSeen}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Button variant="ghost" size="sm">
                    <Phone className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Video className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {currentMessages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.senderId === "me" ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        msg.senderId === "me" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-900"
                      }`}
                    >
                      {msg.type === "file" ? (
                        <div className="flex items-center space-x-2">
                          <Paperclip className="w-4 h-4" />
                          <span className="text-sm">{msg.fileName}</span>
                        </div>
                      ) : (
                        <p className="text-sm">{msg.content}</p>
                      )}
                      <p className={`text-xs mt-1 ${msg.senderId === "me" ? "text-blue-100" : "text-gray-500"}`}>
                        {msg.timestamp}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Message Input */}
            <div className="bg-white border-t p-4">
              <div className="flex items-center space-x-2">
                <Button variant="ghost" size="sm">
                  <Paperclip className="w-4 h-4" />
                </Button>
                <div className="flex-1">
                  <Input
                    placeholder="Type a message..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                  />
                </div>
                <Button onClick={handleSendMessage} disabled={!message.trim()}>
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          /* No Chat Selected */
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Select a conversation</h3>
              <p className="text-gray-500">Choose a contact from the sidebar to start chatting</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
