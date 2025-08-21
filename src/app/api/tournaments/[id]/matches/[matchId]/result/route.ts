import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { emitMatchUpdate, emitBracketUpdate } from '@/lib/socket';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; matchId: string }> }
) {
  try {
    const { id: tournamentId, matchId } = await params;
    const { score1, score2, winnerId } = await request.json();

    // Verify the match exists and belongs to the tournament
    const match = await db.match.findFirst({
      where: {
        id: matchId,
        stage: {
          tournamentId: tournamentId,
        },
      },
      include: {
        stage: {
          include: {
            tournament: true,
          },
        },
        team1: true,
        team2: true,
        winner: true,
      },
    });

    if (!match) {
      return NextResponse.json(
        { error: 'Match not found' },
        { status: 404 }
      );
    }

    // Validate scores
    if (score1 !== undefined && score1 < 0) {
      return NextResponse.json(
        { error: 'Score 1 must be non-negative' },
        { status: 400 }
      );
    }

    if (score2 !== undefined && score2 < 0) {
      return NextResponse.json(
        { error: 'Score 2 must be non-negative' },
        { status: 400 }
      );
    }

    // Validate winner
    if (winnerId) {
      if (winnerId !== match.team1Id && winnerId !== match.team2Id) {
        return NextResponse.json(
          { error: 'Winner must be one of the teams in the match' },
          { status: 400 }
        );
      }

      // If scores are provided, they are for display only - manual winner selection takes precedence
      if (score1 !== undefined && score2 !== undefined) {
        console.log('Scores provided but manual winner selection takes precedence');
      }
    } else {
      return NextResponse.json(
        { error: 'Winner must be manually selected' },
        { status: 400 }
      );
    }

    // Update the match with results
    const updatedMatch = await db.match.update({
      where: { id: matchId },
      data: {
        score1: score1 !== undefined ? score1 : match.score1,
        score2: score2 !== undefined ? score2 : match.score2,
        winnerId: winnerId || match.winnerId,
      },
      include: {
        team1: {
          select: {
            id: true,
            name: true,
          },
        },
        team2: {
          select: {
            id: true,
            name: true,
          },
        },
        winner: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // If winner is set and there's a next match, advance the winner
    if (winnerId) {
      // Find the next match that this match feeds into
      const nextMatches = await db.match.findMany({
        where: {
          stage: {
            tournamentId: tournamentId,
          },
          round: match.round + 1, // Next round
          OR: [
            { team1Id: null },
            { team2Id: null },
          ],
        },
        include: {
          team1: true,
          team2: true,
        },
        orderBy: {
          matchNumber: 'asc',
        },
      });

      if (nextMatches.length > 0) {
        // Find the first available slot in the next round
        let updated = false;
        
        for (const nextMatch of nextMatches) {
          const updateData: any = {};
          
          if (!nextMatch.team1Id) {
            updateData.team1Id = winnerId;
          } else if (!nextMatch.team2Id) {
            updateData.team2Id = winnerId;
          }
          
          if (Object.keys(updateData).length > 0) {
            await db.match.update({
              where: { id: nextMatch.id },
              data: updateData,
            });
            updated = true;
            break; // Only fill one slot per winner
          }
        }
        
        if (!updated) {
          console.log('No available slots found in next round for winner:', winnerId);
        }
      }
    }

    // Check if tournament is completed (all matches have winners)
    const allMatches = await db.match.findMany({
      where: {
        stage: {
          tournamentId: tournamentId,
        },
      },
    });

    const allMatchesCompleted = allMatches.every(m => m.winnerId !== null);
    
    if (allMatchesCompleted) {
      await db.tournament.update({
        where: { id: tournamentId },
        data: { status: 'COMPLETED' },
      });
    }

    // Prepare advancement info
    let advancementInfo = null;
    if (winnerId) {
      const winner = match.team1?.id === winnerId ? match.team1 : match.team2;
      if (winner) {
        advancementInfo = {
          winnerName: winner.name,
          nextRound: match.round + 1
        };
      }
    }

    // Emit real-time updates
    emitMatchUpdate(tournamentId, matchId);
    emitBracketUpdate(tournamentId);
    
    return NextResponse.json({
      success: true,
      message: 'Match results updated successfully',
      match: updatedMatch,
      tournamentCompleted: allMatchesCompleted,
      advancementInfo,
    });
  } catch (error) {
    console.error('Error updating match results:', error);
    return NextResponse.json(
      { error: 'Failed to update match results' },
      { status: 500 }
    );
  }
}