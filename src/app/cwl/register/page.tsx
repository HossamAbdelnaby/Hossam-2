'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/contexts/auth-context'
import { 
  ArrowLeft, 
  Shield, 
  Crown,
  Users, 
  Loader2,
  Save,
  CheckCircle
} from 'lucide-react'

export default function CWLRegisterPage() {
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  
  const [formData, setFormData] = useState({
    name: '',
    tag: '',
    leagueLevel: '',
    membersNeeded: '',
    offeredPayment: '',
    terms: '',
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
      if (!formData.name.trim()) {
        throw new Error('Clan name is required')
      }

      if (!formData.tag.trim()) {
        throw new Error('Clan tag is required')
      }

      const leagueLevel = parseInt(formData.leagueLevel)
      if (isNaN(leagueLevel) || leagueLevel < 1 || leagueLevel > 3) {
        throw new Error('Valid league level (1-3) is required')
      }

      const membersNeeded = parseInt(formData.membersNeeded)
      if (isNaN(membersNeeded) || membersNeeded < 1 || membersNeeded > 15) {
        throw new Error('Valid members needed (1-15) is required')
      }

      const offeredPayment = parseFloat(formData.offeredPayment)
      if (isNaN(offeredPayment) || offeredPayment < 0) {
        throw new Error('Valid payment amount is required')
      }

      if (!formData.terms.trim()) {
        throw new Error('Terms and conditions are required')
      }

      const response = await fetch('/api/cwl', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          tag: formData.tag.trim(),
          leagueLevel,
          membersNeeded,
          offeredPayment,
          terms: formData.terms.trim(),
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to register clan')
      }

      const data = await response.json()
      setSuccess(true)
      
      // Redirect to CWL clans page after a short delay to see the newly registered clan
      setTimeout(() => {
        router.push('/cwl')
      }, 2000)

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to register clan')
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
            Please login to register your clan for CWL.
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
            <CardTitle>Clan Registered Successfully!</CardTitle>
            <CardDescription>
              Your CWL clan has been registered and is now visible for other players to join. You will be redirected to the CWL clans page.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/cwl">View CWL Clans</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <Link href="/cwl" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="w-4 h-4" />
          Back to CWL
        </Link>
        
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
            <Shield className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-3xl font-bold mb-2">Register Clan for CWL</h1>
            <p className="text-muted-foreground">
              Register your clan to participate in Clan War Leagues and compete with the best
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

        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Clan Information
            </CardTitle>
            <CardDescription>
              Enter your clan's basic details for CWL registration
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Clan Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Enter clan name"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="tag">Clan Tag *</Label>
                <Input
                  id="tag"
                  value={formData.tag}
                  onChange={(e) => handleInputChange('tag', e.target.value)}
                  placeholder="#ABC123XYZ"
                  required
                />
              </div>
            </div>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="leagueLevel">League Level *</Label>
                <Select value={formData.leagueLevel} onValueChange={(value) => handleInputChange('leagueLevel', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select league level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">League 1</SelectItem>
                    <SelectItem value="2">League 2</SelectItem>
                    <SelectItem value="3">League 3</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="membersNeeded">Number of Members Needed *</Label>
                <Input
                  id="membersNeeded"
                  type="number"
                  min="1"
                  max="15"
                  value={formData.membersNeeded}
                  onChange={(e) => handleInputChange('membersNeeded', e.target.value)}
                  placeholder="1-15"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Maximum 15 members can join your clan
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="w-5 h-5" />
              Payment Information
            </CardTitle>
            <CardDescription>
              Set the payment amount for players joining your clan
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="offeredPayment">Price (per player) *</Label>
              <Input
                id="offeredPayment"
                type="number"
                min="0"
                step="0.01"
                value={formData.offeredPayment}
                onChange={(e) => handleInputChange('offeredPayment', e.target.value)}
                placeholder="0.00"
                required
              />
              <p className="text-xs text-muted-foreground">
                Amount you will pay to each player who joins your clan
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Terms & Conditions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Terms & Conditions
            </CardTitle>
            <CardDescription>
              Define the terms and conditions for players joining your clan
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="terms">Terms & Conditions *</Label>
              <Textarea
                id="terms"
                value={formData.terms}
                onChange={(e) => handleInputChange('terms', e.target.value)}
                placeholder="Describe the terms and conditions for players joining your clan, including expectations, requirements, and agreement details..."
                rows={6}
                required
              />
              <p className="text-xs text-muted-foreground">
                This will be shown to players before they join your clan
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" asChild>
            <Link href="/cwl">Cancel</Link>
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Registering...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Register Clan
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}