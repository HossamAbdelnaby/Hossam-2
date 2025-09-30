'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useAuth } from '@/contexts/auth-context'
import { useToast } from '@/hooks/use-toast'
import { 
  ArrowLeft, 
  CheckCircle, 
  Clock, 
  DollarSign, 
  XCircle,
  Users,
  AlertTriangle,
  CreditCard,
  MessageCircle
} from 'lucide-react'

interface Contract {
  id: string
  message: string
  clanTag: string
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'COMPLETED' | 'CANCELLED'
  createdAt: string
  pusher: {
    id: string
    realName: string
    price: number
    profilePicture?: string
    user: {
      name?: string
      email: string
    }
  }
  payment?: {
    id: string
    amount: number
    currency: string
    status: 'PENDING' | 'COMPLETED' | 'FAILED'
  }
}

export default function ContractsPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [contracts, setContracts] = useState<Contract[]>([])
  const [loadingContracts, setLoadingContracts] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
      return
    }

    if (user) {
      fetchUserContracts()
    }
  }, [user, loading, router])

  const fetchUserContracts = async () => {
    try {
      setLoadingContracts(true)
      const response = await fetch('/api/pusher/contracts')
      if (response.ok) {
        const data = await response.json()
        setContracts(data.contracts || [])
      } else {
        setError('Failed to fetch contracts')
      }
    } catch (err) {
      console.error('Error fetching contracts:', err)
      setError('Failed to load contracts')
    } finally {
      setLoadingContracts(false)
    }
  }

  const handlePayment = (contract: Contract) => {
    if (contract.payment) {
      router.push(`/payment?paymentId=${contract.payment.id}&contractId=${contract.id}`)
    }
  }

  const getContractStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'secondary'
      case 'ACCEPTED':
        return 'default'
      case 'REJECTED':
        return 'destructive'
      case 'COMPLETED':
        return 'default'
      case 'CANCELLED':
        return 'secondary'
      default:
        return 'secondary'
    }
  }

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'secondary'
      case 'COMPLETED':
        return 'default'
      case 'FAILED':
        return 'destructive'
      default:
        return 'secondary'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  if (loading || loadingContracts) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="w-12 h-12 mx-auto mb-4 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-muted-foreground">Loading contracts...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <Button variant="outline" asChild>
            <Link href="/dashboard">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Link>
          </Button>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <MessageCircle className="w-8 h-8" />
            My Contracts
          </h1>
        </div>
        <p className="text-muted-foreground">
          Manage your player rental contracts and payments
        </p>
      </div>

      {error && (
        <Alert className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Contracts List */}
      <div className="space-y-6">
        {contracts.length > 0 ? (
          contracts.map((contract) => (
            <Card key={contract.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
                      <Users className="w-6 h-6 text-primary-foreground" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">
                        {contract.pusher.realName}
                      </CardTitle>
                      <CardDescription>
                        {contract.pusher.user.name || contract.pusher.user.email} • {formatDate(contract.createdAt)}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={getContractStatusColor(contract.status)}>
                      {contract.status}
                    </Badge>
                    {contract.payment && (
                      <Badge variant={getPaymentStatusColor(contract.payment.status)}>
                        Payment: {contract.payment.status}
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-2">Contract Details</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Clan Tag:</span>
                        <span className="font-medium">{contract.clanTag}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Service Rate:</span>
                        <span className="font-medium">${contract.pusher.price}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Status:</span>
                        <Badge variant={getContractStatusColor(contract.status)} className="text-xs">
                          {contract.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">Payment Information</h4>
                    {contract.payment ? (
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Amount:</span>
                          <span className="font-medium">{contract.payment.currency} {contract.payment.amount}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Payment Status:</span>
                          <Badge variant={getPaymentStatusColor(contract.payment.status)} className="text-xs">
                            {contract.payment.status}
                          </Badge>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        No payment record found
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Message</h4>
                  <p className="text-sm text-muted-foreground">{contract.message}</p>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 pt-2">
                  {contract.status === 'ACCEPTED' && contract.payment?.status === 'PENDING' && (
                    <Button 
                      onClick={() => handlePayment(contract)}
                      className="gap-2"
                    >
                      <CreditCard className="w-4 h-4" />
                      Pay ${contract.payment.amount}
                    </Button>
                  )}
                  
                  {contract.status === 'PENDING' && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      Waiting for player response...
                    </div>
                  )}
                  
                  {contract.status === 'REJECTED' && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <XCircle className="w-4 h-4" />
                      Contract was rejected by the player
                    </div>
                  )}
                  
                  {contract.status === 'COMPLETED' && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle className="w-4 h-4" />
                      Contract completed successfully
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="text-center py-12">
              <MessageCircle className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No Contracts Yet</h3>
              <p className="text-muted-foreground mb-4">
                You haven't sent any player rental contracts yet.
              </p>
              <Button asChild>
                <Link href="/pusher-registration">
                  <Users className="w-4 h-4 mr-2" />
                  Browse Players
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}