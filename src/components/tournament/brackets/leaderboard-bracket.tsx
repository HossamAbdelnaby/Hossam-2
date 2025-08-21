'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Trophy, Medal, Award, TrendingUp, Star, Zap, Target } from 'lucide-react'

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

interface LeaderboardBracketProps {
  matches: Match[]
  onMatchUpdate?: (matchId: string, score1: number, score2: number) => void
  isAdmin?: boolean
}

interface TeamStats {
  team: Team
  matchesPlayed: number
  totalScore: number
  averageScore: number
  highestScore: number
  wins: number
  winRate: number
  recentForm: string[]
  rank: number
  previousRank?: number
}

export function LeaderboardBracket({ matches, onMatchUpdate, isAdmin = false }: LeaderboardBracketProps) {
  const [sortBy, setSortBy] = useState<'rank' | 'score' | 'wins' | 'winRate'>('rank')
  const [timeFilter, setTimeFilter] = useState<'all' | 'recent'>('all')

  // Calculate team statistics for leaderboard
  const calculateTeamStats = (): TeamStats[] => {
    const teamStatsMap = new Map<string, TeamStats>()
    
    // Get all unique teams
    const allTeams = new Set<Team>()
    matches.forEach(match => {
      if (match.team1) allTeams.add(match.team1)
      if (match.team2) allTeams.add(match.team2)
    })
    
    // Initialize stats for all teams
    allTeams.forEach(team => {
      teamStatsMap.set(team.id, {
        team,
        matchesPlayed: 0,
        totalScore: 0,
        averageScore: 0,
        highestScore: 0,
        wins: 0,
        winRate: 0,
        recentForm: [],
        rank: 0
      })
    })
    
    // Process matches to calculate stats
    const processedMatches = timeFilter === 'recent' 
      ? matches.slice(-10) // Last 10 matches for recent form
      : matches
    
    processedMatches.forEach(match => {
      if (match.team1 && match.score1 !== undefined) {
        const stats = teamStatsMap.get(match.team1.id)!
        stats.matchesPlayed += 1
        stats.totalScore += match.score1
        stats.highestScore = Math.max(stats.highestScore, match.score1)
        
        if (match.score2 !== undefined) {
          if (match.score1 > match.score2) {
            stats.wins += 1
          }
          stats.recentForm.push(match.score1 > match.score2 ? 'W' : 'L')
        }
      }
      
      if (match.team2 && match.score2 !== undefined) {
        const stats = teamStatsMap.get(match.team2.id)!
        stats.matchesPlayed += 1
        stats.totalScore += match.score2
        stats.highestScore = Math.max(stats.highestScore, match.score2)
        
        if (match.score1 !== undefined) {
          if (match.score2 > match.score1) {
            stats.wins += 1
          }
          stats.recentForm.push(match.score2 > match.score1 ? 'W' : 'L')
        }
      }
    })
    
    // Calculate derived stats
    const statsArray = Array.from(teamStatsMap.values())
    statsArray.forEach(stats => {
      stats.averageScore = stats.matchesPlayed > 0 ? stats.totalScore / stats.matchesPlayed : 0
      stats.winRate = stats.matchesPlayed > 0 ? (stats.wins / stats.matchesPlayed) * 100 : 0
      stats.recentForm = stats.recentForm.slice(-5) // Last 5 results
    })
    
    // Sort and assign ranks
    const sorted = statsArray.sort((a, b) => {
      switch (sortBy) {
        case 'score':
          return b.totalScore - a.totalScore
        case 'wins':
          return b.wins - a.wins
        case 'winRate':
          return b.winRate - a.winRate
        default:
          return b.totalScore - a.totalScore
      }
    })
    
    sorted.forEach((stats, index) => {
      stats.previousRank = stats.rank
      stats.rank = index + 1
    })
    
    return sorted
  }

  const teamStats = calculateTeamStats()

  const renderPerformanceCard = (stats: TeamStats) => {
    const rankChange = stats.previousRank ? stats.previousRank - stats.rank : 0
    const getRankIcon = (rank: number) => {
      switch (rank) {
        case 1:
          return <Trophy className="w-6 h-6 text-yellow-500" />
        case 2:
          return <Medal className="w-6 h-6 text-gray-400" />
        case 3:
          return <Award className="w-6 h-6 text-amber-600" />
        default:
          return <span className="text-2xl font-bold text-muted-foreground">#{rank}</span>
      }
    }

    return (
      <Card key={stats.team.id} className="hover:shadow-lg transition-shadow">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              {getRankIcon(stats.rank)}
              <div className="flex items-center gap-2">
                {stats.team.logo && (
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={stats.team.logo} alt={stats.team.name} />
                    <AvatarFallback>
                      {stats.team.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                )}
                <div>
                  <h3 className="font-semibold text-lg">{stats.team.name}</h3>
                  {stats.team.clanTag && (
                    <span className="text-sm text-muted-foreground">[{stats.team.clanTag}]</span>
                  )}
                </div>
              </div>
            </div>
            {rankChange !== 0 && (
              <div className={`flex items-center gap-1 text-sm font-medium ${
                rankChange > 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                <TrendingUp className={`w-4 h-4 ${rankChange > 0 ? '' : 'rotate-180'}`} />
                {rankChange > 0 ? '+' : ''}{rankChange}
              </div>
            )}
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total Score</span>
                <span className="font-bold text-lg">{stats.totalScore}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Average</span>
                <span className="font-medium">{stats.averageScore.toFixed(1)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Highest</span>
                <span className="font-medium">{stats.highestScore}</span>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Matches</span>
                <span className="font-medium">{stats.matchesPlayed}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Wins</span>
                <span className="font-medium text-green-600">{stats.wins}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Win Rate</span>
                <span className="font-medium">{stats.winRate.toFixed(1)}%</span>
              </div>
            </div>
          </div>

          {/* Win Rate Progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Win Rate</span>
              <span className="font-medium">{stats.winRate.toFixed(1)}%</span>
            </div>
            <Progress value={stats.winRate} className="h-2" />
          </div>

          {/* Recent Form */}
          {stats.recentForm.length > 0 && (
            <div className="mt-4">
              <div className="text-sm text-muted-foreground mb-2">Recent Form</div>
              <div className="flex gap-1">
                {stats.recentForm.map((result, index) => (
                  <Badge 
                    key={index} 
                    variant={result === 'W' ? 'default' : 'secondary'}
                    className="text-xs px-2 py-1"
                  >
                    {result}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  const renderDetailedTable = () => {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Detailed Leaderboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">Rank</TableHead>
                <TableHead>Team</TableHead>
                <TableHead className="text-center">Matches</TableHead>
                <TableHead className="text-center">Wins</TableHead>
                <TableHead className="text-center">Win Rate</TableHead>
                <TableHead className="text-center">Total Score</TableHead>
                <TableHead className="text-center">Average</TableHead>
                <TableHead className="text-center">Highest</TableHead>
                <TableHead className="text-center">Form</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {teamStats.map((stats) => {
                const rankChange = stats.previousRank ? stats.previousRank - stats.rank : 0
                
                return (
                  <TableRow key={stats.team.id}>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        {stats.rank === 1 && <Trophy className="w-4 h-4 text-yellow-500" />}
                        {stats.rank === 2 && <Medal className="w-4 h-4 text-gray-400" />}
                        {stats.rank === 3 && <Award className="w-4 h-4 text-amber-600" />}
                        <span className="font-bold">{stats.rank}</span>
                        {rankChange !== 0 && (
                          <TrendingUp className={`w-3 h-3 ${rankChange > 0 ? 'text-green-600' : 'text-red-600'} ${rankChange < 0 ? 'rotate-180' : ''}`} />
                        )}
                      </div>
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
                    <TableCell className="text-center">{stats.matchesPlayed}</TableCell>
                    <TableCell className="text-center font-medium text-green-600">{stats.wins}</TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-2">
                        <span className="font-medium">{stats.winRate.toFixed(1)}%</span>
                        <Progress value={stats.winRate} className="w-16 h-2" />
                      </div>
                    </TableCell>
                    <TableCell className="text-center font-bold">{stats.totalScore}</TableCell>
                    <TableCell className="text-center">{stats.averageScore.toFixed(1)}</TableCell>
                    <TableCell className="text-center">{stats.highestScore}</TableCell>
                    <TableCell className="text-center">
                      <div className="flex gap-1 justify-center">
                        {stats.recentForm.slice(-3).map((result, index) => (
                          <Badge 
                            key={index} 
                            variant={result === 'W' ? 'default' : 'secondary'}
                            className="text-xs px-1 py-0"
                          >
                            {result}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="w-6 h-6 text-yellow-500" />
            Tournament Leaderboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div className="flex gap-2">
              <Button
                variant={sortBy === 'rank' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSortBy('rank')}
              >
                <Trophy className="w-4 h-4 mr-1" />
                Rank
              </Button>
              <Button
                variant={sortBy === 'score' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSortBy('score')}
              >
                <Zap className="w-4 h-4 mr-1" />
                Score
              </Button>
              <Button
                variant={sortBy === 'wins' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSortBy('wins')}
              >
                <Target className="w-4 h-4 mr-1" />
                Wins
              </Button>
              <Button
                variant={sortBy === 'winRate' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSortBy('winRate')}
              >
                <TrendingUp className="w-4 h-4 mr-1" />
                Win Rate
              </Button>
            </div>
            
            <div className="flex gap-2">
              <Button
                variant={timeFilter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTimeFilter('all')}
              >
                All Time
              </Button>
              <Button
                variant={timeFilter === 'recent' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTimeFilter('recent')}
              >
                Recent Form
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Content Tabs */}
      <Tabs defaultValue="cards" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="cards">Performance Cards</TabsTrigger>
          <TabsTrigger value="table">Detailed Table</TabsTrigger>
        </TabsList>
        
        <TabsContent value="cards" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {teamStats.map((stats) => renderPerformanceCard(stats))}
          </div>
        </TabsContent>
        
        <TabsContent value="table" className="mt-6">
          {renderDetailedTable()}
        </TabsContent>
      </Tabs>
    </div>
  )
}