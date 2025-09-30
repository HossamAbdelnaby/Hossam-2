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
        stages: {
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!tournament) {
      return NextResponse.json(
        { error: 'Tournament not found' },
        { status: 404 }
      );
    }

    if (tournament.bracketType !== 'DOUBLE_ELIMINATION') {
      return NextResponse.json(
        { error: 'This endpoint is only for double elimination tournaments' },
        { status: 400 }
      );
    }

    const totalWinnersRounds = Math.ceil(Math.log2(tournament.maxTeams));
    const totalLosersRounds = totalWinnersRounds * 2 - 1;

    // Get all existing matches
    const existingMatches = await db.match.findMany({
      where: {
        stage: {
          tournamentId,
        },
      },
      orderBy: [
        { round: 'asc' },
        { matchNumber: 'asc' },
      ],
    });

    // Get the first stage or create one if it doesn't exist
    let stage = tournament.stages[0];
    if (!stage) {
      stage = await db.tournamentStage.create({
        data: {
          tournamentId,
          type: 'WINNERS_BRACKET',
          order: 1,
          name: 'Winners Bracket',
          isActive: true,
        },
      });
    }

    // Create losers bracket matches based on winners bracket results
    const winnersMatches = existingMatches.filter(match => match.round <= totalWinnersRounds);
    const losersMatchesToCreate = [];

    // Generate losers bracket matches for each round
    for (let losersRound = 1; losersRound <= totalLosersRounds; losersRound++) {
      const winnersRound = Math.ceil(losersRound / 2);
      const matchNumber = losersRound;
      
      // Create matches for losers bracket
      const matchesInRound = Math.max(1, Math.floor(tournament.maxTeams / Math.pow(2, Math.ceil(losersRound / 2) + 1)));
      
      for (let i = 0; i < matchesInRound; i++) {
        const roundNumber = totalWinnersRounds + losersRound;
        const existingMatch = existingMatches.find(m => m.round === roundNumber && m.matchNumber === i + 1);
        
        if (!existingMatch) {
          losersMatchesToCreate.push({
            round: roundNumber,
            matchNumber: i + 1,
            stageId: stage.id,
            isActive: true,
          });
        }
      }
    }

    // Create the losers bracket matches
    if (losersMatchesToCreate.length > 0) {
      await db.match.createMany({
        data: losersMatchesToCreate,
      });
    }

    // Create or update grand final match
    const grandFinalRound = totalWinnersRounds * 2 + 1;
    const existingGrandFinal = existingMatches.find(match => match.round === grandFinalRound);
    
    if (!existingGrandFinal) {
      await db.match.create({
        data: {
          round: grandFinalRound,
          matchNumber: 1,
          stageId: stage.id,
          isActive: true,
        },
      });
    }

    return NextResponse.json({
      message: 'Losers bracket and grand final generated successfully',
      losersRounds: totalLosersRounds,
      matchesCreated: losersMatchesToCreate.length,
    });
  } catch (error) {
    console.error('Error generating losers bracket:', error);
    return NextResponse.json(
      { error: 'Failed to generate losers bracket' },
      { status: 500 }
    );
  }
}