'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

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

interface SingleEliminationBracketProps {
  matches: Match[]
  onMatchUpdate?: (matchId: string, score1: number, score2: number) => void
  isAdmin?: boolean
}

export function SingleEliminationBracket({ matches, onMatchUpdate, isAdmin = false }: SingleEliminationBracketProps) {
  const rounds = Math.max(...matches.map(m => m.round))
  const bracket: { [round: number]: Match[] } = {}
  
  matches.forEach(match => {
    if (!bracket[match.round]) {
      bracket[match.round] = []
    }
    bracket[match.round].push(match)
  })

  const getRoundName = (round: number, totalRounds: number): string => {
    if (round === totalRounds) return 'Final'
    if (round === totalRounds - 1) return 'Semi-Final'
    if (round === totalRounds - 2) return 'Quarter-Final'
    return `Round ${round}`
  }

  const renderMatch = (match: Match) => {
    const isTeam1Winner = match.winner?.id === match.team1?.id
    const isTeam2Winner = match.winner?.id === match.team2?.id

    return (
      <Card key={match.id} className="p-3 min-w-[200px] hover:shadow-md transition-shadow">
        <div className="space-y-2">
          {/* Team 1 */}
          <div className={`flex items-center justify-between p-2 rounded transition-colors ${
            isTeam1Winner ? 'bg-green-50 border-l-4 border-green-500' : ''
          }`}>
            <div className="flex items-center gap-2 flex-1 min-w-0">
              {match.team1?.logo && (
                <Avatar className="w-6 h-6 flex-shrink-0">
                  <AvatarImage src={match.team1.logo} alt={match.team1.name} />
                  <AvatarFallback className="text-xs">
                    {match.team1.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
              )}
              <div className="min-w-0 flex-1">
                <span className="text-sm font-medium truncate block">
                  {match.team1?.name || 'TBD'}
                </span>
                {match.team1?.clanTag && (
                  <span className="text-xs text-muted-foreground">
                    [{match.team1.clanTag}]
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              {isAdmin && (
                <Input
                  type="number"
                  min="0"
                  value={match.score1 ?? ''}
                  onChange={(e) => {
                    const score = parseInt(e.target.value) || 0
                    onMatchUpdate?.(match.id, score, match.score2 || 0)
                  }}
                  className="w-12 h-6 text-xs text-center"
                  placeholder="-"
                />
              )}
              {match.score1 !== undefined && !isAdmin && (
                <span className="text-sm font-bold w-8 text-center">{match.score1}</span>
              )}
              {isTeam1Winner && (
                <Badge variant="default" className="text-xs px-1 py-0">W</Badge>
              )}
            </div>
          </div>
          
          {/* VS Divider */}
          <div className="text-center text-xs text-muted-foreground font-medium py-1">
            VS
          </div>
          
          {/* Team 2 */}
          <div className={`flex items-center justify-between p-2 rounded transition-colors ${
            isTeam2Winner ? 'bg-green-50 border-l-4 border-green-500' : ''
          }`}>
            <div className="flex items-center gap-2 flex-1 min-w-0">
              {match.team2?.logo && (
                <Avatar className="w-6 h-6 flex-shrink-0">
                  <AvatarImage src={match.team2.logo} alt={match.team2.name} />
                  <AvatarFallback className="text-xs">
                    {match.team2.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
              )}
              <div className="min-w-0 flex-1">
                <span className="text-sm font-medium truncate block">
                  {match.team2?.name || 'TBD'}
                </span>
                {match.team2?.clanTag && (
                  <span className="text-xs text-muted-foreground">
                    [{match.team2.clanTag}]
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              {isAdmin && (
                <Input
                  type="number"
                  min="0"
                  value={match.score2 ?? ''}
                  onChange={(e) => {
                    const score = parseInt(e.target.value) || 0
                    onMatchUpdate?.(match.id, match.score1 || 0, score)
                  }}
                  className="w-12 h-6 text-xs text-center"
                  placeholder="-"
                />
              )}
              {match.score2 !== undefined && !isAdmin && (
                <span className="text-sm font-bold w-8 text-center">{match.score2}</span>
              )}
              {isTeam2Winner && (
                <Badge variant="default" className="text-xs px-1 py-0">W</Badge>
              )}
            </div>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <div className="w-full overflow-x-auto">
      <div className="flex gap-8 min-w-max p-4">
        {Object.entries(bracket).map(([round, roundMatches]) => (
          <div key={round} className="flex flex-col gap-4">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-primary">
                {getRoundName(parseInt(round), rounds)}
              </h3>
              <p className="text-xs text-muted-foreground">
                {roundMatches.length} match{roundMatches.length !== 1 ? 'es' : ''}
              </p>
            </div>
            {roundMatches
              .sort((a, b) => a.matchNumber - b.matchNumber)
              .map((match) => renderMatch(match))
            }
          </div>
        ))}
      </div>
    </div>
  )
}