"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Trophy, 
  DollarSign, 
  Calendar,
  Download,
  RefreshCw,
  Activity,
  Target,
  Zap,
  Globe,
  CreditCard,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Minus
} from "lucide-react";

interface StatisticsData {
  overview: {
    totalUsers: number;
    totalTournaments: number;
    totalRevenue: number;
    activeUsers: number;
    newUsersThisMonth: number;
    newTournamentsThisMonth: number;
    revenueThisMonth: number;
  };
  userGrowth: Array<{
    date: string;
    users: number;
    newUsers: number;
  }>;
  tournamentStats: Array<{
    status: string;
    count: number;
    percentage: number;
  }>;
  revenueData: Array<{
    period: string;
    revenue: number;
    transactions: number;
  }>;
  paymentMethods: Array<{
    method: string;
    count: number;
    amount: number;
    percentage: number;
  }>;
  topOrganizers: Array<{
    name: string;
    tournaments: number;
    revenue: number;
  }>;
  systemMetrics: {
    uptime: string;
    responseTime: number;
    errorRate: number;
    activeConnections: number;
  };
}

export default function StatisticsDashboardPage() {
  const [stats, setStats] = useState<StatisticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("30d");
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchStatistics();
  }, [timeRange]);

  const fetchStatistics = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/statistics?range=${timeRange}`);
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching statistics:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchStatistics();
    setRefreshing(false);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  const getChangeIcon = (current: number, previous: number) => {
    if (current > previous) return ArrowUpRight;
    if (current < previous) return ArrowDownRight;
    return Minus;
  };

  const getChangeColor = (current: number, previous: number) => {
    if (current > previous) return 'text-green-600';
    if (current < previous) return 'text-red-600';
    return 'text-gray-600';
  };

  const calculateChange = (current: number, previous: number) => {
    if (previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-muted rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <BarChart3 className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-medium mb-2">Unable to load statistics</h3>
          <Button onClick={handleRefresh}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Statistics Dashboard</h1>
          <p className="text-muted-foreground">
            Comprehensive platform analytics and metrics
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(stats.overview.totalUsers)}</div>
            <p className="text-xs text-muted-foreground">
              {formatNumber(stats.overview.newUsersThisMonth)} new this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tournaments</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(stats.overview.totalTournaments)}</div>
            <p className="text-xs text-muted-foreground">
              {formatNumber(stats.overview.newTournamentsThisMonth)} new this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.overview.totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(stats.overview.revenueThisMonth)} this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(stats.overview.activeUsers)}</div>
            <p className="text-xs text-muted-foreground">
              {((stats.overview.activeUsers / stats.overview.totalUsers) * 100).toFixed(1)}% engagement
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Detailed Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tournament Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              Tournament Status Distribution
            </CardTitle>
            <CardDescription>
              Current status of all tournaments
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.tournamentStats.map((stat) => (
                <div key={stat.status} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-primary rounded-full"></div>
                    <span className="font-medium">{stat.status.replace('_', ' ')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      {formatNumber(stat.count)}
                    </span>
                    <Badge variant="outline">
                      {stat.percentage.toFixed(1)}%
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Payment Methods */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Payment Methods
            </CardTitle>
            <CardDescription>
              Most used payment methods
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.paymentMethods.map((method) => (
                <div key={method.method} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="font-medium">{method.method.replace('_', ' ')}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">{formatCurrency(method.amount)}</div>
                    <div className="text-sm text-muted-foreground">
                      {formatNumber(method.count)} transactions • {method.percentage.toFixed(1)}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Organizers */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5" />
              Top Tournament Organizers
            </CardTitle>
            <CardDescription>
              Most active tournament creators
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.topOrganizers.map((organizer, index) => (
                <div key={organizer.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-sm font-medium">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium">{organizer.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatNumber(organizer.tournaments)} tournaments
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">{formatCurrency(organizer.revenue)}</div>
                    <div className="text-sm text-muted-foreground">revenue</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* System Metrics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5" />
              System Performance
            </CardTitle>
            <CardDescription>
              Current system health and performance metrics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Uptime</span>
                <Badge variant="default">{stats.systemMetrics.uptime}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Response Time</span>
                <span className="text-sm">{stats.systemMetrics.responseTime}ms</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Error Rate</span>
                <Badge variant={stats.systemMetrics.errorRate > 1 ? 'destructive' : 'default'}>
                  {stats.systemMetrics.errorRate.toFixed(2)}%
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Active Connections</span>
                <span className="text-sm">{formatNumber(stats.systemMetrics.activeConnections)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Trend */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Revenue Trend
          </CardTitle>
          <CardDescription>
            Revenue and transaction volume over time
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stats.revenueData.map((data) => (
              <div key={data.period} className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">{data.period}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatNumber(data.transactions)} transactions
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold">{formatCurrency(data.revenue)}</p>
                  <div className="flex items-center gap-1 text-sm">
                    {data.revenue > 0 && (
                      <>
                        <ArrowUpRight className="w-4 h-4 text-green-600" />
                        <span className="text-green-600">Growing</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* User Growth */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            User Growth Trend
          </CardTitle>
          <CardDescription>
            Daily user growth and acquisition
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stats.userGrowth.slice(-7).map((data) => (
              <div key={data.date} className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">{new Date(data.date).toLocaleDateString()}</p>
                  <p className="text-sm text-muted-foreground">
                    Total: {formatNumber(data.users)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-green-600">+{formatNumber(data.newUsers)}</p>
                  <p className="text-sm text-muted-foreground">new users</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}