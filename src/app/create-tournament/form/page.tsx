"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/auth-context";
import { 
  ArrowLeft, 
  Calendar, 
  DollarSign, 
  Trophy, 
  Users, 
  Image,
  Bot,
  Crown,
  Loader2,
  Save,
  CreditCard,
  Dices,
  AlertTriangle,
  Upload,
  X
} from "lucide-react";

const bracketTypes = [
  { value: "SINGLE_ELIMINATION", label: "Single Elimination" },
  { value: "DOUBLE_ELIMINATION", label: "Double Elimination" },
  { value: "SWISS", label: "Swiss" },
  { value: "GROUP_STAGE", label: "Group Stage" },
  { value: "LEADERBOARD", label: "Leaderboard" },
];

const teamSlotsOptions = [
  { value: 8, label: "8 Teams" },
  { value: 16, label: "16 Teams" },
  { value: 32, label: "32 Teams" },
  { value: 64, label: "64 Teams" },
  { value: 128, label: "128 Teams" },
  { value: 256, label: "256 Teams" },
];

const statusOptions = [
  { value: "DRAFT", label: "Draft" },
  { value: "REGISTRATION_OPEN", label: "Registration Open" },
  { value: "REGISTRATION_CLOSED", label: "Registration Closed" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "COMPLETED", label: "Completed" },
];

const paymentMethods = [
  { value: "PAYPAL", label: "PayPal" },
  { value: "WESTERN_UNION", label: "Western Union" },
  { value: "BINANCE", label: "Binance" },
  { value: "CREDIT_CARD", label: "Credit Card" },
];

const packageFeatures = {
  free: {
    bracketTypes: ["SINGLE_ELIMINATION", "DOUBLE_ELIMINATION", "SWISS"],
    showGraphics: false,
    showDiscord: false,
    showFullManagement: false,
    requiresPayment: false,
  },
  graphics: {
    bracketTypes: ["SINGLE_ELIMINATION", "DOUBLE_ELIMINATION", "SWISS", "GROUP_STAGE", "LEADERBOARD"],
    showGraphics: true,
    showDiscord: false,
    showFullManagement: false,
    requiresPayment: true,
  },
  discord: {
    bracketTypes: ["SINGLE_ELIMINATION", "DOUBLE_ELIMINATION", "SWISS", "GROUP_STAGE", "LEADERBOARD"],
    showGraphics: true,
    showDiscord: true,
    showFullManagement: false,
    requiresPayment: true,
  },
  full: {
    bracketTypes: ["SINGLE_ELIMINATION", "DOUBLE_ELIMINATION", "SWISS", "GROUP_STAGE", "LEADERBOARD"],
    showGraphics: true,
    showDiscord: true,
    showFullManagement: true,
    requiresPayment: true,
  },
};

export default function TournamentFormPage() {
  const [formData, setFormData] = useState({
    // Basic Info
    host: "",
    tournamentName: "",
    url: "",
    description: "",
    tournamentLogo: "", // New field for tournament logo
    
    // Schedule & Status
    registrationStart: "",
    registrationEnd: "",
    tournamentStart: "",
    tournamentEnd: "",
    
    // Game Info
    prizeAmount: "",
    currency: "USD",
    paymentMethods: [],
    earlyBirdPrice: "",
    regularPrice: "",
    latePrice: "",
    paymentTerms: "",
    bracketType: "", // Single bracket type for free package
    bracketTypes: [], // Multiple bracket types for paid packages
    maxTeams: 16, // Default to 16 teams
    
    // Graphics
    graphicRequests: "",
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  
  const packageType = searchParams.get('package') as keyof typeof packageFeatures;
  const features = packageFeatures[packageType] || packageFeatures.free;

  useEffect(() => {
    if (!packageType || !features) {
      router.push('/create-tournament');
    }
  }, [packageType, features, router]);

  const handleInputChange = (field: string, value: string | string[]) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleLogoUpload = async (file: File) => {
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setError('Please upload a valid image file (JPEG, PNG, GIF, or WebP)');
      return;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      setError('Image size must be less than 5MB');
      return;
    }

    try {
      setLoading(true);
      setError("");

      // Create FormData for file upload
      const uploadData = new FormData();
      uploadData.append('image', file);

      // Upload image
      const response = await fetch('/api/upload/image', {
        method: 'POST',
        body: uploadData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to upload image');
      }

      const data = await response.json();
      
      // Update form with uploaded image URL
      setFormData(prev => ({
        ...prev,
        tournamentLogo: data.url
      }));

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload logo');
    } finally {
      setLoading(false);
    }
  };

  const handleLogoRemove = () => {
    setFormData(prev => ({
      ...prev,
      tournamentLogo: ""
    }));
  };

  const handleBracketTypeChange = (type: string) => {
    if (packageType === 'free') {
      // Free package: single selection
      setFormData(prev => ({
        ...prev,
        bracketType: type,
        bracketTypes: []
      }));
    } else {
      // Paid package: multiple selection
      setFormData(prev => {
        const currentTypes = prev.bracketTypes || [];
        const isSelected = currentTypes.includes(type);
        
        return {
          ...prev,
          bracketType: type, // Keep single selection for compatibility
          bracketTypes: isSelected 
            ? currentTypes.filter(t => t !== type)
            : [...currentTypes, type]
        };
      });
    }
  };

  const generateRandomUrl = () => {
    const adjectives = ['epic', 'mega', 'ultimate', 'pro', 'elite', 'champion', 'legendary', 'master', 'grand', 'super'];
    const nouns = ['tournament', 'clash', 'battle', 'war', 'cup', 'challenge', 'arena', 'league', 'showdown', 'championship'];
    const randomAdjective = adjectives[Math.floor(Math.random() * adjectives.length)];
    const randomNoun = nouns[Math.floor(Math.random() * nouns.length)];
    const randomSuffix = Math.random().toString(36).substring(2, 8); // Generate 6 character random string
    
    const slug = `${randomAdjective}-${randomNoun}-${randomSuffix}`;
    const url = `https://example.com/${slug}`;
    
    setFormData(prev => ({
      ...prev,
      url: url
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
        if (features.requiresPayment) {
        // For paid packages: save data first, then redirect to payment
        const response = await fetch('/api/tournaments/pending', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...formData,
            packageType: mapPackageToDatabase(packageType),
            prizeAmount: parseFloat(formData.prizeAmount) || 0,
            registrationStart: new Date(formData.registrationStart),
            registrationEnd: formData.registrationEnd ? new Date(formData.registrationEnd) : null,
            tournamentStart: new Date(formData.tournamentStart),
            tournamentEnd: formData.tournamentEnd ? new Date(formData.tournamentEnd) : null,
            bracketType: packageType === 'free' ? formData.bracketType : (formData.bracketTypes[0] || formData.bracketType),
            bracketTypes: packageType === 'free' ? [formData.bracketType] : formData.bracketTypes,
            maxTeams: parseInt(formData.maxTeams.toString()),
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to save tournament data');
        }

        const data = await response.json();
        
        // Redirect to payment page with pending tournament ID
        router.push(`/payment?pendingTournamentId=${data.pendingTournament.id}&package=${packageType}`);
      } else {
        // For free packages: create tournament directly
        const response = await fetch('/api/tournaments', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...formData,
            packageType: mapPackageToDatabase(packageType),
            prizeAmount: parseFloat(formData.prizeAmount) || 0,
            registrationStart: new Date(formData.registrationStart),
            registrationEnd: formData.registrationEnd ? new Date(formData.registrationEnd) : null,
            tournamentStart: new Date(formData.tournamentStart),
            tournamentEnd: formData.tournamentEnd ? new Date(formData.tournamentEnd) : null,
            bracketType: packageType === 'free' ? formData.bracketType : (formData.bracketTypes[0] || formData.bracketType),
            bracketTypes: packageType === 'free' ? [formData.bracketType] : formData.bracketTypes,
            maxTeams: parseInt(formData.maxTeams.toString()),
            paymentCompleted: true, // Free packages don't require payment
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to create tournament');
        }

        const data = await response.json();
        
        // For free packages, just show success
        setSuccess(true);
        setTimeout(() => {
          router.push(`/tournaments/${data.tournament.id}`);
        }, 2000);
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create tournament');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">Authentication Required</h1>
          <p className="text-muted-foreground mb-8">
            Please login to create a tournament.
          </p>
          <Button asChild>
            <Link href="/login">Login</Link>
          </Button>
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
              <Trophy className="w-8 h-8 text-green-600" />
            </div>
            <CardTitle>Tournament Created Successfully!</CardTitle>
            <CardDescription>
              Your tournament has been created and is ready for participants.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/tournaments">View Tournaments</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getPackageIcon = (pkg: string) => {
    switch (pkg) {
      case 'free': return Trophy;
      case 'graphics': return Image;
      case 'discord': return Bot;
      case 'full': return Crown;
      default: return Trophy;
    }
  };

  const getPackagePrice = (pkg: string) => {
    switch (pkg) {
      case 'free': return 'Free';
      case 'graphics': return '$29';
      case 'discord': return '$49';
      case 'full': return '$99';
      default: return 'Free';
    }
  };

  const mapPackageToDatabase = (pkg: string) => {
    switch (pkg) {
      case 'free': return 'FREE';
      case 'graphics': return 'PAID_GRAPHICS';
      case 'discord': return 'PAID_DISCORD_BOT';
      case 'full': return 'FULL_MANAGEMENT';
      default: return 'FREE';
    }
  };

  const PackageIcon = getPackageIcon(packageType);

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <Link href="/create-tournament" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="w-4 h-4" />
          Back to Packages
        </Link>
        
        <div className="mb-4">
          <Alert className="border-blue-200 bg-blue-50">
            <AlertTriangle className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              {features.requiresPayment ? (
                <span>
                  <strong>Security Notice:</strong> This is a paid package. Your tournament will only be created 
                  after successful payment completion. No tournament will be created until payment is verified.
                </span>
              ) : (
                <span>
                  <strong>Free Package:</strong> Your tournament will be created immediately upon submission.
                </span>
              )}
            </AlertDescription>
          </Alert>
        </div>
        
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
            <PackageIcon className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Create Tournament</h1>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{packageType?.toUpperCase()}</Badge>
              <span className="text-lg font-semibold text-primary">
                {getPackagePrice(packageType)}
              </span>
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Basic Information
            </CardTitle>
            <CardDescription>
              Enter the basic details for your tournament
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="host">Host Name *</Label>
                <Input
                  id="host"
                  value={formData.host}
                  onChange={(e) => handleInputChange('host', e.target.value)}
                  placeholder="Enter host name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tournamentName">Tournament Name *</Label>
                <Input
                  id="tournamentName"
                  value={formData.tournamentName}
                  onChange={(e) => handleInputChange('tournamentName', e.target.value)}
                  placeholder="Enter tournament name"
                  required
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="url">Tournament URL *</Label>
              <div className="flex gap-2">
                <Input
                  id="url"
                  value={formData.url}
                  onChange={(e) => handleInputChange('url', e.target.value)}
                  placeholder="https://example.com/tournament"
                  type="url"
                  className="flex-1"
                  required
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={generateRandomUrl}
                  className="px-3"
                  title="Generate random URL"
                >
                  <Dices className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Click the dice icon to generate a random, user-friendly URL
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Describe your tournament..."
                rows={3}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="tournamentLogo" className="flex items-center gap-2">
                <Trophy className="w-4 h-4" />
                Tournament Logo
              </Label>
              <div className="flex items-center gap-4">
                {formData.tournamentLogo ? (
                  <div className="relative group">
                    <img
                      src={formData.tournamentLogo}
                      alt="Tournament Logo"
                      className="w-20 h-20 object-cover rounded-lg border-2 border-primary/20 hover:border-primary/40 transition-colors"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="w-6 h-6 p-0"
                        onClick={handleLogoRemove}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="w-20 h-20 border-2 border-dashed border-muted-foreground/25 rounded-lg flex items-center justify-center bg-muted/5 hover:bg-muted/10 transition-colors">
                    <Trophy className="w-8 h-8 text-muted-foreground/50" />
                  </div>
                )}
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => document.getElementById('logo-upload')?.click()}
                      disabled={loading}
                      className="hover:bg-primary hover:text-primary-foreground transition-colors"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      {formData.tournamentLogo ? 'Change Logo' : 'Upload Logo'}
                    </Button>
                    {formData.tournamentLogo && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleLogoRemove}
                        className="hover:bg-destructive hover:text-destructive-foreground transition-colors"
                      >
                        <X className="w-4 h-4 mr-2" />
                        Remove
                      </Button>
                    )}
                  </div>
                  <input
                    id="logo-upload"
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleLogoUpload(file);
                    }}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    JPEG, PNG, GIF, or WebP (max 5MB)
                  </p>
                  {formData.tournamentLogo && (
                    <p className="text-xs text-green-600 mt-1">
                      ✓ Logo uploaded successfully
                    </p>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Schedule & Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Schedule & Status
            </CardTitle>
            <CardDescription>
              Set the tournament dates. Tournament status will be automatically managed based on these dates.
              <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Automatic Status Management:</strong> Tournament status will automatically transition based on your dates:
                </p>
                <ul className="text-sm text-blue-800 mt-2 ml-4 list-disc">
                  <li>Draft → Before Registration Start</li>
                  <li>Registration Open → From Registration Start until Registration End</li>
                  <li>Registration Closed → From Registration End until Tournament Start</li>
                  <li>In Progress → From Tournament Start until Tournament End</li>
                  <li>Completed → After Tournament End</li>
                </ul>
              </div>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="registrationStart">Registration Start *</Label>
                <Input
                  id="registrationStart"
                  type="datetime-local"
                  value={formData.registrationStart}
                  onChange={(e) => handleInputChange('registrationStart', e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="registrationEnd">Registration End *</Label>
                <Input
                  id="registrationEnd"
                  type="datetime-local"
                  value={formData.registrationEnd}
                  onChange={(e) => handleInputChange('registrationEnd', e.target.value)}
                  required
                />
              </div>
            </div>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tournamentStart">Tournament Start *</Label>
                <Input
                  id="tournamentStart"
                  type="datetime-local"
                  value={formData.tournamentStart}
                  onChange={(e) => handleInputChange('tournamentStart', e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="tournamentEnd">Tournament End *</Label>
                <Input
                  id="tournamentEnd"
                  type="datetime-local"
                  value={formData.tournamentEnd}
                  onChange={(e) => handleInputChange('tournamentEnd', e.target.value)}
                  required
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Game Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5" />
              Game Information
            </CardTitle>
            <CardDescription>
              Set up the tournament structure and prizes
              {packageType === 'free' && (
                <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Free Package:</strong> Choose one bracket type for your tournament stage.
                  </p>
                </div>
              )}
              {packageType !== 'free' && (
                <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-800">
                    <strong>Paid Package:</strong> Select multiple bracket types for your tournament. You can run different tournament stages with various bracket formats.
                  </p>
                </div>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="prizeAmount">Prize Amount (USD) *</Label>
              <Input
                id="prizeAmount"
                type="number"
                min="0"
                step="0.01"
                value={formData.prizeAmount}
                onChange={(e) => handleInputChange('prizeAmount', e.target.value)}
                placeholder="0.00"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label>
                {packageType === 'free' ? 'Bracket Type *' : 'Bracket Types *'}
                {packageType !== 'free' && (
                  <span className="text-sm text-muted-foreground ml-2">
                    (Select all that apply)
                  </span>
                )}
              </Label>
              <div className="grid md:grid-cols-1 gap-3">
                {bracketTypes
                  .filter(type => features.bracketTypes.includes(type.value))
                  .map(type => {
                    const isSelected = packageType === 'free' 
                      ? formData.bracketType === type.value
                      : formData.bracketTypes?.includes(type.value);
                    
                    return (
                      <div key={type.value} className="flex items-center space-x-2">
                        <input
                          type={packageType === 'free' ? "radio" : "checkbox"}
                          id={type.value}
                          name={packageType === 'free' ? "bracketType" : `bracketType-${type.value}`}
                          value={type.value}
                          checked={isSelected}
                          onChange={() => handleBracketTypeChange(type.value)}
                          className="w-4 h-4 text-primary border-gray-300 focus:ring-primary focus:ring-2"
                        />
                        <Label htmlFor={type.value} className="text-sm cursor-pointer">
                          {type.label}
                        </Label>
                      </div>
                    );
                  })}
              </div>
              {packageType === 'free' && !formData.bracketType && (
                <p className="text-sm text-destructive">Please select a bracket type</p>
              )}
              {packageType !== 'free' && (!formData.bracketTypes || formData.bracketTypes.length === 0) && (
                <p className="text-sm text-destructive">Please select at least one bracket type</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label>Team Slots *</Label>
              <Select value={formData.maxTeams.toString()} onValueChange={(value) => handleInputChange('maxTeams', parseInt(value))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select number of teams" />
                </SelectTrigger>
                <SelectContent>
                  {teamSlotsOptions.map(option => (
                    <SelectItem key={option.value} value={option.value.toString()}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                Maximum number of teams that can participate in this tournament
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Graphics Section */}
        {features.showGraphics && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Image className="w-5 h-5" alt="Graphic design icon" />
                Graphic Design
              </CardTitle>
              <CardDescription>
                Tell us about your graphic design requirements
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="graphicRequests">Graphic Design Requests</Label>
                <Textarea
                  id="graphicRequests"
                  value={formData.graphicRequests}
                  onChange={(e) => handleInputChange('graphicRequests', e.target.value)}
                  placeholder="Describe your logo, banner, and other graphic design needs..."
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Payment Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Payment Information
            </CardTitle>
            <CardDescription>
              Configure payment settings for your tournament
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="currency">Currency *</Label>
                <Select value={formData.currency || 'USD'} onValueChange={(value) => handleInputChange('currency', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD - US Dollar</SelectItem>
                    <SelectItem value="EUR">EUR - Euro</SelectItem>
                    <SelectItem value="GBP">GBP - British Pound</SelectItem>
                    <SelectItem value="JPY">JPY - Japanese Yen</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="paymentMethods">Accepted Payment Methods *</Label>
                <div className="grid grid-cols-2 gap-2">
                  {paymentMethods.map((method) => (
                    <label key={method.value} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.paymentMethods?.includes(method.value) || false}
                        onChange={(e) => {
                          const currentMethods = formData.paymentMethods || [];
                          if (e.target.checked) {
                            handleInputChange('paymentMethods', [...currentMethods, method.value]);
                          } else {
                            handleInputChange('paymentMethods', currentMethods.filter((m: string) => m !== method.value));
                          }
                        }}
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm">{method.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="grid md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="earlyBirdPrice">Early Bird Price</Label>
                <Input
                  id="earlyBirdPrice"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.earlyBirdPrice || ''}
                  onChange={(e) => handleInputChange('earlyBirdPrice', e.target.value)}
                  placeholder="0.00"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="regularPrice">Regular Price *</Label>
                <Input
                  id="regularPrice"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.regularPrice || ''}
                  onChange={(e) => handleInputChange('regularPrice', e.target.value)}
                  placeholder="0.00"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="latePrice">Late Price</Label>
                <Input
                  id="latePrice"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.latePrice || ''}
                  onChange={(e) => handleInputChange('latePrice', e.target.value)}
                  placeholder="0.00"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="paymentTerms">Payment Terms & Conditions</Label>
              <Textarea
                id="paymentTerms"
                value={formData.paymentTerms || ''}
                onChange={(e) => handleInputChange('paymentTerms', e.target.value)}
                placeholder="Specify payment terms, refund policy, etc."
                rows={3}
              />
            </div>
            
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Payment processing fees may apply depending on the selected payment methods. 
                Participants will be redirected to the payment page after registration.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* Payment Section - Hidden for all packages, will be handled after tournament creation */}
        {/* Payment section is removed to work like free package */}

        {/* Submit Button */}
        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" asChild>
            <Link href="/create-tournament">Cancel</Link>
          </Button>
          <Button type="submit" disabled={loading || !formData.bracketType || !formData.maxTeams}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Create Tournament
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}