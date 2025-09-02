import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { 
  generateBracketStructure, 
  updateBracketWithMatchData 
} from '@/lib/bracket-data';

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

    // Get actual matches from database
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

    // Generate bracket structure first
    const structure = await generateBracketStructure(
      tournamentId, 
      tournament.bracketType, 
      tournament.maxTeams
    );
    
    // Create a map of database matches by their round and matchNumber
    const matchMap = new Map();
    matches.forEach(match => {
      const key = `${match.round}-${match.matchNumber}`;
      matchMap.set(key, match);
    });

    // Update the bracket structure with real match data
    if (tournament.bracketType === 'SINGLE_ELIMINATION') {
      const updatedRounds = structure.bracket.rounds.map(round => {
        const updatedMatches = round.matches.map(match => {
          const key = `${match.round}-${match.matchNumber}`;
          const dbMatch = matchMap.get(key);
          
          if (dbMatch) {
            return {
              id: dbMatch.id,
              round: dbMatch.round,
              matchNumber: dbMatch.matchNumber,
              score1: dbMatch.score1,
              score2: dbMatch.score2,
              team1: dbMatch.team1,
              team2: dbMatch.team2,
              winner: dbMatch.winner,
              isBye: false,
              nextMatchId: dbMatch.nextMatchId,
            };
          }
          
          return match;
        });
        
        return {
          ...round,
          matches: updatedMatches,
        };
      });

      return NextResponse.json({
        bracket: {
          type: 'SINGLE_ELIMINATION',
          bracket: { rounds: updatedRounds },
        },
        tournament: {
          id: tournament.id,
          bracketType: tournament.bracketType,
          maxTeams: tournament.maxTeams,
          status: tournament.status,
        },
      });
    }
    
    // For other bracket types, use the original update function
    const updatedBracket = await updateBracketWithMatchData(structure, tournamentId);
    
    return NextResponse.json({
      bracket: updatedBracket,
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