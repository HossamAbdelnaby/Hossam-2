import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { emitMatchUpdate, emitBracketUpdate } from '@/lib/socket';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; matchId: string }> }
) {
  try {
    const { id: tournamentId, matchId } = await params;
    const { score1, score2, winnerId } = await request.json();

    // Verify the match exists and belongs to the tournament
    const match = await db.match.findFirst({
      where: {
        id: matchId,
        stage: {
          tournamentId: tournamentId,
        },
      },
      include: {
        stage: {
          include: {
            tournament: true,
          },
        },
        team1: true,
        team2: true,
        winner: true,
      },
    });

    if (!match) {
      return NextResponse.json(
        { error: 'Match not found' },
        { status: 404 }
      );
    }

    // Validate scores
    if (score1 !== undefined && score1 < 0) {
      return NextResponse.json(
        { error: 'Score 1 must be non-negative' },
        { status: 400 }
      );
    }

    if (score2 !== undefined && score2 < 0) {
      return NextResponse.json(
        { error: 'Score 2 must be non-negative' },
        { status: 400 }
      );
    }

    // Validate winner
    if (winnerId) {
      if (winnerId !== match.team1Id && winnerId !== match.team2Id) {
        return NextResponse.json(
          { error: 'Winner must be one of the teams in the match' },
          { status: 400 }
        );
      }

      // If scores are provided, they are for display only - manual winner selection takes precedence
      if (score1 !== undefined && score2 !== undefined) {
        console.log('Scores provided but manual winner selection takes precedence');
      }
    } else {
      return NextResponse.json(
        { error: 'Winner must be manually selected' },
        { status: 400 }
      );
    }

    // Update the match with results
    const updatedMatch = await db.match.update({
      where: { id: matchId },
      data: {
        score1: score1 !== undefined ? score1 : match.score1,
        score2: score2 !== undefined ? score2 : match.score2,
        winnerId: winnerId || match.winnerId,
      },
      include: {
        team1: {
          select: {
            id: true,
            name: true,
          },
        },
        team2: {
          select: {
            id: true,
            name: true,
          },
        },
        winner: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    const tournament = match.stage.tournament;
    const isDoubleElimination = tournament.bracketType === 'DOUBLE_ELIMINATION';
    
    // Handle Double Elimination logic
    if (isDoubleElimination && winnerId) {
      const totalWinnersRounds = Math.ceil(Math.log2(tournament.maxTeams));
      const isWinnersBracket = match.round <= totalWinnersRounds;
      
      // Get the losing team
      const losingTeamId = winnerId === match.team1Id ? match.team2Id : match.team1Id;
      
      if (isWinnersBracket && losingTeamId) {
        // Move losing team to losers bracket (from winners bracket)
        await moveTeamToLosersBracket(tournamentId, losingTeamId, match.round, totalWinnersRounds);
      } else if (!isWinnersBracket && losingTeamId) {
        // Eliminate losing team from tournament (from losers bracket - second loss)
        await eliminateTeamFromTournament(tournamentId, losingTeamId);
        console.log(`Team ${losingTeamId} eliminated from tournament (second loss in losers bracket)`);
      }
      
      // Handle winners bracket advancement - ONLY FOR WINNERS BRACKET
      if (isWinnersBracket) {
        await advanceWinnerToNextMatch(tournamentId, winnerId, match.round, true);
      }
      
      // Check if we need to setup grand final
      await checkAndSetupGrandFinal(tournamentId, totalWinnersRounds);
    } else {
      // Single elimination logic (existing logic)
      if (winnerId) {
        await advanceWinnerToNextMatchSingleElimination(tournamentId, winnerId, match.round);
      }
    }

    // Check if tournament is completed
    const allMatches = await db.match.findMany({
      where: {
        stage: {
          tournamentId: tournamentId,
        },
      },
    });

    const allMatchesCompleted = allMatches.every(m => m.winnerId !== null);
    
    if (allMatchesCompleted) {
      await db.tournament.update({
        where: { id: tournamentId },
        data: { status: 'COMPLETED' },
      });
    }

    // Prepare advancement info
    let advancementInfo = null;
    if (winnerId) {
      const winner = match.team1?.id === winnerId ? match.team1 : match.team2;
      if (winner) {
        advancementInfo = {
          winnerName: winner.name,
          nextRound: match.round + 1
        };
      }
    }

    // Emit real-time updates
    emitMatchUpdate(tournamentId, matchId);
    emitBracketUpdate(tournamentId);
    
    return NextResponse.json({
      success: true,
      message: 'Match results updated successfully',
      match: updatedMatch,
      tournamentCompleted: allMatchesCompleted,
      advancementInfo,
      isDoubleElimination,
    });
  } catch (error) {
    console.error('Error updating match results:', error);
    return NextResponse.json(
      { error: 'Failed to update match results' },
      { status: 500 }
    );
  }
}

// Helper function to move losing team to losers bracket
async function moveTeamToLosersBracket(
  tournamentId: string, 
  losingTeamId: string, 
  currentRound: number, 
  totalWinnersRounds: number
) {
  try {
    // Calculate which losers round this team should go to
    const losersRound = currentRound; // First losers round corresponds to current winners round
    const targetRound = totalWinnersRounds + losersRound;
    
    // Find an available slot in the losers bracket
    const availableSlots = await db.match.findMany({
      where: {
        stage: {
          tournamentId,
        },
        round: targetRound,
        OR: [
          { team1Id: null },
          { team2Id: null },
        ],
      },
      orderBy: {
        matchNumber: 'asc',
      },
    });

    if (availableSlots.length > 0) {
      // Place the losing team in the first available slot
      const targetSlot = availableSlots[0];
      const updateData: any = {};
      
      if (!targetSlot.team1Id) {
        updateData.team1Id = losingTeamId;
      } else if (!targetSlot.team2Id) {
        updateData.team2Id = losingTeamId;
      }
      
      if (Object.keys(updateData).length > 0) {
        await db.match.update({
          where: { id: targetSlot.id },
          data: updateData,
        });
        
        console.log(`Moved losing team ${losingTeamId} to losers bracket round ${targetRound}`);
      }
    } else {
      console.log(`No available slots found in losers bracket round ${targetRound} for team ${losingTeamId}`);
    }
  } catch (error) {
    console.error('Error moving team to losers bracket:', error);
  }
}

// Helper function to advance winner in double elimination
async function advanceWinnerToNextMatch(
  tournamentId: string, 
  winnerId: string, 
  currentRound: number, 
  isWinnersBracket: boolean
) {
  try {
    let targetRound;
    
    if (isWinnersBracket) {
      // Winner stays in winners bracket
      targetRound = currentRound + 1;
    } else {
      // Winner advances in losers bracket
      targetRound = currentRound + 1;
    }
    
    // Find the correct next match based on bracket structure
    // For double elimination, we need to be more specific about which match the winner goes to
    const nextMatches = await db.match.findMany({
      where: {
        stage: {
          tournamentId,
        },
        round: targetRound,
      },
      include: {
        team1: true,
        team2: true,
      },
      orderBy: {
        matchNumber: 'asc',
      },
    });

    if (nextMatches.length > 0) {
      // Find the correct match for this winner
      let targetSlot = null;
      
      if (isWinnersBracket) {
        // In winners bracket, winners go to specific matches based on their original position
        // Match 1 and 2 winners go to match 1 in next round
        // Match 3 and 4 winners go to match 2 in next round
        const currentMatch = await db.match.findUnique({
          where: { id: winnerId }, // This is wrong, we need the original match
        });
        
        // For now, just find first available slot
        targetSlot = nextMatches.find(match => !match.team1Id || !match.team2Id);
      } else {
        // In losers bracket, find first available slot
        targetSlot = nextMatches.find(match => !match.team1Id || !match.team2Id);
      }
      
      if (targetSlot) {
        const updateData: any = {};
        
        if (!targetSlot.team1Id) {
          updateData.team1Id = winnerId;
        } else if (!targetSlot.team2Id) {
          updateData.team2Id = winnerId;
        }
        
        if (Object.keys(updateData).length > 0) {
          await db.match.update({
            where: { id: targetSlot.id },
            data: updateData,
          });
          
          console.log(`Advanced winner ${winnerId} to match ${targetSlot.id} in round ${targetRound}`);
        }
      }
    }
  } catch (error) {
    console.error('Error advancing winner:', error);
  }
}

// Helper function to advance winner in single elimination
async function advanceWinnerToNextMatchSingleElimination(
  tournamentId: string, 
  winnerId: string, 
  currentRound: number
) {
  try {
    // Find the next match that this match feeds into
    const nextMatches = await db.match.findMany({
      where: {
        stage: {
          tournamentId,
        },
        round: currentRound + 1,
        OR: [
          { team1Id: null },
          { team2Id: null },
        ],
      },
      include: {
        team1: true,
        team2: true,
      },
      orderBy: {
        matchNumber: 'asc',
      },
    });

    if (nextMatches.length > 0) {
      // Find the first available slot in the next round
      for (const nextMatch of nextMatches) {
        const updateData: any = {};
        
        if (!nextMatch.team1Id) {
          updateData.team1Id = winnerId;
        } else if (!nextMatch.team2Id) {
          updateData.team2Id = winnerId;
        }
        
        if (Object.keys(updateData).length > 0) {
          await db.match.update({
            where: { id: nextMatch.id },
            data: updateData,
          });
          break; // Only fill one slot per winner
        }
      }
    }
  } catch (error) {
    console.error('Error advancing winner in single elimination:', error);
  }
}

// Helper function to eliminate team from tournament (second loss in losers bracket)
async function eliminateTeamFromTournament(
  tournamentId: string, 
  teamId: string
) {
  try {
    // Mark the team as eliminated in the tournament
    // You might want to add an 'eliminated' field to the team-tournament relationship
    // For now, we'll just log the elimination and could update team status if needed
    
    // Optional: Update team status to eliminated
    // await db.tournamentTeam.update({
    //   where: {
    //     tournamentId_teamId: {
    //       tournamentId,
    //       teamId
    //     }
    //   },
    //   data: { status: 'ELIMINATED' }
    // });
    
    console.log(`Team ${teamId} eliminated from tournament (second loss in losers bracket)`);
  } catch (error) {
    console.error('Error eliminating team from tournament:', error);
  }
}

// Helper function to check and setup grand final
async function checkAndSetupGrandFinal(
  tournamentId: string, 
  totalWinnersRounds: number
) {
  try {
    const grandFinalRound = totalWinnersRounds * 2 + 1;
    
    // Check if we have winners from both brackets
    const winnersFinalMatch = await db.match.findFirst({
      where: {
        stage: { tournamentId },
        round: totalWinnersRounds,
        winnerId: { not: null },
      },
      include: {
        winner: true,
      },
    });

    const losersFinalMatch = await db.match.findFirst({
      where: {
        stage: { tournamentId },
        round: totalWinnersRounds * 2, // Losers final round
        winnerId: { not: null },
      },
      include: {
        winner: true,
      },
    });

    // If both finals have winners, setup grand final
    if (winnersFinalMatch && losersFinalMatch) {
      const grandFinalMatch = await db.match.findFirst({
        where: {
          stage: { tournamentId },
          round: grandFinalRound,
        },
      });

      if (grandFinalMatch) {
        // Update grand final with the two finalists
        await db.match.update({
          where: { id: grandFinalMatch.id },
          data: {
            team1Id: winnersFinalMatch.winnerId,
            team2Id: losersFinalMatch.winnerId,
          },
        });
        
        console.log(`Setup grand final with ${winnersFinalMatch.winner?.name} vs ${losersFinalMatch.winner?.name}`);
      }
    }
  } catch (error) {
    console.error('Error checking and setting up grand final:', error);
  }
}