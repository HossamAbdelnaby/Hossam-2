"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/auth-context";
import { 
  Calendar, 
  DollarSign, 
  Trophy, 
  Users, 
  Search,
  Filter,
  Plus,
  Clock,
  MapPin,
  User,
  Loader2
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
  isActive: boolean;
  createdAt: string;
  organizer: {
    id: string;
    email: string;
    name?: string;
  };
  _count: {
    teams: number;
  };
}

export default function TournamentsPage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  const { user } = useAuth();

  useEffect(() => {
    fetchTournaments();
  }, [currentPage, statusFilter]);

  const fetchTournaments = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "12",
      });

      if (statusFilter !== "all") {
        params.append("status", statusFilter);
      }

      const response = await fetch(`/api/tournaments?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch tournaments');
      }

      const data = await response.json();
      setTournaments(data.tournaments);
      setTotalPages(data.pagination.pages);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch tournaments');
    } finally {
      setLoading(false);
    }
  };

  const filteredTournaments = tournaments.filter(tournament =>
    tournament.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tournament.host.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tournament.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
      month: 'short',
      day: 'numeric',
    });
  };

  const isRegistrationOpen = (status: string) => status === 'REGISTRATION_OPEN';

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-4xl font-bold mb-2">Tournaments</h1>
          <p className="text-muted-foreground">
            Discover and join exciting Clash of Clans tournaments
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/tournaments/available">
              Open Registration
            </Link>
          </Button>
          
          {user && (
            <Button asChild className="gap-2">
              <Link href="/create-tournament">
                <Plus className="w-4 h-4" />
                Create Tournament
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* Search and Filters */}
      <Card className="mb-8">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search tournaments..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="REGISTRATION_OPEN">Registration Open</SelectItem>
                <SelectItem value="REGISTRATION_CLOSED">Registration Closed</SelectItem>
                <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
                <SelectItem value="DRAFT">Draft</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Error State */}
      {error && (
        <Card className="mb-8 border-destructive">
          <CardContent className="pt-6">
            <p className="text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, index) => (
            <Card key={index} className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-muted rounded w-3/4"></div>
                <div className="h-4 bg-muted rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="h-4 bg-muted rounded"></div>
                  <div className="h-4 bg-muted rounded w-5/6"></div>
                  <div className="h-8 bg-muted rounded w-full"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <>
          {/* Tournaments Grid */}
          {filteredTournaments.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTournaments.map((tournament) => (
                <Card key={tournament.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg line-clamp-2">
                          <Link 
                            href={`/tournaments/${tournament.id}`}
                            className="hover:text-primary transition-colors"
                          >
                            {tournament.name}
                          </Link>
                        </CardTitle>
                        <CardDescription className="flex items-center gap-1 mt-1">
                          <User className="w-3 h-3" />
                          {tournament.host}
                        </CardDescription>
                      </div>
                      <div className="flex flex-col gap-1">
                        <Badge variant={getStatusColor(tournament.status)} className="text-xs">
                          {tournament.status.replace('_', ' ')}
                        </Badge>
                        <Badge variant={getPackageColor(tournament.packageType)} className="text-xs">
                          {tournament.packageType.replace('_', ' ')}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    {tournament.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {tournament.description}
                      </p>
                    )}
                    
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <DollarSign className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium">${tournament.prizeAmount.toLocaleString()}</span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span>{formatDate(tournament.registrationStart)}</span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm">
                        <Users className="w-4 h-4 text-muted-foreground" />
                        <span>{tournament._count.teams}/{tournament.maxTeams} teams</span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm">
                        <Trophy className="w-4 h-4 text-muted-foreground" />
                        <span>{tournament.bracketType.replace('_', ' ')}</span>
                      </div>
                    </div>
                    
                    <div className="flex gap-2 pt-2">
                      <Button asChild className="flex-1">
                        <Link href={`/tournaments/${tournament.id}`}>
                          View Details
                        </Link>
                      </Button>
                      
                      {isRegistrationOpen(tournament.status) && user && (
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/tournaments/${tournament.id}/register`}>
                            Register
                          </Link>
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <Trophy className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h2 className="text-2xl font-bold mb-2">No tournaments found</h2>
              <p className="text-muted-foreground mb-6">
                {searchTerm || statusFilter !== "all" 
                  ? "Try adjusting your search or filters"
                  : "Be the first to create a tournament!"
                }
              </p>
              
              {user && !searchTerm && statusFilter === "all" && (
                <Button asChild>
                  <Link href="/create-tournament">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Tournament
                  </Link>
                </Button>
              )}
            </div>
          )}
        </>
      )}

      {/* Pagination */}
      {totalPages > 1 && !loading && filteredTournaments.length > 0 && (
        <div className="flex justify-center gap-2 mt-8">
          <Button
            variant="outline"
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          
          <div className="flex items-center gap-2">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const page = i + 1;
              return (
                <Button
                  key={page}
                  variant={currentPage === page ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </Button>
              );
            })}
          </div>
          
          <Button
            variant="outline"
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}