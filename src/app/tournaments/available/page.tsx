'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Calendar, Trophy, Users, MapPin, Plus, Minus, Crown, CheckCircle, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';

interface Tournament {
  id: string;
  name: string;
  description?: string;
  host: string;
  prizeAmount: number;
  maxTeams: number;
  registrationStart: string;
  registrationEnd?: string;
  tournamentStart: string;
  tournamentEnd?: string;
  bracketType: string;
  packageType: string;
  organizer: {
    id: string;
    username: string;
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

interface PaginationData {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function AvailableTournamentsPage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationData>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  
  // Registration form state
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
  const [isRegisterDialogOpen, setIsRegisterDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [registrationError, setRegistrationError] = useState('');
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  
  const [formData, setFormData] = useState({
    teamName: '',
    clanTag: '',
    teamLogo: '',
    nationality: '',
    players: Array(7).fill(null).map(() => ({
      name: '',
      username: '',
      tag: '',
      nationality: '',
    })),
    captainIndex: 0,
  });

  const { user } = useAuth();

  const fetchTournaments = async (page: number = 1) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/tournaments/available?page=${page}&limit=10`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch tournaments');
      }
      
      const data = await response.json();
      setTournaments(data.tournaments);
      setPagination(data.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTournaments();
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getRegistrationProgress = (currentTeams: number, maxTeams: number) => {
    return Math.round((currentTeams / maxTeams) * 100);
  };

  const getBracketTypeLabel = (type: string) => {
    switch (type) {
      case 'SINGLE_ELIMINATION':
        return 'Single Elimination';
      case 'DOUBLE_ELIMINATION':
        return 'Double Elimination';
      case 'SWISS':
        return 'Swiss';
      case 'GROUP_STAGE':
        return 'Group Stage';
      case 'LEADERBOARD':
        return 'Leaderboard';
      default:
        return type;
    }
  };

  const handleRegisterClick = (tournament: Tournament) => {
    if (!user) {
      window.location.href = '/login';
      return;
    }
    
    setSelectedTournament(tournament);
    setIsRegisterDialogOpen(true);
    // Reset form
    setFormData({
      teamName: '',
      clanTag: '',
      teamLogo: '',
      nationality: '',
      players: Array(7).fill(null).map(() => ({
        name: '',
        username: '',
        tag: '',
        nationality: '',
      })),
      captainIndex: 0,
    });
    setRegistrationError('');
    setRegistrationSuccess(false);
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

  const handleSubmitRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegistrationError('');
    setSubmitting(true);

    try {
      if (!selectedTournament) return;

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

      const response = await fetch(`/api/tournaments/${selectedTournament.id}/teams`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.teamName.trim(),
          clanTag: formData.clanTag.trim() || null,
          logo: formData.teamLogo.trim() || null,
          nationality: formData.nationality.trim() || null,
          players: validPlayers,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to register team');
      }

      setRegistrationSuccess(true);
      
      // Refresh tournaments list to update team count
      await fetchTournaments(pagination.page);
      
      // Close dialog after success
      setTimeout(() => {
        setIsRegisterDialogOpen(false);
        setRegistrationSuccess(false);
      }, 2000);

    } catch (err) {
      setRegistrationError(err instanceof Error ? err.message : 'Failed to register team');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
          <p className="text-gray-600">{error}</p>
          <Button onClick={() => fetchTournaments()} className="mt-4">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Available Tournaments</h1>
        <p className="text-gray-600">
          Register your team for upcoming tournaments
        </p>
      </div>

      {tournaments.length === 0 ? (
        <div className="text-center py-12">
          <Trophy className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No tournaments available
          </h3>
          <p className="text-gray-600">
            There are currently no tournaments open for registration.
          </p>
        </div>
      ) : (
        <>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {tournaments.map((tournament) => {
              const progress = getRegistrationProgress(
                tournament._count.teams,
                tournament.maxTeams
              );
              
              return (
                <Card key={tournament.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{tournament.name}</CardTitle>
                      <Badge variant="secondary">
                        {getBracketTypeLabel(tournament.bracketType)}
                      </Badge>
                    </div>
                    <CardDescription className="line-clamp-2">
                      {tournament.description || 'No description available'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Trophy className="h-4 w-4" />
                        <span>${tournament.prizeAmount.toLocaleString()} Prize Pool</span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="h-4 w-4" />
                        <span>{formatDate(tournament.registrationStart)}</span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MapPin className="h-4 w-4" />
                        <span>Hosted by {tournament.organizer.name || tournament.organizer.username}</span>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            <span>
                              {tournament._count.teams} of {tournament.maxTeams} teams
                            </span>
                          </div>
                          <span className="text-gray-600">{progress}%</span>
                        </div>
                        <Progress value={progress} className="h-2" />
                      </div>
                      
                      <div className="flex gap-2 pt-2">
                        <Link href={`/tournaments/${tournament.id}`} className="flex-1">
                          <Button variant="outline" className="w-full">
                            View Details
                          </Button>
                        </Link>
                        
                        <Dialog open={isRegisterDialogOpen && selectedTournament?.id === tournament.id} onOpenChange={setIsRegisterDialogOpen}>
                          <DialogTrigger asChild>
                            <Button 
                              className="flex-1" 
                              onClick={() => handleRegisterClick(tournament)}
                              disabled={tournament._count.teams >= tournament.maxTeams}
                            >
                              {tournament._count.teams >= tournament.maxTeams ? 'Full' : 'Register Team'}
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>Register Your Team</DialogTitle>
                              <DialogDescription>
                                Register your team for {selectedTournament?.name}
                              </DialogDescription>
                            </DialogHeader>
                            
                            {registrationSuccess ? (
                              <div className="text-center py-8">
                                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                  <CheckCircle className="w-8 h-8 text-green-600" />
                                </div>
                                <h3 className="text-lg font-semibold mb-2">Registration Successful!</h3>
                                <p className="text-gray-600">Your team has been registered successfully.</p>
                              </div>
                            ) : (
                              <form onSubmit={handleSubmitRegistration} className="space-y-6">
                                {registrationError && (
                                  <Alert variant="destructive">
                                    <AlertDescription>{registrationError}</AlertDescription>
                                  </Alert>
                                )}

                                {/* Team Information */}
                                <div className="space-y-4">
                                  <h3 className="text-lg font-semibold">Team Information</h3>
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
                                    <div className="space-y-2">
                                      <Label htmlFor="nationality">Team Nationality</Label>
                                      <Input
                                        id="nationality"
                                        value={formData.nationality}
                                        onChange={(e) => handleInputChange('nationality', e.target.value)}
                                        placeholder="e.g., United States"
                                      />
                                    </div>
                                    
                                    <div className="space-y-2">
                                      <Label htmlFor="teamLogo">Team Logo URL</Label>
                                      <Input
                                        id="teamLogo"
                                        value={formData.teamLogo}
                                        onChange={(e) => handleInputChange('teamLogo', e.target.value)}
                                        placeholder="https://example.com/logo.png"
                                        type="url"
                                      />
                                    </div>
                                  </div>
                                </div>

                                {/* Players Section */}
                                <div className="space-y-4">
                                  <h3 className="text-lg font-semibold">Players</h3>
                                  <p className="text-sm text-gray-600">
                                    Add up to 7 players. The first player will be designated as team captain.
                                  </p>
                                  
                                  <div className="space-y-4 max-h-64 overflow-y-auto">
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
                                        
                                        <div className="grid md:grid-cols-3 gap-4">
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
                                        </div>
                                        
                                        <div className="mt-4">
                                          <Label htmlFor={`player-${index}-nationality`}>Nationality</Label>
                                          <Input
                                            id={`player-${index}-nationality`}
                                            value={player.nationality}
                                            onChange={(e) => handlePlayerChange(index, 'nationality', e.target.value)}
                                            placeholder="Player nationality"
                                          />
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                  
                                  {formData.players.length < 7 && (
                                    <Button
                                      type="button"
                                      variant="outline"
                                      onClick={() => {
                                        setFormData(prev => ({
                                          ...prev,
                                          players: [...prev.players, {
                                            name: '',
                                            username: '',
                                            tag: '',
                                            nationality: '',
                                          }]
                                        }));
                                      }}
                                      className="w-full"
                                    >
                                      <Plus className="w-4 h-4 mr-2" />
                                      Add Player
                                    </Button>
                                  )}
                                </div>

                                {/* Submit Button */}
                                <div className="flex gap-2 pt-4">
                                  <Button 
                                    type="button" 
                                    variant="outline" 
                                    onClick={() => setIsRegisterDialogOpen(false)}
                                    className="flex-1"
                                  >
                                    Cancel
                                  </Button>
                                  <Button 
                                    type="submit" 
                                    disabled={submitting}
                                    className="flex-1"
                                  >
                                    {submitting ? (
                                      <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Registering...
                                      </>
                                    ) : (
                                      'Register Team'
                                    )}
                                  </Button>
                                </div>
                              </form>
                            )}
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-8">
              <Button
                variant="outline"
                onClick={() => fetchTournaments(pagination.page - 1)}
                disabled={pagination.page === 1}
              >
                Previous
              </Button>
              
              <div className="flex items-center gap-2">
                {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
                  <Button
                    key={page}
                    variant={page === pagination.page ? "default" : "outline"}
                    onClick={() => fetchTournaments(page)}
                    className="w-10"
                  >
                    {page}
                  </Button>
                ))}
              </div>
              
              <Button
                variant="outline"
                onClick={() => fetchTournaments(pagination.page + 1)}
                disabled={pagination.page === pagination.totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}