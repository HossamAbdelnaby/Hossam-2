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

interface TournamentPackage {
  id: string;
  packageType: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  features: string; // JSON string
  color: string;
  isActive: boolean;
  isEditable: boolean;
}

const getPackageIcon = (packageType: string) => {
  switch (packageType) {
    case 'FREE': return Trophy;
    case 'PAID_GRAPHICS': return Image;
    case 'PAID_DISCORD_BOT': return Bot;
    case 'FULL_MANAGEMENT': return Crown;
    default: return Trophy;
  }
};

const getPackageId = (packageType: string) => {
  switch (packageType) {
    case 'FREE': return 'free';
    case 'PAID_GRAPHICS': return 'graphics';
    case 'PAID_DISCORD_BOT': return 'discord';
    case 'FULL_MANAGEMENT': return 'full';
    default: return packageType.toLowerCase();
  }
};

const parseFeatures = (featuresJson: string): string[] => {
  try {
    return JSON.parse(featuresJson || '[]');
  } catch (error) {
    console.error('Error parsing features JSON:', error);
    return [];
  }
};

export default function CreateTournamentPage() {
  const [packages, setPackages] = useState<TournamentPackage[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    fetchPackages();
  }, []);

  useEffect(() => {
    const packageParam = searchParams.get('package');
    if (packageParam && packages.find(pkg => getPackageId(pkg.packageType) === packageParam)) {
      setSelectedPackage(packageParam);
    }
  }, [searchParams, packages]);

  const fetchPackages = async () => {
    try {
      const response = await fetch('/api/admin/packages');
      if (response.ok) {
        const data = await response.json();
        // Filter active packages and sort by price
        const activePackages = data.packages
          .filter((pkg: TournamentPackage) => pkg.isActive)
          .sort((a: TournamentPackage, b: TournamentPackage) => a.price - b.price);
        setPackages(activePackages);
      }
    } catch (error) {
      console.error('Error fetching packages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePackageSelect = (packageId: string) => {
    setSelectedPackage(packageId);
  };

  const handleContinue = () => {
    if (selectedPackage) {
      router.push(`/create-tournament/form?package=${selectedPackage}`);
    }
  };

  if (loading || authLoading) {
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
        {packages.map((pkg) => {
          const Icon = getPackageIcon(pkg.packageType);
          const packageId = getPackageId(pkg.packageType);
          const isSelected = selectedPackage === packageId;
          const isPopular = pkg.packageType === 'PAID_GRAPHICS'; // Most popular package
          
          return (
            <Card 
              key={pkg.id} 
              className={`cursor-pointer transition-all hover:shadow-lg ${
                isSelected ? 'ring-2 ring-primary shadow-lg' : ''
              } ${isPopular ? 'relative' : ''}`}
              onClick={() => handlePackageSelect(packageId)}
            >
              {isPopular && (
                <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2 z-10">
                  Most Popular
                </Badge>
              )}
              
              <CardHeader className="text-center pb-4">
                <div 
                  className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                  style={{ backgroundColor: pkg.color }}
                >
                  <Icon className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-xl">{pkg.name || pkg.packageType.replace(/_/g, ' ')}</CardTitle>
                <div className="text-3xl font-bold text-primary">
                  {pkg.price === 0 ? 'Free' : `${pkg.currency}${pkg.price.toLocaleString()}`}
                </div>
                <CardDescription>{pkg.description}</CardDescription>
              </CardHeader>
              
              <CardContent className="pt-0">
                <ul className="space-y-2 mb-6">
                  {parseFeatures(pkg.features).slice(0, 4).map((feature, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <Star className="w-4 h-4 text-primary fill-current mt-0.5 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                  {parseFeatures(pkg.features).length > 4 && (
                    <li className="text-xs text-muted-foreground pl-6">
                      +{parseFeatures(pkg.features).length - 4} more features
                    </li>
                  )}
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
              Continue with {packages.find(pkg => getPackageId(pkg.packageType) === selectedPackage)?.name || 'Selected Package'}
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
      {packages.length > 0 && (
        <div className="mt-16 bg-muted/50 rounded-lg p-8">
          <h2 className="text-2xl font-bold mb-6 text-center">Package Comparison</h2>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-4">Features</th>
                  {packages.map(pkg => (
                    <th key={pkg.id} className="text-center p-4">
                      {pkg.name || pkg.packageType.replace(/_/g, ' ')}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="p-4 font-medium">Price</td>
                  {packages.map(pkg => (
                    <td key={pkg.id} className="text-center p-4">
                      <span className="font-bold">
                        {pkg.price === 0 ? 'Free' : `${pkg.currency}${pkg.price.toLocaleString()}`}
                      </span>
                    </td>
                  ))}
                </tr>
                <tr className="border-b">
                  <td className="p-4 font-medium">Tournaments per week</td>
                  {packages.map(pkg => (
                    <td key={pkg.id} className="text-center p-4">
                      {pkg.packageType === 'FREE' ? '1' : 'Unlimited'}
                    </td>
                  ))}
                </tr>
                <tr className="border-b">
                  <td className="p-4 font-medium">Basic bracket types</td>
                  {packages.map(pkg => (
                    <td key={pkg.id} className="text-center p-4">
                      <Star className="w-4 h-4 text-primary fill-current mx-auto" />
                    </td>
                  ))}
                </tr>
                <tr className="border-b">
                  <td className="p-4 font-medium">Advanced bracket types</td>
                  {packages.map(pkg => (
                    <td key={pkg.id} className="text-center p-4">
                      {pkg.packageType !== 'FREE' ? (
                        <Star className="w-4 h-4 text-primary fill-current mx-auto" />
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </td>
                  ))}
                </tr>
                <tr className="border-b">
                  <td className="p-4 font-medium">Graphic design</td>
                  {packages.map(pkg => (
                    <td key={pkg.id} className="text-center p-4">
                      {pkg.packageType === 'PAID_GRAPHICS' || pkg.packageType === 'PAID_DISCORD_BOT' || pkg.packageType === 'FULL_MANAGEMENT' ? (
                        <Star className="w-4 h-4 text-primary fill-current mx-auto" />
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </td>
                  ))}
                </tr>
                <tr className="border-b">
                  <td className="p-4 font-medium">Discord integration</td>
                  {packages.map(pkg => (
                    <td key={pkg.id} className="text-center p-4">
                      {pkg.packageType === 'PAID_DISCORD_BOT' || pkg.packageType === 'FULL_MANAGEMENT' ? (
                        <Star className="w-4 h-4 text-primary fill-current mx-auto" />
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </td>
                  ))}
                </tr>
                <tr className="border-b">
                  <td className="p-4 font-medium">Full management</td>
                  {packages.map(pkg => (
                    <td key={pkg.id} className="text-center p-4">
                      {pkg.packageType === 'FULL_MANAGEMENT' ? (
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
      )}
    </div>
  );
}