'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useAuth } from '@/contexts/auth-context'
import { BracketDisplay } from '@/components/bracket/bracket-display'
import { ArrowLeft, Trophy, Users, Calendar, Settings, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { BracketMatch } from '@/lib/bracket-data'

interface Tournament {
  id: string
  name: string
  description?: string
  host: string
  prizeAmount: number
  maxTeams: number
  registrationStart: string
  registrationEnd?: string
  tournamentStart: string
  tournamentEnd?: string
  status: 'DRAFT' | 'REGISTRATION_OPEN' | 'REGISTRATION_CLOSED' | 'IN_PROGRESS' | 'COMPLETED'
  bracketType: 'SINGLE_ELIMINATION' | 'DOUBLE_ELIMINATION' | 'SWISS' | 'GROUP_STAGE' | 'LEADERBOARD'
  organizerId: string
  teams: Array<{
    id: string
    name: string
    clanTag?: string
    logo?: string
    nationality?: string
  }>
}

export default function TournamentBracketPage() {
  const params = useParams()
  const router = useRouter()
  const { user, loading } = useAuth()
  const [tournament, setTournament] = useState<Tournament | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (params.id) {
      fetchTournament()
    }
  }, [params.id])

  const fetchTournament = async () => {
    try {
      setIsLoading(true)
      console.log('Fetching tournament data...')
      const response = await fetch(`/api/tournaments/${params.id}`)
      
      if (response.ok) {
        const data = await response.json()
        console.log('Tournament data received:', data)
        setTournament(data.tournament)
      } else if (response.status === 404) {
        setError('Tournament not found')
      } else {
        setError('Failed to load tournament')
      }
    } catch (error) {
      console.error('Error fetching tournament:', error)
      setError('Failed to load tournament')
    } finally {
      setIsLoading(false)
    }
  }

  const handleMatchClick = async (match: BracketMatch) => {
    // Handle match click - could open a modal for editing scores
    console.log('Match clicked:', match)
    // This could be extended to open a score editing modal
  }

  const isAdmin = user && tournament && tournament.organizerId === user.id
  const canEdit = isAdmin && tournament?.status === 'IN_PROGRESS'

  console.log('Page state:', { 
    tournament: tournament?.name, 
    isLoading, 
    error, 
    isAdmin, 
    canEdit,
    user: user?.email 
  })

  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-center">
          <div className="w-8 h-8 bg-muted rounded-full mx-auto mb-2"></div>
          <div className="text-sm text-muted-foreground">Loading tournament bracket...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <div className="text-lg font-semibold text-red-600 mb-2">Error</div>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={() => router.push('/tournaments')}>
              Back to Tournaments
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!tournament) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href={`/tournaments/${params.id}`}>
              <Button variant="outline" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold">{tournament.name}</h1>
              <p className="text-muted-foreground">Tournament Bracket</p>
            </div>
          </div>
          <Badge variant={tournament.status === 'IN_PROGRESS' ? 'default' : 'secondary'}>
            {tournament.status.replace('_', ' ')}
          </Badge>
        </div>

        {/* Tournament Info */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5" />
              Tournament Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4 text-muted-foreground" />
                <div>
                  <div className="text-sm font-medium">Prize Pool</div>
                  <div className="text-lg font-bold">${tournament.prizeAmount.toLocaleString()}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <div>
                  <div className="text-sm font-medium">Start Date</div>
                  <div className="text-lg font-bold">{new Date(tournament.tournamentStart).toLocaleDateString()}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-muted-foreground" />
                <div>
                  <div className="text-sm font-medium">Teams</div>
                  <div className="text-lg font-bold">{tournament.teams.length}/{tournament.maxTeams}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4 text-muted-foreground" />
                <div>
                  <div className="text-sm font-medium">Format</div>
                  <div className="text-lg font-bold">{tournament.bracketType.replace('_', ' ')}</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bracket Display */}
        {tournament.teams.length > 0 ? (
          <BracketDisplay
            tournamentId={tournament.id}
            bracketType={tournament.bracketType}
            maxTeams={tournament.maxTeams}
            onMatchClick={handleMatchClick}
            isAdmin={isAdmin}
            canManage={canEdit}
          />
        ) : (
          <Card>
            <CardContent className="flex items-center justify-center h-64">
              <div className="text-center">
                <Trophy className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No Teams Registered</h3>
                <p className="text-muted-foreground mb-4">
                  Teams need to register before the bracket can be generated.
                </p>
                <Button asChild>
                  <Link href={`/tournaments/${params.id}`}>
                    Back to Tournament
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Status Information */}
        {tournament.status !== 'IN_PROGRESS' && tournament.teams.length > 0 && (
          <Card className="mt-8">
            <CardContent className="pt-6">
              <div className="text-center">
                <AlertCircle className="w-12 h-12 mx-auto mb-4 text-blue-500" />
                <h3 className="text-lg font-semibold mb-2">Tournament Status</h3>
                <Alert className="max-w-md mx-auto">
                  <AlertDescription>
                    {tournament.status === 'DRAFT' && 'Tournament is in draft phase. Bracket will be available when tournament starts.'}
                    {tournament.status === 'REGISTRATION_OPEN' && 'Registration is currently open. Bracket will be generated when registration closes.'}
                    {tournament.status === 'REGISTRATION_CLOSED' && 'Registration is closed. Bracket will be available when tournament starts.'}
                    {tournament.status === 'COMPLETED' && 'Tournament has been completed. Final bracket is shown above.'}
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Admin Controls */}
        {isAdmin && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Admin Controls
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <Button 
                  variant="outline" 
                  onClick={fetchTournament}
                  className="gap-2"
                >
                  Refresh Bracket
                </Button>
                {canEdit && (
                  <Button variant="default">
                    Manage Matches
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}