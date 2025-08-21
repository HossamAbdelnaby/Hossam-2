import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { db } from '@/lib/db'
import { emitMatchUpdate, emitBracketUpdate } from '@/lib/socket'

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string; matchId: string }> }) {
  try {
    const token = request.cookies.get('auth-token')?.value
    
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const { id: tournamentId, matchId } = await params;

    // Check if user is tournament organizer
    const tournament = await db.tournament.findUnique({
      where: { id: tournamentId },
      select: { organizerId: true }
    })

    if (!tournament) {
      return NextResponse.json({ error: 'Tournament not found' }, { status: 404 })
    }

    if (tournament.organizerId !== decoded.userId) {
      return NextResponse.json({ error: 'Only tournament organizer can update matches' }, { status: 403 })
    }

    const { score1, score2 } = await request.json()

    if (score1 === undefined || score2 === undefined) {
      return NextResponse.json(
        { error: 'Both scores are required' },
        { status: 400 }
      )
    }

    if (score1 < 0 || score2 < 0) {
      return NextResponse.json(
        { error: 'Scores cannot be negative' },
        { status: 400 }
      )
    }

    // Get the match first to determine teams
    const existingMatch = await db.match.findUnique({
      where: { id: matchId },
      select: { team1Id: true, team2Id: true }
    })

    if (!existingMatch) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 })
    }

    // Determine winner based on scores
    let winnerId = null
    if (score1 > score2) {
      winnerId = existingMatch.team1Id
    } else if (score2 > score1) {
      winnerId = existingMatch.team2Id
    }

    // Update the match
    const updatedMatch = await db.match.update({
      where: { id: matchId },
      data: {
        score1,
        score2,
        winnerId
      },
      include: {
        team1: true,
        team2: true,
        winner: true,
        stage: {
          include: {
            tournament: true
          }
        }
      }
    })

    // Emit real-time updates via Socket.IO
    try {
      // Emit match update event
      emitMatchUpdate(tournamentId, matchId)
      
      // Emit bracket update event (for full bracket refresh)
      emitBracketUpdate(tournamentId)
      
      console.log(`Real-time updates sent for tournament ${tournamentId}, match ${matchId}`)
    } catch (socketError) {
      console.log('Socket.IO not available for real-time update:', socketError)
    }

    return NextResponse.json({
      message: 'Match updated successfully',
      match: updatedMatch
    })
  } catch (error) {
    console.error('Error updating match:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}