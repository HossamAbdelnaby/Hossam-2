"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trophy, Users } from "lucide-react";
import { GroupStageBracket, BracketMatch } from "@/lib/bracket-data";

interface GroupStageBracketDisplayProps {
  bracket: GroupStageBracket;
  onMatchClick?: (match: BracketMatch) => void;
}

export function GroupStageBracketDisplay({ 
  bracket, 
  onMatchClick 
}: GroupStageBracketDisplayProps) {
  return (
    <div className="w-full">
      <Tabs defaultValue="groups" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="groups">Group Standings</TabsTrigger>
          <TabsTrigger value="matches">All Matches</TabsTrigger>
        </TabsList>
        
        <TabsContent value="groups" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {bracket.groups.map((group) => (
              <GroupStandingsCard 
                key={group.groupId} 
                group={group} 
              />
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="matches" className="mt-6">
          <div className="space-y-6">
            {bracket.groups.map((group) => (
              <Card key={group.groupId}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    {group.name} Matches
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {group.matches.map((match) => (
                      <GroupMatchCard 
                        key={match.id} 
                        match={match} 
                        groupName={group.name}
                        onClick={() => onMatchClick?.(match)}
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function GroupStandingsCard({ group }: { group: any }) {
  // Calculate standings based on match results
  const standings = calculateGroupStandings(group);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            {group.name}
          </span>
          <Badge variant="outline">{group.teams.length} teams</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">Pos</TableHead>
                <TableHead>Team</TableHead>
                <TableHead className="text-center">MP</TableHead>
                <TableHead className="text-center">W</TableHead>
                <TableHead className="text-center">L</TableHead>
                <TableHead className="text-center">Pts</TableHead>
                <TableHead className="text-center">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {standings.map((standing: any, index: number) => (
                <TableRow key={standing.team.id}>
                  <TableCell className="font-medium">
                    {index + 1}
                    {index < 2 && (
                      <Trophy className={`w-4 h-4 inline ml-1 ${
                        index === 0 ? 'text-yellow-500' : 'text-gray-400'
                      }`} />
                    )}
                  </TableCell>
                  <TableCell className="font-medium">{standing.team.name}</TableCell>
                  <TableCell className="text-center">{standing.matchesPlayed}</TableCell>
                  <TableCell className="text-center">{standing.wins}</TableCell>
                  <TableCell className="text-center">{standing.losses}</TableCell>
                  <TableCell className="text-center font-bold">{standing.points}</TableCell>
                  <TableCell className="text-center">
                    <Badge 
                      variant={
                        index < 2 ? "default" : 
                        standing.matchesPlayed === group.matches.length / 2 ? "secondary" : "outline"
                      }
                      className="text-xs"
                    >
                      {index < 2 ? "Qualified" : 
                       standing.matchesPlayed === group.matches.length / 2 ? "Eliminated" : "Active"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

function GroupMatchCard({ 
  match, 
  groupName, 
  onClick 
}: { 
  match: BracketMatch; 
  groupName: string;
  onClick?: () => void;
}) {
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
            {groupName}
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

// Helper function to calculate group standings
function calculateGroupStandings(group: any) {
  const teamStats = new Map();

  // Initialize team stats
  group.teams.forEach((team: any) => {
    teamStats.set(team.id, {
      team,
      matchesPlayed: 0,
      wins: 0,
      losses: 0,
      points: 0,
    });
  });

  // Calculate stats from matches
  group.matches.forEach((match: BracketMatch) => {
    if (match.winner && match.team1 && match.team2) {
      const team1Stats = teamStats.get(match.team1.id);
      const team2Stats = teamStats.get(match.team2.id);

      if (team1Stats && team2Stats) {
        team1Stats.matchesPlayed++;
        team2Stats.matchesPlayed++;

        if (match.winner.id === match.team1.id) {
          team1Stats.wins++;
          team1Stats.points += 3;
          team2Stats.losses++;
        } else {
          team2Stats.wins++;
          team2Stats.points += 3;
          team1Stats.losses++;
        }
      }
    }
  });

  // Sort by points, then by wins
  const standings = Array.from(teamStats.values()).sort((a: any, b: any) => {
    if (b.points !== a.points) {
      return b.points - a.points;
    }
    return b.wins - a.wins;
  });

  return standings;
}