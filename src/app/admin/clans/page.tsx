"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { 
  Shield, 
  Search, 
  RefreshCw, 
  Eye,
  Trophy,
  DollarSign,
  Users,
  CheckCircle,
  XCircle,
  Calendar,
  Mail,
  Phone,
  Star,
  Filter,
  Download,
  Crown,
  Activity,
  BarChart3,
  UserPlus,
  Target,
  Zap,
  Trash2,
  AlertTriangle
} from "lucide-react";

interface Clan {
  id: string;
  name: string;
  tag: string;
  playerCount: number;
  offeredPayment: number;
  terms?: string;
  leagueLevel?: number;
  membersNeeded: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  owner: {
    id: string;
    email: string;
    username: string;
    name?: string;
    phone?: string;
  };
  members: Array<{
    id: string;
    status: string;
    joinedAt: string;
    user: {
      id: string;
      username: string;
      name?: string;
    };
  }>;
  applications: Array<{
    id: string;
    status: string;
    createdAt: string;
    user: {
      id: string;
      username: string;
      name?: string;
    };
  }>;
}

interface ClansResponse {
  clans: Clan[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  stats: {
    totalClans: number;
    activeClans: number;
    totalMembers: number;
    averagePayment: number;
    totalApplications: number;
  };
}

export default function AdminClansPage() {
  const [clans, setClans] = useState<Clan[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalClans, setTotalClans] = useState(0);
  const [stats, setStats] = useState<any>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    leagueLevel: 'all',
    minMembers: '',
    maxPayment: '',
    isActive: 'all',
    limit: 20
  });

  useEffect(() => {
    fetchClans();
  }, [currentPage, filters]);

  const fetchClans = async () => {
    try {
      setLoading(true);
      setError("");
      
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: filters.limit.toString(),
        ...(filters.search && { search: filters.search }),
        ...(filters.leagueLevel && filters.leagueLevel !== 'all' && { leagueLevel: filters.leagueLevel }),
        ...(filters.minMembers && { minMembers: filters.minMembers }),
        ...(filters.maxPayment && { maxPayment: filters.maxPayment }),
        ...(filters.isActive && filters.isActive !== 'all' && { isActive: filters.isActive })
      });

      const response = await fetch(`/api/admin/clans?${params}`);
      
      if (response.ok) {
        const data: ClansResponse = await response.json();
        setClans(data.clans);
        setTotalPages(data.totalPages);
        setTotalClans(data.total);
        setStats(data.stats);
      } else {
        setError("Failed to fetch clans");
      }
    } catch (error) {
      console.error('Error fetching clans:', error);
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClan = async (clanId: string) => {
    if (deleteConfirm !== clanId) {
      setDeleteConfirm(clanId);
      return;
    }

    try {
      setDeleting(true);
      const response = await fetch(`/api/admin/clans/${clanId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setClans(prev => prev.filter(c => c.id !== clanId));
        setDeleteConfirm(null);
        // Refresh data to update stats
        await fetchClans();
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to delete clan');
      }
    } catch (error) {
      console.error('Error deleting clan:', error);
      setError("Network error. Please try again.");
    } finally {
      setDeleting(false);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      leagueLevel: 'all',
      minMembers: '',
      maxPayment: '',
      isActive: 'all',
      limit: 20
    });
    setCurrentPage(1);
  };

  const updateClanStatus = async (clanId: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/admin/clans/${clanId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive })
      });

      if (response.ok) {
        fetchClans();
      }
    } catch (error) {
      console.error('Error updating clan status:', error);
    }
  };

  const getLeagueBadge = (level?: number) => {
    if (!level) return <Badge variant="outline">Unranked</Badge>;
    
    const leagueNames = ['', 'Bronze', 'Silver', 'Gold', 'Crystal', 'Master', 'Champion', 'Titan', 'Legend'];
    const leagueColors = [
      '', 'bg-amber-100 text-amber-800', 'bg-gray-100 text-gray-800', 'bg-yellow-100 text-yellow-800',
      'bg-purple-100 text-purple-800', 'bg-blue-100 text-blue-800', 'bg-green-100 text-green-800',
      'bg-orange-100 text-orange-800', 'bg-red-100 text-red-800'
    ];
    
    return (
      <Badge className={leagueColors[level] || 'bg-gray-100 text-gray-800'}>
        {leagueNames[level] || `Level ${level}`}
      </Badge>
    );
  };

  const getMemberStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case 'INACTIVE':
        return <Badge className="bg-red-100 text-red-800">Inactive</Badge>;
      case 'PENDING':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getActiveFiltersCount = () => {
    return Object.values(filters).filter(value => 
      value !== '' && 
      value !== 20 && 
      value !== 'all'
    ).length;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Clan Management</h1>
          <p className="text-muted-foreground">
            Manage and monitor all CWL clans on the platform
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchClans} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Clans</p>
                  <p className="text-2xl font-bold">{stats.totalClans}</p>
                </div>
                <Shield className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Active Clans</p>
                  <p className="text-2xl font-bold">{stats.activeClans}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Members</p>
                  <p className="text-2xl font-bold">{stats.totalMembers}</p>
                </div>
                <Users className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Avg. Payment</p>
                  <p className="text-2xl font-bold">${stats.averagePayment}</p>
                </div>
                <DollarSign className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Applications</p>
                  <p className="text-2xl font-bold">{stats.totalApplications}</p>
                </div>
                <UserPlus className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filters
            {getActiveFiltersCount() > 0 && (
              <Badge variant="secondary">{getActiveFiltersCount()} active</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-2">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search clans..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">League Level</label>
              <Select value={filters.leagueLevel} onValueChange={(value) => handleFilterChange('leagueLevel', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All levels" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All levels</SelectItem>
                  <SelectItem value="1">Bronze</SelectItem>
                  <SelectItem value="2">Silver</SelectItem>
                  <SelectItem value="3">Gold</SelectItem>
                  <SelectItem value="4">Crystal</SelectItem>
                  <SelectItem value="5">Master</SelectItem>
                  <SelectItem value="6">Champion</SelectItem>
                  <SelectItem value="7">Titan</SelectItem>
                  <SelectItem value="8">Legend</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Min Members</label>
              <Input
                type="number"
                placeholder="1"
                value={filters.minMembers}
                onChange={(e) => handleFilterChange('minMembers', e.target.value)}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Max Payment ($)</label>
              <Input
                type="number"
                placeholder="1000"
                value={filters.maxPayment}
                onChange={(e) => handleFilterChange('maxPayment', e.target.value)}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Status</label>
              <Select value={filters.isActive} onValueChange={(value) => handleFilterChange('isActive', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="true">Active</SelectItem>
                  <SelectItem value="false">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Show</label>
              <Select value={filters.limit.toString()} onValueChange={(value) => handleFilterChange('limit', parseInt(value))}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="flex justify-between items-center">
            <Button variant="outline" onClick={clearFilters}>
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Clans Table */}
      <Card>
        <CardHeader>
          <CardTitle>Clan Directory</CardTitle>
          <CardDescription>
            Showing {clans.length} of {totalClans} clans
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="w-8 h-8 animate-spin text-muted-foreground" />
              <span className="ml-2">Loading clans...</span>
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Clan</TableHead>
                      <TableHead>Owner</TableHead>
                      <TableHead>Details</TableHead>
                      <TableHead>League</TableHead>
                      <TableHead>Members</TableHead>
                      <TableHead>Applications</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {clans.length > 0 ? (
                      clans.map((clan) => (
                        <TableRow key={clan.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                                <Shield className="w-5 h-5 text-primary-foreground" />
                              </div>
                              <div>
                                <div className="font-medium">{clan.name}</div>
                                <div className="text-sm text-muted-foreground">
                                  #{clan.tag}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="font-medium">{clan.owner.name || clan.owner.username}</div>
                              <div className="text-sm text-muted-foreground">
                                @{clan.owner.username}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 text-sm">
                                <Users className="w-3 h-3 text-blue-500" />
                                {clan.playerCount} players
                              </div>
                              <div className="flex items-center gap-2 text-sm">
                                <DollarSign className="w-3 h-3 text-green-500" />
                                ${clan.offeredPayment}
                              </div>
                              <div className="flex items-center gap-2 text-sm">
                                <Target className="w-3 h-3 text-orange-500" />
                                {clan.membersNeeded} needed
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {getLeagueBadge(clan.leagueLevel)}
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <div>{clan.members.length} total</div>
                              <div className="text-muted-foreground">
                                {clan.members.filter(m => m.status === 'ACTIVE').length} active
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <div>{clan.applications.length} total</div>
                              <div className="text-muted-foreground">
                                {clan.applications.filter(a => a.status === 'PENDING').length} pending
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm text-muted-foreground">
                              {formatDate(clan.createdAt)}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button variant="outline" size="sm">
                                <Eye className="w-4 h-4" />
                              </Button>
                              {clan.isActive ? (
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => updateClanStatus(clan.id, false)}
                                >
                                  <XCircle className="w-4 h-4" />
                                </Button>
                              ) : (
                                <Button 
                                  size="sm"
                                  onClick={() => updateClanStatus(clan.id, true)}
                                >
                                  <CheckCircle className="w-4 h-4" />
                                </Button>
                              )}
                              {deleteConfirm === clan.id ? (
                                <>
                                  <Button 
                                    variant="destructive" 
                                    size="sm"
                                    onClick={() => handleDeleteClan(clan.id)}
                                    disabled={deleting}
                                  >
                                    {deleting ? 'Deleting...' : 'Confirm'}
                                  </Button>
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => setDeleteConfirm(null)}
                                    disabled={deleting}
                                  >
                                    Cancel
                                  </Button>
                                </>
                              ) : (
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => handleDeleteClan(clan.id)}
                                  disabled={deleting || deleteConfirm !== null}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8">
                          <div className="flex flex-col items-center gap-2">
                            <Shield className="w-8 h-8 text-muted-foreground" />
                            <span className="text-muted-foreground">No clans found</span>
                            <Button variant="outline" onClick={clearFilters}>
                              Clear filters to see all clans
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-6">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious 
                          onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                          className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                        />
                      </PaginationItem>
                      
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        const page = i + 1;
                        return (
                          <PaginationItem key={page}>
                            <PaginationLink
                              onClick={() => setCurrentPage(page)}
                              isActive={currentPage === page}
                              className="cursor-pointer"
                            >
                              {page}
                            </PaginationLink>
                          </PaginationItem>
                        );
                      })}
                      
                      {totalPages > 5 && (
                        <>
                          <PaginationItem>
                            <span className="px-2">...</span>
                          </PaginationItem>
                          <PaginationItem>
                            <PaginationLink
                              onClick={() => setCurrentPage(totalPages)}
                              isActive={currentPage === totalPages}
                              className="cursor-pointer"
                            >
                              {totalPages}
                            </PaginationLink>
                          </PaginationItem>
                        </>
                      )}
                      
                      <PaginationItem>
                        <PaginationNext 
                          onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                          className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}