import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: tournamentId } = await params;
    
    // Get tournament details
    const tournament = await db.tournament.findUnique({
      where: { id: tournamentId },
      include: {
        stages: true,
        teams: true,
      },
    });

    if (!tournament || tournament.bracketType !== 'GROUP_STAGE') {
      return NextResponse.json(
        { error: 'Tournament not found or not group stage' },
        { status: 404 }
      );
    }

    // Get all teams
    const teams = tournament.teams;
    if (teams.length < 4) {
      return NextResponse.json(
        { error: 'Need at least 4 teams for group stage' },
        { status: 400 }
      );
    }

    // Get the stage
    let stage = tournament.stages[0];
    if (!stage) {
      stage = await db.tournamentStage.create({
        data: {
          tournamentId,
          type: 'GROUP_STAGE',
          order: 1,
          name: 'Group Stage',
          isActive: true,
        },
      });
    }

    // Clear existing matches
    await db.match.deleteMany({
      where: {
        stageId: stage.id,
      },
    });

    // Split teams into two groups
    const teamsPerGroup = Math.ceil(teams.length / 2);
    const groupATeams = teams.slice(0, teamsPerGroup);
    const groupBTeams = teams.slice(teamsPerGroup);

    const createdMatches = [];

    // Create matches for Group A (round 1)
    let matchNumber = 1;
    for (let i = 0; i < groupATeams.length; i++) {
      for (let j = i + 1; j < groupATeams.length; j++) {
        const match = await db.match.create({
          data: {
            round: 1, // Group A matches
            matchNumber: matchNumber++,
            stageId: stage.id,
            team1Id: groupATeams[i].id,
            team2Id: groupATeams[j].id,
            isActive: true,
          },
        });
        createdMatches.push(match);
      }
    }

    // Create matches for Group B (round 2)
    matchNumber = 1;
    for (let i = 0; i < groupBTeams.length; i++) {
      for (let j = i + 1; j < groupBTeams.length; j++) {
        const match = await db.match.create({
          data: {
            round: 2, // Group B matches
            matchNumber: matchNumber++,
            stageId: stage.id,
            team1Id: groupBTeams[i].id,
            team2Id: groupBTeams[j].id,
            isActive: true,
          },
        });
        createdMatches.push(match);
      }
    }

    return NextResponse.json({
      message: 'Group stage matches created successfully',
      groupA: {
        teams: groupATeams.length,
        matches: groupATeams.length * (groupATeams.length - 1) / 2,
      },
      groupB: {
        teams: groupBTeams.length,
        matches: groupBTeams.length * (groupBTeams.length - 1) / 2,
      },
      totalMatches: createdMatches.length,
    });
  } catch (error) {
    console.error('Error setting up group stage matches:', error);
    return NextResponse.json(
      { error: 'Failed to setup group stage matches' },
      { status: 500 }
    );
  }
}