'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { PaymentForm } from '@/components/payment/payment-form'
import { useAuth } from '@/contexts/auth-context'
import { useToast } from '@/hooks/use-toast'
import { 
  ArrowLeft, 
  CheckCircle, 
  DollarSign, 
  Clock, 
  Shield,
  Trophy,
  Users,
  Crown,
  AlertTriangle
} from 'lucide-react'

interface PaymentDetails {
  id: string
  type: 'tournament' | 'clan' | 'player_rental' | 'service'
  amount: number
  currency: string
  description: string
  status: 'pending' | 'completed' | 'failed'
  dueDate?: string
  metadata?: any
}

export default function PaymentPage() {
  const [loading, setLoading] = useState(true)
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetails | null>(null)
  const [error, setError] = useState<string | null>(null)
  
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const { toast } = useToast()

  useEffect(() => {
    if (!user) {
      router.push('/login')
      return
    }

    const paymentId = searchParams.get('paymentId')
    const tournamentId = searchParams.get('tournamentId')
    const pendingTournamentId = searchParams.get('pendingTournamentId')
    const clanId = searchParams.get('clanId')
    const contractId = searchParams.get('contractId')
    const packageType = searchParams.get('package')

    // Fetch payment details from API
    const fetchPaymentDetails = async () => {
      try {
        setLoading(true)
        
        if (contractId) {
          // Fetch contract payment details
          const response = await fetch(`/api/payment/${paymentId}`)
          if (response.ok) {
            const data = await response.json()
            if (data.payment && data.payment.contract) {
              setPaymentDetails({
                id: data.payment.id,
                type: 'player_rental',
                amount: data.payment.amount,
                currency: data.payment.currency,
                description: data.payment.description,
                status: data.payment.status === 'COMPLETED' ? 'completed' : 'pending',
                dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
                metadata: { 
                  contractId, 
                  paymentId: data.payment.id,
                  pusherName: data.payment.contract.pusher.realName
                }
              })
            } else {
              setError('Contract payment not found')
            }
          } else {
            setError('Failed to fetch contract payment details')
          }
        } else if (pendingTournamentId) {
          // Fetch pending tournament details
          const response = await fetch(`/api/tournaments/pending`)
          if (response.ok) {
            const data = await response.json()
            const pendingTournament = data.pendingTournaments.find((pt: any) => pt.id === pendingTournamentId)
            
            if (pendingTournament) {
              setPaymentDetails({
                id: `pay_${Date.now()}`,
                type: 'tournament',
                amount: pendingTournament.packagePrice,
                currency: pendingTournament.packageCurrency,
                description: `Tournament Package - ${pendingTournament.packageType.replace(/_/g, ' ')}`,
                status: 'pending',
                dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                metadata: { pendingTournamentId, packageType: pendingTournament.packageType }
              })
            } else {
              setError('Pending tournament not found')
            }
          } else {
            setError('Failed to fetch pending tournament details')
          }
        } else if (tournamentId) {
          // Legacy support for old tournament IDs
          setPaymentDetails({
            id: `pay_${Date.now()}`,
            type: 'tournament',
            amount: packageType === 'premium' ? 50 : 25,
            currency: 'USD',
            description: `Tournament Registration - ${packageType?.toUpperCase()} Package`,
            status: 'pending',
            dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            metadata: { tournamentId, packageType }
          })
        } else if (clanId) {
          setPaymentDetails({
            id: `pay_${Date.now()}`,
            type: 'clan',
            amount: 20,
            currency: 'USD',
            description: 'Clan Membership Fee',
            status: 'pending',
            dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
            metadata: { clanId }
          })
        } else if (paymentId) {
          setPaymentDetails({
            id: paymentId,
            type: 'service',
            amount: 30,
            currency: 'USD',
            description: 'Service Payment',
            status: 'pending',
            metadata: { paymentId }
          })
        } else {
          setError('No payment details found')
        }
      } catch (err) {
        console.error('Error fetching payment details:', err)
        setError('Failed to load payment details')
      } finally {
        setLoading(false)
      }
    }

    fetchPaymentDetails()
  }, [router, searchParams, user])

  const handlePaymentSuccess = async (paymentData: any) => {
    try {
      const contractId = paymentDetails?.metadata?.contractId
      const paymentId = paymentDetails?.metadata?.paymentId
      const pendingTournamentId = paymentDetails?.metadata?.pendingTournamentId
      
      if (contractId && paymentId) {
        // Update contract payment status
        const response = await fetch(`/api/payment/${paymentId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            status: 'COMPLETED',
            transactionId: paymentData.id || `txn_${Date.now()}`,
            paymentDetails: paymentData
          }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to update contract payment')
        }

        toast({
          title: "Payment Successful!",
          description: `Your payment for ${paymentDetails.metadata.pusherName} has been processed successfully.`,
          variant: "default",
        })

        // Redirect to dashboard
        router.push('/dashboard')
      } else if (pendingTournamentId) {
        // Create tournament after payment
        const response = await fetch('/api/tournaments/create-after-payment', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            pendingTournamentId,
            paymentId: paymentData.id || `pay_${Date.now()}`
          }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to create tournament after payment')
        }

        const data = await response.json()
        
        toast({
          title: "Payment Successful!",
          description: "Your tournament has been created successfully.",
          variant: "default",
        })

        // Redirect to the created tournament
        router.push(`/tournaments/${data.tournament.id}`)
      } else {
        // Handle other payment types (legacy)
        toast({
          title: "Payment Successful!",
          description: "Your payment has been processed successfully.",
          variant: "default",
        })

        // Redirect based on payment type
        if (paymentDetails?.type === 'tournament') {
          router.push('/tournaments')
        } else if (paymentDetails?.type === 'clan') {
          router.push('/cwl')
        } else {
          router.push('/dashboard')
        }
      }
    } catch (error) {
      console.error('Payment success handling error:', error)
      toast({
        title: "Payment Processing Error",
        description: error instanceof Error ? error.message : "There was an error processing your payment. Please contact support.",
        variant: "destructive",
      })
    }
  }

  const handlePaymentError = (errorMessage: string) => {
    toast({
      title: "Payment Error",
      description: errorMessage,
      variant: "destructive",
    })
  }

  const getPaymentTypeIcon = (type: string) => {
    switch (type) {
      case 'tournament':
        return <Trophy className="w-6 h-6" />
      case 'clan':
        return <Crown className="w-6 h-6" />
      case 'player_rental':
        return <Users className="w-6 h-6" />
      default:
        return <DollarSign className="w-6 h-6" />
    }
  }

  const getPaymentTypeLabel = (type: string) => {
    switch (type) {
      case 'tournament':
        return 'Tournament Registration'
      case 'clan':
        return 'Clan Membership'
      case 'player_rental':
        return 'Player Rental'
      case 'service':
        return 'Service Payment'
      default:
        return 'Payment'
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="w-12 h-12 mx-auto mb-4 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-muted-foreground">Loading payment details...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error || !paymentDetails) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error || 'Payment details not found'}</AlertDescription>
          </Alert>
          <Button asChild className="w-full mt-4">
            <Link href="/dashboard">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <Button variant="outline" asChild>
            <Link href={paymentDetails.type === 'tournament' ? '/tournaments' : '/cwl'}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Link>
          </Button>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <DollarSign className="w-8 h-8" />
            Complete Payment
          </h1>
        </div>
        
        <div className="bg-muted/50 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {getPaymentTypeIcon(paymentDetails.type)}
              <div>
                <h2 className="text-xl font-semibold">{getPaymentTypeLabel(paymentDetails.type)}</h2>
                <p className="text-muted-foreground">{paymentDetails.description}</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">{paymentDetails.currency} {paymentDetails.amount.toFixed(2)}</div>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Clock className="w-3 h-3" />
                Due {new Date(paymentDetails.dueDate!).toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Status */}
      <div className="mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-blue-600" />
                <span className="font-medium">Payment Status</span>
              </div>
              <Badge variant={paymentDetails.status === 'completed' ? 'default' : 'secondary'}>
                {paymentDetails.status.charAt(0).toUpperCase() + paymentDetails.status.slice(1)}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Security Notice */}
      <Alert className="mb-6">
        <Shield className="h-4 w-4" />
        <AlertDescription>
          Your payment information is encrypted and secure. We use industry-standard security measures to protect your data.
        </AlertDescription>
      </Alert>

      {/* Payment Form */}
      <PaymentForm
        amount={paymentDetails.amount}
        currency={paymentDetails.currency}
        description={paymentDetails.description}
        paymentType={paymentDetails.type}
        onSuccess={handlePaymentSuccess}
        onError={handlePaymentError}
      />

      {/* Additional Information */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Payment Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Amount:</span>
              <span className="font-medium">{paymentDetails.currency} {paymentDetails.amount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Type:</span>
              <span className="font-medium">{getPaymentTypeLabel(paymentDetails.type)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status:</span>
              <Badge variant={paymentDetails.status === 'completed' ? 'default' : 'secondary'}>
                {paymentDetails.status.charAt(0).toUpperCase() + paymentDetails.status.slice(1)}
              </Badge>
            </div>
            {paymentDetails.dueDate && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Due Date:</span>
                <span className="font-medium">{new Date(paymentDetails.dueDate).toLocaleDateString()}</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Need Help?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              If you encounter any issues with your payment, please contact our support team.
            </p>
            <div className="space-y-2">
              <Button variant="outline" size="sm" className="w-full">
                Contact Support
              </Button>
              <Button variant="outline" size="sm" className="w-full">
                Payment FAQ
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}