"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Trophy, TrendingUp, Medal, Award } from "lucide-react";
import { LeaderboardBracket, BracketMatch } from "@/lib/bracket-data";

interface LeaderboardBracketDisplayProps {
  bracket: LeaderboardBracket;
  onMatchClick?: (match: BracketMatch) => void;
}

export function LeaderboardBracketDisplay({ 
  bracket, 
  onMatchClick 
}: LeaderboardBracketDisplayProps) {
  return (
    <div className="w-full space-y-6">
      {/* Top 3 Podium */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5" />
            Tournament Leaders
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center items-end gap-8 py-6">
            {/* 2nd Place */}
            {bracket.standings[1] && (
              <div className="flex flex-col items-center">
                <div className="text-center mb-2">
                  <Medal className="w-8 h-8 text-gray-400 mx-auto mb-1" />
                  <div className="text-lg font-bold">2nd</div>
                </div>
                <Card className="w-32 h-24 bg-gray-100 border-2 border-gray-300">
                  <CardContent className="p-3 flex flex-col items-center justify-center h-full">
                    <div className="font-semibold text-sm text-center truncate w-full">
                      {bracket.standings[1].team.name}
                    </div>
                    <div className="text-lg font-bold text-gray-600">
                      {bracket.standings[1].score}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* 1st Place */}
            {bracket.standings[0] && (
              <div className="flex flex-col items-center -mt-4">
                <div className="text-center mb-2">
                  <Trophy className="w-10 h-10 text-yellow-500 mx-auto mb-1" />
                  <div className="text-xl font-bold">1st</div>
                </div>
                <Card className="w-36 h-28 bg-yellow-50 border-4 border-yellow-400">
                  <CardContent className="p-3 flex flex-col items-center justify-center h-full">
                    <div className="font-bold text-center truncate w-full">
                      {bracket.standings[0].team.name}
                    </div>
                    <div className="text-2xl font-bold text-yellow-600">
                      {bracket.standings[0].score}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* 3rd Place */}
            {bracket.standings[2] && (
              <div className="flex flex-col items-center">
                <div className="text-center mb-2">
                  <Award className="w-8 h-8 text-orange-600 mx-auto mb-1" />
                  <div className="text-lg font-bold">3rd</div>
                </div>
                <Card className="w-32 h-20 bg-orange-50 border-2 border-orange-300">
                  <CardContent className="p-3 flex flex-col items-center justify-center h-full">
                    <div className="font-semibold text-sm text-center truncate w-full">
                      {bracket.standings[2].team.name}
                    </div>
                    <div className="text-lg font-bold text-orange-600">
                      {bracket.standings[2].score}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Full Standings Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Complete Standings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">Rank</TableHead>
                  <TableHead>Team</TableHead>
                  <TableHead className="text-center">Score</TableHead>
                  <TableHead className="text-center">Matches</TableHead>
                  <TableHead className="text-center">Wins</TableHead>
                  <TableHead className="text-center">Win Rate</TableHead>
                  <TableHead className="text-center">Trend</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bracket.standings.map((standing, index) => (
                  <LeaderboardRow 
                    key={standing.team.id} 
                    standing={standing} 
                    rank={index + 1}
                  />
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function LeaderboardRow({ standing, rank }: { standing: any; rank: number }) {
  const winRate = standing.matchesPlayed > 0 
    ? Math.round((standing.wins / standing.matchesPlayed) * 100) 
    : 0;

  const getRankIcon = () => {
    switch (rank) {
      case 1:
        return <Trophy className="w-5 h-5 text-yellow-500" />;
      case 2:
        return <Medal className="w-5 h-5 text-gray-400" />;
      case 3:
        return <Award className="w-5 h-5 text-orange-600" />;
      default:
        return <span className="w-5 h-5 flex items-center justify-center text-sm font-bold">{rank}</span>;
    }
  };

  const getTrendIcon = () => {
    // This would normally be calculated based on previous rankings
    // For now, we'll use a simple placeholder
    if (rank <= 3) {
      return <TrendingUp className="w-4 h-4 text-green-500" />;
    }
    return null;
  };

  return (
    <TableRow className={rank <= 3 ? 'bg-muted/30' : ''}>
      <TableCell className="font-medium">
        <div className="flex items-center gap-2">
          {getRankIcon()}
        </div>
      </TableCell>
      <TableCell className="font-medium">{standing.team.name}</TableCell>
      <TableCell className="text-center">
        <div className="flex items-center justify-center gap-1">
          <span className="font-bold text-lg">{standing.score}</span>
          {rank <= 3 && (
            <Badge variant="outline" className="text-xs">
              Top {rank}
            </Badge>
          )}
        </div>
      </TableCell>
      <TableCell className="text-center">{standing.matchesPlayed}</TableCell>
      <TableCell className="text-center">{standing.wins}</TableCell>
      <TableCell className="text-center">
        <div className="flex items-center gap-2">
          <Progress value={winRate} className="w-16 h-2" />
          <span className="text-sm font-medium">{winRate}%</span>
        </div>
      </TableCell>
      <TableCell className="text-center">
        {getTrendIcon()}
      </TableCell>
    </TableRow>
  );
}