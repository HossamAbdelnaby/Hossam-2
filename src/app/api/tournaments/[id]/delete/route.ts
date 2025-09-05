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

    // First, get the tournament to verify it exists
    const tournament = await db.tournament.findUnique({
      where: {
        id: tournamentId,
      },
      include: {
        stages: {
          include: {
            matches: true,
          },
        },
        teams: {
          include: {
            players: true,
          },
        },
        registrationLogs: true,
      },
    });

    if (!tournament) {
      return NextResponse.json(
        { error: 'Tournament not found' },
        { status: 404 }
      );
    }

    // Collect all IDs to delete
    const stageIds = tournament.stages.map(stage => stage.id);
    const matchIds = tournament.stages.flatMap(stage => stage.matches.map(match => match.id));
    const teamIds = tournament.teams.map(team => team.id);
    const playerIds = tournament.teams.flatMap(team => team.players.map(player => player.id));
    const registrationLogIds = tournament.registrationLogs.map(log => log.id);

    // Delete in correct order due to foreign key constraints
    const deletedItems = {
      registrationLogs: 0,
      players: 0,
      teams: 0,
      matches: 0,
      stages: 0,
      tournament: 0,
    };

    // Delete registration logs
    if (registrationLogIds.length > 0) {
      const deletedLogs = await db.registrationLog.deleteMany({
        where: {
          id: {
            in: registrationLogIds,
          },
        },
      });
      deletedItems.registrationLogs = deletedLogs.count;
    }

    // Delete players
    if (playerIds.length > 0) {
      const deletedPlayers = await db.player.deleteMany({
        where: {
          id: {
            in: playerIds,
          },
        },
      });
      deletedItems.players = deletedPlayers.count;
    }

    // Delete teams
    if (teamIds.length > 0) {
      const deletedTeams = await db.team.deleteMany({
        where: {
          id: {
            in: teamIds,
          },
        },
      });
      deletedItems.teams = deletedTeams.count;
    }

    // Delete matches
    if (matchIds.length > 0) {
      const deletedMatches = await db.match.deleteMany({
        where: {
          id: {
            in: matchIds,
          },
        },
      });
      deletedItems.matches = deletedMatches.count;
    }

    // Delete stages
    if (stageIds.length > 0) {
      const deletedStages = await db.tournamentStage.deleteMany({
        where: {
          id: {
            in: stageIds,
          },
        },
      });
      deletedItems.stages = deletedStages.count;
    }

    // Finally, delete the tournament
    await db.tournament.delete({
      where: {
        id: tournamentId,
      },
    });
    deletedItems.tournament = 1;

    return NextResponse.json({
      message: 'Tournament and all related data deleted successfully',
      tournamentName: tournament.name,
      deletedItems,
      deletedIds: {
        tournamentId,
        stageIds,
        matchIds,
        teamIds,
        playerIds,
        registrationLogIds,
      },
    });
  } catch (error) {
    console.error('Error deleting tournament:', error);
    return NextResponse.json(
      { error: 'Failed to delete tournament' },
      { status: 500 }
    );
  }
}