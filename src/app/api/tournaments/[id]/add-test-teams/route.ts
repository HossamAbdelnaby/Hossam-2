import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

const testTeams = [
  { name: "Team Liquid", clanTag: "TL" },
  { name: "Fnatic", clanTag: "FNC" },
  { name: "G2 Esports", clanTag: "G2" },
  { name: "Cloud9", clanTag: "C9" },
  { name: "NAVI", clanTag: "NAVI" },
  { name: "DIZI", clanTag: "DIZI" },
  { name: "Vitality", clanTag: "VIT" },
  { name: "Astralis", clanTag: "AST" },
  { name: "Evil Geniuses", clanTag: "EG" },
  { name: "100 Thieves", clanTag: "100T" },
  { name: "Sentinels", clanTag: "SEN" },
  { name: "OpTic Gaming", clanTag: "OPTC" },
  { name: "FaZe Clan", clanTag: "FAZE" },
  { name: "T1", clanTag: "T1" },
  { name: "DRX", clanTag: "DRX" },
  { name: "Paper Rex", clanTag: "PRX" },
];

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

    // Get existing team names to avoid duplicates
    const existingTeamNames = tournament.teams.map(team => team.name.toLowerCase());
    
    // Filter out teams that already exist
    const teamsToAdd = testTeams.filter(team => 
      !existingTeamNames.includes(team.name.toLowerCase())
    );

    if (teamsToAdd.length === 0) {
      return NextResponse.json({
        message: 'All test teams already exist in tournament',
        existingTeams: tournament.teams.length,
      });
    }

    // Add new teams to the tournament
    const createdTeams = [];
    for (const teamData of teamsToAdd) {
      try {
        const team = await db.team.create({
          data: {
            name: teamData.name,
            clanTag: teamData.clanTag,
            tournamentId: tournamentId,
            logo: null, // No logo for test teams
          },
        });
        createdTeams.push(team);
      } catch (error) {
        console.error(`Error creating team ${teamData.name}:`, error);
      }
    }

    return NextResponse.json({
      message: 'Test teams added successfully',
      teamsAdded: createdTeams.length,
      totalTeams: tournament.teams.length + createdTeams.length,
      newTeams: createdTeams.map(team => ({
        id: team.id,
        name: team.name,
        clanTag: team.clanTag,
      })),
    });
  } catch (error) {
    console.error('Error adding test teams:', error);
    return NextResponse.json(
      { error: 'Failed to add test teams' },
      { status: 500 }
    );
  }
}