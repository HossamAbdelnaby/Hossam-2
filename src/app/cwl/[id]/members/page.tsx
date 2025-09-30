'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useAuth } from '@/contexts/auth-context'
import { useToast } from '@/hooks/use-toast'
import { 
  Shield, 
  Users, 
  ArrowLeft,
  Mail,
  Calendar,
  CheckCircle,
  User,
  Crown
} from 'lucide-react'

interface ClanMember {
  id: string
  name: string
  playerTag: string
  paymentMethod: string
  status: string
  createdAt: string
  user: {
    id: string
    email: string
    name?: string
  }
}

interface ClanDetails {
  id: string
  name: string
  tag: string
  leagueLevel: number
  membersNeeded: number
  offeredPayment: number
  isActive: boolean
  createdAt: string
  owner: {
    id: string
    email: string
    name?: string
  }
}

export default function ClanMembersPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [clan, setClan] = useState<ClanDetails | null>(null)
  const [members, setMembers] = useState<ClanMember[]>([])
  
  const params = useParams()
  const router = useRouter()
  const clanId = params.id as string
  const { user } = useAuth()
  const { toast } = useToast()

  const isOwner = user && clan && user.id === clan.owner.id

  useEffect(() => {
    if (clanId) {
      fetchClanDetails()
      fetchClanMembers()
    }
  }, [clanId])

  const fetchClanDetails = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/cwl/${clanId}`)
      
      if (response.ok) {
        const data = await response.json()
        setClan(data.clan)
      } else if (response.status === 404) {
        setError('Clan not found')
      } else {
        setError('Failed to fetch clan details')
      }
    } catch (err) {
      console.error('Failed to fetch clan details:', err)
      setError('Failed to fetch clan details')
    } finally {
      setLoading(false)
    }
  }

  const fetchClanMembers = async () => {
    try {
      const response = await fetch(`/api/cwl/${clanId}/applications`)
      
      if (response.ok) {
        const data = await response.json()
        const approved = data.applications.filter((app: ClanMember) => 
          app.status.toLowerCase() === 'accepted' || app.status === 'ACCEPTED'
        )
        setMembers(approved)
      }
    } catch (err) {
      console.error('Failed to fetch clan members:', err)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const formatStatus = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Shield className="w-12 h-12 mx-auto mb-4 animate-spin text-muted-foreground" />
            <p className="text-muted-foreground">Loading clan members...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error || !clan) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto">
          <Alert>
            <AlertDescription>{error || 'Clan not found'}</AlertDescription>
          </Alert>
          <Button asChild className="w-full mt-4">
            <Link href="/cwl">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Clans
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
            <Link href={`/cwl/${clanId}`}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Clan
            </Link>
          </Button>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Shield className="w-8 h-8" />
            Clan Members
          </h1>
        </div>
        
        <div className="bg-muted/50 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold">{clan.name}</h2>
              <p className="text-muted-foreground">Tag: {clan.tag}</p>
            </div>
            <div className="text-right">
              <Badge variant="default" className="text-lg px-3 py-1">
                {members.length}/{clan.membersNeeded} Members
              </Badge>
              <p className="text-sm text-muted-foreground mt-1">
                {clan.membersNeeded - members.length} spots available
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Members List */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold flex items-center gap-2">
            <Users className="w-5 h-5" />
            Approved Members
          </h3>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={fetchClanMembers}
              disabled={loading}
            >
              {loading ? (
                <Shield className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Shield className="w-4 h-4 mr-2" />
              )}
              Refresh
            </Button>
            {isOwner && (
              <Button asChild size="sm">
                <Link href={`/cwl/${clanId}`}>
                  <Crown className="w-4 h-4 mr-2" />
                  Manage Applications
                </Link>
              </Button>
            )}
          </div>
        </div>

        {members.length === 0 ? (
          <Card>
            <CardContent className="pt-12">
              <div className="text-center py-8">
                <Users className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No Approved Members Yet</h3>
                <p className="text-muted-foreground mb-4">
                  Approved members will appear here after the clan owner accepts their applications.
                </p>
                {isOwner && (
                  <Button asChild>
                    <Link href={`/cwl/${clanId}`}>
                      <Crown className="w-4 h-4 mr-2" />
                      Review Applications
                    </Link>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {members.map((member) => (
              <Card key={member.id} className="border-l-4 border-l-green-500 hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-lg">{member.name}</h3>
                          <Badge variant="default" className="bg-green-600">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Active Member
                          </Badge>
                        </div>
                        {clan.owner.id === member.user.id && (
                          <Badge variant="outline" className="border-yellow-500 text-yellow-700">
                            <Crown className="w-3 h-3 mr-1" />
                            Clan Owner
                          </Badge>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <User className="w-4 h-4" />
                        <span>{member.user.name || member.user.username}</span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-muted-foreground" />
                          <div>
                            <span className="font-medium text-muted-foreground">Player Tag:</span>
                            <span className="ml-1">{member.playerTag}</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Shield className="w-4 h-4 text-muted-foreground" />
                          <div>
                            <span className="font-medium text-muted-foreground">Payment:</span>
                            <span className="ml-1">{member.paymentMethod}</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          <div>
                            <span className="font-medium text-muted-foreground">Joined:</span>
                            <span className="ml-1">{formatDate(member.createdAt)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-sm text-muted-foreground mb-2">Status</div>
                      <Badge variant="default" className="bg-green-100 text-green-800">
                        {formatStatus(member.status)}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Recruitment Status */}
        {members.length < clan.membersNeeded && (
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-blue-900">Still Recruiting</h4>
                  <p className="text-blue-700 text-sm">
                    We're looking for {clan.membersNeeded - members.length} more members to complete our clan.
                  </p>
                </div>
                <Badge variant="outline" className="border-blue-500 text-blue-700">
                  {members.length}/{clan.membersNeeded}
                </Badge>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Clan Complete */}
        {members.length >= clan.membersNeeded && (
          <Card className="border-green-200 bg-green-50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-green-900">Clan Complete!</h4>
                  <p className="text-green-700 text-sm">
                    Great! We've reached our target of {clan.membersNeeded} members.
                  </p>
                </div>
                <Badge variant="default" className="bg-green-600">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Full
                </Badge>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}