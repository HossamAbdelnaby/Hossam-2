'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAuth } from '@/contexts/auth-context'
import { useToast } from '@/hooks/use-toast'
import { 
  PaymentMethodSelector, 
  PaymentInstructionsDisplay 
} from '@/components/payment/payment-method-selector'
import { 
  PaymentMethod, 
  PaymentInstructions 
} from '@/lib/payment/enhanced-payment-service'
import { 
  Shield, 
  Users, 
  Trophy, 
  Calendar,
  MapPin,
  DollarSign,
  Clock,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  CreditCard
} from 'lucide-react'

interface TournamentDetails {
  id: string
  name: string
  description?: string
  host: string
  prizeAmount: number
  currency: string
  paymentMethods: string
  paymentTerms?: string
  earlyBirdPrice?: number
  regularPrice?: number
  latePrice?: number
  registrationStart: string
  registrationEnd?: string
  tournamentStart: string
  tournamentEnd: string
  status: string
  maxTeams: number
  bracketType: string
  packageType: string
}

export default function TournamentPaymentPage() {
  const [loading, setLoading] = useState(true)
  const [tournament, setTournament] = useState<TournamentDetails | null>(null)
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null)
  const [paymentInstructions, setPaymentInstructions] = useState<PaymentInstructions | null>(null)
  const [paymentCreated, setPaymentCreated] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const params = useParams()
  const router = useRouter()
  const tournamentId = params.id as string
  const { user } = useAuth()
  const { toast } = useToast()

  useEffect(() => {
    if (tournamentId) {
      fetchTournamentDetails()
    }
  }, [tournamentId])

  const fetchTournamentDetails = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/tournaments/${tournamentId}`)
      
      if (response.ok) {
        const data = await response.json()
        setTournament(data.tournament)
      } else if (response.status === 404) {
        setError('Tournament not found')
      } else {
        setError('Failed to fetch tournament details')
      }
    } catch (err) {
      console.error('Failed to fetch tournament details:', err)
      setError('Failed to fetch tournament details')
    } finally {
      setLoading(false)
    }
  }

  const getCurrentPrice = () => {
    if (!tournament) return 0
    
    const now = new Date()
    const registrationStart = new Date(tournament.registrationStart)
    const registrationEnd = tournament.registrationEnd ? new Date(tournament.registrationEnd) : null
    
    if (now < registrationStart) {
      return tournament.earlyBirdPrice || tournament.regularPrice || 0
    }
    
    if (registrationEnd && now > registrationEnd) {
      return tournament.latePrice || tournament.regularPrice || 0
    }
    
    return tournament.regularPrice || 0
  }

  const getPriceType = () => {
    if (!tournament) return 'Regular'
    
    const now = new Date()
    const registrationStart = new Date(tournament.registrationStart)
    const registrationEnd = tournament.registrationEnd ? new Date(tournament.registrationEnd) : null
    
    if (now < registrationStart) {
      return tournament.earlyBirdPrice ? 'Early Bird' : 'Regular'
    }
    
    if (registrationEnd && now > registrationEnd) {
      return tournament.latePrice ? 'Late Registration' : 'Regular'
    }
    
    return 'Regular'
  }

  const handlePaymentSelect = async (method: PaymentMethod, instructions?: PaymentInstructions) => {
    try {
      const response = await fetch('/api/payment/enhanced', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: getCurrentPrice(),
          method,
          currency: tournament?.currency || 'USD',
          description: `Tournament Registration - ${tournament?.name}`,
          tournamentId,
          userId: user?.id
        }),
      })

      const result = await response.json()

      if (result.success) {
        setSelectedMethod(method)
        setPaymentInstructions(result.instructions || instructions)
        setPaymentCreated(true)
        
        toast({
          title: "Payment Created Successfully!",
          description: "Please follow the instructions to complete your payment.",
          variant: "default",
        })

        // If there's a payment URL, redirect to it
        if (result.paymentUrl) {
          window.location.href = result.paymentUrl
        }
      } else {
        toast({
          title: "Payment Failed",
          description: result.error || "Failed to create payment",
          variant: "destructive",
        })
      }
    } catch (err) {
      console.error('Payment creation error:', err)
      toast({
        title: "Payment Failed",
        description: "Failed to create payment. Please try again.",
        variant: "destructive",
      })
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const isRegistrationOpen = () => {
    if (!tournament) return false
    
    const now = new Date()
    const registrationStart = new Date(tournament.registrationStart)
    const registrationEnd = tournament.registrationEnd ? new Date(tournament.registrationEnd) : null
    
    return now >= registrationStart && (!registrationEnd || now <= registrationEnd)
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading tournament details...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error || !tournament) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto">
          <Alert>
            <AlertDescription>{error || 'Tournament not found'}</AlertDescription>
          </Alert>
          <Button asChild className="w-full mt-4">
            <a href="/tournaments">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Tournaments
            </a>
          </Button>
        </div>
      </div>
    )
  }

  const currentPrice = getCurrentPrice()
  const priceType = getPriceType()

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <Button variant="outline" asChild>
            <a href={`/tournaments/${tournamentId}`}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Tournament
            </a>
          </Button>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Trophy className="w-8 h-8" />
            Tournament Registration
          </h1>
        </div>
        
        <div className="bg-muted/50 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold">{tournament.name}</h2>
              <p className="text-muted-foreground">Hosted by {tournament.host}</p>
            </div>
            <div className="text-right">
              <Badge variant={isRegistrationOpen() ? "default" : "secondary"}>
                {isRegistrationOpen() ? "Registration Open" : "Registration Closed"}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column - Tournament Information */}
        <div className="lg:col-span-1 space-y-6">
          {/* Tournament Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Tournament Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Registration Period</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(tournament.registrationStart)} - {
                        tournament.registrationEnd ? formatDate(tournament.registrationEnd) : 'Ongoing'
                      }
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Tournament Dates</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(tournament.tournamentStart)} - {formatDate(tournament.tournamentEnd)}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Location</p>
                    <p className="text-sm text-muted-foreground">{tournament.host}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Max Teams</p>
                    <p className="text-sm text-muted-foreground">{tournament.maxTeams} teams</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Prize Pool</p>
                    <p className="text-sm text-muted-foreground">
                      {tournament.prizeAmount.toFixed(2)} {tournament.currency}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Registration Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Registration Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isRegistrationOpen() ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-green-600 font-medium">Registration is Open</span>
                  </div>
                  {tournament.registrationEnd && (
                    <p className="text-sm text-muted-foreground">
                      Closes on {formatDate(tournament.registrationEnd)}
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-orange-600" />
                    <span className="text-orange-600 font-medium">Registration is Closed</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Registration period has ended
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Payment */}
        <div className="lg:col-span-2">
          {isRegistrationOpen() ? (
            <div className="space-y-6">
              {/* Pricing */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5" />
                    Registration Fee
                  </CardTitle>
                  <CardDescription>
                    Select your registration tier and complete payment to secure your spot
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Current Price */}
                    <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Current Price</p>
                          <p className="text-2xl font-bold text-primary">
                            {currentPrice.toFixed(2)} {tournament.currency}
                          </p>
                        </div>
                        <Badge variant="default">
                          {priceType}
                        </Badge>
                      </div>
                    </div>

                    {/* Price Comparison */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {tournament.earlyBirdPrice && (
                        <div className={`p-3 rounded-lg border ${
                          priceType === 'Early Bird' ? 'border-green-500 bg-green-50' : 'border-muted'
                        }`}>
                          <p className="text-sm font-medium">Early Bird</p>
                          <p className="text-lg font-bold">
                            {tournament.earlyBirdPrice.toFixed(2)} {tournament.currency}
                          </p>
                        </div>
                      )}
                      
                      <div className={`p-3 rounded-lg border ${
                        priceType === 'Regular' ? 'border-blue-500 bg-blue-50' : 'border-muted'
                      }`}>
                        <p className="text-sm font-medium">Regular</p>
                        <p className="text-lg font-bold">
                          {tournament.regularPrice?.toFixed(2) || '0.00'} {tournament.currency}
                        </p>
                      </div>
                      
                      {tournament.latePrice && (
                        <div className={`p-3 rounded-lg border ${
                          priceType === 'Late Registration' ? 'border-orange-500 bg-orange-50' : 'border-muted'
                        }`}>
                          <p className="text-sm font-medium">Late Registration</p>
                          <p className="text-lg font-bold">
                            {tournament.latePrice.toFixed(2)} {tournament.currency}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Payment Terms */}
                    {tournament.paymentTerms && (
                      <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          <strong>Payment Terms:</strong> {tournament.paymentTerms}
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Payment Method Selection */}
              {!paymentCreated ? (
                <PaymentMethodSelector
                  amount={currentPrice}
                  currency={tournament.currency}
                  context={{
                    type: 'tournament',
                    id: tournamentId
                  }}
                  onPaymentSelect={handlePaymentSelect}
                  disabled={!isRegistrationOpen()}
                />
              ) : (
                /* Payment Instructions */
                paymentInstructions && (
                  <PaymentInstructionsDisplay
                    instructions={paymentInstructions}
                    amount={currentPrice}
                    currency={tournament.currency}
                    paymentId="pending" // This would be the actual payment ID from the response
                  />
                )
              )}

              {/* Security Notice */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <Shield className="w-5 h-5 text-green-600 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-green-900 mb-1">Secure Payment Guarantee</h4>
                      <p className="text-sm text-green-700">
                        Your payment information is encrypted and secure. We use industry-standard security measures 
                        to protect your financial data. Your registration will be confirmed immediately upon 
                        successful payment.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            /* Registration Closed */
            <Card>
              <CardContent className="pt-12">
                <div className="text-center py-8">
                  <AlertCircle className="w-16 h-16 mx-auto mb-4 text-orange-600" />
                  <h3 className="text-lg font-semibold mb-2">Registration Closed</h3>
                  <p className="text-muted-foreground mb-4">
                    The registration period for this tournament has ended. 
                    Please check back for future tournaments.
                  </p>
                  <Button asChild>
                    <a href="/tournaments">
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Browse Other Tournaments
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}