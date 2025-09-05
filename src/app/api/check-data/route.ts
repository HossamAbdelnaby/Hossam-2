import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    // Check users
    const users = await db.user.findMany({
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
      },
    });

    // Check tournaments
    const tournaments = await db.tournament.findMany({
      select: {
        id: true,
        name: true,
        status: true,
        host: true,
        prizeAmount: true,
        maxTeams: true,
        _count: {
          select: {
            teams: true,
          },
        },
      },
    });

    // Check teams
    const teams = await db.team.findMany({
      select: {
        id: true,
        name: true,
        tournamentId: true,
        _count: {
          select: {
            players: true,
          },
        },
      },
    });

    return NextResponse.json({
      users: {
        count: users.length,
        data: users,
      },
      tournaments: {
        count: tournaments.length,
        data: tournaments,
      },
      teams: {
        count: teams.length,
        data: teams,
      },
    });
  } catch (error) {
    console.error('Check data error:', error);
    return NextResponse.json(
      { error: 'Failed to check data' },
      { status: 500 }
    );
  }
}