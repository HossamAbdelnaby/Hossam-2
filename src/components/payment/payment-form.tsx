'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { 
  CreditCard, 
  DollarSign, 
  Smartphone, 
  Building2, 
  Wallet,
  Bank,
  Coins,
  CheckCircle,
  Clock,
  AlertTriangle
} from 'lucide-react'

interface PaymentMethod {
  id: string
  name: string
  description: string
  icon: React.ReactNode
  fields: PaymentField[]
  processingTime: string
  fees: string
}

interface PaymentField {
  name: string
  label: string
  type: 'text' | 'email' | 'select' | 'textarea'
  required: boolean
  options?: string[]
  placeholder?: string
}

interface PaymentFormProps {
  amount: number
  currency: string
  description: string
  paymentType: 'tournament' | 'clan' | 'player_rental' | 'service'
  onSuccess: (paymentData: any) => void
  onError: (error: string) => void
}

export function PaymentForm({ 
  amount, 
  currency, 
  description, 
  paymentType, 
  onSuccess, 
  onError 
}: PaymentFormProps) {
  const [selectedMethod, setSelectedMethod] = useState<string>('')
  const [formData, setFormData] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState(1)

  const paymentMethods: PaymentMethod[] = [
    {
      id: 'paypal',
      name: 'PayPal',
      description: 'Fast and secure online payment',
      icon: <CreditCard className="w-6 h-6" />,
      processingTime: 'Instant',
      fees: '2.9% + $0.30',
      fields: [
        { name: 'email', label: 'PayPal Email', type: 'email', required: true, placeholder: 'your@email.com' }
      ]
    },
    {
      id: 'credit_card',
      name: 'Credit Card',
      description: 'Visa, MasterCard, American Express',
      icon: <CreditCard className="w-6 h-6" />,
      processingTime: 'Instant',
      fees: '2.5%',
      fields: [
        { name: 'cardNumber', label: 'Card Number', type: 'text', required: true, placeholder: '1234 5678 9012 3456' },
        { name: 'expiryDate', label: 'Expiry Date', type: 'text', required: true, placeholder: 'MM/YY' },
        { name: 'cvv', label: 'CVV', type: 'text', required: true, placeholder: '123' },
        { name: 'cardName', label: 'Cardholder Name', type: 'text', required: true, placeholder: 'John Doe' }
      ]
    },
    {
      id: 'bank_transfer',
      name: 'Bank Transfer',
      description: 'Direct bank wire transfer',
      icon: <Building2 className="w-6 h-6" />,
      processingTime: '1-3 business days',
      fees: '$15 - $35',
      fields: [
        { name: 'accountName', label: 'Account Name', type: 'text', required: true },
        { name: 'accountNumber', label: 'Account Number', type: 'text', required: true },
        { name: 'bankName', label: 'Bank Name', type: 'text', required: true },
        { name: 'routingNumber', label: 'Routing Number', type: 'text', required: true }
      ]
    },
    {
      id: 'western_union',
      name: 'Western Union',
      description: 'Global money transfer service',
      icon: <DollarSign className="w-6 h-6" />,
      processingTime: 'Minutes to hours',
      fees: 'Variable',
      fields: [
        { name: 'senderName', label: 'Sender Name', type: 'text', required: true },
        { name: 'trackingNumber', label: 'MTCN Number', type: 'text', required: true },
        { name: 'amountSent', label: 'Amount Sent', type: 'text', required: true },
        { name: 'country', label: 'Sending Country', type: 'text', required: true }
      ]
    },
    {
      id: 'binance',
      name: 'Binance',
      description: 'Cryptocurrency payment',
      icon: <Coins className="w-6 h-6" />,
      processingTime: '15-30 minutes',
      fees: '0.1% - 1%',
      fields: [
        { name: 'walletAddress', label: 'Binance Wallet Address', type: 'text', required: true },
        { name: 'transactionHash', label: 'Transaction Hash', type: 'text', required: true },
        { name: 'cryptocurrency', label: 'Cryptocurrency', type: 'select', required: true, options: ['BTC', 'ETH', 'BNB', 'USDT', 'USDC'] }
      ]
    },
    {
      id: 'mobile_money',
      name: 'Mobile Money',
      description: 'M-Pesa, Airtel Money, etc.',
      icon: <Smartphone className="w-6 h-6" />,
      processingTime: 'Instant',
      fees: '1-3%',
      fields: [
        { name: 'phoneNumber', label: 'Phone Number', type: 'text', required: true, placeholder: '+254 XXX XXX XXX' },
        { name: 'provider', label: 'Mobile Money Provider', type: 'select', required: true, options: ['M-Pesa', 'Airtel Money', 'MTN Mobile Money', 'Vodafone Cash'] }
      ]
    },
    {
      id: 'cash',
      name: 'Cash Payment',
      description: 'In-person cash payment',
      icon: <Wallet className="w-6 h-6" />,
      processingTime: 'Requires meeting',
      fees: 'None',
      fields: [
        { name: 'location', label: 'Preferred Meeting Location', type: 'text', required: true },
        { name: 'contact', label: 'Contact Phone', type: 'text', required: true },
        { name: 'idNumber', label: 'ID Number for Verification', type: 'text', required: true }
      ]
    }
  ]

  const selectedPaymentMethod = paymentMethods.find(method => method.id === selectedMethod)

  const handleFieldChange = (fieldName: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedMethod) {
      onError('Please select a payment method')
      return
    }

    // Validate required fields
    const method = paymentMethods.find(m => m.id === selectedMethod)
    if (method) {
      for (const field of method.fields) {
        if (field.required && !formData[field.name]) {
          onError(`${field.label} is required`)
          return
        }
      }
    }

    setLoading(true)
    
    try {
      const paymentData = {
        amount,
        currency,
        paymentMethod: selectedMethod,
        paymentType,
        description,
        formData,
        timestamp: new Date().toISOString()
      }

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      onSuccess(paymentData)
    } catch (error) {
      onError('Payment processing failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Payment Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Payment Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Amount</Label>
              <p className="text-2xl font-bold">{currency} {amount.toFixed(2)}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Payment Type</Label>
              <Badge variant="outline" className="mt-1">
                {paymentType.replace('_', ' ').toUpperCase()}
              </Badge>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Description</Label>
              <p className="text-sm">{description}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Step 1: Select Payment Method */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Select Payment Method</CardTitle>
            <CardDescription>
              Choose your preferred payment method from the options below
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {paymentMethods.map((method) => (
                <div
                  key={method.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                    selectedMethod === method.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedMethod(method.id)}
                >
                  <div className="flex items-start gap-3">
                    <div className="text-blue-600">{method.icon}</div>
                    <div className="flex-1">
                      <h3 className="font-semibold">{method.name}</h3>
                      <p className="text-sm text-muted-foreground mb-2">{method.description}</p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {method.processingTime}
                        </div>
                        <div className="flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          {method.fees}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {selectedMethod && (
              <div className="mt-6 flex justify-end">
                <Button onClick={() => setStep(2)}>
                  Continue with {paymentMethods.find(m => m.id === selectedMethod)?.name}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Step 2: Payment Details */}
      {step === 2 && selectedPaymentMethod && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {selectedPaymentMethod.icon}
              {selectedPaymentMethod.name} Details
            </CardTitle>
            <CardDescription>
              Please provide the required information for {selectedPaymentMethod.name}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {selectedPaymentMethod.fields.map((field) => (
                <div key={field.name}>
                  <Label htmlFor={field.name}>
                    {field.label}
                    {field.required && <span className="text-red-500 ml-1">*</span>}
                  </Label>
                  {field.type === 'select' ? (
                    <Select onValueChange={(value) => handleFieldChange(field.name, value)}>
                      <SelectTrigger>
                        <SelectValue placeholder={`Select ${field.label}`} />
                      </SelectTrigger>
                      <SelectContent>
                        {field.options?.map((option) => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : field.type === 'textarea' ? (
                    <Textarea
                      id={field.name}
                      placeholder={field.placeholder}
                      value={formData[field.name] || ''}
                      onChange={(e) => handleFieldChange(field.name, e.target.value)}
                      required={field.required}
                    />
                  ) : (
                    <Input
                      id={field.name}
                      type={field.type}
                      placeholder={field.placeholder}
                      value={formData[field.name] || ''}
                      onChange={(e) => handleFieldChange(field.name, e.target.value)}
                      required={field.required}
                    />
                  )}
                </div>
              ))}

              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  By completing this payment, you agree to our terms and conditions. 
                  Processing time: {selectedPaymentMethod.processingTime}. 
                  Fees: {selectedPaymentMethod.fees}
                </AlertDescription>
              </Alert>

              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => setStep(1)}>
                  Back
                </Button>
                <Button type="submit" disabled={loading} className="flex-1">
                  {loading ? (
                    <>
                      <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Pay {currency} {amount.toFixed(2)}
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  )
}