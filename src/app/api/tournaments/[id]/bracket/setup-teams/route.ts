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
        teams: true,
      },
    });

    if (!tournament) {
      return NextResponse.json(
        { error: 'Tournament not found' },
        { status: 404 }
      );
    }

    // Get all matches
    const allMatches = await db.match.findMany({
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

    // Clear all matches first
    for (const match of allMatches) {
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

    // Get teams for this tournament
    const teams = tournament.teams;
    if (teams.length < 2) {
      return NextResponse.json(
        { error: 'Not enough teams to setup bracket' },
        { status: 400 }
      );
    }

    // Setup winners bracket round 1 (quarterfinals)
    const winnersRound1 = allMatches.filter(match => match.round === 1);
    
    // Place teams in winners bracket round 1
    for (let i = 0; i < Math.min(teams.length, winnersRound1.length * 2); i++) {
      const matchIndex = Math.floor(i / 2);
      const teamPosition = i % 2;
      
      if (matchIndex < winnersRound1.length) {
        const match = winnersRound1[matchIndex];
        const team = teams[i];
        
        if (teamPosition === 0) {
          // First team in the match
          await db.match.update({
            where: { id: match.id },
            data: { team1Id: team.id },
          });
        } else {
          // Second team in the match
          await db.match.update({
            where: { id: match.id },
            data: { team2Id: team.id },
          });
        }
      }
    }

    return NextResponse.json({
      message: 'Teams setup in bracket successfully',
      teamsPlaced: Math.min(teams.length, winnersRound1.length * 2),
      totalTeams: teams.length,
      bracketType: tournament.bracketType,
    });
  } catch (error) {
    console.error('Error setting up teams in bracket:', error);
    return NextResponse.json(
      { error: 'Failed to setup teams in bracket' },
      { status: 500 }
    );
  }
}