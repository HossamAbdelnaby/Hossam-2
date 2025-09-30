import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: tournamentId } = await params;
    
    // Get tournament details
    const tournament = await db.tournament.findUnique({
      where: { id: tournamentId },
      select: {
        id: true,
        bracketType: true,
        maxTeams: true,
        status: true,
      },
    });

    if (!tournament) {
      return NextResponse.json(
        { error: 'Tournament not found' },
        { status: 404 }
      );
    }

    // Get actual matches from database with all related data
    const matches = await db.match.findMany({
      where: {
        stage: {
          tournamentId,
        },
      },
      include: {
        team1: {
          select: {
            id: true,
            name: true,
            clanTag: true,
            logo: true,
          },
        },
        team2: {
          select: {
            id: true,
            name: true,
            clanTag: true,
            logo: true,
          },
        },
        winner: {
          select: {
            id: true,
            name: true,
            clanTag: true,
            logo: true,
          },
        },
        stage: {
          select: {
            type: true,
            order: true,
          },
        },
      },
      orderBy: [
        { round: 'asc' },
        { matchNumber: 'asc' },
      ],
    });

    // Create bracket structure based on tournament type
    if (tournament.bracketType === 'DOUBLE_ELIMINATION') {
      const totalWinnersRounds = Math.ceil(Math.log2(tournament.maxTeams));
      
      // Separate matches into winners and losers brackets
      const winnersMatches = new Map<number, any[]>();
      const losersMatches = new Map<number, any[]>();
      let grandFinalMatch = null;
      
      matches.forEach(match => {
        // Winners bracket matches (rounds 1 to totalWinnersRounds)
        if (match.round <= totalWinnersRounds) {
          if (!winnersMatches.has(match.round)) {
            winnersMatches.set(match.round, []);
          }
          winnersMatches.get(match.round)!.push(match);
        }
        // Losers bracket matches (rounds totalWinnersRounds + 1 to totalWinnersRounds * 2)
        else if (match.round <= totalWinnersRounds * 2) {
          const losersRound = match.round - totalWinnersRounds;
          if (!losersMatches.has(losersRound)) {
            losersMatches.set(losersRound, []);
          }
          losersMatches.get(losersRound)!.push(match);
        }
        // Grand final match (round totalWinnersRounds * 2 + 1)
        else if (match.round === totalWinnersRounds * 2 + 1) {
          grandFinalMatch = match;
        }
      });

      // Create winners bracket rounds
      const winnersRounds = [];
      
      for (let round = 1; round <= totalWinnersRounds; round++) {
        const roundMatches = winnersMatches.get(round) || [];
        
        let roundName;
        if (round === totalWinnersRounds) roundName = 'Winners Final';
        else if (round === totalWinnersRounds - 1) roundName = 'Winners Semifinal';
        else if (round === totalWinnersRounds - 2) roundName = 'Winners Quarterfinal';
        else roundName = `Winners Round ${round}`;

        winnersRounds.push({
          roundNumber: round,
          name: roundName,
          matches: roundMatches.map(match => ({
            id: match.id,
            round: match.round,
            matchNumber: match.matchNumber,
            score1: match.score1,
            score2: match.score2,
            team1: match.team1,
            team2: match.team2,
            winner: match.winner,
            isBye: false,
            nextMatchId: match.nextMatchId,
          })),
        });
      }

      // Create losers bracket rounds
      const losersRounds = [];
      const totalLosersRounds = totalWinnersRounds * 2 - 1;
      
      for (let round = 1; round <= totalLosersRounds; round++) {
        const roundMatches = losersMatches.get(round) || [];
        
        let roundName;
        if (round === totalLosersRounds) roundName = 'Losers Final';
        else if (round === totalLosersRounds - 1) roundName = 'Losers Semifinal';
        else if (round === totalLosersRounds - 2) roundName = 'Losers Quarterfinal';
        else roundName = `Losers Round ${round}`;

        losersRounds.push({
          roundNumber: round,
          name: roundName,
          matches: roundMatches.map(match => ({
            id: match.id,
            round: match.round,
            matchNumber: match.matchNumber,
            score1: match.score1,
            score2: match.score2,
            team1: match.team1,
            team2: match.team2,
            winner: match.winner,
            isBye: false,
            nextMatchId: match.nextMatchId,
          })),
        });
      }

      // Create grand final
      const grandFinal = grandFinalMatch ? {
        id: grandFinalMatch.id,
        round: grandFinalMatch.round,
        matchNumber: grandFinalMatch.matchNumber,
        score1: grandFinalMatch.score1,
        score2: grandFinalMatch.score2,
        team1: grandFinalMatch.team1,
        team2: grandFinalMatch.team2,
        winner: grandFinalMatch.winner,
        isBye: false,
        nextMatchId: grandFinalMatch.nextMatchId,
      } : {
        // Create a placeholder grand final match if it doesn't exist
        id: `grand-final-${tournamentId}`,
        round: totalWinnersRounds * 2 + 1,
        matchNumber: 1,
        score1: null,
        score2: null,
        team1: null, // Will be filled by winners bracket winner
        team2: null, // Will be filled by losers bracket winner
        winner: null,
        isBye: false,
        nextMatchId: null,
      };

      return NextResponse.json({
        bracket: {
          type: 'DOUBLE_ELIMINATION',
          bracket: {
            winnersBracket: { rounds: winnersRounds },
            losersBracket: { rounds: losersRounds },
            final: grandFinal,
          },
        },
        tournament: {
          id: tournament.id,
          bracketType: tournament.bracketType,
          maxTeams: tournament.maxTeams,
          status: tournament.status,
        },
      });
    } else if (tournament.bracketType === 'GROUP_STAGE') {
      // Group Stage bracket structure
      const groups = [];
      
      // Get all teams for this tournament
      const teams = await db.team.findMany({
        where: { tournamentId },
        select: {
          id: true,
          name: true,
          clanTag: true,
          logo: true,
        },
      });

      // Create groups (typically 2 groups for 8 teams)
      const teamsPerGroup = Math.ceil(teams.length / 2);
      
      // Group A
      const groupATeams = teams.slice(0, teamsPerGroup);
      const groupAMatches = matches.filter(match => match.round === 1);
      
      // Group B  
      const groupBTeams = teams.slice(teamsPerGroup);
      const groupBMatches = matches.filter(match => match.round === 2);

      if (groupATeams.length > 0) {
        groups.push({
          groupId: 'group-a',
          name: 'Group A',
          teams: groupATeams,
          matches: groupAMatches.map(match => ({
            id: match.id,
            round: match.round,
            matchNumber: match.matchNumber,
            score1: match.score1,
            score2: match.score2,
            team1: match.team1,
            team2: match.team2,
            winner: match.winner,
            isBye: false,
            nextMatchId: match.nextMatchId,
          })),
        });
      }

      if (groupBTeams.length > 0) {
        groups.push({
          groupId: 'group-b',
          name: 'Group B',
          teams: groupBTeams,
          matches: groupBMatches.map(match => ({
            id: match.id,
            round: match.round,
            matchNumber: match.matchNumber,
            score1: match.score1,
            score2: match.score2,
            team1: match.team1,
            team2: match.team2,
            winner: match.winner,
            isBye: false,
            nextMatchId: match.nextMatchId,
          })),
        });
      }

      return NextResponse.json({
        bracket: {
          type: 'GROUP_STAGE',
          bracket: {
            groups,
          },
        },
        tournament: {
          id: tournament.id,
          bracketType: tournament.bracketType,
          maxTeams: tournament.maxTeams,
          status: tournament.status,
        },
      });
    } else if (tournament.bracketType === 'LEADERBOARD') {
      // Leaderboard bracket structure
      const teams = await db.team.findMany({
        where: { tournamentId },
        select: {
          id: true,
          name: true,
          clanTag: true,
          logo: true,
        },
      });

      // Get all matches for this tournament
      const tournamentMatches = await db.match.findMany({
        where: {
          stage: {
            tournamentId,
          },
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

      // Calculate standings for each team
      const teamStats = new Map();

      // Initialize team stats
      teams.forEach(team => {
        teamStats.set(team.id, {
          team,
          score: 0,
          matchesPlayed: 0,
          wins: 0,
          losses: 0,
        });
      });

      // Calculate stats from matches
      tournamentMatches.forEach(match => {
        if (match.winner && match.team1 && match.team2) {
          const team1Stats = teamStats.get(match.team1.id);
          const team2Stats = teamStats.get(match.team2.id);

          if (team1Stats && team2Stats) {
            team1Stats.matchesPlayed++;
            team2Stats.matchesPlayed++;

            if (match.winner.id === match.team1.id) {
              team1Stats.wins++;
              team1Stats.score += 3; // 3 points for a win
              team2Stats.losses++;
            } else {
              team2Stats.wins++;
              team2Stats.score += 3; // 3 points for a win
              team1Stats.losses++;
            }
          }
        }
      });

      // Convert to array and sort by score, then by wins
      const standings = Array.from(teamStats.values()).sort((a: any, b: any) => {
        if (b.score !== a.score) {
          return b.score - a.score;
        }
        return b.wins - a.wins;
      });

      return NextResponse.json({
        bracket: {
          type: 'LEADERBOARD',
          bracket: {
            standings,
            matches: tournamentMatches.map(match => ({
              id: match.id,
              round: match.round,
              matchNumber: match.matchNumber,
              score1: match.score1,
              score2: match.score2,
              team1: match.team1,
              team2: match.team2,
              winner: match.winner,
              isBye: false,
              nextMatchId: match.nextMatchId,
            })),
          },
        },
        tournament: {
          id: tournament.id,
          bracketType: tournament.bracketType,
          maxTeams: tournament.maxTeams,
          status: tournament.status,
        },
      });
    } else {
      // Single elimination and other bracket types
      const matchesByRound = new Map<number, any[]>();
      
      matches.forEach(match => {
        if (!matchesByRound.has(match.round)) {
          matchesByRound.set(match.round, []);
        }
        matchesByRound.get(match.round)!.push(match);
      });

      const rounds = [];
      const maxRound = Math.max(...matchesByRound.keys(), 0);
      
      for (let round = 1; round <= maxRound; round++) {
        const roundMatches = matchesByRound.get(round) || [];
        
        let roundName;
        if (tournament.bracketType === 'SINGLE_ELIMINATION') {
          const totalRounds = Math.ceil(Math.log2(tournament.maxTeams));
          if (round === totalRounds) roundName = 'Final';
          else if (round === totalRounds - 1) roundName = 'Semifinal';
          else if (round === totalRounds - 2) roundName = 'Quarterfinal';
          else roundName = `Round ${round}`;
        } else {
          roundName = `Round ${round}`;
        }

        rounds.push({
          roundNumber: round,
          name: roundName,
          matches: roundMatches.map(match => ({
            id: match.id,
            round: match.round,
            matchNumber: match.matchNumber,
            score1: match.score1,
            score2: match.score2,
            team1: match.team1,
            team2: match.team2,
            winner: match.winner,
            isBye: false,
            nextMatchId: match.nextMatchId,
          })),
        });
      }

      return NextResponse.json({
        bracket: {
          type: tournament.bracketType,
          bracket: { rounds },
        },
        tournament: {
          id: tournament.id,
          bracketType: tournament.bracketType,
          maxTeams: tournament.maxTeams,
          status: tournament.status,
        },
      });
    }
  } catch (error) {
    console.error('Error fetching bracket data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bracket data' },
      { status: 500 }
    );
  }
}