'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { Trophy, Users, Calendar, Settings, Plus, Edit2, Trash2 } from 'lucide-react'

interface Team {
  id: string
  name: string
  clanTag?: string
  logo?: string
  captain: {
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

interface TournamentStage {
  id: string
  name: string
  type: 'SINGLE_ELIMINATION' | 'DOUBLE_ELIMINATION' | 'SWISS' | 'GROUP_STAGE' | 'LEADERBOARD'
  order: number
  isActive: boolean
  matches: Match[]
}

interface Tournament {
  id: string
  name: string
  description?: string
  host: string
  prizeAmount: number
  startDate: string
  endDate?: string
  status: 'DRAFT' | 'REGISTRATION_OPEN' | 'REGISTRATION_CLOSED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
  bracketType: 'SINGLE_ELIMINATION' | 'DOUBLE_ELIMINATION' | 'SWISS' | 'GROUP_STAGE' | 'LEADERBOARD'
  stages: TournamentStage[]
  teams: Team[]
}

interface BracketGeneratorProps {
  tournament: Tournament
  onMatchUpdate?: (matchId: string, score1: number, score2: number) => void
  onStageCreate?: (name: string, type: string) => void
  isAdmin?: boolean
}

export function BracketGenerator({ tournament, onMatchUpdate, onStageCreate, isAdmin = false }: BracketGeneratorProps) {
  const [selectedStage, setSelectedStage] = useState<string>(tournament.stages[0]?.id || '')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [newStageName, setNewStageName] = useState('')
  const [newStageType, setNewStageType] = useState('SINGLE_ELIMINATION')
  const { toast } = useToast()

  const currentStage = tournament.stages.find(stage => stage.id === selectedStage)

  const generateSingleEliminationBracket = (teams: Team[]): Match[] => {
    const matches: Match[] = []
    const rounds = Math.ceil(Math.log2(teams.length))
    let roundNumber = 1
    
    // Generate first round matches
    const shuffledTeams = [...teams].sort(() => Math.random() - 0.5)
    for (let i = 0; i < shuffledTeams.length; i += 2) {
      if (i + 1 < shuffledTeams.length) {
        matches.push({
          id: `match-${roundNumber}-${Math.floor(i/2)}`,
          round: roundNumber,
          matchNumber: Math.floor(i/2) + 1,
          team1: shuffledTeams[i],
          team2: shuffledTeams[i + 1],
          isActive: true
        })
      }
    }

    // Generate subsequent rounds
    let teamsInRound = Math.floor(teams.length / 2)
    for (let r = 2; r <= rounds; r++) {
      for (let i = 0; i < teamsInRound; i++) {
        matches.push({
          id: `match-${r}-${i}`,
          round: r,
          matchNumber: i + 1,
          isActive: true
        })
      }
      teamsInRound = Math.floor(teamsInRound / 2)
    }

    return matches
  }

  const generateSwissBracket = (teams: Team[]): Match[] => {
    const matches: Match[] = []
    const rounds = Math.min(5, teams.length) // Typically 5 rounds for Swiss
    
    for (let round = 1; round <= rounds; round++) {
      for (let i = 0; i < Math.floor(teams.length / 2); i++) {
        matches.push({
          id: `swiss-${round}-${i}`,
          round: round,
          matchNumber: i + 1,
          isActive: true
        })
      }
    }
    
    return matches
  }

  const generateGroupStageBracket = (teams: Team[]): Match[] => {
    const matches: Match[] = []
    const groups = 4 // 4 groups typical
    const teamsPerGroup = Math.ceil(teams.length / groups)
    
    for (let group = 0; group < groups; group++) {
      const groupTeams = teams.slice(group * teamsPerGroup, (group + 1) * teamsPerGroup)
      
      // Round robin within each group
      for (let i = 0; i < groupTeams.length; i++) {
        for (let j = i + 1; j < groupTeams.length; j++) {
          matches.push({
            id: `group-${group}-${i}-${j}`,
            round: 1,
            matchNumber: matches.length + 1,
            team1: groupTeams[i],
            team2: groupTeams[j],
            isActive: true
          })
        }
      }
    }
    
    return matches
  }

  const generateLeaderboardBracket = (teams: Team[]): Match[] => {
    // For leaderboard, we just create placeholder matches for tracking scores
    return teams.map((team, index) => ({
      id: `leaderboard-${index}`,
      round: 1,
      matchNumber: index + 1,
      team1: team,
      isActive: true
    }))
  }

  const renderSingleEliminationBracket = (matches: Match[]) => {
    const rounds = Math.max(...matches.map(m => m.round))
    const bracket: { [round: number]: Match[] } = {}
    
    matches.forEach(match => {
      if (!bracket[match.round]) {
        bracket[match.round] = []
      }
      bracket[match.round].push(match)
    })

    return (
      <div className="flex gap-8 overflow-x-auto p-4">
        {Object.entries(bracket).map(([round, roundMatches]) => (
          <div key={round} className="flex flex-col gap-4 min-w-[200px]">
            <h3 className="text-center font-semibold">Round {round}</h3>
            {roundMatches.map((match) => (
              <Card key={match.id} className="p-3">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {match.team1?.logo && (
                        <Avatar className="w-6 h-6">
                          <AvatarImage src={match.team1.logo} alt={match.team1.name} />
                          <AvatarFallback className="text-xs">
                            {match.team1.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                      )}
                      <span className="text-sm font-medium">{match.team1?.name || 'TBD'}</span>
                    </div>
                    {isAdmin && match.score1 !== undefined && (
                      <Input
                        type="number"
                        min="0"
                        value={match.score1}
                        onChange={(e) => {
                          const score = parseInt(e.target.value) || 0
                          onMatchUpdate?.(match.id, score, match.score2 || 0)
                        }}
                        className="w-12 h-6 text-xs"
                      />
                    )}
                    {match.score1 !== undefined && (
                      <span className="text-sm font-bold">{match.score1}</span>
                    )}
                  </div>
                  
                  <div className="text-center text-xs text-muted-foreground">VS</div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {match.team2?.logo && (
                        <Avatar className="w-6 h-6">
                          <AvatarImage src={match.team2.logo} alt={match.team2.name} />
                          <AvatarFallback className="text-xs">
                            {match.team2.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                      )}
                      <span className="text-sm font-medium">{match.team2?.name || 'TBD'}</span>
                    </div>
                    {isAdmin && match.score2 !== undefined && (
                      <Input
                        type="number"
                        min="0"
                        value={match.score2}
                        onChange={(e) => {
                          const score = parseInt(e.target.value) || 0
                          onMatchUpdate?.(match.id, match.score1 || 0, score)
                        }}
                        className="w-12 h-6 text-xs"
                      />
                    )}
                    {match.score2 !== undefined && (
                      <span className="text-sm font-bold">{match.score2}</span>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ))}
      </div>
    )
  }

  const renderSwissBracket = (matches: Match[]) => {
    const rounds = Math.max(...matches.map(m => m.round))
    const bracket: { [round: number]: Match[] } = {}
    
    matches.forEach(match => {
      if (!bracket[match.round]) {
        bracket[match.round] = []
      }
      bracket[match.round].push(match)
    })

    return (
      <div className="space-y-6">
        {Object.entries(bracket).map(([round, roundMatches]) => (
          <div key={round}>
            <h3 className="text-lg font-semibold mb-4">Round {round}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {roundMatches.map((match) => (
                <Card key={match.id} className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {match.team1?.logo && (
                          <Avatar className="w-8 h-8">
                            <AvatarImage src={match.team1.logo} alt={match.team1.name} />
                            <AvatarFallback>
                              {match.team1.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                        )}
                        <span className="font-medium">{match.team1?.name || 'TBD'}</span>
                      </div>
                      {isAdmin && match.score1 !== undefined && (
                        <Input
                          type="number"
                          min="0"
                          value={match.score1}
                          onChange={(e) => {
                            const score = parseInt(e.target.value) || 0
                            onMatchUpdate?.(match.id, score, match.score2 || 0)
                          }}
                          className="w-16 h-8"
                        />
                      )}
                      {match.score1 !== undefined && (
                        <span className="font-bold">{match.score1}</span>
                      )}
                    </div>
                    
                    <div className="text-center text-muted-foreground">VS</div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {match.team2?.logo && (
                          <Avatar className="w-8 h-8">
                            <AvatarImage src={match.team2.logo} alt={match.team2.name} />
                            <AvatarFallback>
                              {match.team2.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                        )}
                        <span className="font-medium">{match.team2?.name || 'TBD'}</span>
                      </div>
                      {isAdmin && match.score2 !== undefined && (
                        <Input
                          type="number"
                          min="0"
                          value={match.score2}
                          onChange={(e) => {
                            const score = parseInt(e.target.value) || 0
                            onMatchUpdate?.(match.id, match.score1 || 0, score)
                          }}
                          className="w-16 h-8"
                        />
                      )}
                      {match.score2 !== undefined && (
                        <span className="font-bold">{match.score2}</span>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>
    )
  }

  const renderGroupStageBracket = (matches: Match[]) => {
    const groups: { [key: string]: Match[] } = {}
    
    matches.forEach(match => {
      const groupMatch = match.id.match(/group-(\d+)/)
      if (groupMatch) {
        const groupId = groupMatch[1]
        if (!groups[groupId]) {
          groups[groupId] = []
        }
        groups[groupId].push(match)
      }
    })

    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {Object.entries(groups).map(([groupId, groupMatches]) => (
          <Card key={groupId}>
            <CardHeader>
              <CardTitle className="text-lg">Group {parseInt(groupId) + 1}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {groupMatches.map((match) => (
                  <div key={match.id} className="flex items-center justify-between p-3 border rounded">
                    <div className="flex items-center gap-2">
                      {match.team1?.logo && (
                        <Avatar className="w-6 h-6">
                          <AvatarImage src={match.team1.logo} alt={match.team1.name} />
                          <AvatarFallback className="text-xs">
                            {match.team1.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                      )}
                      <span className="text-sm font-medium">{match.team1?.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {isAdmin && match.score1 !== undefined && (
                        <Input
                          type="number"
                          min="0"
                          value={match.score1}
                          onChange={(e) => {
                            const score = parseInt(e.target.value) || 0
                            onMatchUpdate?.(match.id, score, match.score2 || 0)
                          }}
                          className="w-12 h-6 text-xs"
                        />
                      )}
                      <span className="text-sm font-bold">{match.score1 || 0}</span>
                      <span className="text-xs text-muted-foreground">-</span>
                      <span className="text-sm font-bold">{match.score2 || 0}</span>
                      {isAdmin && match.score2 !== undefined && (
                        <Input
                          type="number"
                          min="0"
                          value={match.score2}
                          onChange={(e) => {
                            const score = parseInt(e.target.value) || 0
                            onMatchUpdate?.(match.id, match.score1 || 0, score)
                          }}
                          className="w-12 h-6 text-xs"
                        />
                      )}
                      <div className="flex items-center gap-2">
                        {match.team2?.logo && (
                          <Avatar className="w-6 h-6">
                            <AvatarImage src={match.team2.logo} alt={match.team2.name} />
                            <AvatarFallback className="text-xs">
                              {match.team2.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                        )}
                        <span className="text-sm font-medium">{match.team2?.name}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  const renderLeaderboardBracket = (matches: Match[]) => {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Leaderboard</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {matches.map((match, index) => (
              <div key={match.id} className="flex items-center justify-between p-3 border rounded">
                <div className="flex items-center gap-3">
                  <span className="font-bold text-lg">#{index + 1}</span>
                  {match.team1?.logo && (
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={match.team1.logo} alt={match.team1.name} />
                      <AvatarFallback>
                        {match.team1.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <span className="font-medium">{match.team1?.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Score:</span>
                  {isAdmin && match.score1 !== undefined && (
                    <Input
                      type="number"
                      min="0"
                      value={match.score1}
                      onChange={(e) => {
                        const score = parseInt(e.target.value) || 0
                        onMatchUpdate?.(match.id, score, 0)
                      }}
                      className="w-16 h-8"
                    />
                  )}
                  {match.score1 !== undefined && (
                    <span className="font-bold">{match.score1}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  const handleCreateStage = () => {
    if (!newStageName.trim()) {
      toast({
        title: 'Error',
        description: 'Stage name is required',
        variant: 'destructive'
      })
      return
    }

    onStageCreate?.(newStageName, newStageType)
    setNewStageName('')
    setNewStageType('SINGLE_ELIMINATION')
    setIsDialogOpen(false)
    
    toast({
      title: 'Success',
      description: 'Tournament stage created successfully'
    })
  }

  const renderBracket = () => {
    if (!currentStage) return null

    switch (currentStage.type) {
      case 'SINGLE_ELIMINATION':
        return renderSingleEliminationBracket(currentStage.matches)
      case 'DOUBLE_ELIMINATION':
        return renderSingleEliminationBracket(currentStage.matches) // Simplified for now
      case 'SWISS':
        return renderSwissBracket(currentStage.matches)
      case 'GROUP_STAGE':
        return renderGroupStageBracket(currentStage.matches)
      case 'LEADERBOARD':
        return renderLeaderboardBracket(currentStage.matches)
      default:
        return <div>Unsupported bracket type</div>
    }
  }

  return (
    <div className="space-y-6">
      {/* Tournament Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">{tournament.name}</CardTitle>
              <p className="text-muted-foreground">{tournament.description}</p>
              <div className="flex items-center gap-4 mt-2">
                <div className="flex items-center gap-2">
                  <Trophy className="w-4 h-4" />
                  <span className="text-sm">${tournament.prizeAmount.toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span className="text-sm">{new Date(tournament.startDate).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  <span className="text-sm">{tournament.teams.length} teams</span>
                </div>
                <Badge variant={tournament.status === 'IN_PROGRESS' ? 'default' : 'secondary'}>
                  {tournament.status.replace('_', ' ')}
                </Badge>
              </div>
            </div>
            {isAdmin && (
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Stage
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Stage</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="stageName">Stage Name</Label>
                      <Input
                        id="stageName"
                        value={newStageName}
                        onChange={(e) => setNewStageName(e.target.value)}
                        placeholder="Enter stage name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="stageType">Stage Type</Label>
                      <Select value={newStageType} onValueChange={setNewStageType}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="SINGLE_ELIMINATION">Single Elimination</SelectItem>
                          <SelectItem value="DOUBLE_ELIMINATION">Double Elimination</SelectItem>
                          <SelectItem value="SWISS">Swiss</SelectItem>
                          <SelectItem value="GROUP_STAGE">Group Stage</SelectItem>
                          <SelectItem value="LEADERBOARD">Leaderboard</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button onClick={handleCreateStage} className="w-full">
                      Create Stage
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Stage Selector */}
      {tournament.stages.length > 1 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <Label htmlFor="stageSelect">Select Stage:</Label>
              <Select value={selectedStage} onValueChange={setSelectedStage}>
                <SelectTrigger className="w-64">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {tournament.stages.map((stage) => (
                    <SelectItem key={stage.id} value={stage.id}>
                      {stage.name} ({stage.type.replace('_', ' ')})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bracket Display */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5" />
            {currentStage?.name} - {currentStage?.type.replace('_', ' ')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="max-h-[800px]">
            {renderBracket()}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
}