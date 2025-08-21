import { BracketType, Match, TournamentStage, Team } from '@prisma/client';

export interface BracketMatch {
  id: string;
  round: number;
  matchNumber: number;
  team1?: Team | null;
  team2?: Team | null;
  winner?: Team | null;
  score1?: number | null;
  score2?: number | null;
  nextMatchId?: string | null;
  isFinal: boolean;
}

export interface BracketRound {
  roundNumber: number;
  name: string;
  matches: BracketMatch[];
}

export interface SingleEliminationBracket {
  type: 'SINGLE_ELIMINATION';
  rounds: BracketRound[];
  finalMatch?: BracketMatch;
}

export interface DoubleEliminationBracket {
  type: 'DOUBLE_ELIMINATION';
  winnersBracket: BracketRound[];
  losersBracket: BracketRound[];
  grandFinal?: BracketMatch;
}

export interface SwissBracket {
  type: 'SWISS';
  rounds: BracketRound[];
}

export interface GroupStageBracket {
  type: 'GROUP_STAGE';
  groups: {
    groupName: string;
    teams: Team[];
    matches: BracketMatch[];
  }[];
}

export interface LeaderboardBracket {
  type: 'LEADERBOARD';
  standings: {
    rank: number;
    team: Team;
    score: number;
    matches: number;
    wins: number;
    losses: number;
  }[];
}

export type TournamentBracket = 
  | SingleEliminationBracket 
  | DoubleEliminationBracket 
  | SwissBracket 
  | GroupStageBracket 
  | LeaderboardBracket;

/**
 * Calculate the next power of 2 for bracket sizing
 */
export function getNextPowerOf2(n: number): number {
  return Math.pow(2, Math.ceil(Math.log2(n)));
}

/**
 * Calculate the number of byes needed for a bracket
 */
export function getByesCount(teamCount: number): number {
  const nextPower = getNextPowerOf2(teamCount);
  return nextPower - teamCount;
}

/**
 * Generate single elimination bracket structure
 */
export function generateSingleEliminationBracket(
  teams: Team[],
  existingMatches: Match[] = []
): SingleEliminationBracket {
  const teamCount = teams.length;
  const bracketSize = getNextPowerOf2(teamCount);
  const rounds = Math.log2(bracketSize);
  const byes = getByesCount(teamCount);

  // Create rounds structure
  const bracketRounds: BracketRound[] = [];
  
  // Generate matches for each round
  for (let round = 0; round < rounds; round++) {
    const matchesInRound = bracketSize / Math.pow(2, round + 1);
    const roundMatches: BracketMatch[] = [];
    
    for (let matchNum = 0; matchNum < matchesInRound; matchNum++) {
      const matchId = `round_${round}_match_${matchNum}`;
      const existingMatch = existingMatches.find(m => 
        m.round === round && m.matchNumber === matchNum
      );
      
      roundMatches.push({
        id: existingMatch?.id || matchId,
        round,
        matchNumber: matchNum,
        team1: existingMatch?.team1Id ? teams.find(t => t.id === existingMatch.team1Id) : null,
        team2: existingMatch?.team2Id ? teams.find(t => t.id === existingMatch.team2Id) : null,
        winner: existingMatch?.winnerId ? teams.find(t => t.id === existingMatch.winnerId) : null,
        score1: existingMatch?.score1,
        score2: existingMatch?.score2,
        nextMatchId: round < rounds - 1 ? `round_${round + 1}_match_${Math.floor(matchNum / 2)}` : undefined,
        isFinal: round === rounds - 1
      });
    }
    
    bracketRounds.push({
      roundNumber: round + 1,
      name: getRoundName(round + 1, rounds),
      matches: roundMatches
    });
  }

  return {
    type: 'SINGLE_ELIMINATION',
    rounds: bracketRounds,
    finalMatch: bracketRounds[bracketRounds.length - 1]?.matches[0]
  };
}

/**
 * Generate double elimination bracket structure
 */
export function generateDoubleEliminationBracket(
  teams: Team[],
  existingMatches: Match[] = []
): DoubleEliminationBracket {
  const teamCount = teams.length;
  const bracketSize = getNextPowerOf2(teamCount);
  const rounds = Math.log2(bracketSize);

  // Winners Bracket
  const winnersBracket: BracketRound[] = [];
  for (let round = 0; round < rounds; round++) {
    const matchesInRound = bracketSize / Math.pow(2, round + 1);
    const roundMatches: BracketMatch[] = [];
    
    for (let matchNum = 0; matchNum < matchesInRound; matchNum++) {
      const existingMatch = existingMatches.find(m => 
        m.round === round && m.matchNumber === matchNum
      );
      
      roundMatches.push({
        id: existingMatch?.id || `wb_round_${round}_match_${matchNum}`,
        round,
        matchNumber: matchNum,
        team1: existingMatch?.team1Id ? teams.find(t => t.id === existingMatch.team1Id) : null,
        team2: existingMatch?.team2Id ? teams.find(t => t.id === existingMatch.team2Id) : null,
        winner: existingMatch?.winnerId ? teams.find(t => t.id === existingMatch.winnerId) : null,
        score1: existingMatch?.score1,
        score2: existingMatch?.score2,
        isFinal: round === rounds - 1
      });
    }
    
    winnersBracket.push({
      roundNumber: round + 1,
      name: `Winners Round ${round + 1}`,
      matches: roundMatches
    });
  }

  // Losers Bracket (simplified - would be more complex in reality)
  const losersBracket: BracketRound[] = [];
  for (let round = 0; round < rounds * 2 - 1; round++) {
    const matchesInRound = Math.max(1, bracketSize / Math.pow(2, Math.floor(round / 2) + 1));
    const roundMatches: BracketMatch[] = [];
    
    for (let matchNum = 0; matchNum < matchesInRound; matchNum++) {
      const existingMatch = existingMatches.find(m => 
        m.round === rounds + round && m.matchNumber === matchNum
      );
      
      roundMatches.push({
        id: existingMatch?.id || `lb_round_${round}_match_${matchNum}`,
        round: rounds + round,
        matchNumber: matchNum,
        team1: existingMatch?.team1Id ? teams.find(t => t.id === existingMatch.team1Id) : null,
        team2: existingMatch?.team2Id ? teams.find(t => t.id === existingMatch.team2Id) : null,
        winner: existingMatch?.winnerId ? teams.find(t => t.id === existingMatch.winnerId) : null,
        score1: existingMatch?.score1,
        score2: existingMatch?.score2,
        isFinal: round === rounds * 2 - 2
      });
    }
    
    losersBracket.push({
      roundNumber: round + 1,
      name: `Losers Round ${round + 1}`,
      matches: roundMatches
    });
  }

  // Grand Final
  const grandFinalMatch = existingMatches.find(m => m.round === rounds * 3);
  const grandFinal: BracketMatch = {
    id: grandFinalMatch?.id || 'grand_final',
    round: rounds * 3,
    matchNumber: 0,
    team1: grandFinalMatch?.team1Id ? teams.find(t => t.id === grandFinalMatch.team1Id) : null,
    team2: grandFinalMatch?.team2Id ? teams.find(t => t.id === grandFinalMatch.team2Id) : null,
    winner: grandFinalMatch?.winnerId ? teams.find(t => t.id === grandFinalMatch.winnerId) : null,
    score1: grandFinalMatch?.score1,
    score2: grandFinalMatch?.score2,
    isFinal: true
  };

  return {
    type: 'DOUBLE_ELIMINATION',
    winnersBracket,
    losersBracket,
    grandFinal
  };
}

/**
 * Generate Swiss bracket structure
 */
export function generateSwissBracket(
  teams: Team[],
  existingMatches: Match[] = [],
  rounds: number = 5
): SwissBracket {
  const bracketRounds: BracketRound[] = [];

  for (let round = 0; round < rounds; round++) {
    const roundMatches: BracketMatch[] = [];
    const roundMatchesCount = Math.floor(teams.length / 2);
    
    for (let matchNum = 0; matchNum < roundMatchesCount; matchNum++) {
      const existingMatch = existingMatches.find(m => 
        m.round === round && m.matchNumber === matchNum
      );
      
      roundMatches.push({
        id: existingMatch?.id || `swiss_round_${round}_match_${matchNum}`,
        round,
        matchNumber: matchNum,
        team1: existingMatch?.team1Id ? teams.find(t => t.id === existingMatch.team1Id) : null,
        team2: existingMatch?.team2Id ? teams.find(t => t.id === existingMatch.team2Id) : null,
        winner: existingMatch?.winnerId ? teams.find(t => t.id === existingMatch.winnerId) : null,
        score1: existingMatch?.score1,
        score2: existingMatch?.score2,
        isFinal: round === rounds - 1 && matchNum === roundMatchesCount - 1
      });
    }
    
    bracketRounds.push({
      roundNumber: round + 1,
      name: `Swiss Round ${round + 1}`,
      matches: roundMatches
    });
  }

  return {
    type: 'SWISS',
    rounds: bracketRounds
  };
}

/**
 * Generate Group Stage bracket structure
 */
export function generateGroupStageBracket(
  teams: Team[],
  existingMatches: Match[] = [],
  groupsCount: number = 4
): GroupStageBracket {
  const teamsPerGroup = Math.ceil(teams.length / groupsCount);
  const groups: GroupStageBracket['groups'] = [];

  for (let groupIndex = 0; groupIndex < groupsCount; groupIndex++) {
    const startIdx = groupIndex * teamsPerGroup;
    const endIdx = Math.min(startIdx + teamsPerGroup, teams.length);
    const groupTeams = teams.slice(startIdx, endIdx);
    
    const groupMatches: BracketMatch[] = [];
    
    // Generate round-robin matches for the group
    for (let i = 0; i < groupTeams.length; i++) {
      for (let j = i + 1; j < groupTeams.length; j++) {
        const existingMatch = existingMatches.find(m => 
          m.round === groupIndex && 
          ((m.team1Id === groupTeams[i].id && m.team2Id === groupTeams[j].id) ||
           (m.team1Id === groupTeams[j].id && m.team2Id === groupTeams[i].id))
        );
        
        groupMatches.push({
          id: existingMatch?.id || `group_${groupIndex}_match_${i}_${j}`,
          round: groupIndex,
          matchNumber: groupMatches.length,
          team1: existingMatch?.team1Id === groupTeams[i].id ? groupTeams[i] : groupTeams[j],
          team2: existingMatch?.team2Id === groupTeams[j].id ? groupTeams[j] : groupTeams[i],
          winner: existingMatch?.winnerId ? teams.find(t => t.id === existingMatch.winnerId) : null,
          score1: existingMatch?.score1,
          score2: existingMatch?.score2,
          isFinal: false
        });
      }
    }
    
    groups.push({
      groupName: `Group ${String.fromCharCode(65 + groupIndex)}`,
      teams: groupTeams,
      matches: groupMatches
    });
  }

  return {
    type: 'GROUP_STAGE',
    groups
  };
}

/**
 * Generate Leaderboard bracket structure
 */
export function generateLeaderboardBracket(
  teams: Team[],
  existingMatches: Match[] = []
): LeaderboardBracket {
  const standings = teams.map(team => {
    const teamMatches = existingMatches.filter(m => 
      m.team1Id === team.id || m.team2Id === team.id
    );
    
    const wins = teamMatches.filter(m => 
      (m.team1Id === team.id && m.winnerId === team.id) ||
      (m.team2Id === team.id && m.winnerId === team.id)
    ).length;
    
    const losses = teamMatches.filter(m => 
      (m.team1Id === team.id && m.winnerId !== team.id && m.winnerId !== null) ||
      (m.team2Id === team.id && m.winnerId !== team.id && m.winnerId !== null)
    ).length;
    
    const score = wins * 3 + (teamMatches.length - wins - losses); // 3 points for win, 1 for draw
    
    return {
      rank: 0, // Will be calculated after sorting
      team,
      score,
      matches: teamMatches.length,
      wins,
      losses
    };
  });

  // Sort by score, then by wins, then by team name
  standings.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (b.wins !== a.wins) return b.wins - a.wins;
    return a.team.name.localeCompare(b.team.name);
  });

  // Assign ranks
  standings.forEach((standing, index) => {
    standing.rank = index + 1;
  });

  return {
    type: 'LEADERBOARD',
    standings
  };
}

/**
 * Generate bracket based on tournament type
 */
export function generateBracket(
  bracketType: BracketType,
  teams: Team[],
  existingMatches: Match[] = [],
  options?: {
    rounds?: number;
    groupsCount?: number;
  }
): TournamentBracket {
  switch (bracketType) {
    case 'SINGLE_ELIMINATION':
      return generateSingleEliminationBracket(teams, existingMatches);
    
    case 'DOUBLE_ELIMINATION':
      return generateDoubleEliminationBracket(teams, existingMatches);
    
    case 'SWISS':
      return generateSwissBracket(teams, existingMatches, options?.rounds);
    
    case 'GROUP_STAGE':
      return generateGroupStageBracket(teams, existingMatches, options?.groupsCount);
    
    case 'LEADERBOARD':
      return generateLeaderboardBracket(teams, existingMatches);
    
    default:
      throw new Error(`Unsupported bracket type: ${bracketType}`);
  }
}

/**
 * Get round name based on round number and total rounds
 */
function getRoundName(round: number, totalRounds: number): string {
  if (round === totalRounds) return 'Final';
  if (round === totalRounds - 1) return 'Semi-Final';
  if (round === totalRounds - 2) return 'Quarter-Final';
  if (round <= 3) return `Round ${round}`;
  return `Round of ${Math.pow(2, totalRounds - round + 1)}`;
}