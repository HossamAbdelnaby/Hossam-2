'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { 
  PaymentMethod, 
  PaymentMethodInfo, 
  PaymentInstructions,
  EnhancedPaymentService 
} from '@/lib/payment/enhanced-payment-service'
import { 
  CreditCard, 
  PayPal, 
  Building2, 
  Bitcoin, 
  Banknote, 
  Smartphone, 
  Globe, 
  Coins,
  Clock,
  Shield,
  CheckCircle,
  AlertCircle,
  Info,
  ArrowRight
} from 'lucide-react'

interface PaymentMethodSelectorProps {
  amount: number
  currency?: string
  context?: {
    type: 'tournament' | 'clan' | 'service'
    id?: string
  }
  onPaymentSelect: (method: PaymentMethod, instructions?: PaymentInstructions) => void
  disabled?: boolean
}

export function PaymentMethodSelector({ 
  amount, 
  currency = 'USD', 
  context, 
  onPaymentSelect, 
  disabled = false 
}: PaymentMethodSelectorProps) {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null)
  const [availableMethods, setAvailableMethods] = useState<PaymentMethodInfo[]>([])
  const [loading, setLoading] = useState(false)

  React.useEffect(() => {
    const fetchMethods = async () => {
      try {
        setLoading(true)
        const methods = await EnhancedPaymentService.getPaymentMethodsForContext({
          type: context?.type || 'tournament',
          amount,
          currency
        })
        setAvailableMethods(methods)
      } catch (error) {
        console.error('Failed to fetch payment methods:', error)
        // Fallback to all methods
        setAvailableMethods(EnhancedPaymentService.getAvailablePaymentMethods())
      } finally {
        setLoading(false)
      }
    }

    fetchMethods()
  }, [amount, currency, context])

  const getMethodIcon = (method: PaymentMethod) => {
    const iconMap: Record<PaymentMethod, React.ReactNode> = {
      [PaymentMethod.PAYPAL]: <PayPal className="w-6 h-6" />,
      [PaymentMethod.CREDIT_CARD]: <CreditCard className="w-6 h-6" />,
      [PaymentMethod.BANK_TRANSFER]: <Building2 className="w-6 h-6" />,
      [PaymentMethod.CRYPTOCURRENCY]: <Bitcoin className="w-6 h-6" />,
      [PaymentMethod.CASH]: <Banknote className="w-6 h-6" />,
      [PaymentMethod.MOBILE_MONEY]: <Smartphone className="w-6 h-6" />,
      [PaymentMethod.WESTERN_UNION]: <Globe className="w-6 h-6" />,
      [PaymentMethod.BINANCE]: <Coins className="w-6 h-6" />
    }
    return iconMap[method]
  }

  const getSpeedColor = (processingTime: string) => {
    if (processingTime.includes('Immediate') || processingTime.includes('Instant')) {
      return 'text-green-600 bg-green-100'
    }
    if (processingTime.includes('minutes') || processingTime.includes('hour')) {
      return 'text-blue-600 bg-blue-100'
    }
    return 'text-orange-600 bg-orange-100'
  }

  const handleMethodSelect = (method: PaymentMethod) => {
    setSelectedMethod(method)
  }

  const handleConfirmPayment = () => {
    if (selectedMethod) {
      const methodInfo = availableMethods.find(m => m.method === selectedMethod)
      onPaymentSelect(selectedMethod, methodInfo?.instructions)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading payment methods...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Payment Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Payment Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold">{amount.toFixed(2)} {currency}</p>
              <p className="text-sm text-muted-foreground">
                {context?.type === 'tournament' && 'Tournament Registration Fee'}
                {context?.type === 'clan' && 'Clan Membership Fee'}
                {context?.type === 'service' && 'Service Payment'}
              </p>
            </div>
            <Badge variant="outline" className="text-lg px-3 py-1">
              Secure Payment
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Payment Methods */}
      <Card>
        <CardHeader>
          <CardTitle>Select Payment Method</CardTitle>
          <CardDescription>
            Choose your preferred payment method from the options below
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {availableMethods.map((method) => (
              <Card
                key={method.method}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  selectedMethod === method.method 
                    ? 'ring-2 ring-primary border-primary' 
                    : 'hover:border-primary/50'
                } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                onClick={() => !disabled && handleMethodSelect(method.method)}
              >
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      <div className="p-2 bg-muted rounded-lg">
                        {getMethodIcon(method.method)}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold">{method.name}</h3>
                        <Badge variant="outline" className={getSpeedColor(method.processingTime)}>
                          <Clock className="w-3 h-3 mr-1" />
                          {method.processingTime}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">
                        {method.description}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Shield className="w-3 h-3" />
                          <span>{method.fees}</span>
                        </div>
                        {selectedMethod === method.method && (
                          <div className="flex items-center gap-1 text-green-600">
                            <CheckCircle className="w-3 h-3" />
                            <span>Selected</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Selected Method Details */}
      {selectedMethod && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {getMethodIcon(selectedMethod)}
              {availableMethods.find(m => m.method === selectedMethod)?.name} Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="instructions">Instructions</TabsTrigger>
                <TabsTrigger value="requirements">Requirements</TabsTrigger>
              </TabsList>
              
              <TabsContent value="overview" className="space-y-4">
                <div className="grid gap-4">
                  <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      <span className="font-medium">Processing Time</span>
                    </div>
                    <Badge className={getSpeedColor(
                      availableMethods.find(m => m.method === selectedMethod)?.processingTime || ''
                    )}>
                      {availableMethods.find(m => m.method === selectedMethod)?.processingTime}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4" />
                      <span className="font-medium">Fees</span>
                    </div>
                    <span className="font-medium">
                      {availableMethods.find(m => m.method === selectedMethod)?.fees}
                    </span>
                  </div>
                  
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      {availableMethods.find(m => m.method === selectedMethod)?.instructions.description}
                    </AlertDescription>
                  </Alert>
                </div>
              </TabsContent>
              
              <TabsContent value="instructions" className="space-y-4">
                <div className="space-y-3">
                  <h4 className="font-semibold">Payment Steps:</h4>
                  <ol className="space-y-2">
                    {availableMethods.find(m => m.method === selectedMethod)?.instructions.steps.map((step, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
                          {index + 1}
                        </div>
                        <span className="text-sm">{step}</span>
                      </li>
                    ))}
                  </ol>
                  
                  <div className="pt-4 border-t">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      <span>Timeline: {availableMethods.find(m => m.method === selectedMethod)?.instructions.timeline}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                      <AlertCircle className="w-4 h-4" />
                      <span>Contact: {availableMethods.find(m => m.method === selectedMethod)?.instructions.contactInfo}</span>
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="requirements" className="space-y-4">
                <div className="space-y-3">
                  <h4 className="font-semibold">What You Need:</h4>
                  <ul className="space-y-2">
                    {availableMethods.find(m => m.method === selectedMethod)?.requirements.map((req, index) => (
                      <li key={index} className="flex items-center gap-3">
                        <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                        <span className="text-sm">{req}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <Alert>
                    <Shield className="h-4 w-4" />
                    <AlertDescription>
                      All payments are secure and encrypted. Your financial information is protected with industry-standard security measures.
                    </AlertDescription>
                  </Alert>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex gap-4">
        <Button
          onClick={handleConfirmPayment}
          disabled={!selectedMethod || disabled}
          className="flex-1"
        >
          Continue with {selectedMethod ? availableMethods.find(m => m.method === selectedMethod)?.name : 'Selected Method'}
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
        
        {selectedMethod && (
          <Button
            variant="outline"
            onClick={() => setSelectedMethod(null)}
          >
            Change Method
          </Button>
        )}
      </div>
    </div>
  )
}

interface PaymentInstructionsDisplayProps {
  instructions: PaymentInstructions
  amount: number
  currency: string
  paymentId: string
}

export function PaymentInstructionsDisplay({ 
  instructions, 
  amount, 
  currency, 
  paymentId 
}: PaymentInstructionsDisplayProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Info className="w-5 h-5" />
          {instructions.title}
        </CardTitle>
        <CardDescription>
          {instructions.description}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Payment Details */}
        <div className="bg-muted p-4 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium">Payment Amount:</span>
            <span className="text-xl font-bold">{amount.toFixed(2)} {currency}</span>
          </div>
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Payment Reference:</span>
            <span className="font-mono">{paymentId}</span>
          </div>
        </div>

        {/* Instructions */}
        <div className="space-y-4">
          <h4 className="font-semibold">Payment Instructions:</h4>
          <ol className="space-y-3">
            {instructions.steps.map((step, index) => (
              <li key={index} className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
                  {index + 1}
                </div>
                <span className="text-sm">{step}</span>
              </li>
            ))}
          </ol>
        </div>

        {/* Additional Details */}
        {Object.keys(instructions.details).length > 0 && (
          <div className="space-y-3">
            <h4 className="font-semibold">Additional Information:</h4>
            <div className="bg-muted p-4 rounded-lg space-y-2">
              {Object.entries(instructions.details).map(([key, value]) => (
                <div key={key} className="flex justify-between text-sm">
                  <span className="font-medium capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>
                  <span>{String(value)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Timeline and Contact */}
        <div className="grid md:grid-cols-2 gap-4">
          <Alert>
            <Clock className="h-4 w-4" />
            <AlertDescription>
              <strong>Processing Time:</strong> {instructions.timeline}
            </AlertDescription>
          </Alert>
          
          {instructions.contactInfo && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Contact Support:</strong> {instructions.contactInfo}
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* Important Notice */}
        <Alert>
          <Shield className="h-4 w-4" />
          <AlertDescription>
            Please include your payment reference ({paymentId}) in all communications. 
            Your payment will be processed automatically, but may take some time depending on the payment method.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  )
}