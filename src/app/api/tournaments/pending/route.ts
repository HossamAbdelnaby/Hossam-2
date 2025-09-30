import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { db } from '@/lib/db';
import { TournamentPackage, BracketType } from '@prisma/client';

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
      tournamentLogo, // New field for tournament logo
      currency = 'USD',
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

    // Check if this is a paid package
    const paidPackages = ['PAID_GRAPHICS', 'PAID_DISCORD_BOT', 'FULL_MANAGEMENT'];
    const requiresPayment = paidPackages.includes(packageType);

    // This endpoint should only be used for paid packages
    if (!requiresPayment) {
      return NextResponse.json(
        { error: 'This endpoint is only for paid packages. Free packages should use the regular tournament creation endpoint.' },
        { status: 400 }
      );
    }

    // Get package price from database
    const packagePrice = await db.packagePrice.findUnique({
      where: { packageType }
    });

    if (!packagePrice || !packagePrice.isActive) {
      return NextResponse.json(
        { error: 'Package not available or inactive' },
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

    // Create pending tournament record
    const pendingTournament = await db.pendingTournament.create({
      data: {
        host,
        name: tournamentName,
        url,
        description,
        prizeAmount: prizeAmount || 0,
        currency,
        maxTeams,
        registrationStart: new Date(registrationStart),
        registrationEnd: registrationEnd ? new Date(registrationEnd) : null,
        tournamentStart: new Date(tournamentStart),
        tournamentEnd: tournamentEnd ? new Date(tournamentEnd) : null,
        bracketType,
        packageType,
        graphicRequests,
        tournamentLogo, // Add tournament logo
        organizerId: decoded.userId,
        packagePrice: packagePrice.price,
        packageCurrency: packagePrice.currency,
        status: 'PENDING_PAYMENT',
      },
    });

    return NextResponse.json({
      message: 'Tournament data saved successfully. Please complete payment to create the tournament.',
      pendingTournament: {
        id: pendingTournament.id,
        packagePrice: packagePrice.price,
        packageCurrency: packagePrice.currency,
        tournamentName: pendingTournament.name,
      },
    });
  } catch (error) {
    console.error('Pending tournament creation error:', error);
    return NextResponse.json(
      { error: 'Failed to save tournament data' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const pendingTournaments = await db.pendingTournament.findMany({
      where: {
        organizerId: decoded.userId,
        status: 'PENDING_PAYMENT',
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({
      pendingTournaments,
    });
  } catch (error) {
    console.error('Error fetching pending tournaments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pending tournaments' },
      { status: 500 }
    );
  }
}