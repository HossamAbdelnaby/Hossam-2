import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: tournamentId } = await params;
    
    // Get tournament details
    const tournament = await db.tournament.findUnique({
      where: { id: tournamentId },
      include: {
        stages: true,
      },
    });

    if (!tournament || tournament.bracketType !== 'DOUBLE_ELIMINATION') {
      return NextResponse.json(
        { error: 'Tournament not found or not double elimination' },
        { status: 404 }
      );
    }

    const totalWinnersRounds = Math.ceil(Math.log2(tournament.maxTeams));
    
    // Get all matches
    const allMatches = await db.match.findMany({
      where: {
        stage: {
          tournamentId,
        },
      },
      include: {
        team1: true,
        team2: true,
        winner: true,
      },
      orderBy: [
        { round: 'asc' },
        { matchNumber: 'asc' },
      ],
    });

    // Clear all matches from round 2 onwards (keep only round 1 results)
    const matchesToClear = allMatches.filter(match => match.round > 1);
    
    for (const match of matchesToClear) {
      await db.match.update({
        where: { id: match.id },
        data: {
          team1Id: null,
          team2Id: null,
          winnerId: null,
          score1: null,
          score2: null,
        },
      });
    }

    // Get winners from round 1
    const round1Winners = allMatches
      .filter(match => match.round === 1 && match.winnerId)
      .map(match => match.winnerId);

    // Place winners in winners semifinal (round 2)
    const winnersSemifinal = allMatches.filter(match => match.round === 2);
    
    for (let i = 0; i < Math.min(round1Winners.length, winnersSemifinal.length); i++) {
      const match = winnersSemifinal[i];
      const winnerId = round1Winners[i];
      
      if (i === 0) {
        // First semifinal match
        await db.match.update({
          where: { id: match.id },
          data: { team1Id: winnerId },
        });
      } else if (i === 1) {
        // Second semifinal match
        await db.match.update({
          where: { id: match.id },
          data: { team1Id: winnerId },
        });
      }
    }

    // Get losers from round 1 and place them in losers round 1
    const round1Losers = allMatches
      .filter(match => match.round === 1 && match.winnerId)
      .map(match => {
        const loserId = match.team1Id === match.winnerId ? match.team2Id : match.team1Id;
        return loserId;
      })
      .filter(Boolean);

    const losersRound1 = allMatches.filter(match => match.round === totalWinnersRounds + 1); // Losers round 1
    
    for (let i = 0; i < Math.min(round1Losers.length, losersRound1.length); i++) {
      const match = losersRound1[i];
      const loserId = round1Losers[i];
      
      if (i === 0) {
        // First losers match
        await db.match.update({
          where: { id: match.id },
          data: { team1Id: loserId },
        });
      } else if (i === 1) {
        // Second losers match
        await db.match.update({
          where: { id: match.id },
          data: { team1Id: loserId },
        });
      }
    }

    return NextResponse.json({
      message: 'Bracket cleaned up successfully',
      winnersPlaced: round1Winners.length,
      losersPlaced: round1Losers.length,
    });
  } catch (error) {
    console.error('Error cleaning up bracket:', error);
    return NextResponse.json(
      { error: 'Failed to clean up bracket' },
      { status: 500 }
    );
  }
}