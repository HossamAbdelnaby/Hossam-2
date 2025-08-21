import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = (page - 1) * limit;

    const tournaments = await db.tournament.findMany({
      where: {
        status: 'REGISTRATION_OPEN',
        isActive: true,
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
        startDate: 'asc',
      },
      skip: offset,
      take: limit,
    });

    const total = await db.tournament.count({
      where: {
        status: 'REGISTRATION_OPEN',
        isActive: true,
      },
    });

    return NextResponse.json({
      tournaments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Available tournaments fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch available tournaments' },
      { status: 500 }
    );
  }
}