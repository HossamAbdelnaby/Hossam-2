"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Trophy, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Users, 
  Calendar, 
  DollarSign,
  MapPin,
  Clock,
  CheckCircle,
  AlertTriangle,
  Eye,
  Settings,
  Filter,
  Download,
  ExternalLink,
  Zap
} from "lucide-react";

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
  status: string;
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
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function AdminTournamentsPage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [packageFilter, setPackageFilter] = useState("all");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // New tournament form state
  const [newTournament, setNewTournament] = useState({
    name: "",
    description: "",
    host: "",
    prizeAmount: 0,
    maxTeams: 16,
    registrationStart: "",
    registrationEnd: "",
    tournamentStart: "",
    tournamentEnd: "",
    bracketType: "SINGLE_ELIMINATION",
    packageType: "FREE"
  });

  useEffect(() => {
    fetchTournaments();
  }, []);

  const fetchTournaments = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/tournaments');
      
      if (response.ok) {
        const data = await response.json();
        setTournaments(data.tournaments || []);
      } else {
        const errorData = await response.json();
        setMessage({ type: 'error', text: errorData.error || 'Failed to fetch tournaments' });
      }
    } catch (error) {
      console.error('Error fetching tournaments:', error);
      setMessage({ type: 'error', text: 'Network error' });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTournament = async () => {
    try {
      const response = await fetch('/api/admin/tournaments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTournament)
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Tournament created successfully!' });
        setShowCreateDialog(false);
        setNewTournament({
          name: "",
          description: "",
          host: "",
          prizeAmount: 0,
          maxTeams: 16,
          registrationStart: "",
          registrationEnd: "",
          tournamentStart: "",
          tournamentEnd: "",
          bracketType: "SINGLE_ELIMINATION",
          packageType: "FREE"
        });
        fetchTournaments();
      } else {
        const data = await response.json();
        setMessage({ type: 'error', text: data.error || 'Failed to create tournament' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error' });
    }
  };

  const handleDeleteTournament = async (tournamentId: string) => {
    if (!confirm('Are you sure you want to delete this tournament? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/tournaments/${tournamentId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Tournament deleted successfully!' });
        fetchTournaments();
      } else {
        const data = await response.json();
        setMessage({ type: 'error', text: data.error || 'Failed to delete tournament' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error' });
    }
  };

  const handleUpdateStatus = async (tournamentId: string, status: string) => {
    try {
      const response = await fetch(`/api/admin/tournaments/${tournamentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Tournament status updated successfully!' });
        fetchTournaments();
      } else {
        const data = await response.json();
        setMessage({ type: 'error', text: data.error || 'Failed to update tournament status' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error' });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT': return 'secondary';
      case 'REGISTRATION_OPEN': return 'default';
      case 'REGISTRATION_CLOSED': return 'secondary';
      case 'IN_PROGRESS': return 'default';
      case 'COMPLETED': return 'outline';
      default: return 'secondary';
    }
  };

  const getPackageColor = (packageType: string) => {
    switch (packageType) {
      case 'FREE': return 'outline';
      case 'PAID_GRAPHICS': return 'default';
      case 'PAID_DISCORD_BOT': return 'default';
      case 'FULL_MANAGEMENT': return 'destructive';
      default: return 'secondary';
    }
  };

  const filteredTournaments = tournaments.filter(tournament => {
    const matchesSearch = 
      tournament.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tournament.host.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tournament.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || tournament.status === statusFilter;
    const matchesPackage = packageFilter === "all" || tournament.packageType === packageFilter;

    return matchesSearch && matchesStatus && matchesPackage;
  });

  const tournamentStats = {
    total: tournaments.length,
    active: tournaments.filter(t => t.isActive).length,
    registrationOpen: tournaments.filter(t => t.status === 'REGISTRATION_OPEN').length,
    inProgress: tournaments.filter(t => t.status === 'IN_PROGRESS').length,
    completed: tournaments.filter(t => t.status === 'COMPLETED').length,
    totalPrizePool: tournaments.reduce((sum, t) => sum + t.prizeAmount, 0),
    totalTeams: tournaments.reduce((sum, t) => sum + t._count.teams, 0)
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="h-6 bg-muted rounded w-3/4"></div>
                  <div className="h-4 bg-muted rounded w-1/2"></div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="h-4 bg-muted rounded"></div>
                    <div className="h-4 bg-muted rounded"></div>
                    <div className="h-4 bg-muted rounded"></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Tournament Management</h1>
          <p className="text-muted-foreground">
            Manage all tournaments, create new ones, and monitor their progress
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Create Tournament
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Tournament</DialogTitle>
                <DialogDescription>
                  Set up a new tournament with all the necessary details
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Tournament Name</label>
                    <Input
                      value={newTournament.name}
                      onChange={(e) => setNewTournament({...newTournament, name: e.target.value})}
                      placeholder="Enter tournament name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Host/Organizer</label>
                    <Input
                      value={newTournament.host}
                      onChange={(e) => setNewTournament({...newTournament, host: e.target.value})}
                      placeholder="Host name"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Description</label>
                  <Input
                    value={newTournament.description}
                    onChange={(e) => setNewTournament({...newTournament, description: e.target.value})}
                    placeholder="Tournament description"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Prize Amount ($)</label>
                    <Input
                      type="number"
                      value={newTournament.prizeAmount}
                      onChange={(e) => setNewTournament({...newTournament, prizeAmount: parseFloat(e.target.value) || 0})}
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Max Teams</label>
                    <Input
                      type="number"
                      value={newTournament.maxTeams}
                      onChange={(e) => setNewTournament({...newTournament, maxTeams: parseInt(e.target.value) || 16})}
                      placeholder="16"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Registration Start</label>
                    <Input
                      type="datetime-local"
                      value={newTournament.registrationStart}
                      onChange={(e) => setNewTournament({...newTournament, registrationStart: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Registration End</label>
                    <Input
                      type="datetime-local"
                      value={newTournament.registrationEnd}
                      onChange={(e) => setNewTournament({...newTournament, registrationEnd: e.target.value})}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Tournament Start</label>
                    <Input
                      type="datetime-local"
                      value={newTournament.tournamentStart}
                      onChange={(e) => setNewTournament({...newTournament, tournamentStart: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Tournament End</label>
                    <Input
                      type="datetime-local"
                      value={newTournament.tournamentEnd}
                      onChange={(e) => setNewTournament({...newTournament, tournamentEnd: e.target.value})}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Bracket Type</label>
                    <Select value={newTournament.bracketType} onValueChange={(value) => setNewTournament({...newTournament, bracketType: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="SINGLE_ELIMINATION">Single Elimination</SelectItem>
                        <SelectItem value="DOUBLE_ELIMINATION">Double Elimination</SelectItem>
                        <SelectItem value="SWISS">Swiss</SelectItem>
                        <SelectItem value="GROUP_STAGE">Group Stage</SelectItem>
                        <SelectItem value="LEADERBOARD">Leaderboard</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Package Type</label>
                    <Select value={newTournament.packageType} onValueChange={(value) => setNewTournament({...newTournament, packageType: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="FREE">Free</SelectItem>
                        <SelectItem value="PAID_GRAPHICS">Graphics Package</SelectItem>
                        <SelectItem value="PAID_DISCORD_BOT">Discord Package</SelectItem>
                        <SelectItem value="FULL_MANAGEMENT">Full Management</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button onClick={handleCreateTournament} disabled={!newTournament.name || !newTournament.host}>
                    Create Tournament
                  </Button>
                  <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Message */}
      {message && (
        <Alert className={message.type === 'success' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
          {message.type === 'success' ? (
            <CheckCircle className="h-4 w-4 text-green-600" />
          ) : (
            <AlertTriangle className="h-4 w-4 text-red-600" />
          )}
          <AlertDescription className={message.type === 'success' ? 'text-green-800' : 'text-red-800'}>
            {message.text}
          </AlertDescription>
        </Alert>
      )}

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Tournaments</p>
                <p className="text-2xl font-bold">{tournamentStats.total}</p>
              </div>
              <Trophy className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Tournaments</p>
                <p className="text-2xl font-bold">{tournamentStats.active}</p>
              </div>
              <Zap className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Prize Pool</p>
                <p className="text-2xl font-bold">${tournamentStats.totalPrizePool.toLocaleString()}</p>
              </div>
              <DollarSign className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Registered Teams</p>
                <p className="text-2xl font-bold">{tournamentStats.totalTeams}</p>
              </div>
              <Users className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search tournaments by name, host, or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="DRAFT">Draft</SelectItem>
                  <SelectItem value="REGISTRATION_OPEN">Registration Open</SelectItem>
                  <SelectItem value="REGISTRATION_CLOSED">Registration Closed</SelectItem>
                  <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={packageFilter} onValueChange={setPackageFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All Packages" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Packages</SelectItem>
                  <SelectItem value="FREE">Free</SelectItem>
                  <SelectItem value="PAID_GRAPHICS">Graphics</SelectItem>
                  <SelectItem value="PAID_DISCORD_BOT">Discord</SelectItem>
                  <SelectItem value="FULL_MANAGEMENT">Full Management</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tournaments List */}
      <div className="space-y-4">
        {filteredTournaments.length > 0 ? (
          filteredTournaments.map((tournament) => (
            <Card key={tournament.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <CardTitle className="text-xl">{tournament.name}</CardTitle>
                    <CardDescription className="flex items-center gap-2 mt-1">
                      <MapPin className="w-4 h-4" />
                      {tournament.host}
                      <span>•</span>
                      <Calendar className="w-4 h-4" />
                      {new Date(tournament.tournamentStart).toLocaleDateString()}
                    </CardDescription>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Badge variant={getStatusColor(tournament.status)}>
                      {tournament.status.replace('_', ' ')}
                    </Badge>
                    <Badge variant={getPackageColor(tournament.packageType)}>
                      {tournament.packageType.replace('_', ' ')}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                {tournament.description && (
                  <p className="text-sm text-muted-foreground mb-4">
                    {tournament.description}
                  </p>
                )}
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="flex items-center gap-2 text-sm">
                    <DollarSign className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">${tournament.prizeAmount.toLocaleString()}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">{tournament._count.teams}/{tournament.maxTeams} teams</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">{tournament.bracketType.replace('_', ' ')}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm">
                    <Trophy className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">{tournament.packageType.replace('_', ' ')}</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="flex gap-2">
                    <Select 
                      value={tournament.status} 
                      onValueChange={(value) => handleUpdateStatus(tournament.id, value)}
                    >
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="DRAFT">Draft</SelectItem>
                        <SelectItem value="REGISTRATION_OPEN">Registration Open</SelectItem>
                        <SelectItem value="REGISTRATION_CLOSED">Registration Closed</SelectItem>
                        <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                        <SelectItem value="COMPLETED">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <a href={`/tournaments/${tournament.id}`} target="_blank">
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </a>
                    </Button>
                    
                    <Button variant="outline" size="sm" asChild>
                      <a href={`/tournaments/${tournament.id}/edit`} target="_blank">
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
                      </a>
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleDeleteTournament(tournament.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <Trophy className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">No tournaments found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || statusFilter !== "all" || packageFilter !== "all" 
                  ? "Try adjusting your filters or search terms."
                  : "Start by creating your first tournament."
                }
              </p>
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Tournament
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}