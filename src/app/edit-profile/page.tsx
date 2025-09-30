'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { AvatarUpload } from '@/components/ui/avatar-upload'
import { useAuth } from '@/contexts/auth-context'
import { 
  User, 
  Mail, 
  Phone, 
  Globe, 
  ArrowLeft,
  Save,
  Upload,
  Crown,
  FileText
} from 'lucide-react'

export default function EditProfilePage() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: '',
    phone: '',
    description: '',
    language: 'en'
  })
  const [selectedAvatar, setSelectedAvatar] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loadingSave, setLoadingSave] = useState(false)

  const predefinedAvatars = [
    '/coc-barbarian.png',
    '/coc-archer.png',
    '/coc-giant.png',
    '/coc-wizard.png',
    '/coc-dragon.png',
    '/coc-pekka.png',
    '/coc-hogrider.png',
    '/coc-valkyrie.png'
  ]

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        username: user.username,
        email: user.email,
        phone: user.phone || '',
        description: user.description || '',
        language: user.language
      })
      setSelectedAvatar(user.avatar || '/clash-royale-avatar.png')
    }
  }, [user])

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleAvatarSelect = (avatarUrl: string) => {
    setSelectedAvatar(avatarUrl)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoadingSave(true)

    try {
      const response = await fetch('/api/user/update-profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          avatar: selectedAvatar
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess('Profile updated successfully!')
        // Update the user context
        setTimeout(() => {
          router.push('/')
        }, 1500)
      } else {
        setError(data.error || 'Failed to update profile')
      }
    } catch (err) {
      setError('Network error. Please try again.')
    } finally {
      setLoadingSave(false)
    }
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return 'bg-gradient-to-r from-red-500 to-red-600 text-white border-0'
      case 'ADMIN':
        return 'bg-gradient-to-r from-orange-500 to-orange-600 text-white border-0'
      case 'MODERATOR':
        return 'bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0'
      case 'PLAYER':
        return 'bg-gradient-to-r from-green-500 to-green-600 text-white border-0'
      default:
        return 'bg-gradient-to-r from-gray-500 to-gray-600 text-white border-0'
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return <Crown className="w-3 h-3 mr-1" />
      case 'ADMIN':
        return <Crown className="w-3 h-3 mr-1" />
      case 'MODERATOR':
        return <Crown className="w-3 h-3 mr-1" />
      case 'PLAYER':
        return <Crown className="w-3 h-3 mr-1" />
      default:
        return <User className="w-3 h-3 mr-1" />
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-muted-foreground">Please login to access this page.</p>
              <Button className="mt-4" onClick={() => router.push('/login')}>
                Login
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            className="mb-4"
            onClick={() => router.push('/')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
          <h1 className="text-3xl font-bold">Edit Profile</h1>
          <p className="text-muted-foreground mt-2">
            Update your personal information and preferences
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Avatar Preview */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Profile Preview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col items-center space-y-4">
                  <Avatar className="w-24 h-24 ring-4 ring-primary/10">
                    <AvatarImage src={selectedAvatar} alt={formData.name || formData.email} />
                    <AvatarFallback className="text-lg bg-gradient-to-br from-primary/20 to-primary/10 text-primary">
                      {(formData.name || formData.email).charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="text-center space-y-2">
                    <h3 className="text-lg font-semibold">
                      {formData.name || 'Unnamed User'}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      @{formData.username}
                    </p>
                    <Badge className={`${getRoleBadgeColor(user.role)} shadow-sm`}>
                      {getRoleIcon(user.role)}
                      {user.role.replace('_', ' ')}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Avatar Selection */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="w-5 h-5" />
                  Choose Avatar
                </CardTitle>
                <CardDescription>
                  Select from our Clash of Clans character collection or upload your own photo
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Custom Avatar Upload */}
                <div>
                  <h4 className="text-sm font-medium mb-3">Upload Your Photo</h4>
                  <AvatarUpload
                    currentAvatar={selectedAvatar}
                    onAvatarChange={handleAvatarSelect}
                  />
                </div>

                <Separator />

                {/* Predefined Avatars */}
                <div>
                  <h4 className="text-sm font-medium mb-3">Clash of Clans Characters</h4>
                  <div className="grid grid-cols-2 gap-3">
                    {predefinedAvatars.map((avatar, index) => (
                      <button
                        key={index}
                        className={`p-1 rounded-lg border-2 transition-all ${
                          selectedAvatar === avatar 
                            ? 'border-primary bg-primary/5' 
                            : 'border-transparent hover:border-primary/30'
                        }`}
                        onClick={() => handleAvatarSelect(avatar)}
                      >
                        <img 
                          src={avatar} 
                          alt={`CoC Character ${index + 1}`}
                          className="w-full h-20 object-cover rounded-md"
                          onError={(e) => {
                            e.currentTarget.src = '/coc-barbarian.png'
                          }}
                        />
                      </button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>
                  Update your personal details and contact information
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}
                  
                  {success && (
                    <Alert className="border-green-200 bg-green-50">
                      <AlertDescription className="text-green-800">{success}</AlertDescription>
                    </Alert>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        Full Name
                      </Label>
                      <Input
                        id="name"
                        type="text"
                        placeholder="Enter your full name"
                        value={formData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="username" className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        Username
                      </Label>
                      <Input
                        id="username"
                        type="text"
                        placeholder="Enter your username"
                        value={formData.username}
                        onChange={(e) => handleInputChange('username', e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      Email Address
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone" className="flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      Phone Number
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="Enter your phone number"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description" className="flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      Personal Information
                    </Label>
                    <Textarea
                      id="description"
                      placeholder="Tell us about yourself..."
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      rows={4}
                      className="resize-none"
                    />
                    <p className="text-xs text-muted-foreground">
                      This information will be visible on your public profile
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="language" className="flex items-center gap-2">
                      <Globe className="w-4 h-4" />
                      Language
                    </Label>
                    <select
                      id="language"
                      className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      value={formData.language}
                      onChange={(e) => handleInputChange('language', e.target.value)}
                    >
                      <option value="en">English</option>
                      <option value="ar">العربية (Arabic)</option>
                    </select>
                  </div>

                  <Separator />

                  <div className="flex justify-end gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => router.push('/')}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={loadingSave}
                      className="min-w-[120px]"
                    >
                      {loadingSave ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          Save Changes
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}