"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/contexts/auth-context";
import { 
  Search, 
  Filter, 
  Users, 
  Trophy, 
  DollarSign, 
  Calendar,
  MessageCircle,
  Clock,
  Star,
  User,
  Globe,
  CheckCircle,
  Loader2,
  Send,
  Plus
} from "lucide-react";

interface Pusher {
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
  user: {
    id: string;
    email: string;
    name?: string;
  };
}

export default function RentPusherPage() {
  const [pushers, setPushers] = useState<Pusher[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [availabilityFilter, setAvailabilityFilter] = useState("all");
  const [priceFilter, setPriceFilter] = useState("all");
  const [sortBy, setSortBy] = useState("trophies");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Contract dialog state
  const [selectedPusher, setSelectedPusher] = useState<Pusher | null>(null);
  const [contractDialogOpen, setContractDialogOpen] = useState(false);
  const [contractForm, setContractForm] = useState({
    message: "",
    clanTag: "",
  });
  const [submittingContract, setSubmittingContract] = useState(false);
  const [contractSuccess, setContractSuccess] = useState(false);
  
  const { user } = useAuth();

  useEffect(() => {
    fetchPushers();
  }, [currentPage, availabilityFilter, priceFilter, sortBy]);

  const fetchPushers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "12",
        sortBy,
      });

      if (availabilityFilter !== "all") {
        params.append("availability", availabilityFilter);
      }

      if (priceFilter !== "all") {
        params.append("priceRange", priceFilter);
      }

      const response = await fetch(`/api/pusher?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch pushers');
      }

      const data = await response.json();
      setPushers(data.pushers);
      setTotalPages(data.pagination.pages);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch pushers');
    } finally {
      setLoading(false);
    }
  };

  const filteredPushers = pushers.filter(pusher =>
    pusher.realName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    pusher.user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    pusher.user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleHirePusher = (pusher: Pusher) => {
    if (!user) {
      // Redirect to login if not authenticated
      window.location.href = '/login';
      return;
    }
    setSelectedPusher(pusher);
    setContractDialogOpen(true);
  };

  const handleContractSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPusher || !user) return;

    setSubmittingContract(true);
    setError("");

    try {
      const response = await fetch('/api/pusher/contracts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pusherId: selectedPusher.id,
          message: contractForm.message,
          clanTag: contractForm.clanTag,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send contract request');
      }

      setContractSuccess(true);
      setContractDialogOpen(false);
      setContractForm({ message: "", clanTag: "" });
      setSelectedPusher(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send contract request');
    } finally {
      setSubmittingContract(false);
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
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-4xl font-bold mb-2">Find Elite Pushers</h1>
          <p className="text-muted-foreground">
            Hire skilled Clash of Clans players with 5000+ trophies
          </p>
        </div>
        
        {user && (
          <Button asChild className="gap-2">
            <Link href="/pusher-registration">
              <Plus className="w-4 h-4" />
              Become a Pusher
            </Link>
          </Button>
        )}
      </div>

      {/* Search and Filters */}
      <Card className="mb-8">
        <CardContent className="pt-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search pushers by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex gap-2">
              <Select value={availabilityFilter} onValueChange={setAvailabilityFilter}>
                <SelectTrigger className="w-full lg:w-48">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Availability" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Availability</SelectItem>
                  <SelectItem value="STAY">Full Season</SelectItem>
                  <SelectItem value="EOS">EOS Only</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={priceFilter} onValueChange={setPriceFilter}>
                <SelectTrigger className="w-full lg:w-48">
                  <DollarSign className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Price Range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Prices</SelectItem>
                  <SelectItem value="0-50">$0 - $50</SelectItem>
                  <SelectItem value="50-100">$50 - $100</SelectItem>
                  <SelectItem value="100+">$100+</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full lg:w-48">
                  <Star className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Sort By" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="trophies">Trophies</SelectItem>
                  <SelectItem value="price">Price</SelectItem>
                  <SelectItem value="rating">Rating</SelectItem>
                  <SelectItem value="newest">Newest</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error and Success Messages */}
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {contractSuccess && (
        <Alert className="mb-6 border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            Contract request sent successfully! The pusher will review your request.
          </AlertDescription>
        </Alert>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, index) => (
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
          ))}
        </div>
      ) : (
        <>
          {/* Pushers Grid */}
          {filteredPushers.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPushers.map((pusher) => (
                <Card key={pusher.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
                        <User className="w-6 h-6 text-primary-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg line-clamp-1">
                          {pusher.realName}
                        </CardTitle>
                        <CardDescription className="text-sm">
                          {pusher.user.name || pusher.user.email}
                        </CardDescription>
                        <div className="flex items-center gap-1 mt-1">
                          <Badge variant={getStatusColor(pusher.status)} className="text-xs">
                            {pusher.status}
                          </Badge>
                          <Badge variant={getAvailabilityColor(pusher.availability)} className="text-xs">
                            {pusher.availability === 'STAY' ? 'Full Season' : 'EOS'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="text-center p-2 bg-muted rounded-lg">
                        <div className="flex items-center justify-center gap-1 text-sm font-medium">
                          <Trophy className="w-3 h-3" />
                          {pusher.trophies.toLocaleString()}
                        </div>
                        <div className="text-xs text-muted-foreground">Trophies</div>
                      </div>
                      
                      <div className="text-center p-2 bg-muted rounded-lg">
                        <div className="flex items-center justify-center gap-1 text-sm font-medium">
                          <DollarSign className="w-3 h-3" />
                          ${pusher.price}
                        </div>
                        <div className="text-xs text-muted-foreground">Price</div>
                      </div>
                    </div>
                    
                    {/* Details */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Globe className="w-4 h-4 text-muted-foreground" />
                        <span>{pusher.paymentMethod}</span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <span>Member since {formatDate(pusher.createdAt)}</span>
                      </div>
                      
                      {pusher.negotiation && (
                        <div className="flex items-center gap-2 text-sm">
                          <MessageCircle className="w-4 h-4 text-muted-foreground" />
                          <span>Open to negotiation</span>
                        </div>
                      )}
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex gap-2 pt-2">
                      <Button 
                        className="flex-1"
                        disabled={pusher.status !== 'AVAILABLE'}
                        onClick={() => handleHirePusher(pusher)}
                      >
                        {pusher.status === 'AVAILABLE' ? 'Hire Pusher' : 'Unavailable'}
                      </Button>
                      
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/pusher/${pusher.id}`}>
                          View Profile
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <Users className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h2 className="text-2xl font-bold mb-2">No pushers found</h2>
              <p className="text-muted-foreground mb-6">
                {searchTerm || availabilityFilter !== "all" || priceFilter !== "all"
                  ? "Try adjusting your search or filters"
                  : "No pushers are currently available"
                }
              </p>
              
              {user && !searchTerm && availabilityFilter === "all" && priceFilter === "all" && (
                <Button asChild>
                  <Link href="/pusher-registration">
                    <Plus className="w-4 h-4 mr-2" />
                    Become a Pusher
                  </Link>
                </Button>
              )}
            </div>
          )}
        </>
      )}

      {/* Pagination */}
      {totalPages > 1 && !loading && filteredPushers.length > 0 && (
        <div className="flex justify-center gap-2 mt-8">
          <Button
            variant="outline"
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          
          <div className="flex items-center gap-2">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const page = i + 1;
              return (
                <Button
                  key={page}
                  variant={currentPage === page ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </Button>
              );
            })}
          </div>
          
          <Button
            variant="outline"
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
        </div>
      )}

      {/* Contract Dialog */}
      <Dialog open={contractDialogOpen} onOpenChange={setContractDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Hire {selectedPusher?.realName}</DialogTitle>
            <DialogDescription>
              Send a contract request to this pusher for their services.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleContractSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="clanTag">Your Clan Tag *</Label>
              <Input
                id="clanTag"
                value={contractForm.clanTag}
                onChange={(e) => setContractForm(prev => ({ ...prev, clanTag: e.target.value }))}
                placeholder="e.g., #ABC123"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="message">Message *</Label>
              <Textarea
                id="message"
                value={contractForm.message}
                onChange={(e) => setContractForm(prev => ({ ...prev, message: e.target.value }))}
                placeholder="Describe your requirements and expectations..."
                rows={4}
                required
              />
            </div>
            
            {selectedPusher && (
              <div className="bg-muted p-3 rounded-lg text-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">Service Details:</span>
                  <span className="font-semibold">${selectedPusher.price}</span>
                </div>
                <div className="text-muted-foreground">
                  Availability: {selectedPusher.availability === 'STAY' ? 'Full Season' : 'EOS Only'}
                </div>
                {selectedPusher.negotiation && (
                  <div className="text-muted-foreground">
                    This pusher is open to price negotiation
                  </div>
                )}
              </div>
            )}
            
            <div className="flex justify-end gap-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setContractDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submittingContract}>
                {submittingContract ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Send Request
                  </>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}