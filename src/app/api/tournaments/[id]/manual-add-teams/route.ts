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
        teams: true,
      },
    });

    if (!tournament) {
      return NextResponse.json(
        { error: 'Tournament not found' },
        { status: 404 }
      );
    }

    // Test teams data
    const testTeamsData = [
      { name: 'NAVI', clanTag: 'NAV' },
      { name: 'DIZI', clanTag: 'DIZ' },
      { name: 'Team Liquid', clanTag: 'TL' },
      { name: 'Fnatic', clanTag: 'FNC' },
      { name: 'G2 Esports', clanTag: 'G2' },
      { name: 'Cloud9', clanTag: 'C9' },
    ];

    const addedTeams = [];
    
    for (const teamData of testTeamsData) {
      try {
        // Create team without checking for duplicates
        const newTeam = await db.team.create({
          data: {
            name: teamData.name,
            clanTag: teamData.clanTag,
            logo: null,
          },
        });

        // Add team to tournament
        await db.tournamentTeam.create({
          data: {
            tournamentId,
            teamId: newTeam.id,
            registeredAt: new Date(),
          },
        });

        addedTeams.push({
          id: newTeam.id,
          name: newTeam.name,
          clanTag: newTeam.clanTag,
        });
      } catch (error) {
        console.error(`Error creating team ${teamData.name}:`, error);
      }
    }

    return NextResponse.json({
      message: 'Teams added successfully',
      teamsAdded: addedTeams.length,
      totalTeamsNow: tournament.teams.length + addedTeams.length,
      addedTeams: addedTeams,
    });
  } catch (error) {
    console.error('Error in manual add teams:', error);
    return NextResponse.json(
      { error: 'Failed to add teams' },
      { status: 500 }
    );
  }
}