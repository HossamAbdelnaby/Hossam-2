'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAuth } from '@/contexts/auth-context'
import { 
  Shield, 
  Users, 
  Crown, 
  Calendar,
  User,
  Mail,
  ArrowLeft,
  Eye,
  MapPin,
  Star,
  Clock,
  CheckCircle,
  XCircle,
  Trash2,
  Settings,
  AlertTriangle,
  Loader2
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
  updatedAt: string
  owner: {
    id: string
    email: string
    name?: string
  }
}

interface ClanStats {
  totalApplications: number
  approvedApplications: number
  pendingApplications: number
  rejectedApplications: number
}

interface JoinRequest {
  id: string
  name: string
  playerTag: string
  paymentMethod: string
  status: 'pending' | 'approved' | 'rejected'
  createdAt: string
  user: {
    id: string
    email: string
    name?: string
  }
}

export default function ClanDetailsPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [clan, setClan] = useState<Clan | null>(null)
  const [stats, setStats] = useState<ClanStats | null>(null)
  const [joinRequests, setJoinRequests] = useState<JoinRequest[]>([])
  const [activeTab, setActiveTab] = useState('overview')
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  
  const params = useParams()
  const router = useRouter()
  const clanId = params.id as string
  const { user } = useAuth()

  const isOwner = user && clan && user.id === clan.owner.id

  useEffect(() => {
    if (clanId) {
      fetchClanDetails()
      fetchClanStats()
      if (user) {
        fetchJoinRequests()
      }
    }
  }, [clanId, user])

  const fetchClanDetails = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/cwl/${clanId}`)
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Clan not found')
        }
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

  const fetchClanStats = async () => {
    try {
      const response = await fetch(`/api/cwl/${clanId}/stats`)
      
      if (response.ok) {
        const data = await response.json()
        setStats(data.stats)
      }
    } catch (err) {
      console.error('Failed to fetch clan stats:', err)
    }
  }

  const fetchJoinRequests = async () => {
    try {
      const response = await fetch(`/api/cwl/${clanId}/applications`)
      
      if (response.ok) {
        const data = await response.json()
        setJoinRequests(data.applications || [])
      }
    } catch (err) {
      console.error('Failed to fetch join requests:', err)
    }
  }

  const handleRequestAction = async (requestId: string, action: 'approve' | 'reject') => {
    try {
      setActionLoading(requestId)
      const response = await fetch(`/api/cwl/my-clan/applications/${requestId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action }),
      })

      if (!response.ok) {
        throw new Error(`Failed to ${action} request`)
      }

      // Refresh data
      await fetchJoinRequests()
      await fetchClanStats()
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to ${action} request`)
    } finally {
      setActionLoading(null)
    }
  }

  const handleDeleteClan = async () => {
    try {
      setDeleteLoading(true)
      const response = await fetch(`/api/cwl/${clanId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete clan')
      }

      // Redirect to CWL page
      router.push('/cwl')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete clan')
    } finally {
      setDeleteLoading(false)
      setShowDeleteConfirm(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const tabsListClass = isOwner ? "grid w-full grid-cols-3" : "grid w-full grid-cols-1"

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    )
  }

  if (error || !clan) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <Shield className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h1 className="text-3xl font-bold mb-4">Clan Not Found</h1>
          <p className="text-muted-foreground mb-8">
            {error || 'The clan you\'re looking for doesn\'t exist or is no longer active.'}
          </p>
          <Button asChild>
            <Link href="/cwl">Back to CWL Clans</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <Link href="/cwl" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="w-4 h-4" />
          Back to CWL Clans
        </Link>
        
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
            <Shield className="w-8 h-8 text-primary-foreground" />
          </div>
          <div className="flex-1">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-3xl font-bold mb-2">{clan.name}</h1>
                <p className="text-muted-foreground">
                  Clan details and owner information
                </p>
              </div>
              <div className="flex gap-2">
                {user && !isOwner && (
                  <Button asChild>
                    <Link href={`/cwl/${clan.id}/apply`}>
                      <User className="w-4 h-4 mr-2" />
                      Apply to Join
                    </Link>
                  </Button>
                )}
                {isOwner && (
                  <Button asChild>
                    <Link href="/cwl/profile">
                      <Eye className="w-4 h-4 mr-2" />
                      Manage Clan
                    </Link>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-600" />
                <div>
                  <p className="text-2xl font-bold">{stats.totalApplications}</p>
                  <p className="text-xs text-muted-foreground">Total Applications</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-yellow-600" />
                <div>
                  <p className="text-2xl font-bold">{stats.pendingApplications}</p>
                  <p className="text-xs text-muted-foreground">Pending</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-green-600" />
                <div>
                  <p className="text-2xl font-bold">{stats.approvedApplications}</p>
                  <p className="text-xs text-muted-foreground">Approved</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-red-600" />
                <div>
                  <p className="text-2xl font-bold">{stats.rejectedApplications}</p>
                  <p className="text-xs text-muted-foreground">Rejected</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content */}
      <div className="space-y-6">
        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className={tabsListClass}>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            {isOwner && (
              <TabsTrigger value="applications">Manage Applications</TabsTrigger>
            )}
            {isOwner && (
              <TabsTrigger value="settings">Manage Clan</TabsTrigger>
            )}
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Left Column - Clan Information */}
              <div className="lg:col-span-2 space-y-6">
                {/* Clan Details */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="w-5 h-5" />
                      Clan Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Clan Name</p>
                          <p className="text-lg font-semibold">{clan.name}</p>
                        </div>
                        
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Clan Tag</p>
                          <p className="text-lg font-semibold">{clan.tag}</p>
                        </div>
                        
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">League Level</p>
                          <Badge variant="outline" className="text-sm">
                            League {clan.leagueLevel || 'N/A'}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Members Needed</p>
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-muted-foreground" />
                            <span className="text-lg font-semibold">{clan.membersNeeded}</span>
                          </div>
                        </div>
                        
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Payment Per Player</p>
                          <div className="flex items-center gap-2">
                            <Crown className="w-4 h-4 text-muted-foreground" />
                            <span className="text-lg font-semibold">${clan.offeredPayment.toFixed(2)}</span>
                          </div>
                        </div>
                        
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Status</p>
                          <Badge variant={clan.isActive ? "default" : "secondary"}>
                            {clan.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    
                    {clan.terms && (
                      <div className="pt-6 border-t">
                        <p className="text-sm font-medium text-muted-foreground mb-3">Terms & Conditions</p>
                        <div className="bg-muted p-4 rounded-md">
                          <p className="text-sm leading-relaxed">{clan.terms}</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Owner Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="w-5 h-5" />
                      Clan Owner Information
                    </CardTitle>
                    <CardDescription>
                      Details about the clan owner who registered this clan
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
                        <User className="w-6 h-6 text-primary-foreground" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">
                          {clan.owner.name || 'Clan Owner'}
                        </h3>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Mail className="w-4 h-4" />
                          <span>{clan.owner.email}</span>
                        </div>
                      </div>
                      {isOwner && (
                        <Badge variant="outline">You</Badge>
                      )}
                    </div>
                    
                    <div className="grid md:grid-cols-2 gap-4 pt-4 border-t">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Member Since</p>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm">
                            {formatDate(clan.createdAt)}
                          </span>
                        </div>
                      </div>
                      
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Last Updated</p>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm">
                            {formatDate(clan.updatedAt)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Right Column - Actions */}
              <div className="lg:col-span-1">
                <Card className="sticky top-6">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="w-5 h-5" />
                      Quick Actions
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {user && !isOwner && (
                      <Button asChild className="w-full">
                        <Link href={`/cwl/${clan.id}/apply`}>
                          <User className="w-4 h-4 mr-2" />
                          Apply to Join Clan
                        </Link>
                      </Button>
                    )}
                    
                    {isOwner && (
                      <Button asChild className="w-full">
                        <Link href="/cwl/profile">
                          <Eye className="w-4 h-4 mr-2" />
                          Manage Applications
                        </Link>
                      </Button>
                    )}
                    
                    <Button variant="outline" asChild className="w-full">
                      <Link href={`/cwl/${clan.id}/apply`}>
                        <Eye className="w-4 h-4 mr-2" />
                        View Application Page
                      </Link>
                    </Button>
                    
                    <Button variant="outline" asChild className="w-full">
                      <Link href="/cwl">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Browse All Clans
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Manage Applications Tab */}
          {isOwner && (
            <TabsContent value="applications" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Manage Join Requests
                  </CardTitle>
                  <CardDescription>
                    Review and manage player applications to join your clan
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {joinRequests.length === 0 ? (
                    <div className="text-center py-8">
                      <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-muted-foreground">No join requests yet</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {joinRequests.map((request) => (
                        <Card key={request.id} className={`border-l-4 ${
                          request.status === 'pending' ? 'border-l-yellow-500' :
                          request.status === 'approved' ? 'border-l-green-500' :
                          'border-l-red-500'
                        }`}>
                          <CardContent className="pt-6">
                            <div className="flex items-start justify-between">
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <User className="w-4 h-4 text-muted-foreground" />
                                  <span className="font-semibold">{request.name}</span>
                                  <Badge variant="outline" className="text-xs">
                                    {request.playerTag}
                                  </Badge>
                                  <Badge variant={
                                    request.status === 'pending' ? 'outline' :
                                    request.status === 'approved' ? 'default' : 'destructive'
                                  } className="text-xs">
                                    {request.status}
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <Mail className="w-4 h-4" />
                                  <span>{request.user.email}</span>
                                  {request.user.name && (
                                    <span>({request.user.name})</span>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <Calendar className="w-4 h-4" />
                                  <span>
                                    Applied {new Date(request.createdAt).toLocaleDateString()}
                                  </span>
                                </div>
                              </div>
                              
                              {request.status === 'pending' && (
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    onClick={() => handleRequestAction(request.id, 'approve')}
                                    disabled={actionLoading === request.id}
                                    className="bg-green-600 hover:bg-green-700"
                                  >
                                    {actionLoading === request.id ? (
                                      <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                      <CheckCircle className="w-4 h-4" />
                                    )}
                                    <span className="ml-1">Accept</span>
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => handleRequestAction(request.id, 'reject')}
                                    disabled={actionLoading === request.id}
                                  >
                                    {actionLoading === request.id ? (
                                      <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                      <XCircle className="w-4 h-4" />
                                    )}
                                    <span className="ml-1">Reject</span>
                                  </Button>
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {/* Manage Clan Tab */}
          {isOwner && (
            <TabsContent value="settings" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="w-5 h-5" />
                    Clan Management
                  </CardTitle>
                  <CardDescription>
                    Manage your clan settings and perform administrative actions
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Clan Information */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Clan Information</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Clan Name</p>
                        <p className="font-semibold">{clan.name}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Clan Tag</p>
                        <p className="font-semibold">{clan.tag}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">League Level</p>
                        <Badge variant="outline">League {clan.leagueLevel || 'N/A'}</Badge>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Status</p>
                        <Badge variant={clan.isActive ? "default" : "secondary"}>
                          {clan.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Danger Zone */}
                  <div className="pt-6 border-t">
                    <h3 className="text-lg font-semibold text-destructive mb-4">Danger Zone</h3>
                    <Alert className="mb-4">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        Deleting your clan is permanent and cannot be undone. This will remove all clan data including join requests and clan information.
                      </AlertDescription>
                    </Alert>
                    
                    {!showDeleteConfirm ? (
                      <Button
                        variant="destructive"
                        onClick={() => setShowDeleteConfirm(true)}
                        disabled={deleteLoading}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete Clan
                      </Button>
                    ) : (
                      <div className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                          Are you sure you want to delete "{clan.name}"? This action cannot be undone.
                        </p>
                        <div className="flex gap-2">
                          <Button
                            variant="destructive"
                            onClick={handleDeleteClan}
                            disabled={deleteLoading}
                          >
                            {deleteLoading ? (
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4 mr-2" />
                            )}
                            Yes, Delete Clan
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => setShowDeleteConfirm(false)}
                            disabled={deleteLoading}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  )
}