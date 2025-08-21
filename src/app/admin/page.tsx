"use client";

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useAuth } from '@/contexts/auth-context'
import { 
  Users, 
  Trophy, 
  DollarSign, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  FileText,
  Image,
  CreditCard,
  BarChart3,
  Shield,
  Database,
  Package,
  Settings,
  Edit,
  Eye,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Server,
  Globe,
  UserCheck
} from 'lucide-react'

interface DashboardStats {
  totalUsers: number
  totalTournaments: number
  totalRevenue: number
  activeTournaments: number
  pendingPayments: number
  totalFiles: number
  activeGateways: number
  recentActivity: Array<{
    id: string
    action: string
    target: string
    user: string
    timestamp: string
  }>
}

interface SystemHealth {
  status: 'healthy' | 'warning' | 'error'
  uptime: string
  memory: string
  disk: string
  cpu: string
}

export default function AdminDashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true)
      
      // Fetch users and tournaments for basic stats
      const [usersRes, tournamentsRes, paymentsRes] = await Promise.all([
        fetch('/api/admin/users'),
        fetch('/api/admin/tournaments'),
        fetch('/api/admin/payments')
      ])

      if (usersRes.ok && tournamentsRes.ok) {
        const usersData = await usersRes.json()
        const tournamentsData = await tournamentsRes.json()
        const paymentsData = paymentsRes.ok ? await paymentsRes.json() : { payments: [] }
        
        const totalUsers = usersData.users?.length || 0
        const totalTournaments = tournamentsData.tournaments?.length || 0
        const activeTournaments = tournamentsData.tournaments?.filter((t: any) => 
          t.status === 'IN_PROGRESS' || t.status === 'REGISTRATION_OPEN'
        ).length || 0
        const totalRevenue = paymentsData.payments?.filter((p: any) => p.status === 'COMPLETED')
          .reduce((sum: number, p: any) => sum + p.amount, 0) || 0
        const pendingPayments = paymentsData.payments?.filter((p: any) => p.status === 'PENDING').length || 0
        
        setStats({
          totalUsers,
          totalTournaments,
          totalRevenue,
          activeTournaments,
          pendingPayments,
          totalFiles: 0, // Would fetch from files API
          activeGateways: 0, // Would fetch from gateways API
          recentActivity: [
            {
              id: '1',
              action: 'User Registration',
              target: 'New User',
              user: 'System',
              timestamp: new Date().toISOString()
            },
            {
              id: '2',
              action: 'Tournament Created',
              target: 'Summer Championship',
              user: 'Admin',
              timestamp: new Date(Date.now() - 3600000).toISOString()
            }
          ]
        })
      }

      // Mock system health data
      setSystemHealth({
        status: 'healthy',
        uptime: '15 days, 4 hours',
        memory: '2.1 GB / 8 GB',
        disk: '45 GB / 100 GB',
        cpu: '12%'
      })
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getHealthColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600'
      case 'warning': return 'text-yellow-600'
      case 'error': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  const getHealthIcon = (status: string) => {
    switch (status) {
      case 'healthy': return CheckCircle
      case 'warning': return AlertTriangle
      case 'error': return AlertTriangle
      default: return Activity
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 bg-muted rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Welcome back, {user?.name || 'Admin'}!</h1>
          <p className="text-muted-foreground">
            Here's what's happening with your platform today.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={user?.role === 'SUPER_ADMIN' ? 'destructive' : 'default'}>
            {user?.role}
          </Badge>
        </div>
      </div>

      {/* Main Stats Grid */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                Registered users
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tournaments</CardTitle>
              <Trophy className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalTournaments}</div>
              <p className="text-xs text-muted-foreground">
                {stats.activeTournaments} active
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${stats.totalRevenue.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                Total earnings
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendingPayments}</div>
              <p className="text-xs text-muted-foreground">
                Payments to review
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <Button variant="outline" className="h-20 flex-col" asChild>
          <a href="/admin/users">
            <Users className="h-6 w-6 mb-2" />
            <span className="text-xs">Manage Users</span>
          </a>
        </Button>
        
        <Button variant="outline" className="h-20 flex-col" asChild>
          <a href="/admin/tournaments">
            <Trophy className="h-6 w-6 mb-2" />
            <span className="text-xs">Tournaments</span>
          </a>
        </Button>
        
        <Button variant="outline" className="h-20 flex-col" asChild>
          <a href="/admin/packages">
            <Package className="h-6 w-6 mb-2" />
            <span className="text-xs">Package Prices</span>
          </a>
        </Button>
        
        <Button variant="outline" className="h-20 flex-col" asChild>
          <a href="/admin/content">
            <Edit className="h-6 w-6 mb-2" />
            <span className="text-xs">Content</span>
          </a>
        </Button>
        
        <Button variant="outline" className="h-20 flex-col" asChild>
          <a href="/admin/files">
            <Image className="h-6 w-6 mb-2" alt="Files icon" />
            <span className="text-xs">Files</span>
          </a>
        </Button>
        
        <Button variant="outline" className="h-20 flex-col" asChild>
          <a href="/admin/payments">
            <CreditCard className="h-6 w-6 mb-2" />
            <span className="text-xs">Payments</span>
          </a>
        </Button>
      </div>

      {/* System Health & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* System Health */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="h-5 w-5" />
              System Health
            </CardTitle>
            <CardDescription>
              Current system status and performance
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {systemHealth && (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Status</span>
                  <div className="flex items-center gap-2">
                    {(() => {
                      const Icon = getHealthIcon(systemHealth.status)
                      return <Icon className={`h-4 w-4 ${getHealthColor(systemHealth.status)}`} />
                    })()}
                    <span className={`text-sm font-medium ${getHealthColor(systemHealth.status)}`}>
                      {systemHealth.status.charAt(0).toUpperCase() + systemHealth.status.slice(1)}
                    </span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Uptime</span>
                    <span className="font-medium">{systemHealth.uptime}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>Memory Usage</span>
                    <span className="font-medium">{systemHealth.memory}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>Disk Usage</span>
                    <span className="font-medium">{systemHealth.disk}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>CPU Usage</span>
                    <span className="font-medium">{systemHealth.cpu}</span>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Recent Activity
            </CardTitle>
            <CardDescription>
              Latest admin actions and system events
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[200px]">
              <div className="space-y-3">
                {stats?.recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3 text-sm">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium">{activity.action}</p>
                      <p className="text-muted-foreground">{activity.target}</p>
                      <p className="text-xs text-muted-foreground">
                        {activity.user} • {new Date(activity.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Content Management
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">Total Content Items</span>
                <span className="font-medium">24</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Active Pages</span>
                <span className="font-medium">18</span>
              </div>
              <Button variant="outline" size="sm" className="w-full mt-2" asChild>
                <a href="/admin/content">Manage Content</a>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Image className="h-5 w-5" alt="File Manager icon" />
              File Manager
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">Total Files</span>
                <span className="font-medium">{stats?.totalFiles || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Storage Used</span>
                <span className="font-medium">2.3 GB</span>
              </div>
              <Button variant="outline" size="sm" className="w-full mt-2" asChild>
                <a href="/admin/files">Manage Files</a>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCheck className="h-5 w-5" />
              User Permissions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">Admin Users</span>
                <span className="font-medium">3</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Custom Permissions</span>
                <span className="font-medium">12</span>
              </div>
              <Button variant="outline" size="sm" className="w-full mt-2" asChild>
                <a href="/admin/permissions">Manage Permissions</a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}