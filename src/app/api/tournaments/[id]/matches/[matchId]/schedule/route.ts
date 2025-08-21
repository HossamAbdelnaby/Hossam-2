import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { emitMatchUpdate } from '@/lib/socket';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; matchId: string }> }
) {
  try {
    const { id: tournamentId, matchId } = await params;
    const { scheduledTime } = await request.json();

    if (!scheduledTime) {
      return NextResponse.json(
        { error: 'Scheduled time is required' },
        { status: 400 }
      );
    }

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
      },
    });

    if (!match) {
      return NextResponse.json(
        { error: 'Match not found' },
        { status: 404 }
      );
    }

    // Update the match with scheduled time
    const updatedMatch = await db.match.update({
      where: { id: matchId },
      data: {
        scheduledTime: new Date(scheduledTime),
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

    // Emit real-time update
    emitMatchUpdate(tournamentId, matchId);
    
    return NextResponse.json({
      success: true,
      message: 'Match scheduled successfully',
      match: updatedMatch,
    });
  } catch (error) {
    console.error('Error scheduling match:', error);
    return NextResponse.json(
      { error: 'Failed to schedule match' },
      { status: 500 }
    );
  }
}