'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Trophy, Users, TrendingUp, ArrowUp } from 'lucide-react'

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

interface GroupStageBracketProps {
  matches: Match[]
  onMatchUpdate?: (matchId: string, score1: number, score2: number) => void
  isAdmin?: boolean
}

interface GroupTeamStats {
  team: Team
  played: number
  wins: number
  draws: number
  losses: number
  goalsFor: number
  goalsAgainst: number
  goalDifference: number
  points: number
}

interface Group {
  id: string
  name: string
  teams: Team[]
  matches: Match[]
  standings: GroupTeamStats[]
}

export function GroupStageBracket({ matches, onMatchUpdate, isAdmin = false }: GroupStageBracketProps) {
  const [selectedGroup, setSelectedGroup] = useState<string>('A')

  // Organize matches into groups
  const organizeIntoGroups = (): Group[] => {
    const groups = new Map<string, Group>()
    
    // Extract group information from match IDs (assuming format: group-A-0-1, group-B-0-1, etc.)
    matches.forEach(match => {
      const groupMatch = match.id.match(/group-([A-Z])-/)
      if (groupMatch) {
        const groupId = groupMatch[1]
        const groupName = `Group ${groupId}`
        
        if (!groups.has(groupId)) {
          groups.set(groupId, {
            id: groupId,
            name: groupName,
            teams: [],
            matches: [],
            standings: []
          })
        }
        
        const group = groups.get(groupId)!
        group.matches.push(match)
        
        // Add teams to group
        if (match.team1 && !group.teams.find(t => t.id === match.team1.id)) {
          group.teams.push(match.team1)
        }
        if (match.team2 && !group.teams.find(t => t.id === match.team2.id)) {
          group.teams.push(match.team2)
        }
      }
    })
    
    // Calculate standings for each group
    groups.forEach(group => {
      group.standings = calculateGroupStandings(group.teams, group.matches)
    })
    
    return Array.from(groups.values()).sort((a, b) => a.id.localeCompare(b.id))
  }

  const calculateGroupStandings = (teams: Team[], groupMatches: Match[]): GroupTeamStats[] => {
    const statsMap = new Map<string, GroupTeamStats>()
    
    // Initialize stats for all teams
    teams.forEach(team => {
      statsMap.set(team.id, {
        team,
        played: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        goalDifference: 0,
        points: 0
      })
    })
    
    // Process matches
    groupMatches.forEach(match => {
      if (match.team1 && match.team2 && match.score1 !== undefined && match.score2 !== undefined) {
        const stats1 = statsMap.get(match.team1.id)!
        const stats2 = statsMap.get(match.team2.id)!
        
        stats1.played += 1
        stats2.played += 1
        stats1.goalsFor += match.score1
        stats1.goalsAgainst += match.score2
        stats2.goalsFor += match.score2
        stats2.goalsAgainst += match.score1
        
        if (match.score1 > match.score2) {
          stats1.wins += 1
          stats1.points += 3
          stats2.losses += 1
        } else if (match.score2 > match.score1) {
          stats2.wins += 1
          stats2.points += 3
          stats1.losses += 1
        } else {
          stats1.draws += 1
          stats1.points += 1
          stats2.draws += 1
          stats2.points += 1
        }
      }
    })
    
    // Calculate goal differences
    statsMap.forEach(stats => {
      stats.goalDifference = stats.goalsFor - stats.goalsAgainst
    })
    
    // Sort by points, then goal difference, then goals for
    return Array.from(statsMap.values()).sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points
      if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference
      return b.goalsFor - a.goalsFor
    })
  }

  const groups = organizeIntoGroups()
  const currentGroup = groups.find(g => g.id === selectedGroup) || groups[0]

  const renderMatch = (match: Match) => {
    const isTeam1Winner = match.winner?.id === match.team1?.id
    const isTeam2Winner = match.winner?.id === match.team2?.id

    return (
      <Card key={match.id} className="p-3 hover:shadow-md transition-shadow">
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

  const renderGroupStandings = (group: Group) => {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            {group.name} Standings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                <TableHead>Team</TableHead>
                <TableHead className="text-center">MP</TableHead>
                <TableHead className="text-center">W</TableHead>
                <TableHead className="text-center">D</TableHead>
                <TableHead className="text-center">L</TableHead>
                <TableHead className="text-center">GF</TableHead>
                <TableHead className="text-center">GA</TableHead>
                <TableHead className="text-center">GD</TableHead>
                <TableHead className="text-center">Pts</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {group.standings.map((stats, index) => (
                <TableRow key={stats.team.id}>
                  <TableCell className="text-center font-bold">
                    {index + 1}
                    {index < 2 && (
                      <ArrowUp className="w-3 h-3 text-green-500 inline ml-1" />
                    )}
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
                  <TableCell className="text-center">{stats.played}</TableCell>
                  <TableCell className="text-center font-medium text-green-600">{stats.wins}</TableCell>
                  <TableCell className="text-center font-medium text-yellow-600">{stats.draws}</TableCell>
                  <TableCell className="text-center font-medium text-red-600">{stats.losses}</TableCell>
                  <TableCell className="text-center">{stats.goalsFor}</TableCell>
                  <TableCell className="text-center">{stats.goalsAgainst}</TableCell>
                  <TableCell className="text-center font-medium">
                    <span className={stats.goalDifference > 0 ? 'text-green-600' : stats.goalDifference < 0 ? 'text-red-600' : ''}>
                      {stats.goalDifference > 0 ? '+' : ''}{stats.goalDifference}
                    </span>
                  </TableCell>
                  <TableCell className="text-center font-bold">{stats.points}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    )
  }

  if (groups.length === 0) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center">
            <Users className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No Groups Created</h3>
            <p className="text-muted-foreground">
              Group stage matches will be available when groups are created.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="w-full space-y-6">
      {/* Group Selector */}
      <Card>
        <CardHeader>
          <CardTitle>Group Stage Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={selectedGroup} onValueChange={setSelectedGroup}>
            <TabsList className="grid w-full grid-cols-4">
              {groups.slice(0, 4).map((group) => (
                <TabsTrigger key={group.id} value={group.id}>
                  {group.name}
                </TabsTrigger>
              ))}
            </TabsList>
            
            {groups.map((group) => (
              <TabsContent key={group.id} value={group.id} className="mt-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Group Standings */}
                  {renderGroupStandings(group)}
                  
                  {/* Group Matches */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">{group.name} Matches</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {group.matches.map((match) => renderMatch(match))}
                      </div>
                      
                      {group.matches.length === 0 && (
                        <div className="text-center py-8">
                          <p className="text-muted-foreground">No matches scheduled for {group.name}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}