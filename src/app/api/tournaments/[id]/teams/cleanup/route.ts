import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function DELETE(request: NextRequest) {
  try {
    // Get the tournament ID from the query parameters
    const { searchParams } = new URL(request.url);
    const tournamentId = searchParams.get('tournamentId');

    if (!tournamentId) {
      return NextResponse.json(
        { error: 'Tournament ID is required' },
        { status: 400 }
      );
    }

    // First, get all teams in the tournament
    const teams = await db.team.findMany({
      where: {
        tournamentId: tournamentId,
      },
      include: {
        players: true,
      },
    });

    if (teams.length === 0) {
      return NextResponse.json({
        message: 'No teams found in this tournament',
        deletedTeams: 0,
        deletedPlayers: 0,
      });
    }

    // Collect all player IDs to delete
    const playerIds = teams.flatMap(team => team.players.map(player => player.id));
    const teamIds = teams.map(team => team.id);

    // Delete all players first (due to foreign key constraint)
    const deletedPlayers = await db.player.deleteMany({
      where: {
        id: {
          in: playerIds,
        },
      },
    });

    // Delete all teams
    const deletedTeams = await db.team.deleteMany({
      where: {
        id: {
          in: teamIds,
        },
      },
    });

    // Clear any matches that might reference these teams
    await db.match.updateMany({
      where: {
        OR: [
          { team1Id: { in: teamIds } },
          { team2Id: { in: teamIds } },
          { winnerId: { in: teamIds } },
        ],
      },
      data: {
        team1Id: null,
        team2Id: null,
        winnerId: null,
      },
    });

    return NextResponse.json({
      message: 'Test teams and players deleted successfully',
      deletedTeams: deletedTeams.count,
      deletedPlayers: deletedPlayers.count,
      deletedTeamIds: teamIds,
      deletedPlayerIds: playerIds,
    });
  } catch (error) {
    console.error('Error deleting test teams:', error);
    return NextResponse.json(
      { error: 'Failed to delete test teams' },
      { status: 500 }
    );
  }
}