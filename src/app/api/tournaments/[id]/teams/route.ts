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
        { error: 'Team name is required' },
        { status: 400 }
      );
    }

    // Validate captain (first player) has required fields
    if (!players[0]?.name?.trim()) {
      return NextResponse.json(
        { error: 'Captain name is required' },
        { status: 400 }
      );
    }

    if (!players[0]?.username?.trim()) {
      return NextResponse.json(
        { error: 'Captain username is required' },
        { status: 400 }
      );
    }

    if (!players[0]?.tag?.trim()) {
      return NextResponse.json(
        { error: 'Captain tag is required' },
        { status: 400 }
      );
    }

    // Filter out empty players (keep at least the captain)
    const validPlayers = players.filter(player => 
      player.name?.trim() && player.username?.trim() && player.tag?.trim()
    );

    if (validPlayers.length === 0) {
      return NextResponse.json(
        { error: 'At least one player (captain) is required' },
        { status: 400 }
      );
    }

    // Enforce minimum team members rule
    if (validPlayers.length < 5) {
      return NextResponse.json(
        { error: 'Teams must have at least 5 players to participate' },
        { status: 400 }
      );
    }

    // Validate all players have required fields
    for (let i = 0; i < validPlayers.length; i++) {
      const player = validPlayers[i];
      if (!player.name?.trim()) {
        return NextResponse.json(
          { error: `Player ${i + 1} name is required` },
          { status: 400 }
        );
      }
      if (!player.username?.trim()) {
        return NextResponse.json(
          { error: `Player ${i + 1} username is required` },
          { status: 400 }
        );
      }
      if (!player.tag?.trim()) {
        return NextResponse.json(
          { error: `Player ${i + 1} tag is required` },
          { status: 400 }
        );
      }
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
        name: name.trim(),
        clanTag: clanTag?.trim() || null,
        logo: logo?.trim() || null,
        nationality: nationality?.trim() || null,
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
          create: validPlayers.map((player: any, index: number) => ({
            name: player.name.trim(),
            username: player.username.trim(),
            tag: player.tag.trim(),
            nationality: player.nationality?.trim() || null,
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
          teamName: name.trim(),
          clanTag: clanTag?.trim() || null,
          playerCount: validPlayers.length,
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