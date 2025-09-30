"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { 
  Package, 
  DollarSign, 
  Plus, 
  Edit, 
  Save, 
  X,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  Palette,
  Lock,
  Settings,
  Hash,
  Type,
  FileText,
  List
} from "lucide-react";

interface PackagePrice {
  id: string;
  packageType: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  features: string;
  color: string;
  isActive: boolean;
  isEditable: boolean;
  updatedAt: string;
}

interface FeatureInput {
  id: string;
  text: string;
}

export default function PackagePricesPage() {
  const [packages, setPackages] = useState<PackagePrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPackage, setEditingPackage] = useState<string | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  // Helper function to safely parse features JSON
  const parseFeatures = (featuresJson: string): string[] => {
    try {
      return JSON.parse(featuresJson || '[]');
    } catch (error) {
      console.error('Error parsing features JSON:', error);
      return [];
    }
  };
  
  // Edit form state
  const [editForm, setEditForm] = useState({
    name: "",
    description: "",
    price: "",
    currency: "USD",
    features: [] as FeatureInput[],
    color: "#3B82F6",
    isActive: true
  });

  // Add package form state
  const [newPackage, setNewPackage] = useState({
    packageType: "",
    name: "",
    description: "",
    price: "",
    currency: "USD",
    features: [""] as string[],
    color: "#3B82F6",
    isActive: true
  });

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
    if (!pkg.isEditable) return;
    
    setEditingPackage(pkg.id);
    const features = parseFeatures(pkg.features).map((text: string, index: number) => ({
      id: `feature-${index}`,
      text
    }));
    
    setEditForm({
      name: pkg.name,
      description: pkg.description,
      price: pkg.price.toString(),
      currency: pkg.currency,
      features,
      color: pkg.color,
      isActive: pkg.isActive
    });
  };

  const addFeatureField = () => {
    setEditForm(prev => ({
      ...prev,
      features: [...prev.features, { id: `feature-${Date.now()}`, text: "" }]
    }));
  };

  const removeFeatureField = (id: string) => {
    setEditForm(prev => ({
      ...prev,
      features: prev.features.filter(f => f.id !== id)
    }));
  };

  const updateFeatureField = (id: string, text: string) => {
    setEditForm(prev => ({
      ...prev,
      features: prev.features.map(f => f.id === id ? { ...f, text } : f)
    }));
  };

  const addNewPackageFeature = () => {
    setNewPackage(prev => ({
      ...prev,
      features: [...prev.features, ""]
    }));
  };

  const removeNewPackageFeature = (index: number) => {
    setNewPackage(prev => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index)
    }));
  };

  const updateNewPackageFeature = (index: number, text: string) => {
    setNewPackage(prev => ({
      ...prev,
      features: prev.features.map((f, i) => i === index ? text : f)
    }));
  };

  const handleSave = async (packageId: string) => {
    try {
      const features = editForm.features
        .filter(f => f.text.trim() !== "")
        .map(f => f.text.trim());

      const response = await fetch(`/api/admin/packages/${packageId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editForm.name,
          description: editForm.description,
          price: parseFloat(editForm.price),
          currency: editForm.currency,
          features,
          color: editForm.color,
          isActive: editForm.isActive
        })
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Package updated successfully!' });
        setEditingPackage(null);
        fetchPackagePrices();
      } else {
        const data = await response.json();
        setMessage({ type: 'error', text: data.error || 'Failed to update package' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error' });
    }
  };

  const handleAddPackage = async () => {
    try {
      const features = newPackage.features
        .filter(f => f.trim() !== "")
        .map(f => f.trim());

      const response = await fetch('/api/admin/packages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          packageType: newPackage.packageType,
          name: newPackage.name,
          description: newPackage.description,
          price: parseFloat(newPackage.price),
          currency: newPackage.currency,
          features,
          color: newPackage.color,
          isActive: newPackage.isActive
        })
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Package added successfully!' });
        setShowAddDialog(false);
        setNewPackage({
          packageType: "",
          name: "",
          description: "",
          price: "",
          currency: "USD",
          features: [""],
          color: "#3B82F6",
          isActive: true
        });
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

  const getPackageDisplayName = (packageType: string, name: string) => {
    return name || packageType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const getPackageDescription = (packageType: string, description: string) => {
    return description || `Tournament package: ${packageType.replace(/_/g, ' ').toLowerCase()}`;
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
          <h1 className="text-3xl font-bold">Package Management</h1>
          <p className="text-muted-foreground">
            Manage tournament packages, pricing, and features
          </p>
        </div>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Package
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Package</DialogTitle>
              <DialogDescription>
                Create a new tournament package with custom settings
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="packageType">Package Type</Label>
                  <Input
                    id="packageType"
                    value={newPackage.packageType}
                    onChange={(e) => setNewPackage(prev => ({ ...prev, packageType: e.target.value.toUpperCase() }))}
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
              </div>
              
              <div>
                <Label htmlFor="name">Display Name</Label>
                <Input
                  id="name"
                  value={newPackage.name}
                  onChange={(e) => setNewPackage(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Package display name"
                />
              </div>
              
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newPackage.description}
                  onChange={(e) => setNewPackage(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Package description"
                  rows={3}
                />
              </div>
              
              <div>
                <Label>Features</Label>
                <div className="space-y-2">
                  {newPackage.features.map((feature, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={feature}
                        onChange={(e) => updateNewPackageFeature(index, e.target.value)}
                        placeholder={`Feature ${index + 1}`}
                      />
                      {newPackage.features.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeNewPackageFeature(index)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addNewPackageFeature}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Feature
                  </Button>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="currency">Currency</Label>
                  <Input
                    id="currency"
                    value={newPackage.currency}
                    onChange={(e) => setNewPackage(prev => ({ ...prev, currency: e.target.value }))}
                    placeholder="USD"
                  />
                </div>
                <div>
                  <Label htmlFor="color">Color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="color"
                      type="color"
                      value={newPackage.color}
                      onChange={(e) => setNewPackage(prev => ({ ...prev, color: e.target.value }))}
                      className="w-16 h-10 p-1"
                    />
                    <Input
                      value={newPackage.color}
                      onChange={(e) => setNewPackage(prev => ({ ...prev, color: e.target.value }))}
                      placeholder="#3B82F6"
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="isActive">Active</Label>
                <Switch
                  id="isActive"
                  checked={newPackage.isActive}
                  onCheckedChange={(checked) => setNewPackage(prev => ({ ...prev, isActive: checked }))}
                />
              </div>
              
              <div className="flex gap-2">
                <Button 
                  onClick={handleAddPackage} 
                  disabled={!newPackage.packageType || !newPackage.price}
                >
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {packages.map((pkg) => (
          <Card key={pkg.id} className={`relative ${!pkg.isEditable ? 'border-muted' : ''}`}>
            {!pkg.isEditable && (
              <div className="absolute inset-0 bg-muted/20 rounded-lg flex items-center justify-center">
                <div className="bg-background/95 backdrop-blur-sm rounded-lg p-4 text-center">
                  <Lock className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm font-medium text-muted-foreground">Locked Package</p>
                  <p className="text-xs text-muted-foreground">This package cannot be edited</p>
                </div>
              </div>
            )}
            
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="flex items-center gap-2">
                    <div 
                      className="w-5 h-5 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: pkg.color }}
                    >
                      <Package className="w-3 h-3 text-white" />
                    </div>
                    {getPackageDisplayName(pkg.packageType, pkg.name)}
                    {!pkg.isEditable && (
                      <Lock className="w-4 h-4 text-muted-foreground" />
                    )}
                  </CardTitle>
                  <CardDescription>
                    {getPackageDescription(pkg.packageType, pkg.description)}
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
                    disabled={!pkg.isEditable}
                  >
                    {pkg.isActive ? 'Deactivate' : 'Activate'}
                  </Button>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {editingPackage === pkg.id ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor={`name-${pkg.id}`} className="flex items-center gap-2">
                        <Type className="w-4 h-4" />
                        Name
                      </Label>
                      <Input
                        id={`name-${pkg.id}`}
                        value={editForm.name}
                        onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Package name"
                      />
                    </div>
                    <div>
                      <Label htmlFor={`price-${pkg.id}`} className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4" />
                        Price
                      </Label>
                      <Input
                        id={`price-${pkg.id}`}
                        type="number"
                        step="0.01"
                        value={editForm.price}
                        onChange={(e) => setEditForm(prev => ({ ...prev, price: e.target.value }))}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor={`description-${pkg.id}`} className="flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      Description
                    </Label>
                    <Textarea
                      id={`description-${pkg.id}`}
                      value={editForm.description}
                      onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Package description"
                      rows={2}
                    />
                  </div>
                  
                  <div>
                    <Label className="flex items-center gap-2 mb-2">
                      <List className="w-4 h-4" />
                      Features
                    </Label>
                    <div className="space-y-2">
                      {editForm.features.map((feature) => (
                        <div key={feature.id} className="flex gap-2">
                          <Input
                            value={feature.text}
                            onChange={(e) => updateFeatureField(feature.id, e.target.value)}
                            placeholder="Feature description"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removeFeatureField(feature.id)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addFeatureField}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Feature
                      </Button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor={`currency-${pkg.id}`}>Currency</Label>
                      <Input
                        id={`currency-${pkg.id}`}
                        value={editForm.currency}
                        onChange={(e) => setEditForm(prev => ({ ...prev, currency: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor={`color-${pkg.id}`} className="flex items-center gap-2">
                        <Palette className="w-4 h-4" />
                        Color
                      </Label>
                      <div className="flex gap-2">
                        <Input
                          id={`color-${pkg.id}`}
                          type="color"
                          value={editForm.color}
                          onChange={(e) => setEditForm(prev => ({ ...prev, color: e.target.value }))}
                          className="w-12 h-10 p-1"
                        />
                        <Input
                          value={editForm.color}
                          onChange={(e) => setEditForm(prev => ({ ...prev, color: e.target.value }))}
                          className="flex-1"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor={`active-${pkg.id}`}>Active</Label>
                    <Switch
                      id={`active-${pkg.id}`}
                      checked={editForm.isActive}
                      onCheckedChange={(checked) => setEditForm(prev => ({ ...prev, isActive: checked }))}
                    />
                  </div>
                  
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => handleSave(pkg.id)}>
                      <Save className="w-4 h-4 mr-1" />
                      Save Changes
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
                  
                  <div>
                    <span className="text-sm text-muted-foreground block mb-2">Features</span>
                    <div className="space-y-1">
                      {parseFeatures(pkg.features).slice(0, 3).map((feature: string, index: number) => (
                        <div key={index} className="flex items-center gap-2 text-sm">
                          <div 
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: pkg.color }}
                          />
                          <span>{feature}</span>
                        </div>
                      ))}
                      {parseFeatures(pkg.features).length > 3 && (
                        <div className="text-xs text-muted-foreground">
                          +{parseFeatures(pkg.features).length - 3} more features
                        </div>
                      )}
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
                    disabled={!pkg.isEditable}
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    {pkg.isEditable ? 'Edit Package' : 'View Package'}
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