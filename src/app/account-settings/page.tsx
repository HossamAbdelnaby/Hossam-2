'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { useAuth } from '@/contexts/auth-context'
import { 
  ArrowLeft,
  Save,
  Shield,
  Bell,
  Globe,
  Key,
  User,
  Crown,
  Trash2,
  Download
} from 'lucide-react'

export default function AccountSettingsPage() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    emailNotifications: true,
    pushNotifications: true,
    language: 'en',
    twoFactorEnabled: false
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loadingSave, setLoadingSave] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        language: user.language,
        twoFactorEnabled: false // This would come from user's 2FA status
      }))
    }
  }, [user])

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (formData.newPassword !== formData.confirmPassword) {
      setError('New passwords do not match')
      return
    }

    if (formData.newPassword.length < 8) {
      setError('New password must be at least 8 characters long')
      return
    }

    setLoadingSave(true)

    try {
      const response = await fetch('/api/user/change-password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess('Password changed successfully!')
        setFormData(prev => ({
          ...prev,
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        }))
      } else {
        setError(data.error || 'Failed to change password')
      }
    } catch (err) {
      setError('Network error. Please try again.')
    } finally {
      setLoadingSave(false)
    }
  }

  const handleSettingsSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoadingSave(true)

    try {
      const response = await fetch('/api/user/update-settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          language: formData.language,
          emailNotifications: formData.emailNotifications,
          pushNotifications: formData.pushNotifications
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess('Settings updated successfully!')
      } else {
        setError(data.error || 'Failed to update settings')
      }
    } catch (err) {
      setError('Network error. Please try again.')
    } finally {
      setLoadingSave(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (!showDeleteConfirm) {
      setShowDeleteConfirm(true)
      return
    }

    setLoadingSave(true)

    try {
      const response = await fetch('/api/user/delete-account', {
        method: 'DELETE',
      })

      if (response.ok) {
        // Redirect to home page after account deletion
        router.push('/')
        window.location.reload() // Force reload to clear auth state
      } else {
        const data = await response.json()
        setError(data.error || 'Failed to delete account')
        setShowDeleteConfirm(false)
      }
    } catch (err) {
      setError('Network error. Please try again.')
      setShowDeleteConfirm(false)
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
          <h1 className="text-3xl font-bold">Account Settings</h1>
          <p className="text-muted-foreground mt-2">
            Manage your account security and preferences
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - User Info */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Account Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center space-y-3">
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold">{user.name || 'Unnamed User'}</h3>
                    <p className="text-sm text-muted-foreground">@{user.username}</p>
                    <Badge className={`${getRoleBadgeColor(user.role)} shadow-sm`}>
                      {getRoleIcon(user.role)}
                      {user.role.replace('_', ' ')}
                    </Badge>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Email:</span>
                      <span className="font-medium">{user.email}</span>
                    </div>
                    {user.phone && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Phone:</span>
                        <span className="font-medium">{user.phone}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Member Since:</span>
                      <span className="font-medium">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  variant="outline" 
                  className="w-full justify-start gap-2"
                  onClick={() => router.push('/edit-profile')}
                >
                  <User className="w-4 h-4" />
                  Edit Profile
                </Button>
                
                <Button 
                  variant="outline" 
                  className="w-full justify-start gap-2"
                  onClick={() => {
                    // Export data functionality would go here
                    alert('Data export feature coming soon!')
                  }}
                >
                  <Download className="w-4 h-4" />
                  Export My Data
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Settings */}
          <div className="lg:col-span-2 space-y-6">
            {/* Password Change */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="w-5 h-5" />
                  Change Password
                </CardTitle>
                <CardDescription>
                  Update your password to keep your account secure
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handlePasswordChange} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">Current Password</Label>
                    <Input
                      id="currentPassword"
                      type="password"
                      placeholder="Enter current password"
                      value={formData.currentPassword}
                      onChange={(e) => handleInputChange('currentPassword', e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="newPassword">New Password</Label>
                      <Input
                        id="newPassword"
                        type="password"
                        placeholder="Enter new password"
                        value={formData.newPassword}
                        onChange={(e) => handleInputChange('newPassword', e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm New Password</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        placeholder="Confirm new password"
                        value={formData.confirmPassword}
                        onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                      />
                    </div>
                  </div>

                  <Button type="submit" disabled={loadingSave}>
                    {loadingSave ? 'Updating...' : 'Change Password'}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Notification Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="w-5 h-5" />
                  Notification Preferences
                </CardTitle>
                <CardDescription>
                  Choose how you want to receive notifications
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSettingsSave} className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Email Notifications</Label>
                        <p className="text-sm text-muted-foreground">
                          Receive notifications via email
                        </p>
                      </div>
                      <Switch
                        checked={formData.emailNotifications}
                        onCheckedChange={(checked) => handleInputChange('emailNotifications', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Push Notifications</Label>
                        <p className="text-sm text-muted-foreground">
                          Receive push notifications in browser
                        </p>
                      </div>
                      <Switch
                        checked={formData.pushNotifications}
                        onCheckedChange={(checked) => handleInputChange('pushNotifications', checked)}
                      />
                    </div>
                  </div>

                  <Separator />

                  {/* Language Settings */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Globe className="w-4 h-4" />
                      Language Preference
                    </Label>
                    <select
                      className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      value={formData.language}
                      onChange={(e) => handleInputChange('language', e.target.value)}
                    >
                      <option value="en">English</option>
                      <option value="ar">العربية (Arabic)</option>
                    </select>
                  </div>

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

                  <Button type="submit" disabled={loadingSave}>
                    {loadingSave ? 'Saving...' : 'Save Settings'}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Danger Zone */}
            <Card className="border-red-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-600">
                  <Trash2 className="w-5 h-5" />
                  Danger Zone
                </CardTitle>
                <CardDescription>
                  These actions are irreversible. Please proceed with caution.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                    <h4 className="font-semibold text-red-800 mb-2">Delete Account</h4>
                    <p className="text-sm text-red-700 mb-3">
                      Once you delete your account, there is no going back. This will permanently delete all your data, tournaments, and settings.
                    </p>
                    
                    {showDeleteConfirm ? (
                      <div className="space-y-3">
                        <p className="text-sm font-medium text-red-800">
                          Are you absolutely sure? Type "DELETE" to confirm:
                        </p>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            onClick={() => setShowDeleteConfirm(false)}
                          >
                            Cancel
                          </Button>
                          <Button
                            variant="destructive"
                            onClick={handleDeleteAccount}
                            disabled={loadingSave}
                          >
                            {loadingSave ? 'Deleting...' : 'Delete Account'}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Button
                        variant="destructive"
                        onClick={handleDeleteAccount}
                        disabled={loadingSave}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete Account
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}