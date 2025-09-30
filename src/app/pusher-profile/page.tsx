"use client";

import { useState, useEffect } from "react";
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
  XCircle,
  Edit,
  Trash2,
  Loader2,
  Star,
  Shield,
  Globe
} from "lucide-react";

interface PusherProfile {
  id: string;
  trophies: number;
  realName: string;
  profilePicture?: string;
  description?: string;
  tagPlayer?: string;
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
  contracts: Array<{
    id: string;
    message: string;
    clanTag: string;
    status: string;
    createdAt: string;
    client: {
      id: string;
      email: string;
      name?: string;
    };
  }>;
}

export default function PusherProfilePage() {
  const [profile, setProfile] = useState<PusherProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  
  const { user } = useAuth();

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/pusher/profile');
      
      if (!response.ok) {
        if (response.status === 404) {
          setError('No pusher profile found');
        } else {
          setError('Failed to fetch profile');
        }
        return;
      }

      const data = await response.json();
      setProfile(data.pusher);
    } catch (err) {
      setError('Failed to fetch profile');
    } finally {
      setLoading(false);
    }
  };

  const handleContractAction = async (contractId: string, action: 'accept' | 'reject') => {
    try {
      const response = await fetch(`/api/pusher/contracts/${contractId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update contract');
      }

      // Refresh profile to get updated contracts
      fetchProfile();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update contract');
    }
  };

  const handleDeleteProfile = async () => {
    try {
      setDeleteLoading(true);
      
      const response = await fetch('/api/pusher/profile', {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete profile');
      }

      // Redirect to home page after successful deletion
      window.location.href = '/';
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete profile');
      setDeleteConfirm(false);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: 'AVAILABLE' | 'UNAVAILABLE') => {
    try {
      const response = await fetch('/api/pusher/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: newStatus,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update status');
      }

      // Refresh profile to get updated status
      fetchProfile();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update status');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'AVAILABLE': return 'default';
      case 'HIRED': return 'secondary';
      case 'UNAVAILABLE': return 'destructive';
      default: return 'secondary';
    }
  };

  const getContractStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'secondary';
      case 'ACCEPTED': return 'default';
      case 'REJECTED': return 'destructive';
      case 'COMPLETED': return 'outline';
      case 'CANCELLED': return 'destructive';
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
            Please login to view your pusher profile.
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

  if (error || !profile) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">{error || 'Profile not found'}</h1>
          <p className="text-muted-foreground mb-8">
            Create your pusher profile to start getting hired by clans.
          </p>
          <Button asChild>
            <Link href="/pusher-registration">Create Profile</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <Link href="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>
        
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
            <User className="w-8 h-8 text-primary-foreground" />
          </div>
          <div className="flex-1">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-3xl font-bold mb-2">{profile.realName}</h1>
                <p className="text-muted-foreground mb-2">
                  Elite Clash of Clans Pusher
                </p>
                <div className="flex items-center gap-3 flex-wrap">
                  <Badge variant={getStatusColor(profile.status)}>
                    {profile.status}
                  </Badge>
                  <Badge variant="outline">
                    <Trophy className="w-3 h-3 mr-1" />
                    {profile.trophies.toLocaleString()} trophies
                  </Badge>
                  <Badge variant="outline">
                    <DollarSign className="w-3 h-3 mr-1" />
                    ${profile.price}
                  </Badge>
                  <Badge variant="outline">
                    <Clock className="w-3 h-3 mr-1" />
                    {profile.availability === 'STAY' ? 'Full Season' : 'EOS Only'}
                  </Badge>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button variant="outline" asChild>
                  <Link href="/pusher-registration">
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Profile Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Profile Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Profile Picture */}
              {profile.profilePicture && (
                <div>
                  <h4 className="font-medium mb-2">Profile Picture</h4>
                  <div className="w-32 h-32 rounded-lg overflow-hidden">
                    <img 
                      src={profile.profilePicture} 
                      alt="Profile" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              )}
              
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Contact Information</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-muted-foreground" />
                      <span>{profile.user.name || profile.user.username}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4 text-muted-foreground" />
                      <span>{profile.paymentMethod}</span>
                    </div>
                    {profile.tagPlayer && (
                      <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4 text-muted-foreground" />
                        <span>{profile.tagPlayer}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Service Details</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-muted-foreground" />
                      <span>${profile.price} per service</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span>{profile.availability === 'STAY' ? 'Full Season Availability' : 'End of Season Only'}</span>
                    </div>
                    {profile.tagPlayer && (
                      <div className="flex items-center gap-2 p-2 bg-primary/5 rounded-md">
                        <Shield className="w-4 h-4 text-primary" />
                        <span className="font-medium">Player Tag:</span>
                        <span className="font-mono text-xs">{profile.tagPlayer}</span>
                      </div>
                    )}
                    {profile.description && (
                      <div className="mt-3 p-3 bg-muted/30 rounded-md">
                        <div className="flex items-start gap-2">
                          <MessageCircle className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                          <div className="flex-1">
                            <span className="font-medium text-sm">Service Description:</span>
                            <p className="text-muted-foreground mt-1 text-sm leading-relaxed">
                              {profile.description}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                    {profile.negotiation && (
                      <div className="flex items-center gap-2">
                        <MessageCircle className="w-4 h-4 text-muted-foreground" />
                        <span>Open to negotiation</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Hiring Requests */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5" />
                Hiring Requests
              </CardTitle>
              <CardDescription>
                Manage contract requests from potential clients
              </CardDescription>
            </CardHeader>
            <CardContent>
              {profile.contracts.length > 0 ? (
                <div className="space-y-4">
                  {profile.contracts.map((contract) => (
                    <div key={contract.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium">{contract.client.name || contract.client.email}</h4>
                            <Badge variant={getContractStatusColor(contract.status)}>
                              {contract.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Clan: {contract.clanTag} • {formatDate(contract.createdAt)}
                          </p>
                        </div>
                      </div>
                      
                      <p className="text-sm mb-4">{contract.message}</p>
                      
                      {contract.status === 'PENDING' && (
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            onClick={() => handleContractAction(contract.id, 'accept')}
                            className="gap-2"
                          >
                            <CheckCircle className="w-4 h-4" />
                            Accept
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleContractAction(contract.id, 'reject')}
                            className="gap-2"
                          >
                            <XCircle className="w-4 h-4" />
                            Reject
                          </Button>
                        </div>
                      )}
                      
                      {contract.status === 'ACCEPTED' && contract.payment && contract.payment.status === 'PENDING' && (
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="gap-1">
                            <Clock className="w-3 h-3" />
                            Awaiting Payment
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            Client needs to pay ${contract.payment.amount}
                          </span>
                        </div>
                      )}
                      
                      {contract.status === 'ACCEPTED' && contract.payment && contract.payment.status === 'COMPLETED' && (
                        <div className="flex items-center gap-2">
                          <Badge variant="default" className="gap-1">
                            <CheckCircle className="w-3 h-3" />
                            Paid
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            Payment completed
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <MessageCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No hiring requests yet</p>
                  <p className="text-sm">Clients will send you requests when they're interested in your services</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Profile Status</span>
                <Badge variant={getStatusColor(profile.status)}>
                  {profile.status}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Trophies</span>
                <span className="font-medium">{profile.trophies.toLocaleString()}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Service Rate</span>
                <span className="font-medium">${profile.price}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Availability</span>
                <span className="font-medium">
                  {profile.availability === 'STAY' ? 'Full Season' : 'EOS Only'}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total Requests</span>
                <span className="font-medium">{profile.contracts.length}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Member Since</span>
                <span className="font-medium">{formatDate(profile.createdAt)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full" asChild>
                <Link href="/pusher-registration">
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Profile
                </Link>
              </Button>
              
              <Button variant="outline" className="w-full" asChild>
                <Link href="/rent-pusher">
                  <Users className="w-4 h-4 mr-2" />
                  Browse Other Pushers
                </Link>
              </Button>
              
              {profile.status === 'AVAILABLE' && (
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => handleStatusChange('UNAVAILABLE')}
                >
                  <Clock className="w-4 h-4 mr-2" />
                  Mark as Unavailable
                </Button>
              )}
              
              {profile.status === 'UNAVAILABLE' && (
                <Button 
                  className="w-full"
                  onClick={() => handleStatusChange('AVAILABLE')}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Mark as Available
                </Button>
              )}

              {/* Delete Profile Button */}
              {!deleteConfirm ? (
                <Button 
                  variant="destructive" 
                  className="w-full"
                  onClick={() => setDeleteConfirm(true)}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Profile
                </Button>
              ) : (
                <div className="space-y-2">
                  <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                    <p className="text-sm font-medium text-destructive mb-1">
                      ⚠️ Delete Profile Permanently?
                    </p>
                    <p className="text-xs text-muted-foreground">
                      This action cannot be undone. All your profile data, contracts, and messages will be permanently deleted.
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="destructive" 
                      size="sm" 
                      className="flex-1"
                      onClick={handleDeleteProfile}
                      disabled={deleteLoading}
                    >
                      {deleteLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Deleting...
                        </>
                      ) : (
                        <>
                          <Trash2 className="w-4 h-4 mr-2" />
                          Confirm Delete
                        </>
                      )}
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => setDeleteConfirm(false)}
                      disabled={deleteLoading}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Requirements Reminder */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Requirements
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <Trophy className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  Maintain 5000+ trophies
                </li>
                <li className="flex items-start gap-2">
                  <Star className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  Excellent war performance
                </li>
                <li className="flex items-start gap-2">
                  <Clock className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  Be punctual and reliable
                </li>
                <li className="flex items-start gap-2">
                  <MessageCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  Communicate effectively
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}