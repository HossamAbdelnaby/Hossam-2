'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Upload, 
  Camera, 
  X, 
  Check,
  Loader2
} from 'lucide-react'

interface AvatarUploadProps {
  currentAvatar?: string
  onAvatarChange: (avatarUrl: string) => void
  className?: string
}

export function AvatarUpload({ currentAvatar, onAvatarChange, className = '' }: AvatarUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      setError('Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.')
      return
    }

    // Validate file size (5MB limit)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      setError('File too large. Maximum size is 5MB.')
      return
    }

    // Create preview
    const reader = new FileReader()
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string)
    }
    reader.readAsDataURL(file)

    setError('')
    setSuccess('')
  }

  const handleUpload = async () => {
    const file = fileInputRef.current?.files?.[0]
    if (!file) return

    setUploading(true)
    setError('')
    setSuccess('')

    try {
      const formData = new FormData()
      formData.append('avatar', file)

      const response = await fetch('/api/user/upload-avatar', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess('Avatar uploaded successfully!')
        onAvatarChange(data.avatarUrl)
        // Clear preview and file input
        setPreviewUrl(null)
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
      } else {
        setError(data.error || 'Failed to upload avatar')
      }
    } catch (err) {
      setError('Network error. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  const handleCancel = () => {
    setPreviewUrl(null)
    setError('')
    setSuccess('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Current Avatar */}
      <div className="flex flex-col items-center space-y-2">
        <Avatar className="w-24 h-24 ring-4 ring-primary/10">
          <AvatarImage src={currentAvatar} alt="Current avatar" />
          <AvatarFallback className="text-lg bg-gradient-to-br from-primary/20 to-primary/10 text-primary">
            ?
          </AvatarFallback>
        </Avatar>
        <p className="text-sm text-muted-foreground">Current Avatar</p>
      </div>

      {/* Upload Section */}
      <Card>
        <CardContent className="p-4">
          <div className="space-y-4">
            {/* File Input */}
            <div className="flex flex-col items-center space-y-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                onChange={handleFileSelect}
                className="hidden"
                id="avatar-upload"
              />
              <label
                htmlFor="avatar-upload"
                className="cursor-pointer inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
              >
                <Camera className="w-4 h-4 mr-2" />
                Choose Photo
              </label>
              <p className="text-xs text-muted-foreground">
                JPEG, PNG, GIF, WebP (max 5MB)
              </p>
            </div>

            {/* Preview */}
            {previewUrl && (
              <div className="space-y-3">
                <div className="flex flex-col items-center space-y-2">
                  <Avatar className="w-20 h-20 ring-2 ring-primary/20">
                    <AvatarImage src={previewUrl} alt="Preview" />
                    <AvatarFallback>
                      <Camera className="w-6 h-6" />
                    </AvatarFallback>
                  </Avatar>
                  <p className="text-sm text-muted-foreground">Preview</p>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 justify-center">
                  <Button
                    onClick={handleUpload}
                    disabled={uploading}
                    size="sm"
                  >
                    {uploading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Upload className="w-4 h-4" />
                    )}
                    {uploading ? 'Uploading...' : 'Upload'}
                  </Button>
                  <Button
                    onClick={handleCancel}
                    variant="outline"
                    size="sm"
                  >
                    <X className="w-4 h-4" />
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {/* Messages */}
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="border-green-200 bg-green-50">
                <AlertDescription className="text-green-800 flex items-center">
                  <Check className="w-4 h-4 mr-2" />
                  {success}
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}