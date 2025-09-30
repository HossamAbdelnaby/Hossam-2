'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/contexts/auth-context'
import { 
  Trophy, 
  Users, 
  Crown, 
  Shield,
  Plus,
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
}

export default function DashboardPage() {
  const { user, loading, logout } = useAuth()
  const router = useRouter()
  const [clan, setClan] = useState<Clan | null>(null)
  const [clanLoading, setClanLoading] = useState(false)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user) {
      fetchUserClan()
    }
  }, [user])

  const fetchUserClan = async () => {
    if (!user) return

    setClanLoading(true)
    try {
      const response = await fetch('/api/cwl/user-clan')
      if (response.ok) {
        const data = await response.json()
        setClan(data.clan)
      }
    } catch (error) {
      console.error('Failed to fetch user clan:', error)
    } finally {
      setClanLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Welcome back, {user.name || user.username}!</h1>
          <p className="text-muted-foreground">Manage your tournaments and services</p>
        </div>
        <Button onClick={logout} variant="outline">
          Logout
        </Button>
      </div>

      {/* CWL Clan Section */}
      {clanLoading ? (
        <Card className="mb-8">
          <CardContent className="flex items-center justify-center p-8">
            <Loader2 className="w-6 h-6 animate-spin mr-2" />
            Loading clan information...
          </CardContent>
        </Card>
      ) : clan ? (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Your CWL Clan Registration
            </CardTitle>
            <CardDescription>
              Your clan is registered for Clan War Leagues
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
                    <Shield className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{clan.name}</h3>
                    <p className="text-sm text-muted-foreground">{clan.tag}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-muted rounded-lg">
                    <div className="flex items-center justify-center gap-1 text-sm font-medium">
                      <Trophy className="w-3 h-3" />
                      {clan.leagueLevel || 'N/A'}
                    </div>
                    <div className="text-xs text-muted-foreground">League Level</div>
                  </div>
                  
                  <div className="text-center p-3 bg-muted rounded-lg">
                    <div className="flex items-center justify-center gap-1 text-sm font-medium">
                      <Users className="w-3 h-3" />
                      {clan.membersNeeded}
                    </div>
                    <div className="text-xs text-muted-foreground">Members Needed</div>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="text-center p-3 bg-muted rounded-lg">
                  <div className="flex items-center justify-center gap-1 text-sm font-medium">
                    <Crown className="w-3 h-3" />
                    ${clan.offeredPayment.toFixed(2)}
                  </div>
                  <div className="text-xs text-muted-foreground">Per Player Payment</div>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Terms & Conditions</h4>
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {clan.terms || 'No terms specified'}
                  </p>
                </div>
                
                <div className="flex items-center gap-2">
                  <Badge variant={clan.isActive ? 'default' : 'secondary'}>
                    {clan.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    Registered {new Date(clan.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" onClick={() => router.push('/cwl')}>
                View All Clans
              </Button>
              <Button onClick={() => router.push(`/cwl/${clan.id}`)}>
                Manage Clan
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              CWL Clan Registration
            </CardTitle>
            <CardDescription>
              Register your clan for Clan War Leagues to find players
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <Shield className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No Clan Registered</h3>
              <p className="text-muted-foreground mb-4">
                Register your clan for CWL to start recruiting players
              </p>
              <Button onClick={() => router.push('/cwl/register')}>
                <Plus className="w-4 h-4 mr-2" />
                Register Clan
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Create Tournament</CardTitle>
            <CardDescription>
              Organize a new Clash of Clans tournament
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" onClick={() => router.push('/create-tournament')}>
              Create Tournament
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>My Tournaments</CardTitle>
            <CardDescription>
              View and manage your active tournaments
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" variant="outline" onClick={() => router.push('/tournaments')}>
              View Tournaments
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Player Services</CardTitle>
            <CardDescription>
              Register as a pusher or hire players
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" variant="outline" onClick={() => router.push('/pusher-registration')}>
              Explore Services
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Team Registration</CardTitle>
            <CardDescription>
              Register your team for upcoming tournaments
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" variant="outline" onClick={() => router.push('/teams')}>
              Manage Teams
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Messages</CardTitle>
            <CardDescription>
              Chat with other users and players
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" variant="outline" onClick={() => router.push('/chat')}>
              Open Chat
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>My Contracts</CardTitle>
            <CardDescription>
              View and manage your player rental contracts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" variant="outline" onClick={() => router.push('/contracts')}>
              View Contracts
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Payment History</CardTitle>
            <CardDescription>
              View your payment transactions and history
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" variant="outline" onClick={() => router.push('/payments')}>
              View Payments
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}