import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: tournamentId } = await params;

    // Check if tournament exists
    const tournament = await db.tournament.findUnique({
      where: { id: tournamentId },
    });

    if (!tournament) {
      return NextResponse.json(
        { error: 'Tournament not found' },
        { status: 404 }
      );
    }

    // Fetch registration logs with related data
    const registrationLogs = await db.registrationLog.findMany({
      where: { tournamentId },
      include: {
        team: {
          select: {
            id: true,
            name: true,
            clanTag: true,
            createdAt: true,
          },
        },
        user: {
          select: {
            id: true,
            username: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ registrationLogs });
  } catch (error) {
    console.error('Registration logs fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch registration logs' },
      { status: 500 }
    );
  }
}