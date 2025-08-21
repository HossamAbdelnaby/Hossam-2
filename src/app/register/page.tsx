'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PasswordInput } from '@/components/ui/password-input'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CountrySelector } from '@/components/ui/country-selector'
import { ImageUpload } from '@/components/ui/image-upload'
import { useAuth } from '@/contexts/auth-context'
import { Globe, User, Camera } from 'lucide-react'

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    isUrl: false,
    password: '',
    confirmPassword: '',
    name: '',
    phone: '',
    country: '',
    language: 'en',
    photoUrl: ''
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { register } = useAuth()
  const router = useRouter()

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const toggleInputType = () => {
    setFormData(prev => ({ ...prev, isUrl: !prev.isUrl, username: '' }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validate all required fields
    if (!formData.name.trim()) {
      setError('Full name is required')
      return
    }

    if (!formData.email.trim()) {
      setError('Email is required')
      return
    }

    if (!formData.username.trim()) {
      setError(formData.isUrl ? 'Custom URL is required' : 'Username is required')
      return
    }

    if (!formData.phone.trim()) {
      setError('Phone number is required')
      return
    }

    if (!formData.country) {
      setError('Country selection is required')
      return
    }

    if (!formData.photoUrl || formData.photoUrl.trim() === '') {
      setError('Personal photo is required. Please upload a photo before submitting.')
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long')
      return
    }

    if (formData.username.length < 3) {
      setError(formData.isUrl ? 'URL must be at least 3 characters long' : 'Username must be at least 3 characters long')
      return
    }

    // Additional validation for URLs
    if (formData.isUrl) {
      try {
        new URL(formData.username)
      } catch {
        setError('Please enter a valid URL (e.g., https://example.com)')
        return
      }
    }

    setLoading(true)

    try {
      const result = await register({
        email: formData.email,
        username: formData.username,
        password: formData.password,
        name: formData.name || undefined,
        phone: formData.phone || undefined,
        country: formData.country || undefined,
        language: formData.language,
        photoUrl: formData.photoUrl || undefined
      })
      if (result.success) {
        router.push('/')
      } else {
        setError(result.error || 'Registration failed')
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-secondary/5 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            Create Account
          </CardTitle>
          <CardDescription className="text-center">
            Join the Clash of Clans Tournament Platform
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                type="text"
                placeholder="Enter your full name"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="username">
                  {formData.isUrl ? 'Custom URL' : 'Username'}
                </Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={toggleInputType}
                  className="flex items-center gap-2 text-xs"
                >
                  {formData.isUrl ? (
                    <>
                      <User className="h-3 w-3" />
                      Use Username
                    </>
                  ) : (
                    <>
                      <Globe className="h-3 w-3" />
                      Use URL
                    </>
                  )}
                </Button>
              </div>
              <Input
                id="username"
                type="text"
                placeholder={formData.isUrl ? "https://your-website.com" : "Choose a username"}
                value={formData.username}
                onChange={(e) => handleChange('username', e.target.value)}
                required
              />
              {formData.isUrl && (
                <p className="text-xs text-muted-foreground">
                  Enter a valid URL that will serve as your unique identifier
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone *</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="Enter your phone number"
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                required
              />
            </div>
              <CountrySelector
              value={formData.country}
              onValueChange={(value) => handleChange('country', value)}
              label="Country"
              placeholder="Select your country"
              required={true}
            />
            <ImageUpload
              value={formData.photoUrl}
              onValueChange={(value) => handleChange('photoUrl', value)}
              label="Personal Photo"
              placeholder="Upload your personal photo"
              required={true}
              width={150}
              height={150}
              aspectRatio="1:1"
              maxSize={10}
              acceptedFormats={["image/jpeg", "image/png", "image/webp"]}
              type="photo"
            />
            <div className="space-y-2">
              <Label htmlFor="language">Preferred Language</Label>
              <Select
                value={formData.language}
                onValueChange={(value) => handleChange('language', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="ar">العربية (Arabic)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <PasswordInput
                id="password"
                placeholder="Create a password"
                value={formData.password}
                onChange={(e) => handleChange('password', e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <PasswordInput
                id="confirmPassword"
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChange={(e) => handleChange('confirmPassword', e.target.value)}
                required
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </Button>
            <div className="text-center text-sm">
              Already have an account?{' '}
              <Link href="/login" className="text-primary hover:underline">
                Sign in
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}