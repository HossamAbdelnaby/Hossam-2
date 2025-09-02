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
}

interface Match {
  id: string
  round: number
  matchNumber: number
  score1?: number
  score2?: number
  team1?: Team | null
  team2?: Team | null
  winner?: Team | null
  isBye?: boolean
  nextMatchId?: string
}

interface SingleEliminationBracketProps {
  rounds: {
    roundNumber: number;
    name: string;
    matches: Match[];
  }[]
  onMatchClick?: (match: Match) => void
  onMatchUpdate?: (matchId: string, score1: number, score2: number) => void
  isAdmin?: boolean
  canManage?: boolean
}

export function SingleEliminationBracket({ rounds, onMatchClick, onMatchUpdate, isAdmin = false, canManage = false }: SingleEliminationBracketProps) {

  const getRoundName = (roundNumber: number): string => {
    const totalRounds = rounds.length;
    if (roundNumber === totalRounds) return 'Final'
    if (roundNumber === totalRounds - 1) return 'Semi-Final'
    if (roundNumber === totalRounds - 2) return 'Quarter-Final'
    return `Round ${roundNumber}`
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
              {canManage && (
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
              {match.score1 !== undefined && !canManage && (
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
              {canManage && (
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
              {match.score2 !== undefined && !canManage && (
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
        {rounds.map((round) => (
          <div key={round.roundNumber} className="flex flex-col gap-4">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-primary">
                {round.name}
              </h3>
              <p className="text-xs text-muted-foreground">
                {round.matches.length} match{round.matches.length !== 1 ? 'es' : ''}
              </p>
            </div>
            {round.matches
              .sort((a, b) => a.matchNumber - b.matchNumber)
              .map((match) => (
                <div 
                  key={match.id} 
                  onClick={() => onMatchClick?.(match)}
                  className={onMatchClick ? "cursor-pointer hover:opacity-80" : ""}
                >
                  {renderMatch(match)}
                </div>
              ))
            }
          </div>
        ))}
      </div>
    </div>
  )
}