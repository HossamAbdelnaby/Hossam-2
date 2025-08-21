"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, ArrowRight } from "lucide-react";
import { 
  DoubleEliminationBracket, 
  BracketMatch, 
  WinnersBracket, 
  LosersBracket 
} from "@/lib/bracket-data";

interface DoubleEliminationBracketDisplayProps {
  bracket: DoubleEliminationBracket;
  onMatchClick?: (match: BracketMatch) => void;
}

export function DoubleEliminationBracketDisplay({ 
  bracket, 
  onMatchClick 
}: DoubleEliminationBracketDisplayProps) {
  return (
    <div className="w-full">
      <Tabs defaultValue="winners" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="winners">Winners Bracket</TabsTrigger>
          <TabsTrigger value="losers">Losers Bracket</TabsTrigger>
          <TabsTrigger value="final">Grand Final</TabsTrigger>
        </TabsList>
        
        <TabsContent value="winners" className="mt-6">
          <WinnersBracketDisplay 
            bracket={bracket.winnersBracket} 
            onMatchClick={onMatchClick}
          />
        </TabsContent>
        
        <TabsContent value="losers" className="mt-6">
          <LosersBracketDisplay 
            bracket={bracket.losersBracket} 
            onMatchClick={onMatchClick}
          />
        </TabsContent>
        
        <TabsContent value="final" className="mt-6">
          <GrandFinalDisplay 
            finalMatch={bracket.final} 
            onMatchClick={onMatchClick}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function WinnersBracketDisplay({ 
  bracket, 
  onMatchClick 
}: { 
  bracket: WinnersBracket; 
  onMatchClick?: (match: BracketMatch) => void;
}) {
  return (
    <div className="w-full overflow-x-auto">
      <div className="flex min-w-max gap-8 p-4">
        {bracket.rounds.map((round, roundIndex) => (
          <div key={round.roundNumber} className="flex flex-col gap-4">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">{round.name}</h3>
              <Badge variant="outline">{round.matches.length} matches</Badge>
            </div>
            
            <div className="flex flex-col gap-4">
              {round.matches.map((match, matchIndex) => (
                <MatchCard 
                  key={match.id} 
                  match={match} 
                  bracketType="winners"
                  onClick={() => onMatchClick?.(match)}
                />
              ))}
            </div>
          </div>
        ))}
        
        {/* Winners Bracket Champion */}
        {bracket.rounds.length > 0 && (
          <div className="flex flex-col items-center justify-center">
            <div className="text-center mb-4">
              <Trophy className="w-12 h-12 text-blue-500 mx-auto mb-2" />
              <h3 className="text-xl font-bold">Winners Finalist</h3>
            </div>
            <Card className="w-48 p-4 border-2 border-blue-400 bg-blue-50">
              <CardContent className="p-0">
                <div className="text-center">
                  <div className="text-sm text-muted-foreground mb-1">Advancing to Final</div>
                  <div className="font-semibold text-lg">
                    {getWinnersFinalist(bracket.rounds[bracket.rounds.length - 1])?.name || 'TBD'}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

function LosersBracketDisplay({ 
  bracket, 
  onMatchClick 
}: { 
  bracket: LosersBracket; 
  onMatchClick?: (match: BracketMatch) => void;
}) {
  return (
    <div className="w-full overflow-x-auto">
      <div className="flex min-w-max gap-6 p-4">
        {bracket.rounds.map((round, roundIndex) => (
          <div key={round.roundNumber} className="flex flex-col gap-3">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">{round.name}</h3>
              <Badge variant="outline">{round.matches.length} matches</Badge>
            </div>
            
            <div className="flex flex-col gap-3">
              {round.matches.map((match, matchIndex) => (
                <MatchCard 
                  key={match.id} 
                  match={match} 
                  bracketType="losers"
                  onClick={() => onMatchClick?.(match)}
                />
              ))}
            </div>
          </div>
        ))}
        
        {/* Losers Bracket Champion */}
        {bracket.rounds.length > 0 && (
          <div className="flex flex-col items-center justify-center">
            <div className="text-center mb-4">
              <Trophy className="w-12 h-12 text-red-500 mx-auto mb-2" />
              <h3 className="text-xl font-bold">Losers Finalist</h3>
            </div>
            <Card className="w-48 p-4 border-2 border-red-400 bg-red-50">
              <CardContent className="p-0">
                <div className="text-center">
                  <div className="text-sm text-muted-foreground mb-1">Advancing to Final</div>
                  <div className="font-semibold text-lg">
                    {getLosersFinalist(bracket.rounds[bracket.rounds.length - 1])?.name || 'TBD'}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

function GrandFinalDisplay({ 
  finalMatch, 
  onMatchClick 
}: { 
  finalMatch?: BracketMatch; 
  onMatchClick?: (match: BracketMatch) => void;
}) {
  if (!finalMatch) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Grand Final match not yet determined</p>
      </div>
    );
  }

  return (
    <div className="flex justify-center">
      <Card className="w-96 border-4 border-yellow-400 bg-yellow-50">
        <CardContent className="p-6">
          <div className="text-center mb-6">
            <Trophy className="w-16 h-16 text-yellow-500 mx-auto mb-3" />
            <h2 className="text-2xl font-bold text-yellow-800">Grand Final</h2>
            <p className="text-yellow-600">Championship Match</p>
          </div>
          
          <div onClick={() => onMatchClick?.(finalMatch)} className="cursor-pointer">
            {/* Team 1 */}
            <div className={`mb-4 p-4 rounded-lg border-2 ${
              finalMatch.winner?.id === finalMatch.team1?.id 
                ? 'bg-green-100 border-green-400' 
                : 'bg-white border-gray-200'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="font-bold text-lg">
                    {finalMatch.team1?.name || 'TBD'}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Winners Bracket
                  </div>
                </div>
                {finalMatch.score1 !== undefined && (
                  <div className="ml-4 font-bold text-2xl">
                    {finalMatch.score1}
                  </div>
                )}
              </div>
            </div>

            {/* VS */}
            <div className="text-center my-4">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-yellow-400 text-white rounded-full font-bold text-lg">
                VS
              </div>
            </div>

            {/* Team 2 */}
            <div className={`mb-4 p-4 rounded-lg border-2 ${
              finalMatch.winner?.id === finalMatch.team2?.id 
                ? 'bg-green-100 border-green-400' 
                : 'bg-white border-gray-200'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="font-bold text-lg">
                    {finalMatch.team2?.name || 'TBD'}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Losers Bracket
                  </div>
                </div>
                {finalMatch.score2 !== undefined && (
                  <div className="ml-4 font-bold text-2xl">
                    {finalMatch.score2}
                  </div>
                )}
              </div>
            </div>

            {/* Winner Display */}
            {finalMatch.winner && (
              <div className="mt-6 p-4 bg-green-100 border border-green-300 rounded-lg">
                <div className="flex items-center justify-center text-green-800 font-bold text-lg">
                  <Trophy className="w-6 h-6 mr-2" />
                  CHAMPION: {finalMatch.winner.name}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function MatchCard({ 
  match, 
  bracketType, 
  onClick 
}: { 
  match: BracketMatch; 
  bracketType: 'winners' | 'losers';
  onClick?: () => void;
}) {
  const hasWinner = match.winner !== null;
  const isBye = match.isBye;

  const borderColor = bracketType === 'winners' ? 'border-blue-200' : 'border-red-200';
  const bgColor = bracketType === 'winners' ? 'bg-blue-50' : 'bg-red-50';

  return (
    <Card 
      className={`w-56 cursor-pointer transition-all hover:shadow-md ${borderColor} ${bgColor} ${
        hasWinner ? 'bg-green-50 border-green-200' : ''
      }`}
      onClick={onClick}
    >
      <CardContent className="p-3">
        {/* Match Header */}
        <div className="flex items-center justify-between mb-2">
          <Badge variant="outline" className="text-xs">
            {bracketType === 'winners' ? 'W' : 'L'}-{match.matchNumber}
          </Badge>
          {isBye && (
            <Badge variant="secondary" className="text-xs">
              Bye
            </Badge>
          )}
        </div>

        {/* Team 1 */}
        <div className={`mb-1 p-2 rounded border ${
          match.winner?.id === match.team1?.id ? 'bg-green-100 border-green-300' : 'bg-white'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm truncate">
                {match.team1?.name || 'TBD'}
              </div>
            </div>
            {match.score1 !== undefined && (
              <div className="ml-2 font-bold">
                {match.score1}
              </div>
            )}
          </div>
        </div>

        {/* Team 2 */}
        <div className={`mb-2 p-2 rounded border ${
          match.winner?.id === match.team2?.id ? 'bg-green-100 border-green-300' : 'bg-white'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm truncate">
                {match.team2?.name || 'TBD'}
              </div>
            </div>
            {match.score2 !== undefined && (
              <div className="ml-2 font-bold">
                {match.score2}
              </div>
            )}
          </div>
        </div>

        {/* Winner Display */}
        {hasWinner && (
          <div className="flex items-center justify-center text-green-700 font-medium text-xs">
            <Trophy className="w-3 h-3 mr-1" />
            {match.winner?.name}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function getWinnersFinalist(finalRound: any) {
  const finalMatch = finalRound.matches[0];
  return finalMatch?.winner;
}

function getLosersFinalist(finalRound: any) {
  const finalMatch = finalRound.matches[0];
  return finalMatch?.winner;
}