import { db } from '@/lib/db';

export interface BracketMatch {
  id: string;
  round: number;
  matchNumber: number;
  score1?: number;
  score2?: number;
  team1?: {
    id: string;
    name: string;
  } | null;
  team2?: {
    id: string;
    name: string;
  } | null;
  winner?: {
    id: string;
    name: string;
  } | null;
  nextMatchId?: string;
  isBye?: boolean;
}

export interface BracketRound {
  roundNumber: number;
  name: string;
  matches: BracketMatch[];
}

export interface WinnersBracket {
  rounds: BracketRound[];
}

export interface LosersBracket {
  rounds: BracketRound[];
}

export interface DoubleEliminationBracket {
  winnersBracket: WinnersBracket;
  losersBracket: LosersBracket;
  final?: BracketMatch;
}

export interface SwissBracket {
  rounds: BracketRound[];
}

export interface GroupStageBracket {
  groups: {
    groupId: string;
    name: string;
    teams: Array<{
      id: string;
      name: string;
      matches: number;
      wins: number;
      losses: number;
      points: number;
    }>;
    matches: BracketMatch[];
  }[];
}

export interface LeaderboardBracket {
  standings: Array<{
    rank: number;
    team: {
      id: string;
      name: string;
    };
    score: number;
    matchesPlayed: number;
    wins: number;
  }>;
}

export type BracketData = 
  | { type: 'SINGLE_ELIMINATION'; bracket: { rounds: BracketRound[] } }
  | { type: 'DOUBLE_ELIMINATION'; bracket: DoubleEliminationBracket }
  | { type: 'SWISS'; bracket: SwissBracket }
  | { type: 'GROUP_STAGE'; bracket: GroupStageBracket }
  | { type: 'LEADERBOARD'; bracket: LeaderboardBracket };

/**
 * Generate bracket structure based on tournament type and team count
 */
export async function generateBracketStructure(
  tournamentId: string,
  bracketType: string,
  maxTeams: number
): Promise<BracketData> {
  const teams = await db.team.findMany({
    where: { tournamentId },
    include: {
      _count: {
        select: { players: true },
      },
    },
    orderBy: { createdAt: 'asc' },
  });

  const actualTeamCount = teams.length;

  switch (bracketType) {
    case 'SINGLE_ELIMINATION':
      return generateSingleEliminationBracket(teams, actualTeamCount, maxTeams);
    case 'DOUBLE_ELIMINATION':
      return generateDoubleEliminationBracket(teams, actualTeamCount, maxTeams);
    case 'SWISS':
      return generateSwissBracket(teams, actualTeamCount);
    case 'GROUP_STAGE':
      return generateGroupStageBracket(teams, actualTeamCount);
    case 'LEADERBOARD':
      return generateLeaderboardBracket(teams, actualTeamCount);
    default:
      throw new Error(`Unsupported bracket type: ${bracketType}`);
  }
}

/**
 * Generate single elimination bracket structure
 */
function generateSingleEliminationBracket(
  teams: any[],
  actualTeamCount: number,
  maxTeams: number
): BracketData {
  const rounds: BracketRound[] = [];
  const totalRounds = Math.ceil(Math.log2(maxTeams));
  
  // For 8 teams: Quarterfinals (4 matches) -> Semifinals (2 matches) -> Final (1 match)
  if (maxTeams === 8) {
    // Quarterfinals (Round 1)
    const quarterfinals: BracketMatch[] = [
      { id: 'match-1', round: 1, matchNumber: 1, team1: null, team2: null, winner: null, isBye: false, nextMatchId: 'match-5' },
      { id: 'match-2', round: 1, matchNumber: 2, team1: null, team2: null, winner: null, isBye: false, nextMatchId: 'match-5' },
      { id: 'match-3', round: 1, matchNumber: 3, team1: null, team2: null, winner: null, isBye: false, nextMatchId: 'match-6' },
      { id: 'match-4', round: 1, matchNumber: 4, team1: null, team2: null, winner: null, isBye: false, nextMatchId: 'match-6' },
    ];
    
    // Semifinals (Round 2)
    const semifinals: BracketMatch[] = [
      { id: 'match-5', round: 2, matchNumber: 1, team1: null, team2: null, winner: null, isBye: false, nextMatchId: 'match-7' },
      { id: 'match-6', round: 2, matchNumber: 2, team1: null, team2: null, winner: null, isBye: false, nextMatchId: 'match-7' },
    ];
    
    // Final (Round 3)
    const final: BracketMatch[] = [
      { id: 'match-7', round: 3, matchNumber: 1, team1: null, team2: null, winner: null, isBye: false, nextMatchId: undefined },
    ];
    
    rounds.push(
      { roundNumber: 1, name: 'Quarterfinal', matches: quarterfinals },
      { roundNumber: 2, name: 'Semifinal', matches: semifinals },
      { roundNumber: 3, name: 'Final', matches: final }
    );
  } else {
    // Generic bracket generation for other sizes
    let matchIdCounter = 1;
    let currentRoundMatches = Math.ceil(maxTeams / 2);
    
    for (let round = 1; round <= totalRounds; round++) {
      const matches: BracketMatch[] = [];
      const roundName = getRoundName(round, totalRounds, 'SINGLE_ELIMINATION');
      
      for (let i = 0; i < currentRoundMatches; i++) {
        const isBye = round === 1 && (i * 2 + 1) > actualTeamCount;
        
        matches.push({
          id: `match-${matchIdCounter++}`,
          round,
          matchNumber: i + 1,
          team1: null,
          team2: null,
          winner: null,
          isBye,
          nextMatchId: round < totalRounds ? `match-${matchIdCounter + Math.floor(i / 2)}` : undefined,
        });
      }
      
      rounds.push({
        roundNumber: round,
        name: roundName,
        matches,
      });
      
      currentRoundMatches = Math.ceil(currentRoundMatches / 2);
    }
  }
  
  // Assign teams to first round
  assignTeamsToFirstRound(rounds[0].matches, teams);
  
  return {
    type: 'SINGLE_ELIMINATION',
    bracket: { rounds },
  };
}

/**
 * Generate double elimination bracket structure
 */
function generateDoubleEliminationBracket(
  teams: any[],
  actualTeamCount: number,
  maxTeams: number
): BracketData {
  const winnersRounds: BracketRound[] = [];
  const losersRounds: BracketRound[] = [];
  const totalWinnersRounds = Math.ceil(Math.log2(maxTeams));
  
  // Generate winners bracket (similar to single elimination)
  const winnersBracket = generateSingleEliminationBracket(teams, actualTeamCount, maxTeams);
  const winnersBracketRounds = winnersBracket.bracket.rounds;
  
  // Generate losers bracket
  let matchIdCounter = 1000; // Start losers bracket matches from 1000
  
  for (let round = 1; round < totalWinnersRounds * 2 - 1; round++) {
    const matches: BracketMatch[] = [];
    const roundName = getRoundName(round, totalWinnersRounds * 2 - 1, 'DOUBLE_ELIMINATION_LOSERS');
    
    const matchesInRound = round === 1 ? Math.floor(maxTeams / 4) : Math.floor(maxTeams / Math.pow(2, Math.ceil(round / 2) + 1));
    
    for (let i = 0; i < matchesInRound; i++) {
      matches.push({
        id: `losers-match-${matchIdCounter++}`,
        round,
        matchNumber: i + 1,
        team1: null,
        team2: null,
        winner: null,
      });
    }
    
    losersRounds.push({
      roundNumber: round,
      name: roundName,
      matches,
    });
  }
  
  // Grand final match
  const grandFinal: BracketMatch = {
    id: 'grand-final',
    round: totalWinnersRounds * 2,
    matchNumber: 1,
    team1: null,
    team2: null,
    winner: null,
  };
  
  return {
    type: 'DOUBLE_ELIMINATION',
    bracket: {
      winnersBracket: { rounds: winnersBracketRounds },
      losersBracket: { rounds: losersRounds },
      final: grandFinal,
    },
  };
}

/**
 * Generate Swiss bracket structure
 */
function generateSwissBracket(teams: any[], actualTeamCount: number): BracketData {
  const rounds: BracketRound[] = [];
  const totalRounds = Math.min(5, Math.ceil(Math.log2(actualTeamCount)) + 2); // Typically 5 rounds or log2(n) + 2
  
  let matchIdCounter = 1;
  
  for (let round = 1; round <= totalRounds; round++) {
    const matches: BracketMatch[] = [];
    const matchesInRound = Math.floor(actualTeamCount / 2);
    
    for (let i = 0; i < matchesInRound; i++) {
      matches.push({
        id: `swiss-match-${matchIdCounter++}`,
        round,
        matchNumber: i + 1,
        team1: null,
        team2: null,
        winner: null,
      });
    }
    
    rounds.push({
      roundNumber: round,
      name: `Round ${round}`,
      matches,
    });
  }
  
  return {
    type: 'SWISS',
    bracket: { rounds },
  };
}

/**
 * Generate group stage bracket structure
 */
function generateGroupStageBracket(teams: any[], actualTeamCount: number): BracketData {
  const groups: any[] = [];
  const teamsPerGroup = 4;
  const numberOfGroups = Math.ceil(actualTeamCount / teamsPerGroup);
  
  let matchIdCounter = 1;
  
  for (let groupIndex = 0; groupIndex < numberOfGroups; groupIndex++) {
    const groupTeams = teams.slice(groupIndex * teamsPerGroup, (groupIndex + 1) * teamsPerGroup);
    const matches: BracketMatch[] = [];
    
    // Generate round-robin matches for the group
    for (let i = 0; i < groupTeams.length; i++) {
      for (let j = i + 1; j < groupTeams.length; j++) {
        matches.push({
          id: `group-${groupIndex + 1}-match-${matchIdCounter++}`,
          round: 1,
          matchNumber: matches.length + 1,
          team1: { id: groupTeams[i].id, name: groupTeams[i].name },
          team2: { id: groupTeams[j].id, name: groupTeams[j].name },
          winner: null,
        });
      }
    }
    
    groups.push({
      groupId: `group-${groupIndex + 1}`,
      name: `Group ${groupIndex + 1}`,
      teams: groupTeams.map((team: any) => ({
        id: team.id,
        name: team.name,
        matches: 0,
        wins: 0,
        losses: 0,
        points: 0,
      })),
      matches,
    });
  }
  
  return {
    type: 'GROUP_STAGE',
    bracket: { groups },
  };
}

/**
 * Generate leaderboard bracket structure
 */
function generateLeaderboardBracket(teams: any[], actualTeamCount: number): BracketData {
  const standings = teams.map((team, index) => ({
    rank: index + 1,
    team: {
      id: team.id,
      name: team.name,
    },
    score: 0,
    matchesPlayed: 0,
    wins: 0,
  }));
  
  return {
    type: 'LEADERBOARD',
    bracket: { standings },
  };
}

/**
 * Assign teams to first round matches
 */
export function assignTeamsToFirstRound(matches: BracketMatch[], teams: any[]): void {
  teams.forEach((team, index) => {
    const matchIndex = Math.floor(index / 2);
    if (matchIndex < matches.length) {
      const match = matches[matchIndex];
      if (index % 2 === 0) {
        match.team1 = { id: team.id, name: team.name };
      } else {
        match.team2 = { id: team.id, name: team.name };
      }
    }
  });
}

/**
 * Get round name based on round number and bracket type
 */
function getRoundName(round: number, totalRounds: number, bracketType: string): string {
  if (bracketType === 'DOUBLE_ELIMINATION_LOSERS') {
    return `Losers Round ${round}`;
  }
  
  if (round === totalRounds) {
    return 'Final';
  }
  
  if (round === totalRounds - 1) {
    return 'Semifinal';
  }
  
  if (round === totalRounds - 2) {
    return 'Quarterfinal';
  }
  
  if (round === 1) {
    return 'Round 1';
  }
  
  return `Round ${round}`;
}

/**
 * Update bracket with actual match data from database
 */
export async function updateBracketWithMatchData(
  bracketData: BracketData,
  tournamentId: string
): Promise<BracketData> {
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
      nextMatch: {
        select: {
          id: true,
        },
      },
    },
    orderBy: [
      { round: 'asc' },
      { matchNumber: 'asc' },
    ],
  });

  // Create a map of match IDs to match data
  const matchMap = new Map();
  matches.forEach(match => {
    matchMap.set(match.id, match);
  });

  // Update bracket data with actual match information
  switch (bracketData.type) {
    case 'SINGLE_ELIMINATION':
      return updateSingleEliminationMatches(bracketData, matchMap);
    case 'DOUBLE_ELIMINATION':
      return updateDoubleEliminationMatches(bracketData, matchMap);
    case 'SWISS':
      return updateSwissMatches(bracketData, matchMap);
    case 'GROUP_STAGE':
      return updateGroupStageMatches(bracketData, matchMap);
    case 'LEADERBOARD':
      return updateLeaderboardMatches(bracketData, matchMap);
    default:
      return bracketData;
  }
}

function updateSingleEliminationMatches(
  bracketData: BracketData,
  matchMap: Map<string, any>
): BracketData {
  if (bracketData.type !== 'SINGLE_ELIMINATION') return bracketData;

  const updatedRounds = bracketData.bracket.rounds.map(round => ({
    ...round,
    matches: round.matches.map(match => {
      const dbMatch = matchMap.get(match.id);
      if (dbMatch) {
        return {
          ...match,
          score1: dbMatch.score1,
          score2: dbMatch.score2,
          team1: dbMatch.team1,
          team2: dbMatch.team2,
          winner: dbMatch.winner,
          nextMatchId: dbMatch.nextMatchId,
        };
      }
      return match;
    }),
  }));

  return {
    ...bracketData,
    bracket: { rounds: updatedRounds },
  };
}

function updateDoubleEliminationMatches(
  bracketData: BracketData,
  matchMap: Map<string, any>
): BracketData {
  if (bracketData.type !== 'DOUBLE_ELIMINATION') return bracketData;

  const updateRoundMatches = (rounds: BracketRound[]) =>
    rounds.map(round => ({
      ...round,
      matches: round.matches.map(match => {
        const dbMatch = matchMap.get(match.id);
        if (dbMatch) {
          return {
            ...match,
            score1: dbMatch.score1,
            score2: dbMatch.score2,
            team1: dbMatch.team1,
            team2: dbMatch.team2,
            winner: dbMatch.winner,
          };
        }
        return match;
      }),
    }));

  const updatedWinnersBracket = {
    rounds: updateRoundMatches(bracketData.bracket.winnersBracket.rounds),
  };

  const updatedLosersBracket = {
    rounds: updateRoundMatches(bracketData.bracket.losersBracket.rounds),
  };

  let updatedFinal = bracketData.bracket.final;
  if (updatedFinal) {
    const dbMatch = matchMap.get(updatedFinal.id);
    if (dbMatch) {
      updatedFinal = {
        ...updatedFinal,
        score1: dbMatch.score1,
        score2: dbMatch.score2,
        team1: dbMatch.team1,
        team2: dbMatch.team2,
        winner: dbMatch.winner,
      };
    }
  }

  return {
    ...bracketData,
    bracket: {
      winnersBracket: updatedWinnersBracket,
      losersBracket: updatedLosersBracket,
      final: updatedFinal,
    },
  };
}

function updateSwissMatches(
  bracketData: BracketData,
  matchMap: Map<string, any>
): BracketData {
  if (bracketData.type !== 'SWISS') return bracketData;

  const updatedRounds = bracketData.bracket.rounds.map(round => ({
    ...round,
    matches: round.matches.map(match => {
      const dbMatch = matchMap.get(match.id);
      if (dbMatch) {
        return {
          ...match,
          score1: dbMatch.score1,
          score2: dbMatch.score2,
          team1: dbMatch.team1,
          team2: dbMatch.team2,
          winner: dbMatch.winner,
        };
      }
      return match;
    }),
  }));

  return {
    ...bracketData,
    bracket: { rounds: updatedRounds },
  };
}

function updateGroupStageMatches(
  bracketData: BracketData,
  matchMap: Map<string, any>
): BracketData {
  if (bracketData.type !== 'GROUP_STAGE') return bracketData;

  const updatedGroups = bracketData.bracket.groups.map(group => ({
    ...group,
    matches: group.matches.map(match => {
      const dbMatch = matchMap.get(match.id);
      if (dbMatch) {
        return {
          ...match,
          score1: dbMatch.score1,
          score2: dbMatch.score2,
          team1: dbMatch.team1,
          team2: dbMatch.team2,
          winner: dbMatch.winner,
        };
      }
      return match;
    }),
  }));

  return {
    ...bracketData,
    bracket: { groups: updatedGroups },
  };
}

function updateLeaderboardMatches(
  bracketData: BracketData,
  matchMap: Map<string, any>
): BracketData {
  if (bracketData.type !== 'LEADERBOARD') return bracketData;

  // For leaderboard, we need to calculate standings based on match results
  // This would require additional logic to compute scores and rankings
  // For now, return the original bracket data
  return bracketData;
}