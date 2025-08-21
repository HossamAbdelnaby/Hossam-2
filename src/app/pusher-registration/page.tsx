"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/auth-context";
import { 
  ArrowLeft, 
  UserPlus, 
  User,
  Trophy, 
  DollarSign, 
  Calendar,
  Users,
  Upload,
  MessageCircle,
  Clock,
  CheckCircle,
  Loader2,
  Save,
  Star,
  Shield
} from "lucide-react";

interface PusherProfile {
  id: string;
  trophies: number;
  realName: string;
  profilePicture?: string;
  price: number;
  paymentMethod: string;
  negotiation: boolean;
  availability: string;
  status: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    email: string;
    name?: string;
  };
}

const paymentMethods = [
  { value: "PAYPAL", label: "PayPal" },
  { value: "WESTERN_UNION", label: "Western Union" },
  { value: "BINANCE", label: "Binance" },
  { value: "CREDIT_CARD", label: "Credit Card" },
];

const availabilityOptions = [
  { value: "STAY", label: "Stay (Full Season)" },
  { value: "EOS", label: "EOS (Last Day Only)" },
];

export default function PusherRegistrationPage() {
  const [existingProfile, setExistingProfile] = useState<PusherProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  
  const [formData, setFormData] = useState({
    trophies: "",
    realName: "",
    profilePicture: "",
    price: "",
    paymentMethod: "",
    negotiation: false,
    availability: "STAY",
  });

  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchExistingProfile();
    }
  }, [user]);

  const fetchExistingProfile = async () => {
    try {
      const response = await fetch('/api/pusher/profile');
      
      if (response.ok) {
        const data = await response.json();
        setExistingProfile(data.pusher);
        setFormData({
          trophies: data.pusher.trophies.toString(),
          realName: data.pusher.realName,
          profilePicture: data.pusher.profilePicture || "",
          price: data.pusher.price.toString(),
          paymentMethod: data.pusher.paymentMethod,
          negotiation: data.pusher.negotiation,
          availability: data.pusher.availability,
        });
      }
    } catch (err) {
      // Profile doesn't exist, which is fine
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      // Validate required fields
      const trophies = parseInt(formData.trophies);
      if (isNaN(trophies) || trophies < 5000) {
        throw new Error('Minimum 5000 trophies required');
      }

      if (!formData.realName.trim()) {
        throw new Error('Real name is required');
      }

      const price = parseFloat(formData.price);
      if (isNaN(price) || price <= 0) {
        throw new Error('Valid price is required');
      }

      if (!formData.paymentMethod) {
        throw new Error('Payment method is required');
      }

      const method = existingProfile ? 'PUT' : 'POST';
      const url = existingProfile ? '/api/pusher/profile' : '/api/pusher/register';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          trophies,
          realName: formData.realName.trim(),
          profilePicture: formData.profilePicture.trim() || null,
          price,
          paymentMethod: formData.paymentMethod,
          negotiation: formData.negotiation,
          availability: formData.availability,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save profile');
      }

      const data = await response.json();
      setSuccess(true);
      
      // Redirect to profile page after a short delay
      setTimeout(() => {
        router.push('/pusher-profile');
      }, 2000);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save profile');
    } finally {
      setSubmitting(false);
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
            Please login to register as a pusher.
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

  if (success) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-md mx-auto">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <CardTitle>Profile Saved Successfully!</CardTitle>
            <CardDescription>
              Your pusher profile has been {existingProfile ? 'updated' : 'created'}.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/pusher-profile">View Profile</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <Link href="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>
        
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
            <UserPlus className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-3xl font-bold mb-2">
              {existingProfile ? 'Update Pusher Profile' : 'Register as Pusher'}
            </h1>
            <p className="text-muted-foreground">
              {existingProfile 
                ? 'Update your pusher profile and availability'
                : 'Join our elite group of pushers and get hired by top clans'
              }
            </p>
            {existingProfile && (
              <div className="flex items-center gap-2 mt-2">
                <Badge variant={existingProfile.status === 'AVAILABLE' ? 'default' : 'secondary'}>
                  {existingProfile.status}
                </Badge>
                <Badge variant="outline">
                  <Trophy className="w-3 h-3 mr-1" />
                  {existingProfile.trophies.toLocaleString()} trophies
                </Badge>
              </div>
            )}
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Player Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Player Information
            </CardTitle>
            <CardDescription>
              Tell us about yourself and your Clash of Clans experience
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="realName">Real Name *</Label>
                <Input
                  id="realName"
                  value={formData.realName}
                  onChange={(e) => handleInputChange('realName', e.target.value)}
                  placeholder="Enter your real name"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="trophies">Trophies *</Label>
                <Input
                  id="trophies"
                  type="number"
                  min="5000"
                  value={formData.trophies}
                  onChange={(e) => handleInputChange('trophies', e.target.value)}
                  placeholder="Minimum 5000 trophies"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Must have at least 5000 trophies to register as a pusher
                </p>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="profilePicture">Profile Picture URL</Label>
              <Input
                id="profilePicture"
                value={formData.profilePicture}
                onChange={(e) => handleInputChange('profilePicture', e.target.value)}
                placeholder="https://example.com/profile.jpg"
                type="url"
              />
            </div>
          </CardContent>
        </Card>

        {/* Services & Pricing */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Services & Pricing
            </CardTitle>
            <CardDescription>
              Set your rates and availability for pusher services
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Price (USD) *</Label>
                <Input
                  id="price"
                  type="number"
                  min="1"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => handleInputChange('price', e.target.value)}
                  placeholder="Enter your price"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="paymentMethod">Preferred Payment Method *</Label>
                <Select value={formData.paymentMethod} onValueChange={(value) => handleInputChange('paymentMethod', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select payment method" />
                  </SelectTrigger>
                  <SelectContent>
                    {paymentMethods.map(method => (
                      <SelectItem key={method.value} value={method.value}>
                        {method.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="availability">Availability *</Label>
              <Select value={formData.availability} onValueChange={(value) => handleInputChange('availability', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select availability" />
                </SelectTrigger>
                <SelectContent>
                  {availabilityOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Choose whether you're available for the full season or just end-of-season pushes
              </p>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="negotiation">Open to Negotiation</Label>
                <p className="text-sm text-muted-foreground">
                  Allow clients to negotiate your rates
                </p>
              </div>
              <Switch
                id="negotiation"
                checked={formData.negotiation}
                onCheckedChange={(checked) => handleInputChange('negotiation', checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Requirements & Benefits */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Requirements & Benefits
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium mb-3 text-destructive">Requirements</h4>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <Trophy className="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" />
                    Minimum 5000 trophies
                  </li>
                  <li className="flex items-start gap-2">
                    <Star className="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" />
                    Proven track record in wars
                  </li>
                  <li className="flex items-start gap-2">
                    <Clock className="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" />
                    Reliable and punctual
                  </li>
                  <li className="flex items-start gap-2">
                    <MessageCircle className="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" />
                    Good communication skills
                  </li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium mb-3 text-primary">Benefits</h4>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <DollarSign className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    Competitive compensation
                  </li>
                  <li className="flex items-start gap-2">
                    <Users className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    Work with top clans
                  </li>
                  <li className="flex items-start gap-2">
                    <Calendar className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    Flexible scheduling
                  </li>
                  <li className="flex items-start gap-2">
                    <Shield className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    Protected payments
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" asChild>
            <Link href="/">Cancel</Link>
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {existingProfile ? 'Updating...' : 'Creating...'}
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                {existingProfile ? 'Update Profile' : 'Create Profile'}
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}