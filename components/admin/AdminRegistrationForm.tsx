// components/admin/AdminRegistrationForm.tsx - FIXED VERSION

'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, Mail, Phone, ArrowLeft, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

interface FormData {
  organization: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  username: string;
  password: string;
  confirmPassword: string;
  experience: string;
  level: string;
  appointer: string;
}

interface VerificationData {
  type: 'email' | 'phone' | null;
  contact: string;
  verified: boolean;
}

export default function AdminRegistrationForm() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    organization: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    username: '',
    password: '',
    confirmPassword: '',
    experience: '',
    level: '',
    appointer: ''
  });

  const [verification, setVerification] = useState<VerificationData>({
    type: null,
    contact: '',
    verified: false
  });

  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    setError('');
  };

  const validateStep1 = () => {
    const required = ['organization', 'firstName', 'lastName', 'email', 'phone', 'username', 'password', 'confirmPassword'];
    const missing = required.filter(field => !formData[field as keyof FormData]);
    
    if (missing.length > 0) {
      setError(`Please fill in: ${missing.join(', ')}`);
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return false;
    }

    return true;
  };

  const handleNextStep = () => {
    if (validateStep1()) {
      setStep(2);
      setError('');
    }
  };

  const sendOTP = async (type: 'email' | 'phone') => {
    try {
      setLoading(true);
      setError('');
      
      const contact = type === 'email' ? formData.email : formData.phone;
      
      console.log('🚀 Step 1: Sending OTP...', { type, contact });
      
      const response = await fetch('/api/auth/admin/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          step: 'send-otp',
          verificationType: type, // ✅ FIXED: Make sure this is set
          email: formData.email,
          phone: formData.phone
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to send OTP');
      }

      setVerification({
        type,
        contact,
        verified: false
      });

      toast.success(`OTP sent to your ${type}`);
      console.log('✅ OTP sent successfully');
    } catch (error) {
      console.error('❌ Error sending OTP:', error);
      setError(error instanceof Error ? error.message : 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const verifyOTP = async () => {
    if (!verification.type) {
      setError('Please select a verification method first');
      return;
    }

    if (!otp || otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      console.log('🔍 Step 2: Verifying OTP...', { 
        otp, 
        contact: verification.contact, 
        type: verification.type 
      });

      const response = await fetch('/api/auth/admin/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          step: 'verify-otp',
          otp,
          contact: verification.contact,
          verificationType: verification.type // ✅ FIXED: Make sure this is set
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Invalid OTP');
      }

      setVerification(prev => ({
        ...prev,
        verified: true
      }));

      setStep(3);
      toast.success('Contact verified successfully!');
      console.log('✅ OTP verified successfully');
    } catch (error) {
      console.error('❌ Error verifying OTP:', error);
      setError(error instanceof Error ? error.message : 'Failed to verify OTP');
    } finally {
      setLoading(false);
    }
  };

  const submitRegistration = async () => {
    if (!verification.verified || !verification.type) {
      setError('Please verify your contact information first');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      console.log('📝 Step 3: Submitting registration...', {
        ...formData,
        verificationType: verification.type, // ✅ FIXED: Include verificationType
        verifiedContact: verification.contact
      });

      const response = await fetch('/api/auth/admin/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          step: 'complete-registration',
          ...formData,
          verificationType: verification.type, // ✅ FIXED: Critical fix
          verifiedContact: verification.contact,
          hasOTP: verification.verified // ✅ FIXED: Set this properly
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      setSuccess('Registration submitted successfully! Please wait for admin approval.');
      toast.success('Registration completed!');
      console.log('✅ Registration completed successfully');
      
      // Reset form after success
      setTimeout(() => {
        setStep(1);
        setFormData({
          organization: '',
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
          username: '',
          password: '',
          confirmPassword: '',
          experience: '',
          level: '',
          appointer: ''
        });
        setVerification({ type: null, contact: '', verified: false });
        setOtp('');
        setSuccess('');
      }, 3000);
      
    } catch (error) {
      console.error('❌ Error submitting registration:', error);
      setError(error instanceof Error ? error.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  // Show success message
  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-green-700 mb-2">Registration Successful!</h2>
            <p className="text-gray-600">{success}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center text-gray-800">
            Admin Registration
          </CardTitle>
          <CardDescription className="text-center">
            Step {step} of 3 - {step === 1 ? 'Basic Information' : step === 2 ? 'Contact Verification' : 'Review & Submit'}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Step 1: Basic Information */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="organization">Organization *</Label>
                  <Input
                    id="organization"
                    value={formData.organization}
                    onChange={(e) => handleInputChange('organization', e.target.value)}
                    placeholder="Enter organization name"
                  />
                </div>
                
                <div>
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    placeholder="Enter first name"
                  />
                </div>
                
                <div>
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    placeholder="Enter last name"
                  />
                </div>
                
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="Enter email address"
                  />
                </div>
                
                <div>
                  <Label htmlFor="phone">Phone *</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="Enter phone number"
                  />
                </div>
                
                <div>
                  <Label htmlFor="username">Username *</Label>
                  <Input
                    id="username"
                    value={formData.username}
                    onChange={(e) => handleInputChange('username', e.target.value)}
                    placeholder="Choose username"
                  />
                </div>
                
                <div>
                  <Label htmlFor="password">Password *</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    placeholder="Enter password"
                  />
                </div>
                
                <div>
                  <Label htmlFor="confirmPassword">Confirm Password *</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                    placeholder="Confirm password"
                  />
                </div>
                
                <div>
                  <Label htmlFor="experience">Experience</Label>
                  <Input
                    id="experience"
                    value={formData.experience}
                    onChange={(e) => handleInputChange('experience', e.target.value)}
                    placeholder="Years of experience"
                  />
                </div>
                
                <div>
                  <Label htmlFor="level">Level</Label>
                  <Select onValueChange={(value) => handleInputChange('level', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="junior">Junior</SelectItem>
                      <SelectItem value="mid">Mid-level</SelectItem>
                      <SelectItem value="senior">Senior</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="md:col-span-2">
                  <Label htmlFor="appointer">Appointer</Label>
                  <Input
                    id="appointer"
                    value={formData.appointer}
                    onChange={(e) => handleInputChange('appointer', e.target.value)}
                    placeholder="Who appointed you?"
                  />
                </div>
              </div>
              
              <Button onClick={handleNextStep} className="w-full" size="lg">
                Next: Verify Contact
              </Button>
            </div>
          )}

          {/* Step 2: Contact Verification */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="text-center">
                <p className="text-gray-600 mb-4">
                  To complete your registration, please verify your contact information by receiving an OTP.
                </p>
              </div>

              <div>
                <Label className="text-base font-semibold mb-4 block">Choose Verification Method</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button
                    variant={verification.type === 'phone' ? 'default' : 'outline'}
                    className="h-16 justify-start"
                    onClick={() => sendOTP('phone')}
                    disabled={loading}
                  >
                    <Phone className="w-5 h-5 mr-3" />
                    <div className="text-left">
                      <div className="font-medium">Phone SMS</div>
                      <div className="text-sm opacity-70">{formData.phone}</div>
                    </div>
                  </Button>
                  
                  <Button
                    variant={verification.type === 'email' ? 'default' : 'outline'}
                    className="h-16 justify-start"
                    onClick={() => sendOTP('email')}
                    disabled={loading}
                  >
                    <Mail className="w-5 h-5 mr-3" />
                    <div className="text-left">
                      <div className="font-medium">Email</div>
                      <div className="text-sm opacity-70">{formData.email}</div>
                    </div>
                  </Button>
                </div>
              </div>

              {verification.type && !verification.verified && (
                <div>
                  <Label htmlFor="otp">Enter 6-digit OTP</Label>
                  <div className="flex gap-2">
                    <Input
                      id="otp"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      placeholder="123456"
                      maxLength={6}
                      className="text-center text-xl tracking-wider"
                    />
                    <Button onClick={verifyOTP} disabled={loading || otp.length !== 6}>
                      Verify
                    </Button>
                  </div>
                </div>
              )}

              {verification.verified && (
                <Alert className="border-green-200 bg-green-50">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    Contact Verified Successfully! Your {verification.type} address has been verified.
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Previous
                </Button>
                {verification.verified && (
                  <Button onClick={() => setStep(3)} className="flex-1">
                    Review & Submit
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Step 3: Review & Submit */}
          {step === 3 && (
            <div className="space-y-6">
              {verification.verified && (
                <Alert className="border-green-200 bg-green-50">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    Contact verified successfully!
                  </AlertDescription>
                </Alert>
              )}
              
              <div>
                <h3 className="text-lg font-semibold mb-4">Registration Summary</h3>
                <div className="space-y-2 text-sm">
                  <div><strong>Organization:</strong> {formData.organization}</div>
                  <div><strong>Name:</strong> {formData.firstName} {formData.lastName}</div>
                  <div><strong>Email:</strong> {formData.email}</div>
                  <div><strong>Phone:</strong> {formData.phone}</div>
                  <div><strong>Username:</strong> {formData.username}</div>
                  <div><strong>Experience:</strong> {formData.experience}</div>
                  <div><strong>Level:</strong> {formData.level}</div>
                  <div><strong>Appointer:</strong> {formData.appointer}</div>
                  <div><strong>Verified Contact:</strong> {verification.contact} ({verification.type})</div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep(2)} className="flex-1">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Previous
                </Button>
                <Button 
                  onClick={submitRegistration} 
                  disabled={loading || !verification.verified}
                  className="flex-1"
                  size="lg"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Submit for Approval
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}