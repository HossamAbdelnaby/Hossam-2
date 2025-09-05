import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { db } from '@/lib/db';
import { updateTournamentStatus, needsStatusUpdate } from '@/lib/tournament-status';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: tournamentId } = await params;

    const tournament = await db.tournament.findUnique({
      where: { id: tournamentId },
      include: {
        organizer: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
        teams: {
          include: {
            players: {
              orderBy: {
                createdAt: 'asc',
              },
            },
          },
        },
        stages: {
          include: {
            matches: {
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
              orderBy: {
                matchNumber: 'asc',
              },
            },
          },
          orderBy: {
            order: 'asc',
          },
        },
        _count: {
          select: {
            teams: true,
            stages: true,
          },
        },
      },
    });

    if (!tournament) {
      return NextResponse.json(
        { error: 'Tournament not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ tournament });
  } catch (error) {
    console.error('Tournament fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tournament' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.cookies.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { id: tournamentId } = await params;
    const body = await request.json();

    // Check if user owns the tournament
    const existingTournament = await db.tournament.findUnique({
      where: { id: tournamentId },
      select: { 
        organizerId: true,
        status: true,
        registrationStart: true,
        registrationEnd: true,
        tournamentStart: true,
        tournamentEnd: true,
      },
    });

    if (!existingTournament) {
      return NextResponse.json(
        { error: 'Tournament not found' },
        { status: 404 }
      );
    }

    if (existingTournament.organizerId !== decoded.userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Check if any date fields are being updated
    const dateFields = ['registrationStart', 'registrationEnd', 'tournamentStart', 'tournamentEnd'];
    const dateFieldsChanged = dateFields.some(field => 
      body[field] && body[field] !== existingTournament[field]?.toISOString()
    );

    let statusUpdateResult = null;
    
    // If date fields are changed, check if status needs to be updated
    if (dateFieldsChanged) {
      const oldDates = {
        registrationStart: existingTournament.registrationStart,
        registrationEnd: existingTournament.registrationEnd,
        tournamentStart: existingTournament.tournamentStart,
        tournamentEnd: existingTournament.tournamentEnd,
      };

      const newDates = {
        registrationStart: new Date(body.registrationStart || existingTournament.registrationStart),
        registrationEnd: body.registrationEnd ? new Date(body.registrationEnd) : existingTournament.registrationEnd,
        tournamentStart: new Date(body.tournamentStart || existingTournament.tournamentStart),
        tournamentEnd: body.tournamentEnd ? new Date(body.tournamentEnd) : existingTournament.tournamentEnd,
      };

      if (needsStatusUpdate(oldDates, newDates, existingTournament.status)) {
        statusUpdateResult = await updateTournamentStatus(tournamentId);
      }
    }

    const updatedTournament = await db.tournament.update({
      where: { id: tournamentId },
      data: body,
      include: {
        organizer: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });

    const response: any = {
      message: 'Tournament updated successfully',
      tournament: updatedTournament,
    };

    // Include status update information if status was changed
    if (statusUpdateResult) {
      response.statusUpdate = {
        oldStatus: statusUpdateResult.oldStatus,
        newStatus: statusUpdateResult.newStatus,
        reason: statusUpdateResult.reason,
      };
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('Tournament update error:', error);
    return NextResponse.json(
      { error: 'Failed to update tournament' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.cookies.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { id: tournamentId } = await params;

    // Check if user owns the tournament
    const existingTournament = await db.tournament.findUnique({
      where: { id: tournamentId },
      select: { organizerId: true },
    });

    if (!existingTournament) {
      return NextResponse.json(
        { error: 'Tournament not found' },
        { status: 404 }
      );
    }

    if (existingTournament.organizerId !== decoded.userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    await db.tournament.delete({
      where: { id: tournamentId },
    });

    return NextResponse.json({
      message: 'Tournament deleted successfully',
    });
  } catch (error) {
    console.error('Tournament deletion error:', error);
    return NextResponse.json(
      { error: 'Failed to delete tournament' },
      { status: 500 }
    );
  }
}