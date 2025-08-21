'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  User, 
  Mail, 
  Phone, 
  Globe, 
  Calendar, 
  Shield,
  Edit,
  LogOut,
  Settings,
  Bell,
  Copy,
  Check,
  Crown,
  Image as ImageIcon
} from 'lucide-react'

interface ProfileDialogProps {
  user: {
    id: string
    email: string
    username: string
    name?: string
    phone?: string
    role: string
    language: string
    avatar?: string
    createdAt: string
    country?: string
  }
  onLogout: () => void
  children: React.ReactNode
}

export function ProfileDialog({ user, onLogout, children }: ProfileDialogProps) {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState('')
  const [currentAvatar, setCurrentAvatar] = useState(user.avatar || '/coc-barbarian.png')
  const [showAvatarOptions, setShowAvatarOptions] = useState(false)
  const router = useRouter()

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

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(type)
      setTimeout(() => setCopied(''), 2000)
    } catch (err) {
      console.error('Failed to copy: ', err)
    }
  }

  const handleAvatarSelect = async (avatarUrl: string) => {
    try {
      const response = await fetch('/api/user/update-profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: user.name,
          username: user.username,
          email: user.email,
          phone: user.phone,
          language: user.language,
          avatar: avatarUrl
        }),
      })

      if (response.ok) {
        setCurrentAvatar(avatarUrl)
        setShowAvatarOptions(false)
        // Update the user data in the parent component if needed
        // This will be reflected when the dialog reopens
      } else {
        console.error('Failed to update avatar')
      }
    } catch (error) {
      console.error('Error updating avatar:', error)
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
        return <Shield className="w-3 h-3 mr-1" />
      case 'MODERATOR':
        return <Shield className="w-3 h-3 mr-1" />
      case 'PLAYER':
        return <Crown className="w-3 h-3 mr-1" />
      default:
        return <User className="w-3 h-3 mr-1" />
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-primary" />
            </div>
            Profile
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Profile Header */}
          <div className="flex flex-col items-center space-y-4">
            <div className="relative">
              <Avatar className="w-20 h-20 ring-4 ring-primary/10">
                <AvatarImage src={currentAvatar} alt={user.name || user.email} />
                <AvatarFallback className="text-lg bg-gradient-to-br from-primary/20 to-primary/10 text-primary">
                  {(user.name || user.email).charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-background flex items-center justify-center">
                <div className="w-2 h-2 bg-white rounded-full"></div>
              </div>
              <Button
                size="sm"
                className="absolute -top-1 -right-1 w-6 h-6 p-0 rounded-full bg-primary hover:bg-primary/90"
                onClick={() => setShowAvatarOptions(!showAvatarOptions)}
              >
                <ImageIcon className="w-3 h-3 text-white" />
              </Button>
            </div>
            
            {/* Avatar Options */}
            {showAvatarOptions && (
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 bg-background border rounded-lg shadow-lg p-4 z-50 w-80">
                <div className="space-y-3">
                  <div className="text-center">
                    <p className="text-sm font-medium mb-2">Choose Your Avatar</p>
                    <p className="text-xs text-muted-foreground">Select a Clash of Clans character</p>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {predefinedAvatars.map((avatar, index) => (
                      <button
                        key={index}
                        className="w-12 h-12 rounded-full overflow-hidden border-2 border-transparent hover:border-primary/50 transition-all"
                        onClick={() => handleAvatarSelect(avatar)}
                      >
                        <img 
                          src={avatar} 
                          alt={`CoC Character ${index + 1}`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.src = '/coc-barbarian.png'
                          }}
                        />
                      </button>
                    ))}
                  </div>
                  <div className="text-center">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setShowAvatarOptions(false)
                        router.push('/edit-profile')
                      }}
                      className="text-xs"
                    >
                      <ImageIcon className="w-3 h-3 mr-1" />
                      Upload Custom Photo
                    </Button>
                  </div>
                </div>
              </div>
            )}
            
            <div className="text-center space-y-2">
              <h3 className="text-lg font-semibold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                {user.name || 'Unnamed User'}
              </h3>
              <div className="flex items-center gap-2 justify-center">
                <p className="text-sm text-muted-foreground">
                  @{user.username}
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 hover:bg-primary/10"
                  onClick={() => copyToClipboard(user.username, 'username')}
                >
                  {copied === 'username' ? (
                    <Check className="w-3 h-3 text-green-600" />
                  ) : (
                    <Copy className="w-3 h-3 text-muted-foreground" />
                  )}
                </Button>
              </div>
              <Badge className={`${getRoleBadgeColor(user.role)} shadow-sm`}>
                {getRoleIcon(user.role)}
                {user.role.replace('_', ' ')}
              </Badge>
            </div>
          </div>

          <Separator className="my-4" />

          {/* Profile Details */}
          <div className="space-y-4">
            <div className="flex items-center gap-3 group">
              <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                <Mail className="w-4 h-4 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-blue-900">Email</p>
                <div className="flex items-center gap-2">
                  <p className="text-sm text-blue-700 truncate">{user.email}</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 hover:bg-blue-100"
                    onClick={() => copyToClipboard(user.email, 'email')}
                  >
                    {copied === 'email' ? (
                      <Check className="w-3 h-3 text-green-600" />
                    ) : (
                      <Copy className="w-3 h-3 text-blue-500" />
                    )}
                  </Button>
                </div>
              </div>
            </div>

            {user.phone && (
              <div className="flex items-center gap-3 group">
                <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Phone className="w-4 h-4 text-green-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-green-900">Phone</p>
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-green-700">{user.phone}</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 hover:bg-green-100"
                      onClick={() => copyToClipboard(user.phone || '', 'phone')}
                    >
                      {copied === 'phone' ? (
                        <Check className="w-3 h-3 text-green-600" />
                      ) : (
                        <Copy className="w-3 h-3 text-green-500" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {user.country && (
              <div className="flex items-center gap-3 group">
                <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Globe className="w-4 h-4 text-purple-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-purple-900">Country</p>
                  <p className="text-sm text-purple-700">{user.country}</p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-3 group">
              <div className="w-8 h-8 bg-orange-50 rounded-lg flex items-center justify-center flex-shrink-0">
                <Calendar className="w-4 h-4 text-orange-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-orange-900">Member Since</p>
                <p className="text-sm text-orange-700">{formatDate(user.createdAt)}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 group">
              <div className="w-8 h-8 bg-cyan-50 rounded-lg flex items-center justify-center flex-shrink-0">
                <Shield className="w-4 h-4 text-cyan-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-cyan-900">Language</p>
                <p className="text-sm text-cyan-700">
                  {user.language === 'ar' ? 'العربية (Arabic)' : 'English'}
                </p>
              </div>
            </div>
          </div>

          <Separator className="my-4" />

          {/* Action Buttons */}
          <div className="space-y-2">
            <Button 
              variant="outline" 
              className="w-full justify-start gap-2 hover:bg-primary/5 hover:text-primary hover:border-primary/20 transition-all duration-200"
              onClick={() => {
                setOpen(false)
                router.push('/account-settings')
              }}
            >
              <Settings className="w-4 h-4" />
              Account Settings
            </Button>

            <Button 
              variant="outline" 
              className="w-full justify-start gap-2 hover:bg-primary/5 hover:text-primary hover:border-primary/20 transition-all duration-200"
              onClick={() => {
                setOpen(false)
                // Navigate to notifications page if exists, or keep it for future functionality
              }}
            >
              <Bell className="w-4 h-4" />
              Notifications
            </Button>

            <Button 
              variant="outline" 
              className="w-full justify-start gap-2 hover:bg-primary/5 hover:text-primary hover:border-primary/20 transition-all duration-200"
              onClick={() => {
                setOpen(false)
                router.push('/edit-profile')
              }}
            >
              <Edit className="w-4 h-4" />
              Edit Profile
            </Button>

            <Button 
              variant="destructive" 
              className="w-full justify-start gap-2 hover:bg-red-600 transition-all duration-200"
              onClick={() => {
                setOpen(false)
                onLogout()
              }}
            >
              <LogOut className="w-4 h-4" />
              Logout
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}