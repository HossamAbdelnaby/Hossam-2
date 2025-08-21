'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/contexts/auth-context'
import { Trophy, Users, Clock, Edit, Save } from 'lucide-react'

interface Match {
  id: string
  round: number
  matchNumber: number
  score1?: number
  score2?: number
  winnerId?: string
  team1?: {
    id: string
    name: string
    logo?: string
  }
  team2?: {
    id: string
    name: string
    logo?: string
  }
  winner?: {
    id: string
    name: string
  }
}

interface Stage {
  id: string
  name: string
  type: string
  order: number
  matches: Match[]
}

interface Tournament {
  id: string
  name: string
  status: string
  stages: Stage[]
}

interface TeamStanding {
  id: string
  name: string
  logo?: string
  stats: {
    wins: number
    losses: number
    draws: number
    totalScore: number
    matchesPlayed: number
  }
}

export default function LiveScoresPage() {
  const params = useParams()
  const { user } = useAuth()
  const { toast } = useToast()
  const [tournament, setTournament] = useState<Tournament | null>(null)
  const [standings, setStandings] = useState<TeamStanding[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [editingMatch, setEditingMatch] = useState<string | null>(null)
  const [tempScores, setTempScores] = useState<{ score1: number; score2: number }>({ score1: 0, score2: 0 })

  useEffect(() => {
    fetchTournamentData()
    setupSocketListeners()
  }, [params.id])

  const fetchTournamentData = async () => {
    try {
      const response = await fetch(`/api/tournaments/${params.id}/scores`)
      if (response.ok) {
        const data = await response.json()
        setTournament(data.tournament)
        setStandings(data.standings)
      }
    } catch (error) {
      console.error('Error fetching tournament data:', error)
      toast({
        title: 'Error',
        description: 'Failed to fetch tournament data',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const setupSocketListeners = () => {
    if (typeof window !== 'undefined') {
      const initSocket = async () => {
        const io = (await import('socket.io-client')).default
        const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3000')

        socket.on('score-update', (data: any) => {
          fetchTournamentData()
          toast({
            title: 'Score Updated',
            description: 'Match scores have been updated',
          })
        })

        socket.on(`tournament:${params.id}`, (data: any) => {
          fetchTournamentData()
        })

        return () => socket.disconnect()
      }
      
      initSocket()
    }
  }

  const updateMatchScore = async (matchId: string, score1: number, score2: number) => {
    try {
      const winnerId = score1 > score2 
        ? tournament?.stages.flatMap(s => s.matches).find(m => m.id === matchId)?.team1?.id
        : score2 > score1
        ? tournament?.stages.flatMap(s => s.matches).find(m => m.id === matchId)?.team2?.id
        : null

      const response = await fetch(`/api/tournaments/${params.id}/scores`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          matchId,
          score1,
          score2,
          winnerId
        })
      })

      if (response.ok) {
        setEditingMatch(null)
        fetchTournamentData()
        toast({
          title: 'Success',
          description: 'Match score updated successfully',
        })
      }
    } catch (error) {
      console.error('Error updating match score:', error)
      toast({
        title: 'Error',
        description: 'Failed to update match score',
        variant: 'destructive'
      })
    }
  }

  const startEditing = (match: Match) => {
    setEditingMatch(match.id)
    setTempScores({
      score1: match.score1 || 0,
      score2: match.score2 || 0
    })
  }

  const cancelEditing = () => {
    setEditingMatch(null)
    setTempScores({ score1: 0, score2: 0 })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'IN_PROGRESS':
        return 'bg-green-500'
      case 'COMPLETED':
        return 'bg-blue-500'
      case 'REGISTRATION_OPEN':
        return 'bg-yellow-500'
      default:
        return 'bg-gray-500'
    }
  }

  const getStageTypeIcon = (type: string) => {
    switch (type) {
      case 'SINGLE_ELIMINATION':
        return '🏆'
      case 'DOUBLE_ELIMINATION':
        return '🥈'
      case 'GROUP_STAGE':
        return '👥'
      case 'SWISS':
        return '🎯'
      default:
        return '📊'
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded mb-4"></div>
          <div className="h-32 bg-muted rounded mb-6"></div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>
    )
  }

  if (!tournament) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Tournament not found</h1>
          <p className="text-muted-foreground">The tournament you're looking for doesn't exist.</p>
        </div>
      </div>
    )
  }

  const isOrganizer = user?.id === tournament.organizerId

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Tournament Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">{tournament.name}</h1>
            <div className="flex items-center gap-4">
              <Badge className={getStatusColor(tournament.status)}>
                {tournament.status.replace('_', ' ')}
              </Badge>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span>Live Updates</span>
              </div>
            </div>
          </div>
          <Button onClick={fetchTournamentData} variant="outline">
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Tournament Stages and Matches */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="w-5 h-5" />
                Tournament Bracket
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {tournament.stages.map((stage) => (
                  <div key={stage.id}>
                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-lg">{getStageTypeIcon(stage.type)}</span>
                      <h3 className="text-lg font-semibold">{stage.name}</h3>
                      <Badge variant="outline">{stage.type.replace('_', ' ')}</Badge>
                    </div>
                    
                    <div className="space-y-3">
                      {stage.matches.map((match) => (
                        <Card key={match.id} className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">{match.team1?.name || 'TBD'}</span>
                                  {editingMatch === match.id ? (
                                    <Input
                                      type="number"
                                      value={tempScores.score1}
                                      onChange={(e) => setTempScores(prev => ({ ...prev, score1: parseInt(e.target.value) || 0 }))}
                                      className="w-16 h-8 text-center"
                                      min="0"
                                    />
                                  ) : (
                                    <span className="font-bold text-lg">{match.score1 || '-'}</span>
                                  )}
                                </div>
                                <span className="text-muted-foreground">vs</span>
                                <div className="flex items-center gap-2">
                                  {editingMatch === match.id ? (
                                    <Input
                                      type="number"
                                      value={tempScores.score2}
                                      onChange={(e) => setTempScores(prev => ({ ...prev, score2: parseInt(e.target.value) || 0 }))}
                                      className="w-16 h-8 text-center"
                                      min="0"
                                    />
                                  ) : (
                                    <span className="font-bold text-lg">{match.score2 || '-'}</span>
                                  )}
                                  <span className="font-medium">{match.team2?.name || 'TBD'}</span>
                                </div>
                              </div>
                              
                              {match.winner && (
                                <div className="text-sm text-green-600">
                                  Winner: {match.winner.name}
                                </div>
                              )}
                            </div>
                            
                            {isOrganizer && (
                              <div className="flex gap-2">
                                {editingMatch === match.id ? (
                                  <>
                                    <Button
                                      size="sm"
                                      onClick={() => updateMatchScore(match.id, tempScores.score1, tempScores.score2)}
                                    >
                                      <Save className="w-4 h-4" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={cancelEditing}
                                    >
                                      Cancel
                                    </Button>
                                  </>
                                ) : (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => startEditing(match)}
                                  >
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                )}
                              </div>
                            )}
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Standings */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Standings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Team</TableHead>
                    <TableHead className="text-center">W</TableHead>
                    <TableHead className="text-center">L</TableHead>
                    <TableHead className="text-center">D</TableHead>
                    <TableHead className="text-center">Score</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {standings.map((team, index) => (
                    <TableRow key={team.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {index === 0 && <span className="text-lg">🥇</span>}
                          {index === 1 && <span className="text-lg">🥈</span>}
                          {index === 2 && <span className="text-lg">🥉</span>}
                          <span className="font-medium">{team.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center font-medium text-green-600">
                        {team.stats.wins}
                      </TableCell>
                      <TableCell className="text-center font-medium text-red-600">
                        {team.stats.losses}
                      </TableCell>
                      <TableCell className="text-center font-medium text-yellow-600">
                        {team.stats.draws}
                      </TableCell>
                      <TableCell className="text-center font-bold">
                        {team.stats.totalScore}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}