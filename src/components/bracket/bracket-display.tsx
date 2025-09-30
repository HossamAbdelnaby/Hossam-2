"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { RefreshCw, AlertCircle, Wifi, WifiOff, Shuffle, Settings } from "lucide-react";
import { BracketMatch, BracketData } from "@/lib/bracket-data";
import { SingleEliminationBracket } from "../tournament/brackets/single-elimination-bracket";
import { DoubleEliminationBracketDisplay } from "./double-elimination-bracket";
import { SwissBracketDisplay } from "./swiss-bracket";
import { GroupStageBracketDisplay } from "./group-stage-bracket";
import { LeaderboardBracketDisplay } from "./leaderboard-bracket";
import { MatchManagementModal } from "./match-management-modal";
import { io, Socket } from "socket.io-client";

interface BracketDisplayProps {
  tournamentId: string;
  bracketType: string;
  maxTeams: number;
  onMatchClick?: (match: BracketMatch) => void;
  isAdmin?: boolean;
  canManage?: boolean;
}

export function BracketDisplay({ 
  tournamentId, 
  bracketType, 
  maxTeams, 
  onMatchClick,
  isAdmin = false,
  canManage = false
}: BracketDisplayProps) {
  const [bracketData, setBracketData] = useState<BracketData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [selectedMatch, setSelectedMatch] = useState<BracketMatch | null>(null);
  const [isPerformingDraw, setIsPerformingDraw] = useState(false);
  const [isGeneratingLosers, setIsGeneratingLosers] = useState(false);

  useEffect(() => {
    fetchBracketData();
    setupSocketConnection();
    
    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [tournamentId, bracketType, maxTeams]);

  const setupSocketConnection = () => {
    try {
      const newSocket = io(process.env.NODE_ENV === 'production' ? '' : 'http://localhost:3000', {
        transports: ['websocket', 'polling'],
      });

      newSocket.on('connect', () => {
        console.log('Connected to bracket updates');
        setIsConnected(true);
        // Join tournament-specific room
        newSocket.emit('join-tournament', tournamentId);
      });

      newSocket.on('disconnect', () => {
        console.log('Disconnected from bracket updates');
        setIsConnected(false);
      });

      newSocket.on('match-updated', (data: { tournamentId: string; matchId: string }) => {
        if (data.tournamentId === tournamentId) {
          console.log('Match updated, refreshing bracket...');
          fetchBracketData();
        }
      });

      newSocket.on('bracket-updated', (data: { tournamentId: string }) => {
        if (data.tournamentId === tournamentId) {
          console.log('Bracket updated, refreshing...');
          fetchBracketData();
        }
      });

      setSocket(newSocket);
    } catch (error) {
      console.error('Error setting up socket connection:', error);
      setIsConnected(false);
    }
  };

  const fetchBracketData = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(`/api/tournaments/${tournamentId}/bracket`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch bracket data');
      }
      
      const data = await response.json();
      setBracketData(data.bracket);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load bracket data');
    } finally {
      setLoading(false);
    }
  };

  const handleMatchClick = (match: BracketMatch) => {
    if (canManage) {
      setSelectedMatch(match);
    } else if (onMatchClick) {
      onMatchClick(match);
    }
  };

  const handleRandomDraw = async () => {
    try {
      setIsPerformingDraw(true);
      const response = await fetch(`/api/tournaments/${tournamentId}/bracket/random-draw`, {
        method: "POST",
      });

      if (response.ok) {
        const data = await response.json();
        setBracketData(data.bracket);
        setLastUpdated(new Date());
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to perform random draw");
      }
    } catch (error) {
      console.error("Error performing random draw:", error);
      setError("Failed to perform random draw");
    } finally {
      setIsPerformingDraw(false);
    }
  };

  const handleGenerateLosersBracket = async () => {
    try {
      setIsGeneratingLosers(true);
      const response = await fetch(`/api/tournaments/${tournamentId}/bracket/generate-losers`, {
        method: "POST",
      });

      if (response.ok) {
        const data = await response.json();
        // Refresh bracket data after generating losers bracket
        await fetchBracketData();
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to generate losers bracket");
      }
    } catch (error) {
      console.error("Error generating losers bracket:", error);
      setError("Failed to generate losers bracket");
    } finally {
      setIsGeneratingLosers(false);
    }
  };

  const handleRefresh = () => {
    fetchBracketData();
  };

  const renderBracket = () => {
    if (!bracketData) return null;

    switch (bracketData.type) {
      case 'SINGLE_ELIMINATION':
        return (
          <SingleEliminationBracket 
            rounds={bracketData.bracket.rounds}
            onMatchClick={handleMatchClick}
            canManage={canManage}
          />
        );
      case 'DOUBLE_ELIMINATION':
        return (
          <DoubleEliminationBracketDisplay 
            bracket={bracketData.bracket}
            onMatchClick={handleMatchClick}
            canManage={canManage}
          />
        );
      case 'SWISS':
        return (
          <SwissBracketDisplay 
            bracket={bracketData.bracket}
            onMatchClick={handleMatchClick}
            canManage={canManage}
          />
        );
      case 'GROUP_STAGE':
        return (
          <GroupStageBracketDisplay 
            bracket={bracketData.bracket}
            onMatchClick={handleMatchClick}
            canManage={canManage}
          />
        );
      case 'LEADERBOARD':
        return (
          <LeaderboardBracketDisplay 
            bracket={bracketData.bracket}
            onMatchClick={handleMatchClick}
            canManage={canManage}
          />
        );
      default:
        return (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Unsupported bracket type: {bracketData.type}
            </AlertDescription>
          </Alert>
        );
    }
  };

  const getBracketTypeName = (type: string) => {
    switch (type) {
      case 'SINGLE_ELIMINATION':
        return 'Single Elimination';
      case 'DOUBLE_ELIMINATION':
        return 'Double Elimination';
      case 'SWISS':
        return 'Swiss System';
      case 'GROUP_STAGE':
        return 'Group Stage';
      case 'LEADERBOARD':
        return 'Leaderboard';
      default:
        return type;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Tournament Bracket</h2>
            <p className="text-muted-foreground">Loading bracket data...</p>
          </div>
          <Skeleton className="w-20 h-10" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Failed to load bracket data: {error}
          <Button variant="link" onClick={handleRefresh} className="ml-2 p-0 h-auto">
            Try again
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Tournament Bracket</h2>
          <div className="flex items-center gap-4 mt-2">
            <Badge variant="outline" className="text-sm">
              {getBracketTypeName(bracketType)}
            </Badge>
            <Badge variant="secondary" className="text-sm">
              {maxTeams} teams
            </Badge>
            <div className="flex items-center gap-1">
              {isConnected ? (
                <Wifi className="w-4 h-4 text-green-500" />
              ) : (
                <WifiOff className="w-4 h-4 text-red-500" />
              )}
              <span className="text-sm text-muted-foreground">
                {isConnected ? 'Live' : 'Offline'}
              </span>
            </div>
            {lastUpdated && (
              <span className="text-sm text-muted-foreground">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </span>
            )}
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={handleRefresh}
            className="gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
          {canManage && bracketType === 'DOUBLE_ELIMINATION' && (
            <Button 
              variant="default" 
              onClick={handleGenerateLosersBracket}
              disabled={isGeneratingLosers}
              className="gap-2"
            >
              <Settings className="w-4 h-4" />
              {isGeneratingLosers ? 'Generating...' : 'Generate Losers Bracket'}
            </Button>
          )}
          {canManage && (
            <Button 
              variant="default" 
              onClick={handleRandomDraw}
              disabled={isPerformingDraw}
              className="gap-2"
            >
              <Shuffle className="w-4 h-4" />
              {isPerformingDraw ? 'Drawing...' : 'Random Draw'}
            </Button>
          )}
        </div>
      </div>

      {/* Real-time Update Notice */}
      {isConnected && (
        <Alert>
          <Wifi className="h-4 w-4" />
          <AlertDescription>
            Live updates enabled. Bracket will automatically refresh when match results are updated.
          </AlertDescription>
        </Alert>
      )}

      {/* Bracket Display */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>{getBracketTypeName(bracketType)} Bracket</span>
            <Badge variant="outline">
              {maxTeams} Team{maxTeams !== 1 ? 's' : ''}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {renderBracket()}
        </CardContent>
      </Card>

      {/* Match Management Modal */}
      {selectedMatch && (
        <MatchManagementModal
          match={selectedMatch}
          tournamentId={tournamentId}
          isOpen={!!selectedMatch}
          onClose={() => setSelectedMatch(null)}
          onUpdate={() => {
            fetchBracketData();
            setSelectedMatch(null);
          }}
        />
      )}
    </div>
  );
}