"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, ArrowRight, ChevronRight } from "lucide-react";
import { BracketRound, BracketMatch } from "@/lib/bracket-data";

interface SingleEliminationBracketProps {
  rounds: BracketRound[];
  onMatchClick?: (match: BracketMatch) => void;
  canManage?: boolean;
}

export function SingleEliminationBracket({ rounds, onMatchClick, canManage = false }: SingleEliminationBracketProps) {
  return (
    <div className="w-full overflow-x-auto">
      <div className="flex min-w-max gap-12 p-4">
        {rounds.map((round, roundIndex) => (
          <div key={round.roundNumber} className="flex flex-col gap-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">{round.name}</h3>
              <Badge variant="outline">{round.matches.length} matches</Badge>
            </div>
            
            <div className="flex flex-col gap-4">
              {round.matches.map((match, matchIndex) => (
                <div key={match.id} className="relative">
                  <MatchCard 
                    match={match} 
                    isFinal={round.name === 'Final'}
                    onClick={() => onMatchClick?.(match)}
                    canManage={canManage}
                  />
                  
                  {/* Advancement indicator */}
                  {round.roundNumber < rounds.length && match.winner && (
                    <div className="absolute -right-8 top-1/2 transform -translate-y-1/2 z-10">
                      <div className="flex items-center justify-center w-6 h-6 bg-blue-500 rounded-full">
                        <ChevronRight className="w-4 h-4 text-white" />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
        
        {/* Champion Trophy */}
        {rounds.length > 0 && (
          <div className="flex flex-col items-center justify-center">
            <div className="text-center mb-4">
              <Trophy className="w-12 h-12 text-yellow-500 mx-auto mb-2" />
              <h3 className="text-xl font-bold">Champion</h3>
            </div>
            <Card className="w-48 p-4 border-2 border-yellow-400 bg-yellow-50">
              <CardContent className="p-0">
                <div className="text-center">
                  <div className="text-sm text-muted-foreground mb-1">Winner</div>
                  <div className="font-semibold text-lg text-yellow-700">
                    {getFinalWinner(rounds[rounds.length - 1])?.name || 'TBD'}
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

function MatchCard({ match, isFinal, onClick, canManage }: { match: BracketMatch; isFinal?: boolean; onClick?: () => void; canManage?: boolean }) {
  const hasWinner = match.winner !== null;
  const isBye = match.isBye;
  const isClickable = canManage || onClick;

  return (
    <Card 
      className={`w-64 transition-all hover:shadow-md ${
        isFinal ? 'border-2 border-yellow-400 bg-yellow-50' : ''
      } ${hasWinner ? 'bg-green-50 border-green-200' : ''} ${
        isClickable ? 'cursor-pointer hover:scale-[1.02]' : ''
      }`}
      onClick={isClickable ? onClick : undefined}
    >
      <CardContent className="p-4">
        {/* Match Header */}
        <div className="flex items-center justify-between mb-3">
          <Badge variant="outline" className="text-xs">
            Match {match.matchNumber}
          </Badge>
          {isBye && (
            <Badge variant="secondary" className="text-xs">
              Bye
            </Badge>
          )}
          {canManage && (
            <Badge variant="outline" className="text-xs">
              Click to manage
            </Badge>
          )}
        </div>

        {/* Team 1 */}
        <div className={`mb-2 p-2 rounded border transition-colors ${
          match.winner?.id === match.team1?.id 
            ? 'bg-blue-100 border-blue-400 shadow-sm' 
            : match.winner && match.team1?.id
              ? 'bg-red-100 border-red-300' 
              : 'bg-gray-50'
        } ${
          isClickable ? 'hover:shadow-md' : ''
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <div className={`font-medium truncate ${
                match.winner?.id === match.team1?.id 
                  ? 'text-blue-800 font-bold' 
                  : match.winner && match.team1?.id
                    ? 'text-red-700 line-through'
                    : ''
              }`}>
                {match.team1?.name || 'TBD'}
              </div>
            </div>
            {match.score1 !== undefined && (
              <div className={`ml-2 font-bold text-lg ${
                match.winner?.id === match.team1?.id ? 'text-blue-800' : 'text-gray-600'
              }`}>
                {match.score1}
              </div>
            )}
          </div>
        </div>

        {/* Team 2 */}
        <div className={`mb-3 p-2 rounded border transition-colors ${
          match.winner?.id === match.team2?.id 
            ? 'bg-blue-100 border-blue-400 shadow-sm' 
            : match.winner && match.team2?.id
              ? 'bg-red-100 border-red-300' 
              : 'bg-gray-50'
        } ${
          isClickable ? 'hover:shadow-md' : ''
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <div className={`font-medium truncate ${
                match.winner?.id === match.team2?.id 
                  ? 'text-blue-800 font-bold' 
                  : match.winner && match.team2?.id
                    ? 'text-red-700 line-through'
                    : ''
              }`}>
                {match.team2?.name || 'TBD'}
              </div>
            </div>
            {match.score2 !== undefined && (
              <div className={`ml-2 font-bold text-lg ${
                match.winner?.id === match.team2?.id ? 'text-blue-800' : 'text-gray-600'
              }`}>
                {match.score2}
              </div>
            )}
          </div>
        </div>

        {/* Winner Display */}
        {hasWinner && (
          <div className="flex items-center justify-center text-blue-700 font-medium text-sm bg-blue-50 rounded py-1 px-2">
            <Trophy className="w-4 h-4 mr-1" />
            Winner: {match.winner?.name}
          </div>
        )}

        {/* VS indicator when no winner yet */}
        {!hasWinner && !isBye && match.team1 && match.team2 && (
          <div className="flex items-center justify-center text-gray-500 text-sm">
            VS
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function getFinalWinner(finalRound: BracketRound) {
  const finalMatch = finalRound.matches[0];
  return finalMatch?.winner;
}