'use client';

import Link from "next/link";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Trophy, 
  Users, 
  UserPlus, 
  Search, 
  Plus, 
  Settings, 
  Sword, 
  Shield, 
  Crown,
  Star,
  Zap,
  Target,
  User,
  Calendar,
  MapPin,
  Clock,
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
  organizer: {
    id: string;
    username: string;
    name?: string;
  };
  _count: {
    teams: number;
  };
}

export default function Home() {
  const [upcomingTournaments, setUpcomingTournaments] = useState<Tournament[]>([]);
  const [loadingTournaments, setLoadingTournaments] = useState(true);
  
  const features = [
    {
      icon: Trophy,
      title: "Tournament Management",
      description: "Create and manage professional Clash of Clans tournaments with multiple bracket types and stages.",
      href: "/create-tournament"
    },
    {
      icon: Users,
      title: "Team Registration",
      description: "Register your team with up to 7 players and compete in exciting tournaments.",
      href: "/tournaments"
    },
    {
      icon: UserPlus,
      title: "Player for Hire",
      description: "Register as a pusher and get hired by clans needing your skills.",
      href: "/pusher-registration"
    },
    {
      icon: Search,
      title: "Find Pushers",
      description: "Hire skilled players with 5000+ trophies to strengthen your clan.",
      href: "/rent-pusher"
    },
    {
      icon: Crown,
      title: "CWL Clan Management",
      description: "Register your CWL clan or join existing clans for competitive play.",
      href: "/cwl"
    },
    {
      icon: Settings,
      title: "Extra Services",
      description: "Get training, base analysis, and custom base designs from experts.",
      href: "/services"
    }
  ];

  const tournamentPackages = [
    {
      name: "Free Package",
      price: "Free",
      description: "Perfect for beginners",
      features: ["1 tournament per week", "Basic bracket types", "Team registration"],
      popular: false,
      href: "/create-tournament?package=free"
    },
    {
      name: "Graphics Package",
      price: "$29",
      description: "Professional tournaments",
      features: ["Logo creation", "Graphic design", "Multiple stages", "Custom graphics"],
      popular: true,
      href: "/create-tournament?package=graphics"
    },
    {
      name: "Discord Package",
      price: "$49",
      description: "Complete solution",
      features: ["All graphics features", "Discord bot", "Server setup", "Chat integration"],
      popular: false,
      href: "/create-tournament?package=discord"
    },
    {
      name: "Full Management",
      price: "$99",
      description: "Premium experience",
      features: ["All features", "Admin support", "Social media", "Video editing", "Advertising"],
      popular: false,
      href: "/create-tournament?package=full"
    }
  ];

  useEffect(() => {
    fetchUpcomingTournaments();
  }, []);

  const fetchUpcomingTournaments = async () => {
    try {
      setLoadingTournaments(true);
      const response = await fetch('/api/tournaments/upcoming?limit=6');
      
      if (!response.ok) {
        throw new Error('Failed to fetch tournaments');
      }
      
      const data = await response.json();
      setUpcomingTournaments(data.tournaments || []);
    } catch (error) {
      console.error('Error fetching upcoming tournaments:', error);
    } finally {
      setLoadingTournaments(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
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

  const isUpcoming = (tournament: Tournament) => {
    const tournamentDate = new Date(tournament.tournamentStart);
    const now = new Date();
    return tournamentDate > now;
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero Section */}
      <section className="text-center py-16">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Clash of Clans Tournament Platform
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Organize professional tournaments, find skilled players, and manage your CWL clan with our comprehensive platform.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Button size="lg" asChild className="gap-2">
              <Link href="/create-tournament">
                <Plus className="w-5 h-5" />
                Create Tournament
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="gap-2">
              <Link href="/tournaments/available">
                <Trophy className="w-5 h-5" />
                Open Registration
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="gap-2">
              <Link href="/tournaments">
                <Sword className="w-5 h-5" />
                All Tournaments
              </Link>
            </Button>
          </div>
          
          {/* Login/Register Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="outline" asChild className="gap-2">
              <Link href="/login">
                <User className="w-5 h-5" />
                Sign In
              </Link>
            </Button>
            <Button size="lg" asChild className="gap-2">
              <Link href="/register">
                <UserPlus className="w-5 h-5" />
                Sign Up
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Upcoming Tournaments Section */}
      <section className="py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Upcoming Tournaments</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Discover and join exciting Clash of Clans tournaments before they start. Be the first to register!
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loadingTournaments ? (
            // Loading state
            [...Array(6)].map((_, index) => (
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
            ))
          ) : upcomingTournaments.length > 0 ? (
            // Tournaments found
            upcomingTournaments.map((tournament) => (
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
                        <MapPin className="w-3 h-3" />
                        {tournament.host}
                      </CardDescription>
                    </div>
                    <Badge variant={getStatusColor(tournament.status)} className="text-xs">
                      {tournament.status.replace('_', ' ')}
                    </Badge>
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
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span>{formatDate(tournament.tournamentStart)}</span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm">
                      <Trophy className="w-4 h-4 text-muted-foreground" />
                      <span>${tournament.prizeAmount.toLocaleString()}</span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm">
                      <Users className="w-4 h-4 text-muted-foreground" />
                      <span>{tournament._count.teams}/{tournament.maxTeams} teams</span>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 pt-2">
                    <Button asChild className="flex-1">
                      <Link href={`/tournaments/${tournament.id}`}>
                        View Details
                      </Link>
                    </Button>
                    
                    {tournament.status === 'REGISTRATION_OPEN' && (
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/tournaments/${tournament.id}/register`}>
                          Register
                        </Link>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            // No tournaments found
            <div className="col-span-full text-center py-12">
              <Clock className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">
                No upcoming tournaments
              </h3>
              <p className="text-muted-foreground mb-4">
                Be the first to create a tournament and get started!
              </p>
              <Button asChild>
                <Link href="/create-tournament">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Tournament
                </Link>
              </Button>
            </div>
          )}
        </div>
        
        <div className="text-center mt-8">
          <Button variant="outline" size="lg" asChild>
            <Link href="/tournaments">
              View All Tournaments
              <Sword className="w-4 h-4 ml-2" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Platform Features</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Everything you need to organize tournaments and manage your Clash of Clans gaming experience.
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card key={index} className="hover:shadow-lg transition-shadow cursor-pointer">
                <Link href={feature.href}>
                  <CardHeader>
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                      <Icon className="w-6 h-6 text-primary" />
                    </div>
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                    <CardDescription>{feature.description}</CardDescription>
                  </CardHeader>
                </Link>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Tournament Packages Section */}
      <section className="py-16 bg-muted/50 rounded-lg mt-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Tournament Packages</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Choose the perfect package for your tournament needs, from free basic tournaments to full professional management.
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {tournamentPackages.map((pkg, index) => (
            <Card key={index} className={`relative ${pkg.popular ? 'ring-2 ring-primary' : ''}`}>
              {pkg.popular && (
                <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                  Most Popular
                </Badge>
              )}
              <CardHeader className="text-center">
                <CardTitle className="text-xl">{pkg.name}</CardTitle>
                <div className="text-3xl font-bold text-primary">{pkg.price}</div>
                <CardDescription>{pkg.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 mb-6">
                  {pkg.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center gap-2 text-sm">
                      <Star className="w-4 h-4 text-primary fill-current" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Button asChild className="w-full">
                  <Link href={pkg.href}>Get Started</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16">
        <div className="grid md:grid-cols-4 gap-8 text-center">
          <div>
            <div className="text-4xl font-bold text-primary mb-2">500+</div>
            <div className="text-muted-foreground">Tournaments Created</div>
          </div>
          <div>
            <div className="text-4xl font-bold text-primary mb-2">1000+</div>
            <div className="text-muted-foreground">Active Players</div>
          </div>
          <div>
            <div className="text-4xl font-bold text-primary mb-2">200+</div>
            <div className="text-muted-foreground">Clans Managed</div>
          </div>
          <div>
            <div className="text-4xl font-bold text-primary mb-2">50+</div>
            <div className="text-muted-foreground">Expert Services</div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-muted-foreground mb-8">
            Join thousands of Clash of Clans players and tournament organizers using our platform.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild className="gap-2">
              <Link href="/create-tournament">
                <Zap className="w-5 h-5" />
                Start Free Tournament
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="gap-2">
              <Link href="/pusher-registration">
                <Target className="w-5 h-5" />
                Register as Pusher
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}