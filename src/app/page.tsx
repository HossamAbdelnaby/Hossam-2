import Link from "next/link";
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
  User
} from "lucide-react";

export default function Home() {
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