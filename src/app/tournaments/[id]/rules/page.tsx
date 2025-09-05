"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/auth-context";
import TournamentRules from "@/components/tournament/tournament-rules";
import { 
  ArrowLeft, 
  FileText, 
  Edit, 
  Save, 
  X, 
  AlertTriangle,
  CheckCircle,
  Loader2
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
  rules?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  organizer: {
    id: string;
    email: string;
    name?: string;
  };
  _count: {
    teams: number;
  };
}

export default function TournamentRulesPage() {
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
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
    } catch (err) {
      setError('Failed to fetch tournament');
    } finally {
      setLoading(false);
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

  const isOwner = user && tournament && user.id === tournament.organizer.id;

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
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <Link 
          href={`/tournaments/${tournament.id}`} 
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Tournament
        </Link>
        
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">Tournament Rules</h1>
            <div className="flex items-center gap-4 flex-wrap">
              <span className="text-lg text-muted-foreground">{tournament.name}</span>
              <Badge variant={getStatusColor(tournament.status)}>
                {tournament.status.replace('_', ' ')}
              </Badge>
            </div>
          </div>
          
          {isOwner && (
            <Button asChild>
              <Link href={`/tournaments/${tournament.id}/edit`}>
                <Edit className="w-4 h-4 mr-2" />
                Edit Tournament
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* Tournament Rules Component */}
      <TournamentRules 
        tournamentId={tournament.id}
        tournamentName={tournament.name}
        isOwner={isOwner}
      />

      {/* Quick Tournament Info */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="text-lg">Tournament Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium mb-1">Host</h4>
              <p className="text-sm text-muted-foreground">{tournament.host}</p>
            </div>
            
            <div>
              <h4 className="font-medium mb-1">Prize Pool</h4>
              <p className="text-sm text-muted-foreground">${tournament.prizeAmount.toLocaleString()}</p>
            </div>
            
            <div>
              <h4 className="font-medium mb-1">Registration Status</h4>
              <p className="text-sm text-muted-foreground">
                {tournament._count.teams}/{tournament.maxTeams} teams registered
              </p>
            </div>
            
            <div>
              <h4 className="font-medium mb-1">Tournament Start</h4>
              <p className="text-sm text-muted-foreground">{formatDate(tournament.tournamentStart)}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}