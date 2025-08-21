"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { CountrySelector, CountryDisplay } from "@/components/ui/country-selector";
import { ImageUpload } from "@/components/ui/image-upload";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowLeft, 
  Calendar, 
  DollarSign, 
  Trophy, 
  Users, 
  User,
  MapPin,
  Clock,
  Loader2,
  Edit,
  Share2,
  Zap,
  Trash2,
  AlertTriangle,
  Plus,
  Minus,
  Crown,
  CheckCircle,
  Upload,
  Flag
} from "lucide-react";

interface Tournament {
  id: string;
  name: string;
  description?: string;
  host: string;
  url?: string;
  prizeAmount: number;
  maxTeams: number;
  registrationStart: string;
  registrationEnd?: string;
  tournamentStart: string;
  tournamentEnd?: string;
  status: string;
  bracketType: string;
  packageType: string;
  graphicRequests?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  organizer: {
    id: string;
    email: string;
    name?: string;
  };
  teams: Array<{
    id: string;
    name: string;
  }>;
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

export default function TournamentPage() {
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [registrationLogs, setRegistrationLogs] = useState<any[]>([]);
  
  // Registration form state
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
  
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  
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
      
      // Fetch registration logs
      await fetchRegistrationLogs();
    } catch (err) {
      setError('Failed to fetch tournament');
    } finally {
      setLoading(false);
    }
  };

  const fetchRegistrationLogs = async () => {
    try {
      const response = await fetch(`/api/tournaments/${tournamentId}/registration-logs`);
      
      if (response.ok) {
        const data = await response.json();
        setRegistrationLogs(data.registrationLogs || []);
      }
    } catch (err) {
      console.error('Failed to fetch registration logs:', err);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    setError("");

    try {
      const response = await fetch(`/api/tournaments/${tournamentId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete tournament');
      }

      router.push('/tournaments');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete tournament');
      setShowDeleteConfirm(false);
    } finally {
      setDeleting(false);
    }
  };

  const handleRegisterClick = () => {
    if (!user) {
      window.location.href = '/login';
      return;
    }
    
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
      if (!tournament) return;

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

      const response = await fetch(`/api/tournaments/${tournament.id}/teams`, {
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
      
      // Refresh tournament data to update team count
      await fetchTournament();
      
      // Refresh registration logs to show new registration
      await fetchRegistrationLogs();
      
      // Reset form after successful registration
      setTimeout(() => {
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
        setRegistrationSuccess(false);
        setIsRegisterDialogOpen(false);
      }, 2000);

    } catch (err) {
      setRegistrationError(err instanceof Error ? err.message : 'Failed to register team');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT': return 'secondary';
      case 'REGISTRATION_OPEN': return 'default';
      case 'REGISTRATION_CLOSED': return 'secondary';
      case 'IN_PROGRESS': return 'default';
      case 'COMPLETED': return 'default';
      default: return 'secondary';
    }
  };

  const getPackageColor = (packageType: string) => {
    switch (packageType) {
      case 'FREE': return 'secondary';
      case 'PAID_GRAPHICS': return 'default';
      case 'PAID_DISCORD_BOT': return 'default';
      case 'FULL_MANAGEMENT': return 'default';
      default: return 'secondary';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleCopyUrl = async () => {
    try {
      const url = window.location.origin + `/tournaments/${tournamentId}`;
      await navigator.clipboard.writeText(url);
      toast({
        title: "URL Copied!",
        description: "Tournament URL has been copied to clipboard.",
      });
    } catch (err) {
      console.error('Failed to copy URL:', err);
      toast({
        title: "Copy Failed",
        description: "Failed to copy URL to clipboard.",
        variant: "destructive",
      });
    }
  };

  const isOwner = user && tournament && user.id === tournament.organizer.id;
  const isRegistrationOpen = tournament?.status === 'REGISTRATION_OPEN';
  const isTournamentFull = tournament?._count.teams >= tournament?.maxTeams;

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

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <Link href="/tournaments" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="w-4 h-4" />
          Back to Tournaments
        </Link>
        
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold mb-2">{tournament.name}</h1>
            <div className="flex items-center gap-4 flex-wrap">
              <Badge variant={getStatusColor(tournament.status)}>
                {tournament.status.replace('_', ' ')}
              </Badge>
              <Badge variant={getPackageColor(tournament.packageType)}>
                {tournament.packageType.replace('_', ' ')}
              </Badge>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Calendar className="w-4 h-4" />
                {formatDate(tournament.registrationStart)}
              </div>
            </div>
          </div>
          
          <div className="flex gap-2">
            {/* Registration Button */}
            {isRegistrationOpen && !isTournamentFull && (
              <Dialog open={isRegisterDialogOpen} onOpenChange={setIsRegisterDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={handleRegisterClick} className="gap-2">
                    <Users className="w-4 h-4" />
                    Register Team
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Register Your Team</DialogTitle>
                    <DialogDescription>
                      Fill in your team details to register for {tournament.name}
                    </DialogDescription>
                  </DialogHeader>
                  
                  {registrationSuccess ? (
                    <div className="text-center py-8">
                      <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold mb-2">Registration Successful!</h3>
                      <p className="text-muted-foreground">
                        Your team has been registered successfully. The form will reset shortly.
                      </p>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmitRegistration} className="space-y-6">
                      {registrationError && (
                        <Alert className="border-red-200 bg-red-50">
                          <AlertTriangle className="h-4 w-4 text-red-600" />
                          <AlertDescription className="text-red-800">
                            {registrationError}
                          </AlertDescription>
                        </Alert>
                      )}
                      
                      {/* Team Information */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="teamName">Team Name *</Label>
                          <Input
                            id="teamName"
                            value={formData.teamName}
                            onChange={(e) => handleInputChange('teamName', e.target.value)}
                            placeholder="Enter team name"
                            required
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="clanTag">Clan Tag</Label>
                          <Input
                            id="clanTag"
                            value={formData.clanTag}
                            onChange={(e) => handleInputChange('clanTag', e.target.value)}
                            placeholder="Enter clan tag (optional)"
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="teamLogo">Team Logo</Label>
                          <ImageUpload
                            value={formData.teamLogo}
                            onValueChange={(value) => handleInputChange('teamLogo', value)}
                            placeholder="Upload team logo"
                            required={false}
                            width={150}
                            height={150}
                            aspectRatio="1:1"
                            maxSize={5}
                            acceptedFormats={["image/jpeg", "image/png", "image/webp"]}
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="nationality">Team Nationality</Label>
                          <CountrySelector
                            value={formData.nationality}
                            onChange={(value) => handleInputChange('nationality', value)}
                            placeholder="Select nationality"
                          />
                        </div>
                      </div>
                      
                      {/* Players Section */}
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <Label className="text-lg font-semibold">Players *</Label>
                          <span className="text-sm text-muted-foreground">
                            Minimum 5 players required
                          </span>
                        </div>
                        
                        <div className="space-y-4">
                          {formData.players.map((player, index) => (
                            <Card key={index} className="p-4">
                              <div className="flex items-center justify-between mb-3">
                                <h4 className="font-medium">Player {index + 1}</h4>
                                <div className="flex items-center gap-2">
                                  <Label className="text-sm">Captain</Label>
                                  <input
                                    type="radio"
                                    name="captainIndex"
                                    checked={formData.captainIndex === index}
                                    onChange={() => setFormData(prev => ({ ...prev, captainIndex: index }))}
                                    className="w-4 h-4"
                                  />
                                </div>
                              </div>
                              
                              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                                <div>
                                  <Label htmlFor={`player-${index}-name`}>Name *</Label>
                                  <Input
                                    id={`player-${index}-name`}
                                    value={player.name}
                                    onChange={(e) => handlePlayerChange(index, 'name', e.target.value)}
                                    placeholder="Player name"
                                    required={index === formData.captainIndex}
                                  />
                                </div>
                                
                                <div>
                                  <Label htmlFor={`player-${index}-username`}>Username *</Label>
                                  <Input
                                    id={`player-${index}-username`}
                                    value={player.username}
                                    onChange={(e) => handlePlayerChange(index, 'username', e.target.value)}
                                    placeholder="Username"
                                    required={index === formData.captainIndex}
                                  />
                                </div>
                                
                                <div>
                                  <Label htmlFor={`player-${index}-tag`}>Tag *</Label>
                                  <Input
                                    id={`player-${index}-tag`}
                                    value={player.tag}
                                    onChange={(e) => handlePlayerChange(index, 'tag', e.target.value)}
                                    placeholder="Player tag"
                                    required={index === formData.captainIndex}
                                  />
                                </div>
                                
                                <div>
                                  <Label htmlFor={`player-${index}-nationality`}>Nationality</Label>
                                  <CountrySelector
                                    value={player.nationality}
                                    onChange={(value) => handlePlayerChange(index, 'nationality', value)}
                                    placeholder="Nationality"
                                  />
                                </div>
                              </div>
                            </Card>
                          ))}
                        </div>
                      </div>
                      
                      <div className="flex justify-end gap-3">
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => setIsRegisterDialogOpen(false)}
                          disabled={submitting}
                        >
                          Cancel
                        </Button>
                        <Button 
                          type="submit" 
                          disabled={submitting}
                          className="gap-2"
                        >
                          {submitting ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Registering...
                            </>
                          ) : (
                            <>
                              <CheckCircle className="w-4 h-4" />
                              Register Team
                            </>
                          )}
                        </Button>
                      </div>
                    </form>
                  )}
                </DialogContent>
              </Dialog>
            )}
            
            {/* Registration Closed/Full Messages */}
            {!isRegistrationOpen && (
              <Button variant="outline" disabled className="gap-2">
                <Users className="w-4 h-4" />
                Registration Closed
              </Button>
            )}
            
            {isRegistrationOpen && isTournamentFull && (
              <Button variant="outline" disabled className="gap-2">
                <Users className="w-4 h-4" />
                Tournament Full
              </Button>
            )}
            
            {isOwner && (
              <>
                <Button variant="outline" asChild>
                  <Link href={`/tournaments/${tournament.id}/edit`}>
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </Link>
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={() => setShowDeleteConfirm(true)}
                  className="gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </Button>
              </>
            )}
            <Button 
              variant="outline" 
              className="gap-2"
              onClick={handleCopyUrl}
            >
              <Share2 className="w-4 h-4" />
              Share
            </Button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <Alert className="mb-8 border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <div className="space-y-2">
              <p className="font-medium">Are you sure you want to delete this tournament?</p>
              <p className="text-sm">This action cannot be undone and will remove all tournament data including teams, matches, and stages.</p>
              <div className="flex gap-2 mt-4">
                <Button 
                  variant="destructive" 
                  onClick={handleDelete}
                  disabled={deleting}
                  className="gap-2"
                >
                  {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  {deleting ? 'Deleting...' : 'Yes, Delete Tournament'}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={deleting}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </AlertDescription>
        </Alert>
      )}

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Tournament Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="w-5 h-5" />
                Tournament Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {tournament.description && (
                <div>
                  <h4 className="font-medium mb-2">Description</h4>
                  <p className="text-muted-foreground">{tournament.description}</p>
                </div>
              )}
              
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Host</h4>
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <span>{tournament.host}</span>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Organizer</h4>
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <span>{tournament.organizer.name || tournament.organizer.email}</span>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Prize Pool</h4>
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-muted-foreground" />
                    <span>${tournament.prizeAmount.toLocaleString()}</span>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Bracket Type</h4>
                  <div className="flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-muted-foreground" />
                    <span>{tournament.bracketType.replace('_', ' ')}</span>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Team Slots</h4>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    <span>{tournament.maxTeams} teams</span>
                  </div>
                </div>
              </div>
              
              {tournament.url && (
                <div>
                  <h4 className="font-medium mb-2">Tournament URL</h4>
                  <a 
                    href={tournament.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:underline break-all"
                  >
                    {tournament.url}
                  </a>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Teams Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Registered Teams
              </CardTitle>
              <CardDescription>
                {tournament._count.teams} of {tournament.maxTeams} team slots filled ({Math.round((tournament._count.teams / tournament.maxTeams) * 100)}%)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Progress Bar */}
              <div className="mb-4">
                <div className="flex justify-between text-sm text-muted-foreground mb-1">
                  <span>Registration Progress</span>
                  <span>{tournament._count.teams}/{tournament.maxTeams}</span>
                </div>
                <Progress value={(tournament._count.teams / tournament.maxTeams) * 100} className="h-2" />
              </div>
              
              {tournament.teams.length > 0 ? (
                <div className="grid gap-3">
                  {tournament.teams.map(team => (
                    <div key={team.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                          <Users className="w-5 h-5 text-primary" />
                        </div>
                        <span className="font-medium">{team.name}</span>
                      </div>
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No teams registered yet</p>
                  {/* Registration button removed from here - only main header button should be used */}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Registration Log Section */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Registration Log
              </CardTitle>
              <CardDescription>
                Recent tournament registration activity
              </CardDescription>
            </CardHeader>
            <CardContent>
              {registrationLogs.length > 0 ? (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {registrationLogs.map((log) => {
                    const details = log.details ? JSON.parse(log.details) : {};
                    return (
                      <div key={log.id} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                        <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-sm">
                              {log.team?.name || 'Unknown Team'}
                            </span>
                            {log.team?.clanTag && (
                              <Badge variant="outline" className="text-xs">
                                [{log.team.clanTag}]
                              </Badge>
                            )}
                            <span className="text-xs text-muted-foreground">
                              • {new Date(log.createdAt).toLocaleString()}
                            </span>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            <p>
                              Successfully registered by {log.user?.name || log.user?.username || 'Unknown user'}
                              {details.playerCount && ` with ${details.playerCount} players`}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Clock className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-medium mb-2">No Registration Activity Yet</h3>
                  <p className="text-muted-foreground">
                    Registration activities will appear here as teams join the tournament.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {/* Registration button removed from quick actions - only main header button should be used */}
              
              {isRegistrationOpen && isTournamentFull && (
                <Button className="w-full" disabled>
                  <Users className="w-4 h-4 mr-2" />
                  Tournament Full
                </Button>
              )}
              
              {!isRegistrationOpen && tournament?.status === 'DRAFT' && (
                <Button className="w-full" disabled>
                  <Clock className="w-4 h-4 mr-2" />
                  Registration Not Open Yet
                </Button>
              )}
              
              {!isRegistrationOpen && tournament?.status === 'REGISTRATION_CLOSED' && (
                <Button className="w-full" disabled>
                  <Users className="w-4 h-4 mr-2" />
                  Registration Closed
                </Button>
              )}
              
              {!isRegistrationOpen && (tournament?.status === 'IN_PROGRESS' || tournament?.status === 'COMPLETED') && (
                <Button className="w-full" disabled>
                  <Trophy className="w-4 h-4 mr-2" />
                  Tournament In Progress
                </Button>
              )}
              
              {isOwner && tournament.status === 'DRAFT' && (
                <Button variant="outline" className="w-full">
                  Open Registration
                </Button>
              )}
              
              <Button variant="outline" className="w-full" asChild>
                <Link href={`/tournaments/${tournament.id}/bracket`}>
                  <Trophy className="w-4 h-4 mr-2" />
                  View Bracket
                </Link>
              </Button>
              
              {(tournament.status === 'IN_PROGRESS' || tournament.status === 'COMPLETED') && (
                <Button variant="outline" className="w-full" asChild>
                  <Link href={`/tournaments/${tournament.id}/live-scores`}>
                    <Zap className="w-4 h-4 mr-2" />
                    Live Scores
                  </Link>
                </Button>
              )}
              
              <Button variant="outline" className="w-full">
                Tournament Rules
              </Button>
            </CardContent>
          </Card>

          {/* Tournament Details */}
          <Card>
            <CardHeader>
              <CardTitle>Tournament Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2 text-sm">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span>Created {formatDate(tournament.createdAt)}</span>
              </div>
              
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span>Registration Starts {formatDate(tournament.registrationStart)}</span>
              </div>
              
              {tournament.registrationEnd && (
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span>Registration Ends {formatDate(tournament.registrationEnd)}</span>
                </div>
              )}
              
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span>Tournament Starts {formatDate(tournament.tournamentStart)}</span>
              </div>
              
              {tournament.tournamentEnd && (
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span>Tournament Ends {formatDate(tournament.tournamentEnd)}</span>
                </div>
              )}
              
              <div className="flex items-center gap-2 text-sm">
                <Users className="w-4 h-4 text-muted-foreground" />
                <span>{tournament._count.teams}/{tournament.maxTeams} teams registered</span>
              </div>
              
              <div className="pt-2 border-t">
                <div className="text-sm text-muted-foreground">
                  Status: <span className={`font-medium ${
                    tournament.status === 'REGISTRATION_OPEN' ? 'text-green-600' :
                    tournament.status === 'IN_PROGRESS' ? 'text-blue-600' :
                    tournament.status === 'COMPLETED' ? 'text-gray-600' :
                    'text-orange-600'
                  }`}>
                    {tournament.status.replace('_', ' ')}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}