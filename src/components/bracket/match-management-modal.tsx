"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Trophy, Users, CheckCircle, ArrowRight, TrendingDown } from "lucide-react";
import { BracketMatch } from "@/lib/bracket-data";

interface MatchManagementModalProps {
  match: BracketMatch;
  tournamentId: string;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

export function MatchManagementModal({
  match,
  tournamentId,
  isOpen,
  onClose,
  onUpdate
}: MatchManagementModalProps) {
  const [score1, setScore1] = useState(match.score1?.toString() || "");
  const [score2, setScore2] = useState(match.score2?.toString() || "");
  const [winnerId, setWinnerId] = useState(match.winner?.id || "");
  const [isUpdating, setIsUpdating] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [advancementInfo, setAdvancementInfo] = useState<{winnerName: string, nextRound: number} | null>(null);
  const [losersBracketUpdate, setLosersBracketUpdate] = useState<{losingTeamName: string, losersRound: number} | null>(null);

  const handleUpdateResult = async () => {
    try {
      setIsUpdating(true);
      
      // Update the match result - the API will handle losers bracket automatically
      const response = await fetch(
        `/api/tournaments/${tournamentId}/matches/${match.id}/result`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            score1: score1 ? parseInt(score1) : undefined,
            score2: score2 ? parseInt(score2) : undefined,
            winnerId: winnerId || undefined,
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        
        // Show success message
        setShowSuccess(true);
        
        // Check if there was advancement
        if (data.advancementInfo) {
          setAdvancementInfo(data.advancementInfo);
        }
        
        // Check if it's double elimination and show losers bracket info
        if (data.isDoubleElimination) {
          // Get the losing team info
          const losingTeam = match.team1?.id === winnerId ? match.team2 : match.team1;
          if (losingTeam && match.round <= 3) { // Winners bracket rounds
            setLosersBracketUpdate({
              losingTeamName: losingTeam.name,
              losersRound: match.round + 3, // Losers rounds start from round 4
            });
          }
        }
        
        // Auto-close after delay
        setTimeout(() => {
          onUpdate();
          onClose();
          setShowSuccess(false);
          setAdvancementInfo(null);
          setLosersBracketUpdate(null);
        }, 3000);
      } else {
        console.error("Failed to update match result");
      }
    } catch (error) {
      console.error("Error updating match result:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  const isBye = match.isBye || !match.team1 || !match.team2;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5" />
            Match Management
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Match Info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Match Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Round:</span>
                <span className="text-sm font-medium">{match.round}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Match:</span>
                <span className="text-sm font-medium">#{match.matchNumber}</span>
              </div>
              <div className="flex items-center gap-2 pt-2">
                <Users className="w-4 h-4 text-muted-foreground" />
                <div className="flex-1">
                  <div className="text-sm font-medium">
                    {match.team1?.name || "TBD"} vs {match.team2?.name || "TBD"}
                  </div>
                  {isBye && (
                    <div className="text-xs text-muted-foreground">Bye match</div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Results Section */}
          {!isBye && match.team1 && match.team2 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Trophy className="w-4 h-4" />
                  Match Results
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="score1">{match.team1.name}</Label>
                    <Input
                      id="score1"
                      type="number"
                      min="0"
                      max="15"
                      value={score1}
                      onChange={(e) => setScore1(e.target.value)}
                      className="mt-1"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <Label htmlFor="score2">{match.team2.name}</Label>
                    <Input
                      id="score2"
                      type="number"
                      min="0"
                      max="15"
                      value={score2}
                      onChange={(e) => setScore2(e.target.value)}
                      className="mt-1"
                      placeholder="0"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="winner">Winner (Manual Selection)</Label>
                  <Select value={winnerId} onValueChange={setWinnerId}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select winner manually" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={match.team1.id}>
                        {match.team1.name}
                      </SelectItem>
                      <SelectItem value={match.team2.id}>
                        {match.team2.name}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">
                    Manually select the winner regardless of scores
                  </p>
                </div>

                <Button 
                  onClick={handleUpdateResult}
                  disabled={isUpdating || !winnerId}
                  className="w-full"
                >
                  <Trophy className="w-4 h-4 mr-2" />
                  {isUpdating ? "Updating..." : "Update Result & Advance Winner"}
                </Button>
                
                {/* Success Message */}
                {showSuccess && (
                  <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-2 text-green-700">
                      <CheckCircle className="w-5 h-5" />
                      <span className="font-medium">Match result updated successfully!</span>
                    </div>
                    
                    {advancementInfo && (
                      <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
                        <div className="flex items-center gap-2 text-blue-700">
                          <ArrowRight className="w-4 h-4" />
                          <span className="font-medium">
                            {advancementInfo.winnerName} advances to Round {advancementInfo.nextRound}!
                          </span>
                        </div>
                      </div>
                    )}
                    
                    {losersBracketUpdate && (
                      <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded-md">
                        <div className="flex items-center gap-2 text-orange-700">
                          <TrendingDown className="w-4 h-4" />
                          <span className="font-medium">
                            {losersBracketUpdate.losingTeamName} moves to Losers Bracket Round {losersBracketUpdate.losersRound}!
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}