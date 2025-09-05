"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ImageUpload } from "@/components/ui/image-upload";
import { CountrySelector } from "@/components/ui/country-selector";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/auth-context";
import { 
  ArrowLeft, 
  Users, 
  Trophy, 
  Plus, 
  Minus,
  Upload,
  MapPin,
  Flag,
  Crown,
  Loader2,
  Save,
  CheckCircle,
  AlertCircle
} from "lucide-react";

interface Tournament {
  id: string;
  name: string;
  description?: string;
  host: string;
  prizeAmount: number;
  startDate: string;
  status: string;
  bracketType: string;
  packageType: string;
  isActive: boolean;
  organizer: {
    id: string;
    email: string;
    name?: string;
  };
  _count: {
    teams: number;
  };
}

interface Player {
  name: string;
  username: string;
  tag: string;
  nationality?: string;
}

export default function TournamentRegistrationPage() {
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  
  const [formData, setFormData] = useState({
    // Team Info
    teamName: "",
    clanTag: "",
    teamLogo: "",
    teamNationality: "",
    
    // Players
    players: Array(7).fill(null).map(() => ({
      name: "",
      username: "",
      tag: "",
      nationality: "",
    })),
    
    // Captain
    captainIndex: 0,
  });

  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  
  const tournamentId = params.id as string;

  useEffect(() => {
    fetchTournament();
  }, [tournamentId]);

  const fetchTournament = async () => {
    try {
      const response = await fetch(`/api/tournaments/${tournamentId}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          setError('Tournament not found');
        } else {
          setError('Failed to fetch tournament');
        }
        return;
      }

      const data = await response.json();
      setTournament(data.tournament);
    } catch (err) {
      setError('Failed to fetch tournament');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePlayerChange = (index: number, field: keyof Player, value: string) => {
    setFormData(prev => ({
      ...prev,
      players: prev.players.map((player, i) => 
        i === index ? { ...player, [field]: value } : player
      )
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      // Validate required fields
      if (!formData.teamName.trim()) {
        throw new Error('Team name is required');
      }

      if (!formData.players[formData.captainIndex]?.name.trim()) {
        throw new Error('Captain name is required');
      }

      if (!formData.players[formData.captainIndex]?.username.trim()) {
        throw new Error('Captain username is required');
      }

      if (!formData.players[formData.captainIndex]?.tag.trim()) {
        throw new Error('Captain tag is required');
      }

      // Filter out empty players (keep at least the captain)
      const validPlayers = formData.players.filter(player => 
        player.name.trim() && player.username.trim() && player.tag.trim()
      );

      if (validPlayers.length === 0) {
        throw new Error('At least one player (captain) is required');
      }

      // Enforce minimum team members rule
      if (validPlayers.length < 5) {
        throw new Error('Teams must have at least 5 players to participate');
      }

      const response = await fetch(`/api/tournaments/${tournamentId}/teams`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.teamName.trim(),
          clanTag: formData.clanTag.trim() || null,
          logo: formData.teamLogo.trim() || null,
          nationality: formData.teamNationality.trim() || null,
          players: validPlayers,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to register team');
      }

      const data = await response.json();
      setSuccess(true);
      
      // Redirect to bracket page after a short delay
      setTimeout(() => {
        router.push(`/tournaments/${tournamentId}/bracket`);
      }, 2000);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to register team');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (error || !tournament) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">{error || 'Tournament not found'}</h1>
          <Button asChild>
            <Link href="/tournaments">Back to Tournaments</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">Authentication Required</h1>
          <p className="text-muted-foreground mb-8">
            Please login to register your team for this tournament.
          </p>
          <div className="flex gap-4 justify-center">
            <Button asChild>
              <Link href="/login">Login</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/register">Register</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (tournament.status !== 'REGISTRATION_OPEN') {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">Registration Closed</h1>
          <p className="text-muted-foreground mb-8">
            This tournament is not currently accepting registrations.
          </p>
          <Button asChild>
            <Link href={`/tournaments/${tournament.id}`}>Back to Tournament</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-md mx-auto">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <CardTitle>Registration Successful!</CardTitle>
            <CardDescription>
              Your team has been registered for {tournament.name}.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href={`/tournaments/${tournament.id}/bracket`}>View Bracket</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <Link href={`/tournaments/${tournament.id}`} className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="w-4 h-4" />
          Back to Tournament
        </Link>
        
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
            <Trophy className="w-6 h-6 text-primary-foreground" />
          </div>
          <div className="flex-1">
            <h1 className="text-3xl font-bold mb-2">Register Your Team</h1>
            <p className="text-muted-foreground">
              Register your team for <span className="font-semibold">{tournament.name}</span>
            </p>
            <div className="flex items-center gap-4 mt-2">
              <Badge variant="outline">
                <Users className="w-3 h-3 mr-1" />
                {tournament._count.teams} teams registered
              </Badge>
              <Badge variant="outline">
                <Crown className="w-3 h-3 mr-1" />
                ${tournament.prizeAmount.toLocaleString()} prize pool
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Team Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Team Information
            </CardTitle>
            <CardDescription>
              Enter your team's basic information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="teamName">Team Name *</Label>
                <Input
                  id="teamName"
                  value={formData.teamName}
                  onChange={(e) => handleInputChange('teamName', e.target.value)}
                  placeholder="Enter your team name"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="clanTag">Clan Tag</Label>
                <Input
                  id="clanTag"
                  value={formData.clanTag}
                  onChange={(e) => handleInputChange('clanTag', e.target.value)}
                  placeholder="e.g., #ABC123"
                />
              </div>
            </div>
            
            <div className="grid md:grid-cols-2 gap-4">
              <ImageUpload
                value={formData.teamLogo}
                onValueChange={(value) => handleInputChange('teamLogo', value)}
                label="Team Logo"
                placeholder="Upload team logo"
                width={200}
                height={200}
              />
              
              <CountrySelector
                value={formData.teamNationality}
                onValueChange={(value) => handleInputChange('teamNationality', value)}
                label="Team Nationality"
                placeholder="Select team nationality"
              />
            </div>
          </CardContent>
        </Card>

        {/* Players Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Players
            </CardTitle>
            <CardDescription>
              Add up to 7 players. The first player will be designated as team captain.
              <div className="mt-2 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <p className="text-sm text-orange-800">
                  <strong>Minimum Team Members Rule:</strong> Teams must have at least 5 players to participate in the tournament.
                </p>
              </div>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Player Count Indicator */}
            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                <span className="font-medium">Team Size</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`font-medium ${
                  formData.players.filter(p => p.name.trim() && p.username.trim() && p.tag.trim()).length >= 5 
                    ? 'text-green-600' 
                    : 'text-orange-600'
                }`}>
                  {formData.players.filter(p => p.name.trim() && p.username.trim() && p.tag.trim()).length} / 5 players
                </span>
                {formData.players.filter(p => p.name.trim() && p.username.trim() && p.tag.trim()).length >= 5 ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-orange-600" />
                )}
              </div>
            </div>
            
            {formData.players.map((player, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-medium flex items-center gap-2">
                    {index === 0 && <Crown className="w-4 h-4 text-yellow-500" />}
                    Player {index + 1} {index === 0 && "(Captain)"}
                  </h4>
                  {index > 0 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const newPlayers = [...formData.players];
                        newPlayers.splice(index, 1);
                        setFormData(prev => ({
                          ...prev,
                          players: newPlayers,
                          captainIndex: prev.captainIndex >= index ? Math.max(0, prev.captainIndex - 1) : prev.captainIndex
                        }));
                      }}
                    >
                      <Minus className="w-4 h-4" />
                    </Button>
                  )}
                </div>
                
                <div className="grid md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor={`player-${index}-name`}>Player Name *</Label>
                    <Input
                      id={`player-${index}-name`}
                      value={player.name}
                      onChange={(e) => handlePlayerChange(index, 'name', e.target.value)}
                      placeholder="Enter player name"
                      required={index === 0}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor={`player-${index}-username`}>Username *</Label>
                    <Input
                      id={`player-${index}-username`}
                      value={player.username}
                      onChange={(e) => handlePlayerChange(index, 'username', e.target.value)}
                      placeholder="In-game username"
                      required={index === 0}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor={`player-${index}-tag`}>Player Tag *</Label>
                    <Input
                      id={`player-${index}-tag`}
                      value={player.tag}
                      onChange={(e) => handlePlayerChange(index, 'tag', e.target.value)}
                      placeholder="#ABC123"
                      required={index === 0}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <CountrySelector
                      value={player.nationality || ""}
                      onValueChange={(value) => handlePlayerChange(index, 'nationality', value)}
                      label={`Player ${index + 1} Nationality`}
                      placeholder="Select nationality"
                      required={index === 0}
                    />
                  </div>
                </div>
              </div>
            ))}
            
            {formData.players.length < 7 && (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setFormData(prev => ({
                    ...prev,
                    players: [...prev.players, {
                      name: "",
                      username: "",
                      tag: "",
                    }]
                  }));
                }}
                className="w-full"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Player
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" asChild>
            <Link href={`/tournaments/${tournament.id}`}>Cancel</Link>
          </Button>
          <Button 
            type="submit" 
            disabled={submitting || formData.players.filter(p => p.name.trim() && p.username.trim() && p.tag.trim()).length < 5}
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Registering Team...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Register Team
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}