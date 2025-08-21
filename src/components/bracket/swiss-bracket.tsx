"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trophy, TrendingUp } from "lucide-react";
import { SwissBracket, BracketMatch } from "@/lib/bracket-data";

interface SwissBracketDisplayProps {
  bracket: SwissBracket;
  onMatchClick?: (match: BracketMatch) => void;
}

export function SwissBracketDisplay({ bracket, onMatchClick }: SwissBracketDisplayProps) {
  return (
    <div className="w-full space-y-6">
      {/* Standings Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Tournament Standings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <SwissStandings bracket={bracket} />
        </CardContent>
      </Card>

      {/* Rounds */}
      <div className="space-y-6">
        {bracket.rounds.map((round, roundIndex) => (
          <Card key={round.roundNumber}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{round.name}</span>
                <Badge variant="outline">{round.matches.length} matches</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {round.matches.map((match) => (
                  <SwissMatchCard 
                    key={match.id} 
                    match={match} 
                    onClick={() => onMatchClick?.(match)}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function SwissStandings({ bracket }: { bracket: SwissBracket }) {
  // Calculate standings based on match results
  const standings = calculateSwissStandings(bracket);

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">Rank</TableHead>
            <TableHead>Team</TableHead>
            <TableHead className="text-center">Played</TableHead>
            <TableHead className="text-center">Wins</TableHead>
            <TableHead className="text-center">Losses</TableHead>
            <TableHead className="text-center">Score</TableHead>
            <TableHead className="text-center">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {standings.map((standing, index) => (
            <TableRow key={standing.team.id}>
              <TableCell className="font-medium">
                {index + 1}
                {index === 0 && <Trophy className="w-4 h-4 text-yellow-500 inline ml-1" />}
              </TableCell>
              <TableCell className="font-medium">{standing.team.name}</TableCell>
              <TableCell className="text-center">{standing.played}</TableCell>
              <TableCell className="text-center">{standing.wins}</TableCell>
              <TableCell className="text-center">{standing.losses}</TableCell>
              <TableCell className="text-center font-bold">{standing.score}</TableCell>
              <TableCell className="text-center">
                <Badge 
                  variant={standing.played === bracket.rounds.length ? "default" : "secondary"}
                  className="text-xs"
                >
                  {standing.played === bracket.rounds.length ? "Complete" : "Active"}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function SwissMatchCard({ match, onClick }: { match: BracketMatch; onClick?: () => void }) {
  const hasWinner = match.winner !== null;

  return (
    <Card 
      className="cursor-pointer transition-all hover:shadow-md"
      onClick={onClick}
    >
      <CardContent className="p-4">
        {/* Match Header */}
        <div className="flex items-center justify-between mb-3">
          <Badge variant="outline" className="text-xs">
            Round {match.round}
          </Badge>
          <Badge variant="outline" className="text-xs">
            Match {match.matchNumber}
          </Badge>
        </div>

        {/* Team 1 */}
        <div className={`mb-2 p-3 rounded-lg border ${
          match.winner?.id === match.team1?.id ? 'bg-green-100 border-green-300' : 'bg-gray-50'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <div className="font-medium">
                {match.team1?.name || 'TBD'}
              </div>
              <div className="text-sm text-muted-foreground">
                {getTeamStanding(match.team1?.id, match.round)}
              </div>
            </div>
            {match.score1 !== undefined && (
              <div className="ml-3 font-bold text-xl">
                {match.score1}
              </div>
            )}
          </div>
        </div>

        {/* Team 2 */}
        <div className={`mb-3 p-3 rounded-lg border ${
          match.winner?.id === match.team2?.id ? 'bg-green-100 border-green-300' : 'bg-gray-50'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <div className="font-medium">
                {match.team2?.name || 'TBD'}
              </div>
              <div className="text-sm text-muted-foreground">
                {getTeamStanding(match.team2?.id, match.round)}
              </div>
            </div>
            {match.score2 !== undefined && (
              <div className="ml-3 font-bold text-xl">
                {match.score2}
              </div>
            )}
          </div>
        </div>

        {/* Winner Display */}
        {hasWinner && (
          <div className="flex items-center justify-center text-green-700 font-medium text-sm">
            <Trophy className="w-4 h-4 mr-1" />
            {match.winner?.name}
          </div>
        )}

        {/* VS indicator when no winner yet */}
        {!hasWinner && match.team1 && match.team2 && (
          <div className="flex items-center justify-center text-gray-500 text-sm">
            VS
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Helper functions for Swiss bracket calculations
function calculateSwissStandings(bracket: SwissBracket) {
  const teamStats = new Map();

  // Initialize team stats
  bracket.rounds.forEach(round => {
    round.matches.forEach(match => {
      if (match.team1) {
        if (!teamStats.has(match.team1.id)) {
          teamStats.set(match.team1.id, {
            team: match.team1,
            played: 0,
            wins: 0,
            losses: 0,
            score: 0,
          });
        }
      }
      if (match.team2) {
        if (!teamStats.has(match.team2.id)) {
          teamStats.set(match.team2.id, {
            team: match.team2,
            played: 0,
            wins: 0,
            losses: 0,
            score: 0,
          });
        }
      }
    });
  });

  // Calculate stats from matches
  bracket.rounds.forEach(round => {
    round.matches.forEach(match => {
      if (match.winner && match.team1 && match.team2) {
        const team1Stats = teamStats.get(match.team1.id);
        const team2Stats = teamStats.get(match.team2.id);

        if (team1Stats && team2Stats) {
          team1Stats.played++;
          team2Stats.played++;

          if (match.winner.id === match.team1.id) {
            team1Stats.wins++;
            team1Stats.score += 3;
            team2Stats.losses++;
          } else {
            team2Stats.wins++;
            team2Stats.score += 3;
            team1Stats.losses++;
          }
        }
      }
    });
  });

  // Sort by score, then by wins
  const standings = Array.from(teamStats.values()).sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    return b.wins - a.wins;
  });

  return standings;
}

function getTeamStanding(teamId: string | undefined, currentRound: number): string {
  if (!teamId) return '';
  // This would need more complex logic to track team standings across rounds
  // For now, return a placeholder
  return `Current Round`;
}