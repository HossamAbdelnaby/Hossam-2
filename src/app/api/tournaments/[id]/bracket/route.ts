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

    // Generate bracket structure
    const structure = await generateBracketStructure(
      tournamentId, 
      tournament.bracketType, 
      tournament.maxTeams
    );
    
    // Update with actual match data
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