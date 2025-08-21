'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Trophy, Medal, Award, TrendingUp } from 'lucide-react'

interface Team {
  id: string
  name: string
  clanTag?: string
  logo?: string
  captain?: {
    name: string
    username: string
  }
}

interface Match {
  id: string
  round: number
  matchNumber: number
  score1?: number
  score2?: number
  team1?: Team
  team2?: Team
  winner?: Team
  isActive: boolean
}

interface SwissBracketProps {
  matches: Match[]
  onMatchUpdate?: (matchId: string, score1: number, score2: number) => void
  isAdmin?: boolean
}

interface TeamStats {
  team: Team
  wins: number
  losses: number
  draws: number
  score: number
  opponents: string[]
  buchholz: number
}

export function SwissBracket({ matches, onMatchUpdate, isAdmin = false }: SwissBracketProps) {
  const [selectedRound, setSelectedRound] = useState<number>(1)
  
  // Calculate team statistics
  const calculateTeamStats = (): TeamStats[] => {
    const teamStatsMap = new Map<string, TeamStats>()
    
    // Initialize stats for all teams
    const allTeams = new Set<Team>()
    matches.forEach(match => {
      if (match.team1) allTeams.add(match.team1)
      if (match.team2) allTeams.add(match.team2)
    })
    
    allTeams.forEach(team => {
      teamStatsMap.set(team.id, {
        team,
        wins: 0,
        losses: 0,
        draws: 0,
        score: 0,
        opponents: [],
        buchholz: 0
      })
    })
    
    // Process matches to calculate stats
    matches.forEach(match => {
      if (match.team1 && match.team2 && match.score1 !== undefined && match.score2 !== undefined) {
        const stats1 = teamStatsMap.get(match.team1.id)!
        const stats2 = teamStatsMap.get(match.team2.id)!
        
        // Track opponents
        stats1.opponents.push(match.team2.id)
        stats2.opponents.push(match.team1.id)
        
        if (match.score1 > match.score2) {
          stats1.wins += 1
          stats1.score += 3
          stats2.losses += 1
          stats2.score += 0
        } else if (match.score2 > match.score1) {
          stats2.wins += 1
          stats2.score += 3
          stats1.losses += 1
          stats1.score += 0
        } else {
          stats1.draws += 1
          stats1.score += 1
          stats2.draws += 1
          stats2.score += 1
        }
      }
    })
    
    // Calculate Buchholz score (sum of opponents' scores)
    const statsArray = Array.from(teamStatsMap.values())
    statsArray.forEach(stats => {
      stats.buchholz = stats.opponents.reduce((sum, oppId) => {
        const oppStats = teamStatsMap.get(oppId)
        return sum + (oppStats?.score || 0)
      }, 0)
    })
    
    // Sort by score, then Buchholz, then wins
    return statsArray.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score
      if (b.buchholz !== a.buchholz) return b.buchholz - a.buchholz
      return b.wins - a.wins
    })
  }

  const teamStats = calculateTeamStats()
  const rounds = Math.max(...matches.map(m => m.round), 0)
  const roundMatches = matches.filter(match => match.round === selectedRound)

  const renderMatch = (match: Match) => {
    const isTeam1Winner = match.winner?.id === match.team1?.id
    const isTeam2Winner = match.winner?.id === match.team2?.id

    return (
      <Card key={match.id} className="p-4 hover:shadow-md transition-shadow">
        <div className="space-y-3">
          {/* Match Header */}
          <div className="flex items-center justify-between">
            <Badge variant="outline">Match #{match.matchNumber}</Badge>
            <div className="text-sm text-muted-foreground">Round {match.round}</div>
          </div>
          
          {/* Team 1 */}
          <div className={`flex items-center justify-between p-3 rounded-lg transition-colors ${
            isTeam1Winner ? 'bg-green-50 border-l-4 border-green-500' : 'bg-muted/30'
          }`}>
            <div className="flex items-center gap-3 flex-1 min-w-0">
              {match.team1?.logo && (
                <Avatar className="w-8 h-8 flex-shrink-0">
                  <AvatarImage src={match.team1.logo} alt={match.team1.name} />
                  <AvatarFallback>
                    {match.team1.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
              )}
              <div className="min-w-0 flex-1">
                <span className="font-medium truncate block">
                  {match.team1?.name || 'TBD'}
                </span>
                {match.team1?.clanTag && (
                  <span className="text-xs text-muted-foreground">
                    [{match.team1.clanTag}]
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {isAdmin && (
                <Input
                  type="number"
                  min="0"
                  value={match.score1 ?? ''}
                  onChange={(e) => {
                    const score = parseInt(e.target.value) || 0
                    onMatchUpdate?.(match.id, score, match.score2 || 0)
                  }}
                  className="w-16 h-8 text-center"
                  placeholder="-"
                />
              )}
              {match.score1 !== undefined && !isAdmin && (
                <span className="text-lg font-bold w-12 text-center">{match.score1}</span>
              )}
              {isTeam1Winner && (
                <Trophy className="w-4 h-4 text-yellow-500" />
              )}
            </div>
          </div>
          
          {/* VS Divider */}
          <div className="text-center">
            <span className="text-sm font-medium text-muted-foreground">VS</span>
          </div>
          
          {/* Team 2 */}
          <div className={`flex items-center justify-between p-3 rounded-lg transition-colors ${
            isTeam2Winner ? 'bg-green-50 border-l-4 border-green-500' : 'bg-muted/30'
          }`}>
            <div className="flex items-center gap-3 flex-1 min-w-0">
              {match.team2?.logo && (
                <Avatar className="w-8 h-8 flex-shrink-0">
                  <AvatarImage src={match.team2.logo} alt={match.team2.name} />
                  <AvatarFallback>
                    {match.team2.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
              )}
              <div className="min-w-0 flex-1">
                <span className="font-medium truncate block">
                  {match.team2?.name || 'TBD'}
                </span>
                {match.team2?.clanTag && (
                  <span className="text-xs text-muted-foreground">
                    [{match.team2.clanTag}]
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {isAdmin && (
                <Input
                  type="number"
                  min="0"
                  value={match.score2 ?? ''}
                  onChange={(e) => {
                    const score = parseInt(e.target.value) || 0
                    onMatchUpdate?.(match.id, match.score1 || 0, score)
                  }}
                  className="w-16 h-8 text-center"
                  placeholder="-"
                />
              )}
              {match.score2 !== undefined && !isAdmin && (
                <span className="text-lg font-bold w-12 text-center">{match.score2}</span>
              )}
              {isTeam2Winner && (
                <Trophy className="w-4 h-4 text-yellow-500" />
              )}
            </div>
          </div>
        </div>
      </Card>
    )
  }

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="w-5 h-5 text-yellow-500" />
      case 2:
        return <Medal className="w-5 h-5 text-gray-400" />
      case 3:
        return <Award className="w-5 h-5 text-amber-600" />
      default:
        return <span className="text-sm font-bold text-muted-foreground">#{rank}</span>
    }
  }

  return (
    <div className="w-full space-y-6">
      {/* Standings Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Current Standings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">Rank</TableHead>
                <TableHead>Team</TableHead>
                <TableHead className="text-center">W</TableHead>
                <TableHead className="text-center">L</TableHead>
                <TableHead className="text-center">D</TableHead>
                <TableHead className="text-center">Score</TableHead>
                <TableHead className="text-center">Buchholz</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {teamStats.map((stats, index) => (
                <TableRow key={stats.team.id}>
                  <TableCell className="text-center">
                    {getRankIcon(index + 1)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {stats.team.logo && (
                        <Avatar className="w-6 h-6">
                          <AvatarImage src={stats.team.logo} alt={stats.team.name} />
                          <AvatarFallback className="text-xs">
                            {stats.team.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                      )}
                      <div>
                        <span className="font-medium">{stats.team.name}</span>
                        {stats.team.clanTag && (
                          <span className="text-xs text-muted-foreground ml-1">
                            [{stats.team.clanTag}]
                          </span>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-center font-medium text-green-600">
                    {stats.wins}
                  </TableCell>
                  <TableCell className="text-center font-medium text-red-600">
                    {stats.losses}
                  </TableCell>
                  <TableCell className="text-center font-medium text-yellow-600">
                    {stats.draws}
                  </TableCell>
                  <TableCell className="text-center font-bold">
                    {stats.score}
                  </TableCell>
                  <TableCell className="text-center text-sm text-muted-foreground">
                    {stats.buchholz.toFixed(1)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Round Selector */}
      <Card>
        <CardHeader>
          <CardTitle>Match Schedule</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-4 flex-wrap">
            {Array.from({ length: rounds }, (_, i) => i + 1).map((round) => (
              <Button
                key={round}
                variant={selectedRound === round ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedRound(round)}
              >
                Round {round}
              </Button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {roundMatches.map((match) => renderMatch(match))}
          </div>

          {roundMatches.length === 0 && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No matches scheduled for Round {selectedRound}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}