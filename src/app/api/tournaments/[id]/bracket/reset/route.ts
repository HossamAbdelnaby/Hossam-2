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

    // Get all matches
    const allMatches = await db.match.findMany({
      where: {
        stage: {
          tournamentId,
        },
      },
    });

    // Clear ALL matches
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

    return NextResponse.json({
      message: 'Bracket reset successfully',
      matchesCleared: allMatches.length,
    });
  } catch (error) {
    console.error('Error resetting bracket:', error);
    return NextResponse.json(
      { error: 'Failed to reset bracket' },
      { status: 500 }
    );
  }
}