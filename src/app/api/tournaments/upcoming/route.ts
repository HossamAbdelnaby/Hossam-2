import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '6');

    const tournaments = await db.tournament.findMany({
      where: {
        isActive: true,
        OR: [
          { status: 'DRAFT' },
          { status: 'REGISTRATION_OPEN' },
          { status: 'REGISTRATION_CLOSED' },
        ],
        tournamentStart: {
          gte: new Date(), // Only tournaments that haven't started yet
        },
      },
      include: {
        organizer: {
          select: {
            id: true,
            username: true,
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
        tournamentStart: 'asc', // Show upcoming tournaments first
      },
      take: limit,
    });

    return NextResponse.json({
      tournaments,
    });
  } catch (error) {
    console.error('Upcoming tournaments fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch upcoming tournaments' },
      { status: 500 }
    );
  }
}