import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
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

    // Shuffle teams for random draw
    const shuffledTeams = [...tournament.teams].sort(() => Math.random() - 0.5);

    // Create matches based on bracket type
    const matchesToCreate = [];
    
    if (tournament.bracketType === 'SINGLE_ELIMINATION') {
      // Single elimination bracket structure
      const totalRounds = Math.ceil(Math.log2(tournament.maxTeams));
      let matchIdCounter = 1;
      
      // Create matches for each round
      for (let round = 1; round <= totalRounds; round++) {
        const matchesInRound = Math.ceil(tournament.maxTeams / Math.pow(2, round));
        
        for (let matchNum = 0; matchNum < matchesInRound; matchNum++) {
          const matchId = `match-${Date.now()}-${matchIdCounter++}`;
          
          let team1Id = null;
          let team2Id = null;
          
          // Only assign teams to first round
          if (round === 1) {
            const teamIndex = matchNum * 2;
            team1Id = shuffledTeams[teamIndex]?.id || null;
            team2Id = shuffledTeams[teamIndex + 1]?.id || null;
          }
          
          matchesToCreate.push({
            id: matchId,
            round: round,
            matchNumber: matchNum + 1,
            stageId: stage.id,
            team1Id,
            team2Id,
          });
        }
      }
    } else if (tournament.bracketType === 'DOUBLE_ELIMINATION') {
      // Double elimination - simplified version
      const totalRounds = Math.ceil(Math.log2(tournament.maxTeams));
      let matchIdCounter = 1;
      
      // Winners bracket
      for (let round = 1; round <= totalRounds; round++) {
        const matchesInRound = Math.ceil(tournament.maxTeams / Math.pow(2, round));
        
        for (let matchNum = 0; matchNum < matchesInRound; matchNum++) {
          const matchId = `match-${Date.now()}-${matchIdCounter++}`;
          
          let team1Id = null;
          let team2Id = null;
          
          // Only assign teams to first round
          if (round === 1) {
            const teamIndex = matchNum * 2;
            team1Id = shuffledTeams[teamIndex]?.id || null;
            team2Id = shuffledTeams[teamIndex + 1]?.id || null;
          }
          
          matchesToCreate.push({
            id: matchId,
            round: round,
            matchNumber: matchNum + 1,
            stageId: stage.id,
            team1Id,
            team2Id,
          });
        }
      }
    } else if (tournament.bracketType === 'GROUP_STAGE') {
      // Group stage - create groups and round-robin matches
      const groupsCount = 4;
      const teamsPerGroup = Math.ceil(shuffledTeams.length / groupsCount);
      
      for (let groupIndex = 0; groupIndex < groupsCount; groupIndex++) {
        const startIdx = groupIndex * teamsPerGroup;
        const endIdx = Math.min(startIdx + teamsPerGroup, shuffledTeams.length);
        const groupTeams = shuffledTeams.slice(startIdx, endIdx);
        
        // Create round-robin matches for the group
        for (let i = 0; i < groupTeams.length; i++) {
          for (let j = i + 1; j < groupTeams.length; j++) {
            matchesToCreate.push({
              id: `match-${Date.now()}-${matchesToCreate.length + 1}`,
              round: groupIndex + 1,
              matchNumber: matchesToCreate.length + 1,
              stageId: stage.id,
              team1Id: groupTeams[i].id,
              team2Id: groupTeams[j].id,
            });
          }
        }
      }
    } else if (tournament.bracketType === 'SWISS') {
      // Swiss system - create rounds with random pairings
      const roundsCount = Math.min(5, Math.ceil(Math.log2(shuffledTeams.length)) + 2);
      
      for (let round = 1; round <= roundsCount; round++) {
        const matchesInRound = Math.floor(shuffledTeams.length / 2);
        
        for (let matchNum = 0; matchNum < matchesInRound; matchNum++) {
          const teamIndex = matchNum * 2;
          
          matchesToCreate.push({
            id: `match-${Date.now()}-${matchesToCreate.length + 1}`,
            round: round,
            matchNumber: matchNum + 1,
            stageId: stage.id,
            team1Id: shuffledTeams[teamIndex]?.id || null,
            team2Id: shuffledTeams[teamIndex + 1]?.id || null,
          });
        }
      }
    }

    // Create all matches
    for (const matchData of matchesToCreate) {
      try {
        await db.match.create({
          data: matchData,
        });
      } catch (error) {
        console.error('Error creating match:', error);
      }
    }

    // Update tournament status if needed
    if (tournament.status === 'REGISTRATION_CLOSED' || tournament.status === 'DRAFT') {
      await db.tournament.update({
        where: { id: tournamentId },
        data: { status: 'IN_PROGRESS' },
      });
    }

    // Emit real-time update
    emitBracketUpdate(tournamentId);
    
    return NextResponse.json({
      success: true,
      message: 'Random draw completed successfully',
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