"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { Users, Shield, Award, Phone, Mail, MapPin, Clock, Menu, X, Crown } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

// Type definitions
type LoginMethod = "phone" | "email" | "membership"

interface ToastProps {
  title: string
  description: string
  variant?: "default" | "destructive"
}

// Main component
const HomePage: React.FC = () => {
  // State management with proper TypeScript types
  const [loginMethod, setLoginMethod] = useState<LoginMethod>("phone")
  const [contact, setContact] = useState<string>("")
  const [membershipId, setMembershipId] = useState<string>("")
  const [otp, setOtp] = useState<string>("")
  const [showOTP, setShowOTP] = useState<boolean>(false)
  const [loading, setLoading] = useState<boolean>(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false)

  // Hooks
  const router = useRouter()
  const { toast } = useToast()

  // Event handlers
  const handleSendOTP = async (): Promise<void> => {
    if (!contact && loginMethod !== "membership") {
      toast({
        title: "Error",
        description: "Please enter your contact information",
        variant: "destructive",
      })
      return
    }

    if (loginMethod === "membership" && !membershipId) {
      toast({
        title: "Error",
        description: "Please enter your membership ID",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      if (loginMethod === "membership") {
        if (!membershipId || membershipId.trim().length < 5) {
          toast({
            title: "Error",
            description: "Please enter a valid membership ID",
            variant: "destructive",
          })
          return
        }

        // ✅ Set authentication token for direct access
        try {
          setLoading(true)

          // Create a simple auth token for demonstration
          const demoToken = btoa(JSON.stringify({
            id: "demo-member-id",
            membershipId: membershipId,
            role: "member",
            type: "member",
            exp: Date.now() + 24 * 60 * 60 * 1000 // 24 hours
          }))

          // Set token in cookie
          document.cookie = `auth-token=${demoToken}; path=/; max-age=${24 * 60 * 60}`

          toast({
            title: "Success",
            description: "Login successful!",
          })

          setTimeout(() => {
            router.push("/member/dashboard")
          }, 1000)

        } catch (error) {
          toast({
            title: "Error",
            description: "Login failed. Please try again.",
            variant: "destructive",
          })
        } finally {
          setLoading(false)
        }
      } else {
        // Send OTP
        const response = await fetch("/api/auth/send-otp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contact,
            type: loginMethod,
          }),
        })

        if (response.ok) {
          setShowOTP(true)
          toast({
            title: "OTP Sent",
            description: `Verification code sent to your ${loginMethod}`,
          })
        } else {
          const error = await response.json()
          toast({
            title: "Error",
            description: error.error || "Failed to send OTP",
            variant: "destructive",
          })
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOTP = async (): Promise<void> => {
    if (!otp) {
      toast({
        title: "Error",
        description: "Please enter the OTP",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      const response = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contact,
          otp,
          type: loginMethod,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        toast({
          title: "Success",
          description: "Email Verification successful!",
        })
        setShowOTP(false) // Hide the OTP box
        setContact("")    // Clear the email/phone input
        setOtp("")        // Clear the OTP input as well
        router.push("/member/dashboard")
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.error || "Invalid OTP",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const scrollToSection = (sectionId: string): void => {
    const element = document.getElementById(sectionId)
    if (element) {
      element.scrollIntoView({ behavior: "smooth" })
    }
    setMobileMenuOpen(false)
  }

  const handleLoginMethodChange = (value: string): void => {
    setLoginMethod(value as LoginMethod)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setContact(e.target.value)
  }

  const handleMembershipIdChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setMembershipId(e.target.value)
  }

  const handleOtpChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setOtp(e.target.value)
  }

  const toggleMobileMenu = (): void => {
    setMobileMenuOpen(!mobileMenuOpen)
  }

  const navigateToRegister = (): void => {
    router.push("/register")
  }

  const navigateToAdminLogin = (): void => {
    router.push("/admin/login")
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">MemberPortal</span>
            </div>

            {/* Desktop Navigation Links */}
            <div className="hidden md:flex items-center space-x-8">
              <button
                onClick={() => scrollToSection("home")}
                className="text-gray-700 hover:text-blue-600 font-medium transition-colors"
                type="button"
              >
                Home
              </button>
              <button
                onClick={() => scrollToSection("about")}
                className="text-gray-700 hover:text-blue-600 font-medium transition-colors"
                type="button"
              >
                About
              </button>
              <button
                onClick={() => scrollToSection("services")}
                className="text-gray-700 hover:text-blue-600 font-medium transition-colors"
                type="button"
              >
                Services
              </button>
              <button
                onClick={() => scrollToSection("contact")}
                className="text-gray-700 hover:text-blue-600 font-medium transition-colors"
                type="button"
              >
                Contact
              </button>
              <Button
                variant="outline"
                onClick={navigateToAdminLogin}
                className="ml-4"
              >
                Admin Login
              </Button>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <Button variant="ghost" size="sm" onClick={toggleMobileMenu}>
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </Button>
            </div>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden border-t bg-white py-4">
              <div className="flex flex-col space-y-4">
                <button
                  onClick={() => scrollToSection("home")}
                  className="text-left text-gray-700 hover:text-blue-600 font-medium py-2"
                  type="button"
                >
                  Home
                </button>
                <button
                  onClick={() => scrollToSection("about")}
                  className="text-left text-gray-700 hover:text-blue-600 font-medium py-2"
                  type="button"
                >
                  About
                </button>
                <button
                  onClick={() => scrollToSection("services")}
                  className="text-left text-gray-700 hover:text-blue-600 font-medium py-2"
                  type="button"
                >
                  Services
                </button>
                <button
                  onClick={() => scrollToSection("contact")}
                  className="text-left text-gray-700 hover:text-blue-600 font-medium py-2"
                  type="button"
                >
                  Contact
                </button>
                <Button
                  variant="outline"
                  onClick={navigateToAdminLogin}
                  className="w-full justify-start"
                >
                  Admin Login
                </Button>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section id="home" className="bg-gradient-to-br from-blue-50 to-indigo-100 py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center max-w-7xl mx-auto">
            {/* Left Content */}
            <div className="text-center lg:text-left">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                Professional Membership Management Made Simple
              </h1>
              <p className="text-lg md:text-xl text-gray-600 mb-8 max-w-2xl mx-auto lg:mx-0">
                Connect with leading professional organizations, manage your memberships, and advance your career with
                our comprehensive platform.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Button size="lg" onClick={navigateToRegister} className="text-base px-8 py-3">
                  Apply for Membership
                </Button>
                <Button size="lg" variant="outline" className="text-base px-8 py-3">
                  Learn More
                </Button>
              </div>
            </div>

            {/* Right - Login Section */}
            <div className="flex justify-center lg:justify-end">
              <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl">Member Login</CardTitle>
                  <CardDescription>Access your membership dashboard</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <Tabs value={loginMethod} onValueChange={handleLoginMethodChange}>
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="phone" className="text-sm">
                        Phone
                      </TabsTrigger>
                      <TabsTrigger value="email" className="text-sm">
                        Email
                      </TabsTrigger>
                      <TabsTrigger value="membership" className="text-sm">
                        Membership ID
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="phone" className="space-y-4 mt-6">
                      <div className="space-y-2">
                        <Label htmlFor="phone" className="text-sm font-medium">
                          Phone Number
                        </Label>
                        <Input
                          id="phone"
                          type="tel"
                          placeholder="+1-555-0123"
                          value={contact}
                          onChange={handleInputChange}
                          className="h-11"
                        />
                      </div>
                    </TabsContent>

                    <TabsContent value="email" className="space-y-4 mt-6">
                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-sm font-medium">
                          Email Address
                        </Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="your@email.com"
                          value={contact}
                          onChange={handleInputChange}
                          className="h-11"
                        />
                      </div>
                    </TabsContent>

                    <TabsContent value="membership" className="space-y-4 mt-6">
                      <div className="space-y-2">
                        <Label htmlFor="membership" className="text-sm font-medium">
                          Membership ID
                        </Label>
                        <Input
                          id="membership"
                          placeholder="ENG-0001"
                          value={membershipId}
                          onChange={handleMembershipIdChange}
                          className="h-11"
                        />
                      </div>
                    </TabsContent>
                  </Tabs>

                  {showOTP && loginMethod !== "membership" && (
                    <div className="space-y-2">
                      <Label htmlFor="otp" className="text-sm font-medium">
                        Verification Code
                      </Label>
                      <Input
                        id="otp"
                        placeholder="Enter 6-digit code"
                        value={otp}
                        onChange={handleOtpChange}
                        maxLength={6}
                        className="h-11"
                      />
                    </div>
                  )}

                  <div className="space-y-4">
                    {!showOTP || loginMethod === "membership" ? (
                      <Button onClick={handleSendOTP} className="w-full h-11" disabled={loading}>
                        {loading ? "Processing..." : loginMethod === "membership" ? "Login" : "Send Verification Code"}
                      </Button>
                    ) : (
                      <Button onClick={handleVerifyOTP} className="w-full h-11" disabled={loading}>
                        {loading ? "Verifying..." : "Verify & Login"}
                      </Button>
                    )}
                    <div className="text-center">
                      <Button variant="link" onClick={navigateToRegister} className="text-sm">
                        Apply for Membership
                      </Button>
                    </div>

                    {/* Synchronized Login Links */}
                    <div className="flex justify-center space-x-6 text-sm border-t pt-4">
                      <Link
                        href="/admin/login"
                        className="text-gray-600 hover:text-gray-800 inline-flex items-center transition-colors"
                      >
                        <Shield className="w-4 h-4 mr-1" />
                        Admin Login
                      </Link>
                      <Link
                        href="/superadmin/login"
                        className="text-gray-600 hover:text-gray-800 inline-flex items-center transition-colors"
                      >
                        <Crown className="w-4 h-4 mr-1" />
                        Superadmin
                      </Link>
                      <Link
                        href="/member/login"
                        className="text-gray-600 hover:text-gray-800 inline-flex items-center transition-colors"
                      >
                        <Clock className="w-4 h-4 mr-1" />
                        Member status
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-16 md:py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-7xl mx-auto">
            {/* Section Header */}
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">About MemberPortal</h2>
              <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                We are dedicated to revolutionizing how professional organizations manage memberships and how
                professionals connect with industry communities.
              </p>
            </div>

            {/* About Content */}
            <div className="grid lg:grid-cols-2 gap-12 items-center mb-16">
              <div className="order-2 lg:order-1">
                <Image
                  src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80"
                  alt="Professional business meeting and collaboration"
                  width={600}
                  height={500}
                  className="rounded-lg shadow-lg w-full"
                />
              </div>
              <div className="order-1 lg:order-2 space-y-6">
                <h3 className="text-2xl md:text-3xl font-bold text-gray-900">Our Mission</h3>
                <p className="text-gray-600 text-lg leading-relaxed">
                  To bridge the gap between professional organizations and their members by providing innovative,
                  secure, and user-friendly membership management solutions that foster growth, networking, and
                  professional development.
                </p>
                <div className="space-y-4">
                  {/* <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center mt-1">
                      <span className="text-white text-sm">✓</span>
                    </div>
                    <span className="text-gray-700">
                      Founded in 2020 with a vision to modernize membership management
                    </span>
                  </div> */}
                  {/* <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center mt-1">
                      <span className="text-white text-sm">✓</span>
                    </div>
                    <span className="text-gray-700">Serving over 50 professional organizations worldwide</span>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center mt-1">
                      <span className="text-white text-sm">✓</span>
                    </div>
                    <span className="text-gray-700">Trusted by 10,000+ active professional members</span>
                  </div> */}
                </div>
              </div>
            </div>

            {/* Features Grid */}
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center p-6">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Users className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold mb-4">Professional Networks</h3>
                <p className="text-gray-600 leading-relaxed">
                  Connect with industry professionals and expand your network through verified membership organizations
                  across various sectors and specialties.
                </p>
              </div>

              <div className="text-center p-6">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Shield className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold mb-4">Secure Management</h3>
                <p className="text-gray-600 leading-relaxed">
                  Your membership data is protected with enterprise-grade security, encryption, and privacy measures
                  that meet industry standards.
                </p>
              </div>

              <div className="text-center p-6">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Award className="w-8 h-8 text-purple-600" />
                </div>
                <h3 className="text-xl font-semibold mb-4">Career Growth</h3>
                <p className="text-gray-600 leading-relaxed">
                  Access exclusive opportunities, professional certifications, and valuable resources designed to
                  advance your career and expertise.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-16 md:py-24 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-7xl mx-auto">
            {/* Section Header */}
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">Our Services</h2>
              <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                Comprehensive membership management solutions designed to enhance your professional experience and
                organizational efficiency.
              </p>
            </div>

            {/* Services Content */}
            <div className="grid lg:grid-cols-2 gap-12 items-center mb-16">
              <div className="space-y-8">
                <div>
                  <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">Complete Membership Solutions</h3>
                  <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                    Our platform offers a comprehensive suite of tools and services designed to streamline membership
                    management and enhance professional networking experiences.
                  </p>
                </div>

                <div className="space-y-6">
                  <div className="flex items-start space-x-4">
                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center mt-1">
                      <span className="text-white text-sm font-bold">1</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Digital Membership Management</h4>
                      <p className="text-gray-600">
                        Digital membership cards, certificates, and automated renewal systems
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center mt-1">
                      <span className="text-white text-sm font-bold">2</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Event Management</h4>
                      <p className="text-gray-600">
                        Event registration, networking opportunities, and professional conferences
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center mt-1">
                      <span className="text-white text-sm font-bold">3</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Professional Development</h4>
                      <p className="text-gray-600">
                        Training resources, certification programs, and career advancement tools
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center mt-1">
                      <span className="text-white text-sm font-bold">4</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Communication Hub</h4>
                      <p className="text-gray-600">Member directory, messaging systems, and community forums</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-center">
                <Image
                  src="https://images.unsplash.com/photo-1552664730-d307ca884978?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80"
                  alt="Membership services dashboard"
                  width={600}
                  height={500}
                  className="rounded-lg shadow-lg w-full max-w-lg"
                />
              </div>
            </div>

            {/* Statistics Section */}
            {/* <div className="bg-blue-600 rounded-2xl p-8 md:p-12">
              <div className="grid md:grid-cols-4 gap-8 text-center text-white">
                <div>
                  <div className="text-3xl md:text-4xl font-bold mb-2">10,000+</div>
                  <div className="text-blue-100 text-sm md:text-base">Active Members</div>
                </div>
                <div>
                  <div className="text-3xl md:text-4xl font-bold mb-2">50+</div>
                  <div className="text-blue-100 text-sm md:text-base">Partner Organizations</div>
                </div>
                <div>
                  <div className="text-3xl md:text-4xl font-bold mb-2">500+</div>
                  <div className="text-blue-100 text-sm md:text-base">Events Hosted</div>
                </div>
                <div>
                  <div className="text-3xl md:text-4xl font-bold mb-2">98%</div>
                  <div className="text-blue-100 text-sm md:text-base">Satisfaction Rate</div>
                </div>
              </div>
            </div> */}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-16 md:py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-7xl mx-auto">
            {/* Section Header */}
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">Get in Touch</h2>
              <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                Have questions about membership or need support? We're here to help you get started and make the most of
                your professional journey.
              </p>
            </div>

            {/* Contact Content */}
            <div className="grid lg:grid-cols-2 gap-12 mb-16">
              {/* Contact Information */}
              <div className="space-y-8">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-6">Contact Information</h3>
                  <p className="text-gray-600 mb-8 leading-relaxed">
                    Reach out to us through any of the following channels. Our support team is available Monday through
                    Friday to assist with your membership needs.
                  </p>
                </div>

                <div className="space-y-6">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <Phone className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">Phone Support</h4>
                      <p className="text-gray-600 mb-1">+1 (555) 123-4567</p>
                      <p className="text-sm text-gray-500">Monday - Friday, 9AM - 6PM EST</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <Mail className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">Email Support</h4>
                      <p className="text-gray-600 mb-1">support@memberportal.com</p>
                      <p className="text-sm text-gray-500">Response within 24 hours</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <MapPin className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">Office Address</h4>
                      <p className="text-gray-600">
                        123 Business Avenue, Suite 100
                        <br />
                        New York, NY 10001
                        <br />
                        United States
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <Clock className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">Business Hours</h4>
                      <p className="text-gray-600">
                        Monday - Friday: 9:00 AM - 6:00 PM
                        <br />
                        Saturday: 10:00 AM - 2:00 PM
                        <br />
                        Sunday: Closed
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Contact Image */}
              <div className="flex justify-center lg:justify-end">
                <Image
                  src="https://images.unsplash.com/photo-1556761175-b413da4baf72?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80"
                  alt="Customer support team"
                  width={600}
                  height={500}
                  className="rounded-lg shadow-lg w-full max-w-lg"
                />
              </div>
            </div>

            {/* Quick Contact Cards */}
            <div className="grid md:grid-cols-3 gap-6">
              <Card className="p-6 text-center hover:shadow-lg transition-shadow">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">New Members</h3>
                <p className="text-gray-600 text-sm mb-4">
                  Questions about joining? We'll help you find the right organization.
                </p>
                <Button variant="outline" size="sm" onClick={navigateToRegister}>
                  Get Started
                </Button>
              </Card>

              <Card className="p-6 text-center hover:shadow-lg transition-shadow">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Technical Support</h3>
                <p className="text-gray-600 text-sm mb-4">
                  Having trouble with your account? Our tech team is here to help.
                </p>
                <Button variant="outline" size="sm">
                  Contact Support
                </Button>
              </Card>

              <Card className="p-6 text-center hover:shadow-lg transition-shadow">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Award className="w-8 h-8 text-purple-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Organizations</h3>
                <p className="text-gray-600 text-sm mb-4">
                  Interested in partnering with us? Let's discuss opportunities.
                </p>
                <Button variant="outline" size="sm">
                  Learn More
                </Button>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-7xl mx-auto">
            <div className="grid md:grid-cols-4 gap-8 mb-8">
              {/* Brand Column */}
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-xl font-bold">MemberPortal</span>
                </div>
                <p className="text-gray-400 leading-relaxed">
                  Connecting professionals through comprehensive membership management solutions that drive career
                  growth and industry networking.
                </p>
              </div>

              {/* Quick Links */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Quick Links</h3>
                <ul className="space-y-3 text-gray-400">
                  <li>
                    <button
                      onClick={() => scrollToSection("home")}
                      className="hover:text-white transition-colors"
                      type="button"
                    >
                      Home
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => scrollToSection("about")}
                      className="hover:text-white transition-colors"
                      type="button"
                    >
                      About Us
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => scrollToSection("services")}
                      className="hover:text-white transition-colors"
                      type="button"
                    >
                      Services
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => scrollToSection("contact")}
                      className="hover:text-white transition-colors"
                      type="button"
                    >
                      Contact
                    </button>
                  </li>
                </ul>
              </div>

              {/* Services */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Services</h3>
                <ul className="space-y-3 text-gray-400">
                  <li>
                    <a href="#" className="hover:text-white transition-colors">
                      Membership Management
                    </a>
                  </li>
                  <li>
                    <a href="#" className="hover:text-white transition-colors">
                      Event Planning
                    </a>
                  </li>
                  <li>
                    <a href="#" className="hover:text-white transition-colors">
                      Professional Development
                    </a>
                  </li>
                  <li>
                    <a href="#" className="hover:text-white transition-colors">
                      Networking Solutions
                    </a>
                  </li>
                </ul>
              </div>

              {/* Contact Info */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Contact Info</h3>
                <div className="space-y-3 text-gray-400">
                  <div className="flex items-center space-x-3">
                    <Phone className="w-4 h-4" />
                    <span>+1 (555) 123-4567</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Mail className="w-4 h-4" />
                    <span>support@memberportal.com</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <MapPin className="w-4 h-4" />
                    <span>New York, NY 10001</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Clock className="w-4 h-4" />
                    <span>Mon-Fri 9AM-6PM EST</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Bottom */}
            <div className="border-t border-gray-800 pt-8 text-center">
              <p className="text-gray-400">
                &copy; 2024 MemberPortal. All rights reserved. | Privacy Policy | Terms of Service
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default HomePage