import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: tournamentId } = await params;
    
    // Get tournament details
    const tournament = await db.tournament.findUnique({
      where: { id: tournamentId },
      select: {
        id: true,
        bracketType: true,
        maxTeams: true,
        status: true,
      },
    });

    if (!tournament) {
      return NextResponse.json(
        { error: 'Tournament not found' },
        { status: 404 }
      );
    }

    // Get actual matches from database with all related data
    const matches = await db.match.findMany({
      where: {
        stage: {
          tournamentId,
        },
      },
      include: {
        team1: {
          select: {
            id: true,
            name: true,
            clanTag: true,
            logo: true,
          },
        },
        team2: {
          select: {
            id: true,
            name: true,
            clanTag: true,
            logo: true,
          },
        },
        winner: {
          select: {
            id: true,
            name: true,
            clanTag: true,
            logo: true,
          },
        },
      },
      orderBy: [
        { round: 'asc' },
        { matchNumber: 'asc' },
      ],
    });

    // Group matches by round
    const matchesByRound = new Map<number, any[]>();
    matches.forEach(match => {
      if (!matchesByRound.has(match.round)) {
        matchesByRound.set(match.round, []);
      }
      matchesByRound.get(match.round)!.push(match);
    });

    // Create bracket structure based on actual matches
    const rounds = [];
    const maxRound = Math.max(...matchesByRound.keys(), 0);
    
    for (let round = 1; round <= maxRound; round++) {
      const roundMatches = matchesByRound.get(round) || [];
      
      let roundName;
      if (tournament.bracketType === 'SINGLE_ELIMINATION') {
        const totalRounds = Math.ceil(Math.log2(tournament.maxTeams));
        if (round === totalRounds) roundName = 'Final';
        else if (round === totalRounds - 1) roundName = 'Semifinal';
        else if (round === totalRounds - 2) roundName = 'Quarterfinal';
        else roundName = `Round ${round}`;
      } else {
        roundName = `Round ${round}`;
      }

      rounds.push({
        roundNumber: round,
        name: roundName,
        matches: roundMatches.map(match => ({
          id: match.id,
          round: match.round,
          matchNumber: match.matchNumber,
          score1: match.score1,
          score2: match.score2,
          team1: match.team1,
          team2: match.team2,
          winner: match.winner,
          isBye: false,
          nextMatchId: match.nextMatchId,
        })),
      });
    }

    return NextResponse.json({
      bracket: {
        type: tournament.bracketType,
        bracket: { rounds },
      },
      tournament: {
        id: tournament.id,
        bracketType: tournament.bracketType,
        maxTeams: tournament.maxTeams,
        status: tournament.status,
      },
    });
  } catch (error) {
    console.error('Error fetching bracket data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bracket data' },
      { status: 500 }
    );
  }
}