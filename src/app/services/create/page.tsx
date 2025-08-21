'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useAuth } from '@/contexts/auth-context'
import { 
  ArrowLeft, 
  GraduationCap, 
  Target, 
  Palette, 
  Video, 
  Zap,
  DollarSign,
  Clock,
  Save,
  CheckCircle,
  Loader2,
  Star
} from 'lucide-react'

const serviceTypes = [
  { value: 'TRAINING', label: 'Training', icon: GraduationCap, color: 'bg-blue-500' },
  { value: 'BASE_ANALYSIS', label: 'Base Analysis', icon: Target, color: 'bg-green-500' },
  { value: 'CUSTOM_DESIGN', label: 'Custom Design', icon: Palette, color: 'bg-purple-500' },
  { value: 'VIDEO_EDITING', label: 'Video Editing', icon: Video, color: 'bg-orange-500' },
  { value: 'STRATEGY', label: 'Strategy', icon: Zap, color: 'bg-red-500' },
]

const durations = [
  { value: '30 minutes', label: '30 minutes' },
  { value: '1 hour', label: '1 hour' },
  { value: '2 hours', label: '2 hours' },
  { value: '3 hours', label: '3 hours' },
  { value: '1 day', label: '1 day' },
  { value: '2-3 days', label: '2-3 days' },
  { value: '1 week', label: '1 week' },
  { value: '2 weeks', label: '2 weeks' },
  { value: '1 month', label: '1 month' },
]

export default function CreateServicePage() {
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: '',
    price: '',
    duration: '',
    requirements: '',
    deliveryMethod: '',
  })

  const router = useRouter()
  const { user } = useAuth()

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      // Validate required fields
      if (!formData.title.trim()) {
        throw new Error('Service title is required')
      }

      if (!formData.description.trim()) {
        throw new Error('Service description is required')
      }

      if (!formData.type) {
        throw new Error('Service type is required')
      }

      const price = parseFloat(formData.price)
      if (isNaN(price) || price <= 0) {
        throw new Error('Valid price is required')
      }

      if (!formData.duration) {
        throw new Error('Duration is required')
      }

      const response = await fetch('/api/services', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: formData.title.trim(),
          description: formData.description.trim(),
          type: formData.type,
          price,
          duration: formData.duration,
          requirements: formData.requirements.trim() || null,
          deliveryMethod: formData.deliveryMethod.trim() || null,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create service')
      }

      const data = await response.json()
      setSuccess(true)
      
      // Redirect to services page after a short delay
      setTimeout(() => {
        router.push('/services')
      }, 2000)

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create service')
    } finally {
      setSubmitting(false)
    }
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">Authentication Required</h1>
          <p className="text-muted-foreground mb-8">
            Please login to offer services.
          </p>
          <div className="flex gap-4 justify-center">
            <Button asChild>
              <Link href="/login">Login</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/register">Register</Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-md mx-auto">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <CardTitle>Service Created Successfully!</CardTitle>
            <CardDescription>
              Your service has been listed and is now available for booking.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/services">View Services</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const selectedServiceType = serviceTypes.find(st => st.value === formData.type)

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <Link href="/services" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="w-4 h-4" />
          Back to Services
        </Link>
        
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
            <Star className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-3xl font-bold mb-2">Create Service</h1>
            <p className="text-muted-foreground">
              Offer your expertise and help other Clash of Clans players improve
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Service Type Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="w-5 h-5" />
              Service Type
            </CardTitle>
            <CardDescription>
              Choose the type of service you want to offer
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {serviceTypes.map((type) => {
                const Icon = type.icon
                const isSelected = formData.type === type.value
                
                return (
                  <Card
                    key={type.value}
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      isSelected ? 'ring-2 ring-primary shadow-lg' : ''
                    }`}
                    onClick={() => handleInputChange('type', type.value)}
                  >
                    <CardContent className="p-4 text-center">
                      <div className={`w-12 h-12 ${type.color} rounded-full flex items-center justify-center mx-auto mb-3`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="font-medium mb-1">{type.label}</h3>
                      <div className={`w-4 h-4 rounded-full border-2 ${
                        isSelected 
                          ? 'bg-primary border-primary' 
                          : 'border-muted-foreground'
                      } mx-auto`} />
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {selectedServiceType ? (
                <>
                  <selectedServiceType.icon className="w-5 h-5" />
                  {selectedServiceType.label} Details
                </>
              ) : (
                <>
                  <Star className="w-5 h-5" />
                  Service Details
                </>
              )}
            </CardTitle>
            <CardDescription>
              Enter the details for your service
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Service Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="Enter a catchy title for your service"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Describe your service in detail..."
                rows={4}
                required
              />
            </div>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Price (USD) *</Label>
                <Input
                  id="price"
                  type="number"
                  min="1"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => handleInputChange('price', e.target.value)}
                  placeholder="0.00"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="duration">Duration *</Label>
                <Select value={formData.duration} onValueChange={(value) => handleInputChange('duration', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select duration" />
                  </SelectTrigger>
                  <SelectContent>
                    {durations.map(duration => (
                      <SelectItem key={duration.value} value={duration.value}>
                        {duration.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Additional Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Additional Information
            </CardTitle>
            <CardDescription>
              Provide more details about your service delivery
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="deliveryMethod">Delivery Method</Label>
              <Input
                id="deliveryMethod"
                value={formData.deliveryMethod}
                onChange={(e) => handleInputChange('deliveryMethod', e.target.value)}
                placeholder="e.g., Discord call, Video chat, Document delivery"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="requirements">Client Requirements</Label>
              <Textarea
                id="requirements"
                value={formData.requirements}
                onChange={(e) => handleInputChange('requirements', e.target.value)}
                placeholder="What should clients prepare or provide?"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Service Type Guidelines */}
        {selectedServiceType && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <selectedServiceType.icon className="w-5 h-5" />
                {selectedServiceType.label} Guidelines
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                {selectedServiceType.value === 'TRAINING' && (
                  <>
                    <p>• Focus on specific skills: attacking, defending, base building</p>
                    <p>• Provide personalized coaching sessions</p>
                    <p>• Include practice strategies and feedback</p>
                    <p>• Be prepared to demonstrate techniques</p>
                  </>
                )}
                {selectedServiceType.value === 'BASE_ANALYSIS' && (
                  <>
                    <p>• Analyze base layouts for strengths and weaknesses</p>
                    <p>• Provide detailed improvement suggestions</p>
                    <p>• Consider different attack strategies</p>
                    <p>• Include visual examples and diagrams</p>
                  </>
                )}
                {selectedServiceType.value === 'CUSTOM_DESIGN' && (
                  <>
                    <p>• Create unique base layouts for specific purposes</p>
                    <p>• Consider Town Hall level and available buildings</p>
                    <p>• Provide building placement rationale</p>
                    <p>• Include multiple design options if applicable</p>
                  </>
                )}
                {selectedServiceType.value === 'VIDEO_EDITING' && (
                  <>
                    <p>• Edit attack videos for highlights and analysis</p>
                    <p>• Add commentary and educational content</p>
                    <p>• Include slow-motion and zoom effects</p>
                    <p>• Deliver in requested format and quality</p>
                  </>
                )}
                {selectedServiceType.value === 'STRATEGY' && (
                  <>
                    <p>• Develop comprehensive war strategies</p>
                    <p>• Consider clan composition and opponent bases</p>
                    <p>• Provide attack plans and backup options</p>
                    <p>• Include timing and coordination details</p>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Submit Button */}
        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" asChild>
            <Link href="/services">Cancel</Link>
          </Button>
          <Button 
            type="submit" 
            disabled={submitting || !formData.type}
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Create Service
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}