"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/auth-context";
import { 
  Trophy, 
  Star, 
  Users, 
  Settings, 
  Zap,
  Crown,
  Image,
  Bot,
  Video,
  Share2,
  ArrowLeft,
  Loader2
} from "lucide-react";

const tournamentPackages = [
  {
    id: "free",
    name: "Free Package",
    price: "Free",
    description: "Perfect for beginners and small tournaments",
    features: [
      "1 tournament per week",
      "Basic bracket types (Single/Double Elimination, Swiss)",
      "Team registration management",
      "Basic tournament hosting"
    ],
    icon: Trophy,
    popular: false,
    color: "bg-blue-500"
  },
  {
    id: "graphics",
    name: "Graphics Package",
    price: "$29",
    description: "Professional tournaments with custom graphics",
    features: [
      "All Free features",
      "Logo creation",
      "Professional graphic design",
      "Multiple bracket types (Group Stage, Leaderboard)",
      "Custom graphic requests",
      "Priority support"
    ],
    icon: Image,
    popular: true,
    color: "bg-purple-500"
  },
  {
    id: "discord",
    name: "Discord Package",
    price: "$49",
    description: "Complete solution with Discord integration",
    features: [
      "All Graphics features",
      "Discord server setup help",
      "Custom chat bot",
      "Automated tournament management",
      "Real-time notifications",
      "Discord integration"
    ],
    icon: Bot,
    popular: false,
    color: "bg-green-500"
  },
  {
    id: "full",
    name: "Full Management",
    price: "$99",
    description: "Premium experience with complete management",
    features: [
      "All Discord features",
      "Admin-player chat system",
      "Social media management",
      "Professional advertising",
      "Video editing services",
      "24/7 dedicated support",
      "Tournament promotion"
    ],
    icon: Crown,
    popular: false,
    color: "bg-orange-500"
  }
];

export default function CreateTournamentPage() {
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading } = useAuth();

  useEffect(() => {
    const packageParam = searchParams.get('package');
    if (packageParam && tournamentPackages.find(pkg => pkg.id === packageParam)) {
      setSelectedPackage(packageParam);
    }
  }, [searchParams]);

  const handlePackageSelect = (packageId: string) => {
    setSelectedPackage(packageId);
  };

  const handleContinue = () => {
    if (selectedPackage) {
      router.push(`/create-tournament/form?package=${selectedPackage}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">Authentication Required</h1>
          <p className="text-muted-foreground mb-8">
            Please login or register to create a tournament.
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

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <Link href="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>
        <h1 className="text-4xl font-bold mb-4">Create Tournament</h1>
        <p className="text-xl text-muted-foreground max-w-3xl">
          Choose the perfect package for your tournament. From free basic tournaments to fully managed professional events.
        </p>
      </div>

      {/* Package Selection */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {tournamentPackages.map((pkg) => {
          const Icon = pkg.icon;
          const isSelected = selectedPackage === pkg.id;
          
          return (
            <Card 
              key={pkg.id} 
              className={`cursor-pointer transition-all hover:shadow-lg ${
                isSelected ? 'ring-2 ring-primary shadow-lg' : ''
              } ${pkg.popular ? 'relative' : ''}`}
              onClick={() => handlePackageSelect(pkg.id)}
            >
              {pkg.popular && (
                <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2 z-10">
                  Most Popular
                </Badge>
              )}
              
              <CardHeader className="text-center pb-4">
                <div className={`w-16 h-16 ${pkg.color} rounded-full flex items-center justify-center mx-auto mb-4`}>
                  <Icon className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-xl">{pkg.name}</CardTitle>
                <div className="text-3xl font-bold text-primary">{pkg.price}</div>
                <CardDescription>{pkg.description}</CardDescription>
              </CardHeader>
              
              <CardContent className="pt-0">
                <ul className="space-y-2 mb-6">
                  {pkg.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <Star className="w-4 h-4 text-primary fill-current mt-0.5 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <div className="text-center">
                  <div className={`w-4 h-4 rounded-full border-2 ${
                    isSelected 
                      ? 'bg-primary border-primary' 
                      : 'border-muted-foreground'
                  } mx-auto`} />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Continue Button */}
      <div className="text-center">
        <Button 
          size="lg" 
          onClick={handleContinue}
          disabled={!selectedPackage}
          className="gap-2"
        >
          {selectedPackage ? (
            <>
              Continue with {tournamentPackages.find(pkg => pkg.id === selectedPackage)?.name}
              <Zap className="w-5 h-5" />
            </>
          ) : (
            "Select a Package to Continue"
          )}
        </Button>
        
        {!selectedPackage && (
          <p className="text-muted-foreground mt-2">
            Please select a tournament package above
          </p>
        )}
      </div>

      {/* Package Comparison */}
      <div className="mt-16 bg-muted/50 rounded-lg p-8">
        <h2 className="text-2xl font-bold mb-6 text-center">Package Comparison</h2>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left p-4">Features</th>
                {tournamentPackages.map(pkg => (
                  <th key={pkg.id} className="text-center p-4">
                    {pkg.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <td className="p-4 font-medium">Tournaments per week</td>
                {tournamentPackages.map(pkg => (
                  <td key={pkg.id} className="text-center p-4">
                    {pkg.id === 'free' ? '1' : 'Unlimited'}
                  </td>
                ))}
              </tr>
              <tr className="border-b">
                <td className="p-4 font-medium">Basic bracket types</td>
                {tournamentPackages.map(pkg => (
                  <td key={pkg.id} className="text-center p-4">
                    <Star className="w-4 h-4 text-primary fill-current mx-auto" />
                  </td>
                ))}
              </tr>
              <tr className="border-b">
                <td className="p-4 font-medium">Advanced bracket types</td>
                {tournamentPackages.map(pkg => (
                  <td key={pkg.id} className="text-center p-4">
                    {pkg.id !== 'free' ? (
                      <Star className="w-4 h-4 text-primary fill-current mx-auto" />
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </td>
                ))}
              </tr>
              <tr className="border-b">
                <td className="p-4 font-medium">Graphic design</td>
                {tournamentPackages.map(pkg => (
                  <td key={pkg.id} className="text-center p-4">
                    {pkg.id === 'graphics' || pkg.id === 'discord' || pkg.id === 'full' ? (
                      <Star className="w-4 h-4 text-primary fill-current mx-auto" />
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </td>
                ))}
              </tr>
              <tr className="border-b">
                <td className="p-4 font-medium">Discord integration</td>
                {tournamentPackages.map(pkg => (
                  <td key={pkg.id} className="text-center p-4">
                    {pkg.id === 'discord' || pkg.id === 'full' ? (
                      <Star className="w-4 h-4 text-primary fill-current mx-auto" />
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </td>
                ))}
              </tr>
              <tr className="border-b">
                <td className="p-4 font-medium">Full management</td>
                {tournamentPackages.map(pkg => (
                  <td key={pkg.id} className="text-center p-4">
                    {pkg.id === 'full' ? (
                      <Star className="w-4 h-4 text-primary fill-current mx-auto" />
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}