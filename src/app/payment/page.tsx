'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/contexts/auth-context'
import { 
  ArrowLeft, 
  CreditCard, 
  DollarSign, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  Copy,
  ExternalLink
} from 'lucide-react'

export default function PaymentPage() {
  const [payment, setPayment] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState('')
  const [instructions, setInstructions] = useState<any>(null)
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('')
  
  const router = useRouter()
  const searchParams = useSearchParams()
  const paymentId = searchParams.get('paymentId')
  const tournamentId = searchParams.get('tournamentId')
  const packageType = searchParams.get('package')
  const { user } = useAuth()

  useEffect(() => {
    if (paymentId) {
      // Existing payment flow
      if (!user) {
        router.push('/')
        return
      }
      fetchPaymentDetails()
    } else if (tournamentId && packageType) {
      // New tournament payment flow
      if (!user) {
        router.push('/login')
        return
      }
      // Just set loading to false, we'll show payment method selection
      setLoading(false)
    } else {
      router.push('/')
    }
  }, [paymentId, tournamentId, packageType, user, router])

  const createPayment = async (method: string) => {
    setProcessing(true)
    try {
      const packagePrices = {
        graphics: 29,
        discord: 49,
        full: 99,
      }
      
      const response = await fetch('/api/payment/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: packagePrices[packageType as keyof typeof packagePrices] || 29,
          method: method,
          tournamentId: tournamentId,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to create payment')
      }

      const data = await response.json()
      
      // If it's PayPal or Credit Card with redirect URL, redirect
      if (data.paymentUrl) {
        window.location.href = data.paymentUrl
      } else {
        // For other methods, show the payment details
        setPayment(data.payment)
        setSelectedPaymentMethod(method)
        
        // Fetch instructions for manual payment methods
        if (method === 'BINANCE' || method === 'WESTERN_UNION') {
          const instructionsUrl = method === 'BINANCE' 
            ? `/api/payment/binance/instructions?paymentId=${data.payment.id}`
            : `/api/payment/western-union/instructions?paymentId=${data.payment.id}`
          
          const instructionsResponse = await fetch(instructionsUrl)
          if (instructionsResponse.ok) {
            const instructionsData = await instructionsResponse.json()
            setInstructions(instructionsData.instructions)
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create payment')
    } finally {
      setProcessing(false)
    }
  }

  const fetchPaymentDetails = async () => {
    try {
      const response = await fetch(`/api/payment/${paymentId}`)
      if (!response.ok) {
        throw new Error('Failed to fetch payment details')
      }
      const data = await response.json()
      setPayment(data.payment)
      setSelectedPaymentMethod(data.payment.method)

      // Fetch instructions for manual payment methods
      if (data.payment.method === 'BINANCE' || data.payment.method === 'WESTERN_UNION') {
        const instructionsUrl = data.payment.method === 'BINANCE' 
          ? `/api/payment/binance/instructions?paymentId=${paymentId}`
          : `/api/payment/western-union/instructions?paymentId=${paymentId}`
        
        const instructionsResponse = await fetch(instructionsUrl)
        if (instructionsResponse.ok) {
          const instructionsData = await instructionsResponse.json()
          setInstructions(instructionsData.instructions)
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch payment details')
    } finally {
      setLoading(false)
    }
  }

  const handlePaymentConfirmation = async () => {
    setProcessing(true)
    try {
      const response = await fetch(`/api/payment/${payment.method.toLowerCase()}/confirm`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentId: payment.id,
          transactionDetails: { confirmed: true }
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to confirm payment')
      }

      // Refresh payment details
      await fetchPaymentDetails()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to confirm payment')
    } finally {
      setProcessing(false)
    }
  }

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text)
    setCopied(field)
    setTimeout(() => setCopied(''), 2000)
  }

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'PAYPAL': return <CreditCard className="w-5 h-5" />
      case 'CREDIT_CARD': return <CreditCard className="w-5 h-5" />
      case 'BINANCE': return <DollarSign className="w-5 h-5" />
      case 'WESTERN_UNION': return <DollarSign className="w-5 h-5" />
      default: return <DollarSign className="w-5 h-5" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'bg-green-100 text-green-800'
      case 'PENDING': return 'bg-yellow-100 text-yellow-800'
      case 'FAILED': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded mb-4"></div>
            <div className="h-32 bg-gray-200 rounded mb-4"></div>
            <div className="h-48 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  // Show payment method selection for new tournament payments
  if (!payment && tournamentId && packageType) {
    const packagePrices = {
      graphics: 29,
      discord: 49,
      full: 99,
    }
    
    const packageNames = {
      graphics: 'Graphics Package',
      discord: 'Discord Package',
      full: 'Full Management Package',
    }

    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Button
              variant="ghost"
              asChild
              className="mb-4"
            >
              <a href="/create-tournament">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Tournament Creation
              </a>
            </Button>
            
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <CreditCard className="w-8 h-8 text-primary-foreground" />
              </div>
              <h1 className="text-3xl font-bold mb-2">Complete Your Payment</h1>
              <p className="text-muted-foreground">
                Choose your preferred payment method for {packageNames[packageType as keyof typeof packageNames]}
              </p>
            </div>
          </div>

          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Package Summary */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center">
                <span>{packageNames[packageType as keyof typeof packageNames]}</span>
                <span className="text-2xl font-bold">${packagePrices[packageType as keyof typeof packagePrices]}</span>
              </div>
            </CardContent>
          </Card>

          {/* Payment Method Selection */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Select Payment Method</CardTitle>
              <CardDescription>
                Choose how you'd like to pay for your tournament package
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div 
                className={`p-4 border rounded-lg cursor-pointer transition-colors hover:bg-gray-50 ${
                  selectedPaymentMethod === 'PAYPAL' ? 'border-primary bg-primary/5' : 'border-gray-200'
                }`}
                onClick={() => createPayment('PAYPAL')}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CreditCard className="w-6 h-6 text-blue-600" />
                    <div>
                      <h3 className="font-semibold">PayPal</h3>
                      <p className="text-sm text-muted-foreground">Secure online payment</p>
                    </div>
                  </div>
                  {processing && selectedPaymentMethod === 'PAYPAL' && (
                    <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  )}
                </div>
              </div>

              <div 
                className={`p-4 border rounded-lg cursor-pointer transition-colors hover:bg-gray-50 ${
                  selectedPaymentMethod === 'CREDIT_CARD' ? 'border-primary bg-primary/5' : 'border-gray-200'
                }`}
                onClick={() => createPayment('CREDIT_CARD')}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CreditCard className="w-6 h-6 text-green-600" />
                    <div>
                      <h3 className="font-semibold">Credit Card</h3>
                      <p className="text-sm text-muted-foreground">Visa, Mastercard, etc.</p>
                    </div>
                  </div>
                  {processing && selectedPaymentMethod === 'CREDIT_CARD' && (
                    <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  )}
                </div>
              </div>

              <div 
                className={`p-4 border rounded-lg cursor-pointer transition-colors hover:bg-gray-50 ${
                  selectedPaymentMethod === 'BINANCE' ? 'border-primary bg-primary/5' : 'border-gray-200'
                }`}
                onClick={() => createPayment('BINANCE')}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <DollarSign className="w-6 h-6 text-yellow-600" />
                    <div>
                      <h3 className="font-semibold">Binance</h3>
                      <p className="text-sm text-muted-foreground">Cryptocurrency payment</p>
                    </div>
                  </div>
                  {processing && selectedPaymentMethod === 'BINANCE' && (
                    <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  )}
                </div>
              </div>

              <div 
                className={`p-4 border rounded-lg cursor-pointer transition-colors hover:bg-gray-50 ${
                  selectedPaymentMethod === 'WESTERN_UNION' ? 'border-primary bg-primary/5' : 'border-gray-200'
                }`}
                onClick={() => createPayment('WESTERN_UNION')}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <DollarSign className="w-6 h-6 text-purple-600" />
                    <div>
                      <h3 className="font-semibold">Western Union</h3>
                      <p className="text-sm text-muted-foreground">Money transfer service</p>
                    </div>
                  </div>
                  {processing && selectedPaymentMethod === 'WESTERN_UNION' && (
                    <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Button variant="outline" asChild className="w-full">
            <a href="/create-tournament">Cancel</a>
          </Button>
        </div>
      </div>
    )
  }

  if (!payment) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto text-center">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-4">Payment Not Found</h1>
          <p className="text-muted-foreground mb-8">
            The payment you're looking for doesn't exist or you don't have permission to view it.
          </p>
          <Button asChild>
            <a href="/">Go to Home</a>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            asChild
            className="mb-4"
          >
            <a href="/">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </a>
          </Button>
          
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
              {getPaymentMethodIcon(payment.method)}
            </div>
            <div>
              <h1 className="text-3xl font-bold">Payment Details</h1>
              <div className="flex items-center gap-2">
                <Badge className={getStatusColor(payment.status)}>
                  {payment.status}
                </Badge>
                <span className="text-muted-foreground">
                  {new Date(payment.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Payment Information */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Payment Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Amount</p>
                <p className="text-2xl font-bold">${payment.amount}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Payment Method</p>
                <p className="font-semibold">{payment.method.replace('_', ' ')}</p>
              </div>
            </div>
            
            {payment.transactionId && (
              <div>
                <p className="text-sm text-muted-foreground">Transaction ID</p>
                <p className="font-mono text-sm bg-gray-100 p-2 rounded">
                  {payment.transactionId}
                </p>
              </div>
            )}

            {payment.tournament && (
              <div>
                <p className="text-sm text-muted-foreground">For Tournament</p>
                <p className="font-semibold">{payment.tournament.name}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payment Instructions */}
        {instructions && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Payment Instructions
              </CardTitle>
              <CardDescription>
                Please follow these instructions to complete your payment
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {instructions.walletAddress && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Wallet Address</p>
                  <div className="flex items-center gap-2">
                    <code className="bg-gray-100 p-2 rounded text-sm flex-1">
                      {instructions.walletAddress}
                    </code>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(instructions.walletAddress, 'wallet')}
                    >
                      {copied === 'wallet' ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
              )}

              {instructions.receiver && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Receiver Information</p>
                  <div className="bg-gray-50 p-3 rounded space-y-1">
                    <p><strong>Name:</strong> {instructions.receiver.name}</p>
                    <p><strong>City:</strong> {instructions.receiver.city}</p>
                    <p><strong>Country:</strong> {instructions.receiver.country}</p>
                  </div>
                </div>
              )}

              {instructions.memo && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Memo/Reference</p>
                  <div className="flex items-center gap-2">
                    <code className="bg-gray-100 p-2 rounded text-sm flex-1">
                      {instructions.memo}
                    </code>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(instructions.memo, 'memo')}
                    >
                      {copied === 'memo' ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
              )}

              {instructions.steps && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Steps to Complete Payment</p>
                  <ol className="list-decimal list-inside space-y-1 text-sm">
                    {instructions.steps.map((step: string, index: number) => (
                      <li key={index}>{step}</li>
                    ))}
                  </ol>
                </div>
              )}

              {instructions.supportNote && (
                <Alert>
                  <AlertDescription>{instructions.supportNote}</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        {payment.status === 'PENDING' && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex gap-4">
                {payment.method === 'PAYPAL' || payment.method === 'CREDIT_CARD' ? (
                  <Button
                    onClick={handlePaymentConfirmation}
                    disabled={processing}
                    className="flex-1"
                  >
                    {processing ? (
                      <>
                        <Clock className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Confirm Payment
                      </>
                    )}
                  </Button>
                ) : (
                  <Button
                    onClick={handlePaymentConfirmation}
                    disabled={processing}
                    className="flex-1"
                  >
                    {processing ? (
                      <>
                        <Clock className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="mr-2 h-4 w-4" />
                        I've Sent Payment
                      </>
                    )}
                  </Button>
                )}
                
                <Button variant="outline" asChild>
                  <a href="/">
                    Cancel
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Success Message */}
        {payment.status === 'COMPLETED' && (
          <Card>
            <CardContent className="pt-6 text-center">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Payment Completed!</h3>
              <p className="text-muted-foreground mb-4">
                Your payment has been successfully processed.
              </p>
              <Button asChild>
                <a href="/">
                  Go to Home
                </a>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}