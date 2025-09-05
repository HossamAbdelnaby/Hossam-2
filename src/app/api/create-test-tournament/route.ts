import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    // Get token from cookie
    const token = request.cookies.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Create a test tournament
    const tournament = await db.tournament.create({
      data: {
        name: 'Test Tournament - Registration Open',
        description: 'A test tournament for development with open registration',
        host: 'Test Host',
        prizeAmount: 1000,
        maxTeams: 16,
        registrationStart: new Date(),
        registrationEnd: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        tournamentStart: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
        bracketType: 'SINGLE_ELIMINATION',
        packageType: 'FREE',
        organizerId: decoded.userId,
        status: 'REGISTRATION_OPEN',
        isActive: true,
      },
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

    // Create tournament stage
    await db.tournamentStage.create({
      data: {
        name: 'Single Elimination Stage',
        type: 'SINGLE_ELIMINATION',
        order: 0,
        tournamentId: tournament.id,
      },
    });

    return NextResponse.json({
      message: 'Test tournament created successfully',
      tournament,
    });
  } catch (error) {
    console.error('Create test tournament error:', error);
    return NextResponse.json(
      { error: 'Failed to create test tournament' },
      { status: 500 }
    );
  }
}