import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: tournamentId } = await params;
    const { matchId, winnerId, score1, score2 } = await request.json();

    if (!matchId || winnerId === undefined) {
      return NextResponse.json(
        { error: 'Match ID and winner ID are required' },
        { status: 400 }
      );
    }

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

    // Get the match that was updated
    const updatedMatch = await db.match.findUnique({
      where: { id: matchId },
      include: {
        team1: true,
        team2: true,
        winner: true,
        stage: true,
      },
    });

    if (!updatedMatch) {
      return NextResponse.json(
        { error: 'Match not found' },
        { status: 404 }
      );
    }

    // Only process winners bracket matches
    if (updatedMatch.round > totalWinnersRounds) {
      return NextResponse.json({
        message: 'Match is not in winners bracket, no losers bracket update needed',
      });
    }

    // Get the losing team (the one that didn't win)
    const losingTeam = updatedMatch.team1?.id === winnerId ? updatedMatch.team2 : updatedMatch.team1;

    if (!losingTeam) {
      return NextResponse.json({
        message: 'No losing team to move to losers bracket',
      });
    }

    // Calculate which losers round this team should go to
    const winnersRound = updatedMatch.round;
    const losersRound = winnersRound; // First round losers go to round 1, second round to round 2, etc.
    const losersBracketRoundNumber = totalWinnersRounds + losersRound;

    // Find an available match in the losers bracket
    const availableLosersMatch = await db.match.findFirst({
      where: {
        round: losersBracketRoundNumber,
        stage: {
          tournamentId,
        },
        OR: [
          { team1Id: null },
          { team2Id: null },
        ],
      },
      include: {
        team1: true,
        team2: true,
      },
    });

    if (!availableLosersMatch) {
      return NextResponse.json({
        message: 'No available slot in losers bracket',
      });
    }

    // Place the losing team in the available losers bracket match
    const updateData: any = {};
    if (!availableLosersMatch.team1Id) {
      updateData.team1Id = losingTeam.id;
    } else if (!availableLosersMatch.team2Id) {
      updateData.team2Id = losingTeam.id;
    } else {
      return NextResponse.json({
        message: 'No available slot in losers bracket match',
      });
    }

    await db.match.update({
      where: { id: availableLosersMatch.id },
      data: updateData,
    });

    return NextResponse.json({
      message: 'Losing team moved to losers bracket successfully',
      losingTeam: {
        id: losingTeam.id,
        name: losingTeam.name,
      },
      losersMatch: {
        id: availableLosersMatch.id,
        round: availableLosersMatch.round,
        matchNumber: availableLosersMatch.matchNumber,
      },
    });
  } catch (error) {
    console.error('Error updating losers bracket:', error);
    return NextResponse.json(
      { error: 'Failed to update losers bracket' },
      { status: 500 }
    );
  }
}