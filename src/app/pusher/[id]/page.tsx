"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/contexts/auth-context";
import { 
  ArrowLeft, 
  User, 
  Trophy, 
  DollarSign, 
  Calendar,
  Users,
  MessageCircle,
  Clock,
  CheckCircle,
  Loader2,
  Star,
  Shield,
  Globe,
  MapPin,
  Send
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
  _count: {
    contracts: number;
  };
}

export default function PusherProfilePage() {
  const [pusher, setPusher] = useState<PusherProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showHireDialog, setShowHireDialog] = useState(false);
  
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  
  const pusherId = params.id as string;

  useEffect(() => {
    fetchPusher();
  }, [pusherId]);

  const fetchPusher = async () => {
    try {
      const response = await fetch(`/api/pusher/${pusherId}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          setError('Pusher not found');
        } else {
          setError('Failed to fetch pusher');
        }
        return;
      }

      const data = await response.json();
      setPusher(data.pusher);
    } catch (err) {
      setError('Failed to fetch pusher');
    } finally {
      setLoading(false);
    }
  };

  const handleHirePusher = () => {
    if (!user) {
      router.push('/login');
      return;
    }
    router.push(`/rent-pusher?hire=${pusherId}`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'AVAILABLE': return 'default';
      case 'HIRED': return 'secondary';
      case 'UNAVAILABLE': return 'destructive';
      default: return 'secondary';
    }
  };

  const getAvailabilityColor = (availability: string) => {
    switch (availability) {
      case 'STAY': return 'default';
      case 'EOS': return 'secondary';
      default: return 'secondary';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (error || !pusher) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">{error || 'Pusher not found'}</h1>
          <Button asChild>
            <Link href="/rent-pusher">Back to Pushers</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <Link href="/rent-pusher" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="w-4 h-4" />
          Back to Pushers
        </Link>
        
        <div className="flex items-start gap-6">
          <div className="flex-shrink-0">
            {pusher.profilePicture ? (
              <img 
                src={pusher.profilePicture} 
                alt={pusher.realName}
                className="w-24 h-24 rounded-lg object-cover"
              />
            ) : (
              <div className="w-24 h-24 bg-primary rounded-lg flex items-center justify-center">
                <User className="w-12 h-12 text-primary-foreground" />
              </div>
            )}
          </div>
          
          <div className="flex-1">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold mb-2">{pusher.realName}</h1>
                <p className="text-muted-foreground mb-3">
                  {pusher.user.name || pusher.user.email}
                </p>
                <div className="flex items-center gap-3 flex-wrap">
                  <Badge variant={getStatusColor(pusher.status)}>
                    {pusher.status}
                  </Badge>
                  <Badge variant={getAvailabilityColor(pusher.availability)}>
                    {pusher.availability === 'STAY' ? 'Full Season' : 'EOS Only'}
                  </Badge>
                </div>
              </div>
              
              <Button 
                size="lg"
                disabled={pusher.status !== 'AVAILABLE'}
                onClick={handleHirePusher}
                className="gap-2"
              >
                <Send className="w-4 h-4" />
                {pusher.status === 'AVAILABLE' ? 'Hire Pusher' : 'Unavailable'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Stats Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Stats</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-muted rounded-lg">
                  <div className="flex items-center justify-center gap-1 text-2xl font-bold text-primary">
                    <Trophy className="w-5 h-5" />
                    {pusher.trophies.toLocaleString()}
                  </div>
                  <div className="text-sm text-muted-foreground">Trophies</div>
                </div>
                
                <div className="text-center p-4 bg-muted rounded-lg">
                  <div className="flex items-center justify-center gap-1 text-2xl font-bold text-primary">
                    <DollarSign className="w-5 h-5" />
                    ${pusher.price}
                  </div>
                  <div className="text-sm text-muted-foreground">Price</div>
                </div>
                
                <div className="text-center p-4 bg-muted rounded-lg">
                  <div className="flex items-center justify-center gap-1 text-2xl font-bold text-primary">
                    <Users className="w-5 h-5" />
                    {pusher._count.contracts}
                  </div>
                  <div className="text-sm text-muted-foreground">Contracts</div>
                </div>
                
                <div className="text-center p-4 bg-muted rounded-lg">
                  <div className="flex items-center justify-center gap-1 text-2xl font-bold text-primary">
                    <Clock className="w-5 h-5" />
                    {Math.floor((Date.now() - new Date(pusher.createdAt).getTime()) / (1000 * 60 * 60 * 24))}
                  </div>
                  <div className="text-sm text-muted-foreground">Days Active</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Service Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="w-5 h-5" />
                Service Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Pricing</h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-muted-foreground" />
                      <span>${pusher.price} per service</span>
                    </div>
                    {pusher.negotiation && (
                      <div className="flex items-center gap-2">
                        <MessageCircle className="w-4 h-4 text-muted-foreground" />
                        <span>Open to negotiation</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Availability</h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span>{pusher.availability === 'STAY' ? 'Full Season' : 'End of Season Only'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4 text-muted-foreground" />
                      <span>Accepts {pusher.paymentMethod}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Experience</h4>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  <span>Member since {formatDate(pusher.createdAt)}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                  <Users className="w-4 h-4" />
                  <span>{pusher._count.contracts} contract{pusher._count.contracts !== 1 ? 's' : ''} completed</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Requirements */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Requirements & Expectations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-3 text-primary">What I Offer</h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                      Professional war attacks
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                      Reliable attendance
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                      Clear communication
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                      Strategic gameplay
                    </li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-medium mb-3 text-destructive">What I Expect</h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <Star className="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" />
                      Timely payments
                    </li>
                    <li className="flex items-start gap-2">
                      <Star className="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" />
                      Clear instructions
                    </li>
                    <li className="flex items-start gap-2">
                      <Star className="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" />
                      Respectful communication
                    </li>
                    <li className="flex items-start gap-2">
                      <Star className="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" />
                  Professional environment
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Contact Info */}
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-muted-foreground" />
                <span>{pusher.user.name || pusher.user.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-muted-foreground" />
                <span>{pusher.paymentMethod}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                <span>Available Worldwide</span>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button 
                className="w-full"
                disabled={pusher.status !== 'AVAILABLE'}
                onClick={handleHirePusher}
              >
                <Send className="w-4 h-4 mr-2" />
                Hire This Pusher
              </Button>
              
              <Button variant="outline" className="w-full" asChild>
                <Link href="/rent-pusher">
                  <Users className="w-4 h-4 mr-2" />
                  Browse Other Pushers
                </Link>
              </Button>
              
              {user && user.id !== pusher.user.id && (
                <Button variant="outline" className="w-full">
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Send Message
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Status */}
          <Card>
            <CardHeader>
              <CardTitle>Current Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Availability</span>
                  <Badge variant={getStatusColor(pusher.status)}>
                    {pusher.status}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm">Service Type</span>
                  <Badge variant={getAvailabilityColor(pusher.availability)}>
                    {pusher.availability === 'STAY' ? 'Full Season' : 'EOS Only'}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm">Negotiation</span>
                  <Badge variant={pusher.negotiation ? 'default' : 'secondary'}>
                    {pusher.negotiation ? 'Open' : 'Fixed Price'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}