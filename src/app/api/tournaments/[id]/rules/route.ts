import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const tournament = await db.tournament.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        name: true,
        rules: true,
      },
    });

    if (!tournament) {
      return NextResponse.json(
        { error: 'Tournament not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      tournament: {
        id: tournament.id,
        name: tournament.name,
        rules: tournament.rules || '',
      },
    });
  } catch (error) {
    console.error('Error fetching tournament rules:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tournament rules' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { rules } = await request.json();

    // Check if tournament exists and user is the organizer
    const tournament = await db.tournament.findUnique({
      where: { id: params.id },
      select: {
        organizerId: true,
      },
    });

    if (!tournament) {
      return NextResponse.json(
        { error: 'Tournament not found' },
        { status: 404 }
      );
    }

    if (tournament.organizerId !== session.user.id) {
      return NextResponse.json(
        { error: 'Only the tournament organizer can update rules' },
        { status: 403 }
      );
    }

    const updatedTournament = await db.tournament.update({
      where: { id: params.id },
      data: {
        rules: rules || null,
        updatedAt: new Date(),
      },
      select: {
        id: true,
        name: true,
        rules: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      tournament: updatedTournament,
      message: 'Tournament rules updated successfully',
    });
  } catch (error) {
    console.error('Error updating tournament rules:', error);
    return NextResponse.json(
      { error: 'Failed to update tournament rules' },
      { status: 500 }
    );
  }
}