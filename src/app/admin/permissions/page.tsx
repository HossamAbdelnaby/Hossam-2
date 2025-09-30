"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  UserCheck, 
  Plus, 
  Search, 
  Shield, 
  Crown,
  User,
  Settings,
  Edit,
  Trash2,
  CheckCircle,
  AlertTriangle,
  Calendar,
  Key,
  Users,
  FileText,
  CreditCard,
  BarChart3,
  Database,
  Zap,
  Globe,
  Eye,
  Trophy
} from "lucide-react";

interface UserPermission {
  id: string;
  userId: string;
  user: {
    id: string;
    email: string;
    name?: string;
    role: string;
    avatar?: string;
  };
  permission: string;
  grantedBy: string;
  grantedAt: string;
  expiresAt?: string;
}

interface User {
  id: string;
  email: string;
  name?: string;
  role: string;
  avatar?: string;
  permissions: UserPermission[];
}

const PERMISSIONS = [
  // User Management
  { value: 'users:read', label: 'View Users', icon: Users, description: 'Access to user list and profiles' },
  { value: 'users:write', label: 'Manage Users', icon: UserCheck, description: 'Create, edit, and delete users' },
  { value: 'users:delete', label: 'Delete Users', icon: Trash2, description: 'Permanently delete users' },
  
  // Tournament Management
  { value: 'tournaments:read', label: 'View Tournaments', icon: Trophy, description: 'Access to tournament data' },
  { value: 'tournaments:write', label: 'Manage Tournaments', icon: Edit, description: 'Create and edit tournaments' },
  { value: 'tournaments:delete', label: 'Delete Tournaments', icon: Trash2, description: 'Delete tournaments' },
  
  // Content Management
  { value: 'content:read', label: 'View Content', icon: FileText, description: 'Access to website content' },
  { value: 'content:write', label: 'Manage Content', icon: Edit, description: 'Edit website content' },
  { value: 'content:delete', label: 'Delete Content', icon: Trash2, description: 'Delete content' },
  
  // Payment Management
  { value: 'payments:read', label: 'View Payments', icon: CreditCard, description: 'Access to payment data' },
  { value: 'payments:write', label: 'Manage Payments', icon: Settings, description: 'Manage payment settings' },
  { value: 'payments:delete', label: 'Delete Payments', icon: Trash2, description: 'Delete payment records' },
  
  // System Management
  { value: 'system:read', label: 'View System', icon: Database, description: 'Access to system data' },
  { value: 'system:write', label: 'Manage System', icon: Settings, description: 'System configuration' },
  { value: 'system:admin', label: 'Full Admin', icon: Crown, description: 'Complete system access' },
  
  // File Management
  { value: 'files:read', label: 'View Files', icon: FileText, description: 'Access to file manager' },
  { value: 'files:write', label: 'Manage Files', icon: Edit, description: 'Upload and manage files' },
  { value: 'files:delete', label: 'Delete Files', icon: Trash2, description: 'Delete files' },
  
  // Analytics
  { value: 'analytics:read', label: 'View Analytics', icon: BarChart3, description: 'Access to statistics' },
  { value: 'analytics:export', label: 'Export Data', icon: Database, description: 'Export system data' },
  
  // API Access
  { value: 'api:read', label: 'API Access', icon: Globe, description: 'Access to API endpoints' },
  { value: 'api:write', label: 'API Management', icon: Settings, description: 'Manage API settings' }
];

export default function UserPermissionsPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [permissions, setPermissions] = useState<UserPermission[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<string>("");
  const [selectedPermission, setSelectedPermission] = useState("");
  const [expirationDays, setExpirationDays] = useState("");
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchUsersAndPermissions();
  }, []);

  const fetchUsersAndPermissions = async () => {
    try {
      setLoading(true);
      const [usersRes, permissionsRes] = await Promise.all([
        fetch('/api/admin/users'),
        fetch('/api/admin/permissions')
      ]);

      if (usersRes.ok && permissionsRes.ok) {
        const usersData = await usersRes.json();
        const permissionsData = await permissionsRes.json();
        
        setUsers(usersData.users || []);
        setPermissions(permissionsData.permissions || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGrantPermission = async () => {
    if (!selectedUser || !selectedPermission) {
      setMessage({ type: 'error', text: 'Please select a user and permission' });
      return;
    }

    try {
      const response = await fetch('/api/admin/permissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedUser,
          permission: selectedPermission,
          expiresAt: expirationDays ? new Date(Date.now() + parseInt(expirationDays) * 24 * 60 * 60 * 1000).toISOString() : undefined
        })
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Permission granted successfully!' });
        setShowAddDialog(false);
        setSelectedUser("");
        setSelectedPermission("");
        setExpirationDays("");
        fetchUsersAndPermissions();
      } else {
        const data = await response.json();
        setMessage({ type: 'error', text: data.error || 'Failed to grant permission' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error' });
    }
  };

  const handleRevokePermission = async (permissionId: string) => {
    if (!confirm('Are you sure you want to revoke this permission?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/permissions/${permissionId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Permission revoked successfully!' });
        fetchUsersAndPermissions();
      } else {
        const data = await response.json();
        setMessage({ type: 'error', text: data.error || 'Failed to revoke permission' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error' });
    }
  };

  const getUserPermissions = (userId: string) => {
    return permissions.filter(p => p.userId === userId);
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN': return 'destructive';
      case 'ADMIN': return 'default';
      case 'MODERATOR': return 'secondary';
      case 'USER': return 'outline';
      default: return 'secondary';
    }
  };

  const getPermissionIcon = (permission: string) => {
    const perm = PERMISSIONS.find(p => p.value === permission);
    return perm ? perm.icon : Key;
  };

  const getPermissionLabel = (permission: string) => {
    const perm = PERMISSIONS.find(p => p.value === permission);
    return perm ? perm.label : permission;
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === "all" || user.role === roleFilter;

    return matchesSearch && matchesRole;
  });

  const groupedPermissions = permissions.reduce((acc, permission) => {
    if (!acc[permission.userId]) {
      acc[permission.userId] = [];
    }
    acc[permission.userId].push(permission);
    return acc;
  }, {} as Record<string, UserPermission[]>);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-muted rounded-full"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-muted rounded w-1/3"></div>
                    <div className="h-3 bg-muted rounded w-1/2"></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">User Permissions</h1>
          <p className="text-muted-foreground">
            Manage granular permissions and access control
          </p>
        </div>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Grant Permission
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Grant Permission</DialogTitle>
              <DialogDescription>
                Grant a specific permission to a user
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Select User</label>
                <Select value={selectedUser} onValueChange={setSelectedUser}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a user" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name || user.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Select Permission</label>
                <Select value={selectedPermission} onValueChange={setSelectedPermission}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a permission" />
                  </SelectTrigger>
                  <SelectContent>
                    {PERMISSIONS.map((permission) => {
                      const Icon = permission.icon;
                      return (
                        <SelectItem key={permission.value} value={permission.value}>
                          <div className="flex items-center gap-2">
                            <Icon className="w-4 h-4" />
                            {permission.label}
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Expires In (Optional)</label>
                <Select value={expirationDays} onValueChange={setExpirationDays}>
                  <SelectTrigger>
                    <SelectValue placeholder="No expiration" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No expiration</SelectItem>
                    <SelectItem value="1">1 day</SelectItem>
                    <SelectItem value="7">7 days</SelectItem>
                    <SelectItem value="30">30 days</SelectItem>
                    <SelectItem value="90">90 days</SelectItem>
                    <SelectItem value="365">1 year</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex gap-2">
                <Button onClick={handleGrantPermission} disabled={!selectedUser || !selectedPermission}>
                  Grant Permission
                </Button>
                <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Message */}
      {message && (
        <Alert className={message.type === 'success' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
          {message.type === 'success' ? (
            <CheckCircle className="h-4 w-4 text-green-600" />
          ) : (
            <AlertTriangle className="h-4 w-4 text-red-600" />
          )}
          <AlertDescription className={message.type === 'success' ? 'text-green-800' : 'text-red-800'}>
            {message.text}
          </AlertDescription>
        </Alert>
      )}

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Users</p>
                <p className="text-2xl font-bold">{users.length}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Permissions</p>
                <p className="text-2xl font-bold">{permissions.length}</p>
              </div>
              <Key className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Admin Users</p>
                <p className="text-2xl font-bold">{users.filter(u => u.role === 'ADMIN' || u.role === 'SUPER_ADMIN').length}</p>
              </div>
              <Shield className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Unique Permissions</p>
                <p className="text-2xl font-bold">{new Set(permissions.map(p => p.permission)).size}</p>
              </div>
              <Settings className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search users by email or name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <select 
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-3 py-2 border rounded-md text-sm"
            >
              <option value="all">All Roles</option>
              <option value="SUPER_ADMIN">Super Admin</option>
              <option value="ADMIN">Admin</option>
              <option value="MODERATOR">Moderator</option>
              <option value="USER">User</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Users List */}
      <div className="space-y-4">
        {filteredUsers.map((user) => {
          const userPermissions = getUserPermissions(user.id);
          
          return (
            <Card key={user.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                      <span className="font-medium text-primary">
                        {(user.name || user.email).charAt(0).toUpperCase()}
                      </span>
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-medium">{user.name || user.email}</h3>
                        <Badge variant={getRoleColor(user.role)}>
                          {user.role}
                        </Badge>
                        <Badge variant="outline">
                          {userPermissions.length} permissions
                        </Badge>
                      </div>
                      
                      <p className="text-sm text-muted-foreground mb-3">{user.email}</p>
                      
                      {userPermissions.length > 0 ? (
                        <div className="space-y-2">
                          <p className="text-sm font-medium text-muted-foreground">Granted Permissions:</p>
                          <div className="flex flex-wrap gap-2">
                            {userPermissions.map((permission) => {
                              const Icon = getPermissionIcon(permission.permission);
                              const isExpired = permission.expiresAt && new Date(permission.expiresAt) < new Date();
                              
                              return (
                                <Badge 
                                  key={permission.id} 
                                  variant={isExpired ? 'secondary' : 'default'}
                                  className="text-xs"
                                >
                                  <Icon className="w-3 h-3 mr-1" />
                                  {getPermissionLabel(permission.permission)}
                                  {isExpired && ' (Expired)'}
                                </Badge>
                              );
                            })}
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">No custom permissions assigned</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <a href={`/admin/users/${user.id}`}>
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </a>
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                      <a href={`/admin/users/${user.id}/edit`}>
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
                      </a>
                    </Button>
                  </div>
                </div>
                
                {userPermissions.length > 0 && (
                  <div className="mt-4 pt-4 border-t">
                    <div className="space-y-2">
                      {userPermissions.map((permission) => {
                        const Icon = getPermissionIcon(permission.permission);
                        const isExpired = permission.expiresAt && new Date(permission.expiresAt) < new Date();
                        
                        return (
                          <div key={permission.id} className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                              <Icon className="w-4 h-4 text-muted-foreground" />
                              <span className={isExpired ? 'line-through text-muted-foreground' : ''}>
                                {getPermissionLabel(permission.permission)}
                              </span>
                              {permission.expiresAt && (
                                <span className="text-xs text-muted-foreground">
                                  Expires: {new Date(permission.expiresAt).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRevokePermission(permission.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredUsers.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <UserCheck className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">No users found</h3>
            <p className="text-muted-foreground mb-4">
              Try adjusting your search or filters
            </p>
          </CardContent>
        </Card>
      )}

      {/* Permission Reference */}
      <Card>
        <CardHeader>
          <CardTitle>Permission Reference</CardTitle>
          <CardDescription>
            Available permissions and their descriptions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {PERMISSIONS.map((permission) => {
              const Icon = permission.icon;
              return (
                <div key={permission.value} className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className="w-5 h-5 text-primary" />
                    <span className="font-medium">{permission.label}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{permission.description}</p>
                  <code className="text-xs bg-muted px-2 py-1 rounded mt-2 block">
                    {permission.value}
                  </code>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}