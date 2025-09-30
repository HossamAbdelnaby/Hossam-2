import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { db } from '@/lib/db';
import { TournamentStatus } from '@prisma/client';

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
    const { pendingTournamentId, paymentId } = body;

    if (!pendingTournamentId || !paymentId) {
      return NextResponse.json(
        { error: 'Missing pending tournament ID or payment ID' },
        { status: 400 }
      );
    }

    // Get the pending tournament
    const pendingTournament = await db.pendingTournament.findUnique({
      where: { id: pendingTournamentId },
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

    if (!pendingTournament) {
      return NextResponse.json(
        { error: 'Pending tournament not found' },
        { status: 404 }
      );
    }

    // Verify ownership
    if (pendingTournament.organizerId !== decoded.userId) {
      return NextResponse.json(
        { error: 'Unauthorized access to pending tournament' },
        { status: 403 }
      );
    }

    // Check if payment is completed
    const payment = await db.payment.findUnique({
      where: { id: paymentId },
    });

    if (!payment || payment.status !== 'COMPLETED') {
      return NextResponse.json(
        { error: 'Payment not completed' },
        { status: 400 }
      );
    }

    // Verify payment amount matches package price
    if (payment.amount !== pendingTournament.packagePrice) {
      return NextResponse.json(
        { error: 'Payment amount does not match package price' },
        { status: 400 }
      );
    }

    // Create the actual tournament
    const tournament = await db.tournament.create({
      data: {
        host: pendingTournament.host,
        name: pendingTournament.name,
        url: pendingTournament.url,
        description: pendingTournament.description,
        prizeAmount: pendingTournament.prizeAmount,
        maxTeams: pendingTournament.maxTeams,
        registrationStart: pendingTournament.registrationStart,
        registrationEnd: pendingTournament.registrationEnd,
        tournamentStart: pendingTournament.tournamentStart,
        tournamentEnd: pendingTournament.tournamentEnd,
        bracketType: pendingTournament.bracketType,
        packageType: pendingTournament.packageType,
        graphicRequests: pendingTournament.graphicRequests,
        tournamentLogo: pendingTournament.tournamentLogo, // Add tournament logo
        organizerId: pendingTournament.organizerId,
        status: TournamentStatus.REGISTRATION_OPEN, // Open for registration after payment
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
        name: `${pendingTournament.bracketType.replace('_', ' ')} Stage`,
        type: pendingTournament.bracketType,
        order: 0,
        tournamentId: tournament.id,
      },
    });

    // Update pending tournament status
    await db.pendingTournament.update({
      where: { id: pendingTournamentId },
      data: {
        status: 'PAID',
      },
    });

    // Update payment to link to tournament
    await db.payment.update({
      where: { id: paymentId },
      data: {
        tournamentId: tournament.id,
        type: 'TOURNAMENT_FEE',
        description: `Payment for tournament: ${pendingTournament.name}`,
        completedAt: new Date(),
      },
    });

    return NextResponse.json({
      message: 'Tournament created successfully after payment confirmation',
      tournament,
    });
  } catch (error) {
    console.error('Tournament creation after payment error:', error);
    return NextResponse.json(
      { error: 'Failed to create tournament after payment' },
      { status: 500 }
    );
  }
}