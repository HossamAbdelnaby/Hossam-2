import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    // Count all teams and players in the database
    const teamCount = await db.team.count();
    const playerCount = await db.player.count();

    // Get recent teams if any exist
    const recentTeams = await db.team.findMany({
      take: 5,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        _count: {
          select: {
            players: true,
          },
        },
        tournament: {
          select: {
            name: true,
          },
        },
      },
    });

    // Get recent players if any exist
    const recentPlayers = await db.player.findMany({
      take: 5,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        team: {
          select: {
            name: true,
          },
        },
      },
    });

    return NextResponse.json({
      summary: {
        totalTeams: teamCount,
        totalPlayers: playerCount,
      },
      recentTeams,
      recentPlayers,
    });
  } catch (error) {
    console.error('Error checking database status:', error);
    return NextResponse.json(
      { error: 'Failed to check database status' },
      { status: 500 }
    );
  }
}