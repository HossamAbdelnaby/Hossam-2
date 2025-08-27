import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { db } from '@/lib/db';
import { TournamentPackage, BracketType, TournamentStatus } from '@prisma/client';

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

    const body = await request.json();
    const {
      host,
      tournamentName,
      url,
      description,
      prizeAmount,
      bracketType,
      registrationStart,
      registrationEnd,
      tournamentStart,
      tournamentEnd,
      packageType,
      graphicRequests,
      maxTeams,
    } = body;

    // Validate required fields
    if (!host || !tournamentName || !bracketType || !registrationStart || !tournamentStart || !maxTeams) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate package type
    if (!Object.values(TournamentPackage).includes(packageType)) {
      return NextResponse.json(
        { error: 'Invalid package type' },
        { status: 400 }
      );
    }

    // Validate maxTeams
    const validTeamSlots = [8, 16, 32, 64, 128, 256];
    if (!validTeamSlots.includes(maxTeams)) {
      return NextResponse.json(
        { error: 'Invalid number of team slots. Must be 8, 16, 32, 64, 128, or 256.' },
        { status: 400 }
      );
    }

    // Validate bracket type
    const validBracketTypes = Object.values(BracketType);
    if (!validBracketTypes.includes(bracketType)) {
      return NextResponse.json(
        { error: `Invalid bracket type: ${bracketType}` },
        { status: 400 }
      );
    }

    // Create tournament
    const tournament = await db.tournament.create({
      data: {
        host,
        name: tournamentName,
        url,
        description,
        prizeAmount: prizeAmount || 0,
        maxTeams,
        registrationStart: new Date(registrationStart),
        registrationEnd: registrationEnd ? new Date(registrationEnd) : null,
        tournamentStart: new Date(tournamentStart),
        tournamentEnd: tournamentEnd ? new Date(tournamentEnd) : null,
        bracketType,
        packageType,
        graphicRequests,
        organizerId: decoded.userId,
        status: TournamentStatus.DRAFT,
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

    // Create tournament stage for the single bracket type
    await db.tournamentStage.create({
      data: {
        name: `${bracketType.replace('_', ' ')} Stage`,
        type: bracketType,
        order: 0,
        tournamentId: tournament.id,
      },
    });

    return NextResponse.json({
      message: 'Tournament created successfully',
      tournament,
    });
  } catch (error) {
    console.error('Tournament creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create tournament' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status');
    const isActive = searchParams.get('isActive') !== 'false';

    const skip = (page - 1) * limit;

    const where: any = {
      isActive,
    };

    if (status && Object.values(['DRAFT', 'REGISTRATION_OPEN', 'REGISTRATION_CLOSED', 'IN_PROGRESS', 'COMPLETED']).includes(status)) {
      where.status = status;
    }

    const [tournaments, total] = await Promise.all([
      db.tournament.findMany({
        where,
        include: {
          organizer: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
          teams: {
            select: {
              id: true,
              name: true,
            },
          },
          _count: {
            select: {
              teams: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      db.tournament.count({ where }),
    ]);

    return NextResponse.json({
      tournaments,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Tournaments fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tournaments' },
      { status: 500 }
    );
  }
}