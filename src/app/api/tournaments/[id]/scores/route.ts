import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { db } from '@/lib/db'
import { getIO } from '@/lib/socket'
import { notifications } from '@/lib/notifications/send-notification'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = await getToken({ req: request })
    
    if (!token?.sub) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: tournamentId } = await params;

    const tournament = await db.tournament.findUnique({
      where: { id: tournamentId },
      include: {
        stages: {
          include: {
            matches: {
              include: {
                team1: true,
                team2: true,
                winner: true
              },
              orderBy: { round: 'asc' }
            }
          },
          orderBy: { order: 'asc' }
        },
        teams: {
          include: {
            players: true,
            captain: true
          }
        }
      }
    })

    if (!tournament) {
      return NextResponse.json({ error: 'Tournament not found' }, { status: 404 })
    }

    // Calculate standings
    const standings = tournament.teams.map(team => {
      const teamMatches = tournament.stages.flatMap(stage => 
        stage.matches.filter(match => 
          match.team1Id === team.id || match.team2Id === team.id
        )
      )

      const wins = teamMatches.filter(match => match.winnerId === team.id).length
      const losses = teamMatches.filter(match => 
        match.winnerId && match.winnerId !== team.id
      ).length
      const draws = teamMatches.filter(match => 
        !match.winnerId && match.score1 !== null && match.score2 !== null
      ).length

      const totalScore = teamMatches.reduce((total, match) => {
        if (match.team1Id === team.id) {
          return total + (match.score1 || 0)
        } else if (match.team2Id === team.id) {
          return total + (match.score2 || 0)
        }
        return total
      }, 0)

      return {
        ...team,
        stats: {
          wins,
          losses,
          draws,
          totalScore,
          matchesPlayed: teamMatches.length
        }
      }
    }).sort((a, b) => {
      // Sort by wins, then total score
      if (b.stats.wins !== a.stats.wins) {
        return b.stats.wins - a.stats.wins
      }
      return b.stats.totalScore - a.stats.totalScore
    })

    return NextResponse.json({
      tournament,
      standings
    })
  } catch (error) {
    console.error('Error fetching tournament scores:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = await getToken({ req: request })
    
    if (!token?.sub) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: tournamentId } = await params;
    const { matchId, score1, score2, winnerId } = await request.json()

    if (!matchId || score1 === undefined || score2 === undefined) {
      return NextResponse.json(
        { error: 'Match ID and both scores are required' },
        { status: 400 }
      )
    }

    // Check if user is tournament organizer or has permission
    const tournament = await db.tournament.findUnique({
      where: { id: tournamentId },
      include: {
        stages: {
          include: {
            matches: {
              include: {
                team1: true,
                team2: true
              }
            }
          }
        }
      }
    })

    if (!tournament) {
      return NextResponse.json({ error: 'Tournament not found' }, { status: 404 })
    }

    if (tournament.organizerId !== token.sub) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
    }

    // Find the match
    const match = tournament.stages
      .flatMap(stage => stage.matches)
      .find(m => m.id === matchId)

    if (!match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 })
    }

    // Update match score
    const updatedMatch = await db.match.update({
      where: { id: matchId },
      data: {
        score1,
        score2,
        winnerId: winnerId || null
      },
      include: {
        team1: true,
        team2: true,
        winner: true
      }
    })

    // Emit real-time score update via Socket.IO
    const io = getIO()
    io.to(`tournament:${tournamentId}`).emit('score-update', {
      matchId,
      score1,
      score2,
      winnerId,
      tournamentId: tournamentId
    })

    // Send notifications to team members
    if (match.team1Id) {
      const team1Members = await db.team.findUnique({
        where: { id: match.team1Id },
        include: { user: true }
      })
      if (team1Members?.user) {
        await notifications.tournamentUpdate(
          team1Members.user.id,
          tournament.name
        )
      }
    }

    if (match.team2Id) {
      const team2Members = await db.team.findUnique({
        where: { id: match.team2Id },
        include: { user: true }
      })
      if (team2Members?.user) {
        await notifications.tournamentUpdate(
          team2Members.user.id,
          tournament.name
        )
      }
    }

    return NextResponse.json(updatedMatch)
  } catch (error) {
    console.error('Error updating match score:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}