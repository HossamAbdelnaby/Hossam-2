"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Package, 
  DollarSign, 
  Plus, 
  Edit, 
  Save, 
  X,
  CheckCircle,
  AlertTriangle,
  TrendingUp
} from "lucide-react";

interface PackagePrice {
  id: string;
  packageType: string;
  price: number;
  currency: string;
  isActive: boolean;
  updatedAt: string;
}

export default function PackagePricesPage() {
  const [packages, setPackages] = useState<PackagePrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPackage, setEditingPackage] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ price: "", currency: "USD" });
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newPackage, setNewPackage] = useState({ packageType: "", price: "", currency: "USD" });
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchPackagePrices();
  }, []);

  const fetchPackagePrices = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/packages');
      if (response.ok) {
        const data = await response.json();
        setPackages(data.packages || []);
      }
    } catch (error) {
      console.error('Error fetching package prices:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (pkg: PackagePrice) => {
    setEditingPackage(pkg.id);
    setEditForm({ price: pkg.price.toString(), currency: pkg.currency });
  };

  const handleSave = async (packageId: string) => {
    try {
      const response = await fetch(`/api/admin/packages/${packageId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          price: parseFloat(editForm.price),
          currency: editForm.currency
        })
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Package price updated successfully!' });
        setEditingPackage(null);
        fetchPackagePrices();
      } else {
        const data = await response.json();
        setMessage({ type: 'error', text: data.error || 'Failed to update package price' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error' });
    }
  };

  const handleAddPackage = async () => {
    try {
      const response = await fetch('/api/admin/packages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          packageType: newPackage.packageType,
          price: parseFloat(newPackage.price),
          currency: newPackage.currency
        })
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Package added successfully!' });
        setShowAddDialog(false);
        setNewPackage({ packageType: "", price: "", currency: "USD" });
        fetchPackagePrices();
      } else {
        const data = await response.json();
        setMessage({ type: 'error', text: data.error || 'Failed to add package' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error' });
    }
  };

  const handleToggleActive = async (packageId: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/admin/packages/${packageId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive })
      });

      if (response.ok) {
        setMessage({ type: 'success', text: `Package ${isActive ? 'activated' : 'deactivated'} successfully!` });
        fetchPackagePrices();
      } else {
        const data = await response.json();
        setMessage({ type: 'error', text: data.error || 'Failed to update package status' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error' });
    }
  };

  const getPackageDisplayName = (packageType: string) => {
    switch (packageType) {
      case 'FREE': return 'Free Package';
      case 'PAID_GRAPHICS': return 'Graphics Package';
      case 'PAID_DISCORD_BOT': return 'Discord Package';
      case 'FULL_MANAGEMENT': return 'Full Management';
      default: return packageType.replace('_', ' ');
    }
  };

  const getPackageDescription = (packageType: string) => {
    switch (packageType) {
      case 'FREE': return 'Basic tournament creation';
      case 'PAID_GRAPHICS': return 'Professional graphics and design';
      case 'PAID_DISCORD_BOT': return 'Discord integration and bot';
      case 'FULL_MANAGEMENT': return 'Complete tournament management';
      default: return 'Tournament package';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-muted rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="h-4 bg-muted rounded"></div>
                  <div className="h-4 bg-muted rounded w-2/3"></div>
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
          <h1 className="text-3xl font-bold">Package Prices</h1>
          <p className="text-muted-foreground">
            Manage tournament package pricing and availability
          </p>
        </div>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Package
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Package</DialogTitle>
              <DialogDescription>
                Create a new tournament package with custom pricing
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="packageType">Package Type</Label>
                <Input
                  id="packageType"
                  value={newPackage.packageType}
                  onChange={(e) => setNewPackage(prev => ({ ...prev, packageType: e.target.value }))}
                  placeholder="e.g., PREMIUM, ENTERPRISE"
                />
              </div>
              <div>
                <Label htmlFor="price">Price</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  value={newPackage.price}
                  onChange={(e) => setNewPackage(prev => ({ ...prev, price: e.target.value }))}
                  placeholder="0.00"
                />
              </div>
              <div>
                <Label htmlFor="currency">Currency</Label>
                <Input
                  id="currency"
                  value={newPackage.currency}
                  onChange={(e) => setNewPackage(prev => ({ ...prev, currency: e.target.value }))}
                  placeholder="USD"
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleAddPackage} disabled={!newPackage.packageType || !newPackage.price}>
                  Add Package
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

      {/* Package Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {packages.map((pkg) => (
          <Card key={pkg.id} className="relative">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="flex items-center gap-2">
                    <Package className="w-5 h-5" />
                    {getPackageDisplayName(pkg.packageType)}
                  </CardTitle>
                  <CardDescription>
                    {getPackageDescription(pkg.packageType)}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={pkg.isActive ? 'default' : 'secondary'}>
                    {pkg.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleToggleActive(pkg.id, !pkg.isActive)}
                  >
                    {pkg.isActive ? 'Deactivate' : 'Activate'}
                  </Button>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {editingPackage === pkg.id ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor={`price-${pkg.id}`}>Price</Label>
                      <Input
                        id={`price-${pkg.id}`}
                        type="number"
                        step="0.01"
                        value={editForm.price}
                        onChange={(e) => setEditForm(prev => ({ ...prev, price: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor={`currency-${pkg.id}`}>Currency</Label>
                      <Input
                        id={`currency-${pkg.id}`}
                        value={editForm.currency}
                        onChange={(e) => setEditForm(prev => ({ ...prev, currency: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => handleSave(pkg.id)}>
                      <Save className="w-4 h-4 mr-1" />
                      Save
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setEditingPackage(null)}
                    >
                      <X className="w-4 h-4 mr-1" />
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Price</span>
                    <div className="flex items-center gap-1">
                      <span className="text-2xl font-bold">{pkg.currency}</span>
                      <span className="text-2xl font-bold">{pkg.price.toLocaleString()}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Last Updated</span>
                    <span>{new Date(pkg.updatedAt).toLocaleDateString()}</span>
                  </div>
                  
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleEdit(pkg)}
                    className="w-full"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Price
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Revenue Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Revenue Overview
          </CardTitle>
          <CardDescription>
            Estimated revenue based on current package pricing
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-primary">
                ${packages.reduce((sum, pkg) => sum + (pkg.isActive ? pkg.price : 0), 0).toLocaleString()}
              </div>
              <div className="text-sm text-muted-foreground">Total Active Package Value</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                ${packages.filter(p => p.isActive).length > 0 
                  ? Math.min(...packages.filter(p => p.isActive).map(p => p.price)).toLocaleString() 
                  : '0'}
              </div>
              <div className="text-sm text-muted-foreground">Lowest Active Price</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                ${packages.filter(p => p.isActive).length > 0 
                  ? Math.max(...packages.filter(p => p.isActive).map(p => p.price)).toLocaleString() 
                  : '0'}
              </div>
              <div className="text-sm text-muted-foreground">Highest Active Price</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}