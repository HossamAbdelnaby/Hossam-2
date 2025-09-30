'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/contexts/auth-context'
import { 
  ArrowLeft, 
  Shield, 
  Users, 
  Calendar, 
  Crown,
  Loader2,
  Save,
  CheckCircle,
  User,
  Hash,
  DollarSign
} from 'lucide-react'

interface Clan {
  id: string
  name: string
  tag: string
  leagueLevel?: number
  membersNeeded: number
  offeredPayment: number
  terms?: string
  isActive: boolean
  createdAt: string
  owner: {
    id: string
    email: string
    name?: string
  }
}

export default function CWLApplyPage() {
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [clan, setClan] = useState<Clan | null>(null)
  const [existingApplication, setExistingApplication] = useState<any>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  
  const [formData, setFormData] = useState({
    inGameName: '',
    accountTag: '',
    agreeToTerms: false,
  })

  const router = useRouter()
  const params = useParams()
  const clanId = params.id as string
  const { user } = useAuth()

  useEffect(() => {
    if (clanId) {
      fetchClanDetails()
    }
  }, [clanId])

  const fetchClanDetails = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/cwl/${clanId}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch clan details')
      }

      const data = await response.json()
      setClan(data.clan)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch clan details')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string | boolean) => {
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
      if (!formData.inGameName.trim()) {
        throw new Error('In-game name is required')
      }

      if (!formData.accountTag.trim()) {
        throw new Error('Account tag is required')
      }

      if (!formData.agreeToTerms) {
        throw new Error('You must agree to the terms and conditions')
      }

      const response = await fetch(`/api/cwl/${clanId}/apply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inGameName: formData.inGameName.trim(),
          accountTag: formData.accountTag.trim(),
          agreeToTerms: formData.agreeToTerms,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to submit application')
      }

      const data = await response.json()
      setSuccess(true)
      
      // Redirect to CWL page after a short delay
      setTimeout(() => {
        router.push('/cwl')
      }, 2000)

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit application')
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
            Please login to apply to join a CWL clan.
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

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      </div>
    )
  }

  if (!clan) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">Clan Not Found</h1>
          <p className="text-muted-foreground mb-8">
            The clan you're trying to apply to doesn't exist or is no longer active.
          </p>
          <Button asChild>
            <Link href="/cwl">Back to CWL Clans</Link>
          </Button>
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
            <CardTitle>Application Submitted Successfully!</CardTitle>
            <CardDescription>
              Your application to join {clan.name} has been submitted. The clan owner will review your application.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/cwl">Back to CWL Clans</Link>
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
          Back to CWL Clans
        </Link>
        
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
            <Shield className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-3xl font-bold mb-2">Join {clan.name}</h1>
            <p className="text-muted-foreground">
              Apply to join this CWL clan and compete in Clan War Leagues
            </p>
          </div>
        </div>
      </div>

      {/* Clan Information */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Clan Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Clan Name</Label>
                <p className="text-lg font-semibold">{clan.name}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Clan Tag</Label>
                <p className="text-lg font-semibold">{clan.tag}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">League Level</Label>
                <Badge variant="outline">League {clan.leagueLevel || 'N/A'}</Badge>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Members Needed</Label>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  <span className="text-lg font-semibold">{clan.membersNeeded}</span>
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Payment Per Player</Label>
                <div className="flex items-center gap-2">
                  <Crown className="w-4 h-4 text-muted-foreground" />
                  <span className="text-lg font-semibold">${clan.offeredPayment.toFixed(2)}</span>
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Clan Owner</Label>
                <p className="text-sm">{clan.owner.name || clan.owner.email}</p>
              </div>
            </div>
          </div>
          
          {clan.terms && (
            <div className="mt-6 pt-6 border-t">
              <Label className="text-sm font-medium text-muted-foreground mb-2 block">Clan Terms & Conditions</Label>
              <p className="text-sm bg-muted p-3 rounded-md">{clan.terms}</p>
            </div>
          )}

          {/* Payment Information */}
          <div className="mt-6 pt-6 border-t">
            <Label className="text-sm font-medium text-muted-foreground mb-4 block flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Payment Information
            </Label>
            <div className="grid md:grid-cols-2 gap-4">
              <Card>
                <CardContent className="pt-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Amount Per Player:</span>
                      <span className="font-semibold">${clan.offeredPayment.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Currency:</span>
                      <span className="font-medium">{clan.paymentCurrency || 'USD'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Payment Due:</span>
                      <span className="font-medium">
                        {clan.paymentDueDate 
                          ? new Date(clan.paymentDueDate).toLocaleDateString()
                          : 'Upon acceptance'
                        }
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-4">
                  <div className="space-y-3">
                    <div className="text-sm font-medium text-muted-foreground">Accepted Payment Methods:</div>
                    <div className="flex flex-wrap gap-1">
                      {clan.paymentMethods ? (
                        JSON.parse(clan.paymentMethods).map((method: string) => (
                          <Badge key={method} variant="outline" className="text-xs">
                            {method.replace('_', ' ').toUpperCase()}
                          </Badge>
                        ))
                      ) : (
                        <Badge variant="outline" className="text-xs">
                          Various Methods
                        </Badge>
                      )}
                    </div>
                    
                    {clan.paymentTerms && (
                      <div className="pt-2 border-t">
                        <div className="text-sm font-medium text-muted-foreground mb-1">Payment Terms:</div>
                        <p className="text-xs text-muted-foreground">{clan.paymentTerms}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Application Form */}
      <form onSubmit={handleSubmit} className="space-y-8">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Player Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Player Information
            </CardTitle>
            <CardDescription>
              Enter your in-game details for the clan application
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="inGameName">In-Game Name *</Label>
              <Input
                id="inGameName"
                value={formData.inGameName}
                onChange={(e) => handleInputChange('inGameName', e.target.value)}
                placeholder="Enter your in-game name"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="accountTag">Account Tag *</Label>
              <Input
                id="accountTag"
                value={formData.accountTag}
                onChange={(e) => handleInputChange('accountTag', e.target.value)}
                placeholder="#ABC123XYZ"
                required
              />
              <p className="text-xs text-muted-foreground">
                Your unique account tag starting with #
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Terms & Conditions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Terms & Conditions Agreement
            </CardTitle>
            <CardDescription>
              You must agree to the clan's terms and conditions to join
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start space-x-3">
              <Checkbox
                id="agreeToTerms"
                checked={formData.agreeToTerms}
                onCheckedChange={(checked) => handleInputChange('agreeToTerms', checked as boolean)}
                className="mt-1"
              />
              <div className="space-y-1">
                <Label htmlFor="agreeToTerms" className="text-sm font-medium cursor-pointer">
                  I agree to the terms and conditions
                </Label>
                <p className="text-xs text-muted-foreground">
                  By checking this box, you agree to abide by the clan's terms and conditions as listed above. 
                  You understand that violation of these terms may result in removal from the clan.
                </p>
              </div>
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
                Submitting Application...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Submit Application
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}