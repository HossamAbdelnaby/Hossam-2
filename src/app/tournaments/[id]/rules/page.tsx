"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Loader2,
  Trophy,
  Calendar,
  Users,
  DollarSign,
  CreditCard,
  Clock,
  MapPin,
  Shield,
  Info,
  Star,
  Target,
  Zap,
  Award,
  Settings,
  Crown
} from "lucide-react";

interface Tournament {
  id: string;
  name: string;
  description?: string;
  host: string;
  url?: string;
  prizeAmount: number;
  currency?: string;
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
  paymentMethods?: string;
  paymentTerms?: string;
  earlyBirdPrice?: number;
  regularPrice?: number;
  latePrice?: number;
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

  const getPackageIcon = (packageType: string) => {
    switch (packageType) {
      case 'FREE': return <Star className="w-4 h-4" />;
      case 'PAID_GRAPHICS': return <Target className="w-4 h-4" />;
      case 'PAID_DISCORD_BOT': return <Zap className="w-4 h-4" />;
      case 'FULL_MANAGEMENT': return <Crown className="w-4 h-4" />;
      default: return <Settings className="w-4 h-4" />;
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

  const getCurrentPrice = () => {
    if (!tournament) return 0;
    
    const now = new Date();
    const registrationStart = new Date(tournament.registrationStart);
    const registrationEnd = tournament.registrationEnd ? new Date(tournament.registrationEnd) : null;
    
    if (now < registrationStart) {
      return tournament.earlyBirdPrice || tournament.regularPrice || 0;
    }
    
    if (registrationEnd && now > registrationEnd) {
      return tournament.latePrice || tournament.regularPrice || 0;
    }
    
    return tournament.regularPrice || 0;
  };

  const getPriceType = () => {
    if (!tournament) return 'Regular';
    
    const now = new Date();
    const registrationStart = new Date(tournament.registrationStart);
    const registrationEnd = tournament.registrationEnd ? new Date(tournament.registrationEnd) : null;
    
    if (now < registrationStart) {
      return tournament.earlyBirdPrice ? 'Early Bird' : 'Regular';
    }
    
    if (registrationEnd && now > registrationEnd) {
      return tournament.latePrice ? 'Late Registration' : 'Regular';
    }
    
    return 'Regular';
  };

  const isRegistrationOpen = () => {
    if (!tournament) return false;
    
    const now = new Date();
    const registrationStart = new Date(tournament.registrationStart);
    const registrationEnd = tournament.registrationEnd ? new Date(tournament.registrationEnd) : null;
    
    return now >= registrationStart && (!registrationEnd || now <= registrationEnd);
  };

  const getPaymentMethods = () => {
    if (!tournament?.paymentMethods) return [];
    try {
      return JSON.parse(tournament.paymentMethods);
    } catch {
      return [];
    }
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

  const currentPrice = getCurrentPrice();
  const priceType = getPriceType();
  const paymentMethods = getPaymentMethods();

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <Link 
          href={`/tournaments/${tournament.id}`} 
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Tournament
        </Link>
        
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
              <Trophy className="w-8 h-8 text-yellow-500" />
              Tournament Rules & Information
            </h1>
            <div className="flex items-center gap-4 flex-wrap">
              <span className="text-lg text-muted-foreground">{tournament.name}</span>
              <Badge variant={getStatusColor(tournament.status)}>
                {tournament.status.replace('_', ' ')}
              </Badge>
              <Badge variant={getPackageColor(tournament.packageType)} className="flex items-center gap-1">
                {getPackageIcon(tournament.packageType)}
                {tournament.packageType.replace('_', ' ')}
              </Badge>
            </div>
          </div>
          
          {isOwner && (
            <div className="flex gap-2">
              <Button asChild variant="outline">
                <Link href={`/tournaments/${tournament.id}/edit`}>
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Tournament
                </Link>
              </Button>
              {tournament.regularPrice && (
                <Button asChild>
                  <Link href={`/tournaments/${tournament.id}/payment`}>
                    <CreditCard className="w-4 h-4 mr-2" />
                    Register Now
                  </Link>
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="rules" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
          <TabsTrigger value="rules" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Rules
          </TabsTrigger>
          <TabsTrigger value="details" className="flex items-center gap-2">
            <Info className="w-4 h-4" />
            Details
          </TabsTrigger>
          <TabsTrigger value="payment" className="flex items-center gap-2">
            <CreditCard className="w-4 h-4" />
            Payment
          </TabsTrigger>
          <TabsTrigger value="schedule" className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Schedule
          </TabsTrigger>
        </TabsList>

        {/* Rules Tab */}
        <TabsContent value="rules">
          <TournamentRules 
            tournamentId={tournament.id}
            tournamentName={tournament.name}
            isOwner={isOwner}
          />
        </TabsContent>

        {/* Details Tab */}
        <TabsContent value="details">
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Tournament Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="w-5 h-5" />
                  Tournament Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Description</h4>
                  <p className="text-sm text-muted-foreground">
                    {tournament.description || 'No description available'}
                  </p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-1">Host</h4>
                    <p className="text-sm text-muted-foreground">{tournament.host}</p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-1">Format</h4>
                    <p className="text-sm text-muted-foreground">{tournament.bracketType.replace('_', ' ')}</p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-1">Max Teams</h4>
                    <p className="text-sm text-muted-foreground">{tournament.maxTeams} teams</p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-1">Status</h4>
                    <Badge variant={getStatusColor(tournament.status)}>
                      {tournament.status.replace('_', ' ')}
                    </Badge>
                  </div>
                </div>

                {tournament.graphicRequests && (
                  <div>
                    <h4 className="font-medium mb-2">Graphic Requests</h4>
                    <p className="text-sm text-muted-foreground">{tournament.graphicRequests}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Prize & Rewards */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="w-5 h-5" />
                  Prize & Rewards
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-yellow-900">Total Prize Pool</h4>
                      <p className="text-2xl font-bold text-yellow-600">
                        {tournament.prizeAmount.toLocaleString()} {tournament.currency || 'USD'}
                      </p>
                    </div>
                    <Trophy className="w-12 h-12 text-yellow-500" />
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-yellow-500" />
                    <span className="text-sm">Winner takes 60% of prize pool</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-gray-400" />
                    <span className="text-sm">Runner-up takes 30% of prize pool</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-orange-600" />
                    <span className="text-sm">Third place takes 10% of prize pool</span>
                  </div>
                </div>

                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    Prize distribution may vary based on tournament format and number of participants.
                    Final prize distribution will be announced before the tournament starts.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Payment Tab */}
        <TabsContent value="payment">
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Registration Fees */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  Registration Fees
                </CardTitle>
                <CardDescription>
                  Current pricing and registration information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Current Price */}
                <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Current Price</p>
                      <p className="text-2xl font-bold text-primary">
                        {currentPrice.toFixed(2)} {tournament.currency || 'USD'}
                      </p>
                    </div>
                    <Badge variant="default">
                      {priceType}
                    </Badge>
                  </div>
                </div>

                {/* Price Tiers */}
                <div className="space-y-3">
                  <h4 className="font-medium">Price Tiers</h4>
                  <div className="grid grid-cols-1 gap-3">
                    {tournament.earlyBirdPrice && (
                      <div className={`p-3 rounded-lg border ${
                        priceType === 'Early Bird' ? 'border-green-500 bg-green-50' : 'border-muted'
                      }`}>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-green-700">Early Bird</p>
                            <p className="text-sm text-green-600">
                              Register before {formatDate(tournament.registrationStart)}
                            </p>
                          </div>
                          <p className="font-bold text-green-700">
                            {tournament.earlyBirdPrice.toFixed(2)} {tournament.currency || 'USD'}
                          </p>
                        </div>
                      </div>
                    )}
                    
                    <div className={`p-3 rounded-lg border ${
                      priceType === 'Regular' ? 'border-blue-500 bg-blue-50' : 'border-muted'
                    }`}>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-blue-700">Regular</p>
                          <p className="text-sm text-blue-600">
                            Standard registration period
                          </p>
                        </div>
                        <p className="font-bold text-blue-700">
                          {tournament.regularPrice?.toFixed(2) || '0.00'} {tournament.currency || 'USD'}
                        </p>
                      </div>
                    </div>
                    
                    {tournament.latePrice && (
                      <div className={`p-3 rounded-lg border ${
                        priceType === 'Late Registration' ? 'border-orange-500 bg-orange-50' : 'border-muted'
                      }`}>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-orange-700">Late Registration</p>
                            <p className="text-sm text-orange-600">
                              Register after {tournament.registrationEnd ? formatDate(tournament.registrationEnd) : 'deadline'}
                            </p>
                          </div>
                          <p className="font-bold text-orange-700">
                            {tournament.latePrice.toFixed(2)} {tournament.currency || 'USD'}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Registration Status */}
                <div>
                  <h4 className="font-medium mb-2">Registration Status</h4>
                  <div className="flex items-center gap-2">
                    {isRegistrationOpen() ? (
                      <>
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span className="text-green-600 font-medium">Registration is Open</span>
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="w-4 h-4 text-orange-600" />
                        <span className="text-orange-600 font-medium">Registration is Closed</span>
                      </>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {tournament._count.teams}/{tournament.maxTeams} teams registered
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Payment Methods & Terms */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Payment Methods & Terms
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Accepted Payment Methods */}
                <div>
                  <h4 className="font-medium mb-3">Accepted Payment Methods</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {paymentMethods.length > 0 ? (
                      paymentMethods.map((method: string, index: number) => (
                        <Badge key={index} variant="outline" className="justify-center">
                          {method.replace('_', ' ')}
                        </Badge>
                      ))
                    ) : (
                      <div className="col-span-2 text-center text-muted-foreground py-4">
                        <CreditCard className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No specific payment methods set</p>
                        <p className="text-xs">All standard payment methods accepted</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Payment Terms */}
                {tournament.paymentTerms && (
                  <div>
                    <h4 className="font-medium mb-2">Payment Terms</h4>
                    <div className="bg-muted p-3 rounded-lg">
                      <p className="text-sm text-muted-foreground">
                        {tournament.paymentTerms}
                      </p>
                    </div>
                  </div>
                )}

                {/* Security Notice */}
                <Alert>
                  <Shield className="h-4 w-4" />
                  <AlertDescription>
                    All payments are secure and encrypted. We use industry-standard security measures 
                    to protect your financial information. Your registration will be confirmed 
                    immediately upon successful payment.
                  </AlertDescription>
                </Alert>

                {/* Refund Policy */}
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Refund Policy:</strong> Refunds are available up to 7 days before the tournament 
                    starts. A 10% processing fee may apply. No refunds will be issued within 7 days 
                    of the tournament start date.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Schedule Tab */}
        <TabsContent value="schedule">
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Tournament Timeline */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Tournament Timeline
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {/* Registration Period */}
                  <div className="flex items-start gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-medium">
                      1
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-blue-900">Registration Period</h4>
                      <p className="text-sm text-blue-700">
                        {formatDate(tournament.registrationStart)} - {
                          tournament.registrationEnd ? formatDate(tournament.registrationEnd) : 'Ongoing'
                        }
                      </p>
                      <p className="text-xs text-blue-600 mt-1">
                        Teams can register during this period
                      </p>
                    </div>
                  </div>

                  {/* Tournament Start */}
                  <div className="flex items-start gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex-shrink-0 w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-medium">
                      2
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-green-900">Tournament Start</h4>
                      <p className="text-sm text-green-700">
                        {formatDate(tournament.tournamentStart)}
                      </p>
                      <p className="text-xs text-green-600 mt-1">
                        Tournament officially begins
                      </p>
                    </div>
                  </div>

                  {/* Tournament End */}
                  {tournament.tournamentEnd && (
                    <div className="flex items-start gap-3 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                      <div className="flex-shrink-0 w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center text-sm font-medium">
                        3
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-purple-900">Tournament End</h4>
                        <p className="text-sm text-purple-700">
                          {formatDate(tournament.tournamentEnd)}
                        </p>
                        <p className="text-xs text-purple-600 mt-1">
                          Tournament concludes and winners are announced
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Important Dates */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Important Dates & Deadlines
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Registration Opens</span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {formatDate(tournament.registrationStart)}
                    </span>
                  </div>

                  {tournament.registrationEnd && (
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Registration Closes</span>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {formatDate(tournament.registrationEnd)}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-2">
                      <Trophy className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Tournament Starts</span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {formatDate(tournament.tournamentStart)}
                    </span>
                  </div>

                  {tournament.tournamentEnd && (
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-2">
                        <Award className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Tournament Ends</span>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {formatDate(tournament.tournamentEnd)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Reminders */}
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Important Reminders:</strong>
                    <ul className="mt-2 space-y-1 text-sm">
                      <li>• All team members must be registered before the deadline</li>
                      <li>• Payment must be completed to secure your spot</li>
                      <li>• Check-in required 30 minutes before tournament start</li>
                      <li>• Rules may be subject to change, check regularly for updates</li>
                    </ul>
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Quick Actions */}
      {isRegistrationOpen() && !isOwner && (
        <Card className="mt-8">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h4 className="font-semibold">Ready to Join?</h4>
                <p className="text-sm text-muted-foreground">
                  Register now to secure your spot in this tournament
                </p>
              </div>
              <div className="flex gap-2">
                <Button asChild variant="outline">
                  <Link href={`/tournaments/${tournament.id}`}>
                    View Details
                  </Link>
                </Button>
                {tournament.regularPrice && (
                  <Button asChild>
                    <Link href={`/tournaments/${tournament.id}/payment`}>
                      <CreditCard className="w-4 h-4 mr-2" />
                      Register Now - {currentPrice.toFixed(2)} {tournament.currency || 'USD'}
                    </Link>
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}