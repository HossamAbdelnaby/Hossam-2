import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { 
  generateBracketStructure, 
  updateBracketWithMatchData,
  assignTeamsToFirstRound
} from '@/lib/bracket-data';
import { emitBracketUpdate } from '@/lib/socket';

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
        teams: {
          include: {
            _count: {
              select: { players: true },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
        stages: true,
      },
    });

    if (!tournament) {
      return NextResponse.json(
        { error: 'Tournament not found' },
        { status: 404 }
      );
    }

    if (tournament.teams.length < 2) {
      return NextResponse.json(
        { error: 'At least 2 teams are required for random draw' },
        { status: 400 }
      );
    }

    // Check if tournament is in appropriate status for draw
    if (tournament.status === 'COMPLETED') {
      return NextResponse.json(
        { error: 'Cannot perform random draw on completed tournament' },
        { status: 400 }
      );
    }

    // Get or create the main stage
    let stage = tournament.stages[0];
    if (!stage) {
      stage = await db.tournamentStage.create({
        data: {
          name: `${tournament.bracketType} Stage`,
          type: tournament.bracketType,
          order: 0,
          tournamentId: tournamentId,
        },
      });
    }

    // Delete existing matches for this stage
    await db.match.deleteMany({
      where: { stageId: stage.id },
    });

    // Generate bracket structure
    const bracketData = await generateBracketStructure(
      tournamentId, 
      tournament.bracketType, 
      tournament.maxTeams
    );

    // Shuffle teams for random draw
    const shuffledTeams = [...tournament.teams].sort(() => Math.random() - 0.5);

    // Create matches based on bracket structure
    const matchesToCreate = [];
    
    if (bracketData.type === 'SINGLE_ELIMINATION') {
      // Assign teams to first round in bracket structure
      assignTeamsToFirstRound(bracketData.bracket.rounds[0].matches, shuffledTeams);
      
      // Create all matches for all rounds using the updated bracket structure
      for (const round of bracketData.bracket.rounds) {
        for (const match of round.matches) {
          matchesToCreate.push({
            id: `match-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            round: match.round,
            matchNumber: match.matchNumber,
            stageId: stage.id,
            team1Id: match.team1?.id || null,
            team2Id: match.team2?.id || null,
            nextMatchId: match.nextMatchId || null,
          });
        }
      }
    } else if (bracketData.type === 'DOUBLE_ELIMINATION') {
      // Handle double elimination - assign teams to winners bracket first round
      const winnersBracket = bracketData.bracket.winnersBracket;
      const firstRound = winnersBracket.rounds[0];
      let teamIndex = 0;
      
      for (const match of firstRound.matches) {
        if (teamIndex < shuffledTeams.length) {
          const team1 = shuffledTeams[teamIndex++];
          const team2 = teamIndex < shuffledTeams.length ? shuffledTeams[teamIndex++] : null;
          
          matchesToCreate.push({
            id: `match-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            round: match.round,
            matchNumber: match.matchNumber,
            stageId: stage.id,
            team1Id: team1?.id || null,
            team2Id: team2?.id || null,
          });
        }
      }
    } else if (bracketData.type === 'GROUP_STAGE') {
      // Handle group stage - assign teams to groups and create round-robin matches
      const groups = bracketData.bracket.groups;
      let teamIndex = 0;
      
      for (const group of groups) {
        const groupTeams = shuffledTeams.slice(teamIndex, teamIndex + 4);
        teamIndex += 4;
        
        // Create round-robin matches for the group
        for (let i = 0; i < groupTeams.length; i++) {
          for (let j = i + 1; j < groupTeams.length; j++) {
            matchesToCreate.push({
              id: `match-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              round: 1,
              matchNumber: matchesToCreate.length + 1,
              stageId: stage.id,
              team1Id: groupTeams[i].id,
              team2Id: groupTeams[j].id,
            });
          }
        }
      }
    } else if (bracketData.type === 'SWISS') {
      // Handle Swiss system - assign random pairings for first round
      const rounds = bracketData.bracket.rounds;
      const firstRound = rounds[0];
      let teamIndex = 0;
      
      for (const match of firstRound.matches) {
        if (teamIndex < shuffledTeams.length) {
          const team1 = shuffledTeams[teamIndex++];
          const team2 = teamIndex < shuffledTeams.length ? shuffledTeams[teamIndex++] : null;
          
          matchesToCreate.push({
            id: `match-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            round: match.round,
            matchNumber: match.matchNumber,
            stageId: stage.id,
            team1Id: team1?.id || null,
            team2Id: team2?.id || null,
          });
        }
      }
    }

    // Create all matches one by one to handle any potential conflicts
    for (const matchData of matchesToCreate) {
      try {
        await db.match.create({
          data: matchData,
        });
      } catch (error) {
        console.error('Error creating match:', error);
        // Continue with other matches even if one fails
      }
    }

    // Update tournament status if needed
    if (tournament.status === 'REGISTRATION_CLOSED' || tournament.status === 'DRAFT') {
      await db.tournament.update({
        where: { id: tournamentId },
        data: { status: 'IN_PROGRESS' },
      });
    }

    // Get updated bracket data
    const updatedBracket = await updateBracketWithMatchData(bracketData, tournamentId);
    
    // Emit real-time update
    emitBracketUpdate(tournamentId);
    
    return NextResponse.json({
      success: true,
      message: 'Random draw completed successfully',
      bracket: updatedBracket,
      tournament: {
        id: tournament.id,
        bracketType: tournament.bracketType,
        maxTeams: tournament.maxTeams,
        status: 'IN_PROGRESS',
      },
    });
  } catch (error) {
    console.error('Error performing random draw:', error);
    return NextResponse.json(
      { error: 'Failed to perform random draw' },
      { status: 500 }
    );
  }
}