'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useAuth } from '@/contexts/auth-context'
import { 
  ArrowLeft, 
  DollarSign, 
  CreditCard, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  ExternalLink,
  Calendar
} from 'lucide-react'

interface Payment {
  id: string
  amount: number
  method: string
  status: string
  createdAt: string
  transactionId?: string
  tournament?: {
    id: string
    name: string
  }
  contract?: {
    id: string
    message: string
  }
  serviceOrder?: {
    id: string
    service: {
      name: string
    }
  }
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const { user } = useAuth()

  useEffect(() => {
    if (!user) return
    fetchPayments()
  }, [user])

  const fetchPayments = async () => {
    try {
      const response = await fetch('/api/payment/user')
      if (!response.ok) {
        throw new Error('Failed to fetch payments')
      }
      const data = await response.json()
      setPayments(data.payments)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch payments')
    } finally {
      setLoading(false)
    }
  }

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'PAYPAL': return <CreditCard className="w-4 h-4" />
      case 'CREDIT_CARD': return <CreditCard className="w-4 h-4" />
      case 'BINANCE': return <DollarSign className="w-4 h-4" />
      case 'WESTERN_UNION': return <DollarSign className="w-4 h-4" />
      default: return <DollarSign className="w-4 h-4" />
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED': return <CheckCircle className="w-4 h-4" />
      case 'PENDING': return <Clock className="w-4 h-4" />
      case 'FAILED': return <AlertTriangle className="w-4 h-4" />
      default: return <Clock className="w-4 h-4" />
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

  const getPaymentDescription = (payment: Payment) => {
    if (payment.tournament) {
      return `Tournament: ${payment.tournament.name}`
    } else if (payment.contract) {
      return `Contract: ${payment.contract.message.substring(0, 50)}...`
    } else if (payment.serviceOrder) {
      return `Service: ${payment.serviceOrder.service.name}`
    }
    return 'General payment'
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded mb-4"></div>
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
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
              <DollarSign className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Payment History</h1>
              <p className="text-muted-foreground">
                View and manage all your payment transactions
              </p>
            </div>
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Payments</p>
                  <p className="text-2xl font-bold">{payments.length}</p>
                </div>
                <DollarSign className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Completed</p>
                  <p className="text-2xl font-bold">
                    {payments.filter(p => p.status === 'COMPLETED').length}
                  </p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending</p>
                  <p className="text-2xl font-bold">
                    {payments.filter(p => p.status === 'PENDING').length}
                  </p>
                </div>
                <Clock className="w-8 h-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Payments List */}
        <Card>
          <CardHeader>
            <CardTitle>Transaction History</CardTitle>
            <CardDescription>
              All your payment transactions are listed below
            </CardDescription>
          </CardHeader>
          <CardContent>
            {payments.length === 0 ? (
              <div className="text-center py-8">
                <DollarSign className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No payments yet</h3>
                <p className="text-muted-foreground">
                  You haven't made any payments yet. Create a tournament or purchase a service to get started.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {payments.map((payment) => (
                  <div
                    key={payment.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                        {getPaymentMethodIcon(payment.method)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold">${payment.amount}</h4>
                          <Badge className={getStatusColor(payment.status)}>
                            <span className="flex items-center gap-1">
                              {getStatusIcon(payment.status)}
                              {payment.status}
                            </span>
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {getPaymentDescription(payment)}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Calendar className="w-3 h-3 text-gray-400" />
                          <span className="text-xs text-gray-500">
                            {new Date(payment.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {payment.status === 'PENDING' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.location.href = `/payment?paymentId=${payment.id}`}
                        >
                          Complete Payment
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.location.href = `/payment?paymentId=${payment.id}`}
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}