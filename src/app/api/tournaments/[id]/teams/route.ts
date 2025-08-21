import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { db } from '@/lib/db';

export async function POST(
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
    const {
      name,
      clanTag,
      logo,
      nationality,
      players,
    } = body;

    // Validate required fields
    if (!name || !players || players.length === 0) {
      return NextResponse.json(
        { error: 'Team name and at least one player are required' },
        { status: 400 }
      );
    }

    // Enforce minimum team members rule
    if (players.length < 5) {
      return NextResponse.json(
        { error: 'Teams must have at least 5 players to participate' },
        { status: 400 }
      );
    }

    // Check if tournament exists and registration is open
    const tournament = await db.tournament.findUnique({
      where: { id: tournamentId },
    });

    if (!tournament) {
      return NextResponse.json(
        { error: 'Tournament not found' },
        { status: 404 }
      );
    }

    if (tournament.status !== 'REGISTRATION_OPEN') {
      return NextResponse.json(
        { error: 'Tournament registration is not open' },
        { status: 400 }
      );
    }

    // Create team with players
    const team = await db.team.create({
      data: {
        name,
        clanTag,
        logo,
        nationality,
        tournament: {
          connect: {
            id: tournamentId,
          },
        },
        user: {
          connect: {
            id: decoded.userId,
          },
        },
        players: {
          create: players.map((player: any, index: number) => ({
            name: player.name,
            username: player.username,
            tag: player.tag,
            nationality: player.nationality,
          })),
        },
      },
      include: {
        players: true,
        tournament: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Create registration log entry
    await db.registrationLog.create({
      data: {
        action: 'TEAM_REGISTERED',
        details: JSON.stringify({
          teamName: name,
          clanTag,
          playerCount: players.length,
          registrationTime: new Date().toISOString(),
        }),
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
        tournamentId,
        teamId: team.id,
        userId: decoded.userId,
      },
    });

    return NextResponse.json({
      message: 'Team registered successfully',
      team,
    });
  } catch (error) {
    console.error('Team registration error:', error);
    return NextResponse.json(
      { error: 'Failed to register team' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: tournamentId } = await params;

    const teams = await db.team.findMany({
      where: { tournamentId },
      include: {
        players: true,
        _count: {
          select: {
            players: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    return NextResponse.json({ teams });
  } catch (error) {
    console.error('Teams fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch teams' },
      { status: 500 }
    );
  }
}