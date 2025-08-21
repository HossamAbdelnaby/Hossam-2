"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  CreditCard, 
  Plus, 
  Edit, 
  Save, 
  X,
  CheckCircle,
  AlertTriangle,
  Settings,
  TestTube,
  Trash2,
  Eye,
  ToggleLeft,
  ToggleRight,
  Globe,
  Shield,
  Zap
} from "lucide-react";

interface PaymentGateway {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  isActive: boolean;
  config: string; // JSON string
  updatedAt: string;
}

interface GatewayConfig {
  apiKey?: string;
  secretKey?: string;
  webhookUrl?: string;
  environment?: 'sandbox' | 'production';
  currency?: string;
  supportedCountries?: string[];
  fees?: {
    percentage?: number;
    fixed?: number;
  };
}

export default function PaymentGatewayManagementPage() {
  const [gateways, setGateways] = useState<PaymentGateway[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingGateway, setEditingGateway] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    displayName: "",
    description: "",
    config: "{}"
  });
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newGateway, setNewGateway] = useState({
    name: "",
    displayName: "",
    description: "",
    config: "{}"
  });
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchPaymentGateways();
  }, []);

  const fetchPaymentGateways = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/payments/gateways');
      if (response.ok) {
        const data = await response.json();
        setGateways(data.gateways || []);
      }
    } catch (error) {
      console.error('Error fetching payment gateways:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (gateway: PaymentGateway) => {
    setEditingGateway(gateway.id);
    setEditForm({
      displayName: gateway.displayName,
      description: gateway.description || "",
      config: gateway.config
    });
  };

  const handleSave = async (gatewayId: string) => {
    try {
      const response = await fetch(`/api/admin/payments/gateways/${gatewayId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Payment gateway updated successfully!' });
        setEditingGateway(null);
        fetchPaymentGateways();
      } else {
        const data = await response.json();
        setMessage({ type: 'error', text: data.error || 'Failed to update payment gateway' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error' });
    }
  };

  const handleAddGateway = async () => {
    try {
      const response = await fetch('/api/admin/payments/gateways', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newGateway)
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Payment gateway added successfully!' });
        setShowAddDialog(false);
        setNewGateway({ name: "", displayName: "", description: "", config: "{}" });
        fetchPaymentGateways();
      } else {
        const data = await response.json();
        setMessage({ type: 'error', text: data.error || 'Failed to add payment gateway' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error' });
    }
  };

  const handleToggleActive = async (gatewayId: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/admin/payments/gateways/${gatewayId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive })
      });

      if (response.ok) {
        setMessage({ type: 'success', text: `Payment gateway ${isActive ? 'activated' : 'deactivated'} successfully!` });
        fetchPaymentGateways();
      } else {
        const data = await response.json();
        setMessage({ type: 'error', text: data.error || 'Failed to update gateway status' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error' });
    }
  };

  const handleTestGateway = async (gatewayId: string) => {
    try {
      const response = await fetch(`/api/admin/payments/gateways/${gatewayId}/test`, {
        method: 'POST'
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Gateway test completed successfully!' });
      } else {
        const data = await response.json();
        setMessage({ type: 'error', text: data.error || 'Gateway test failed' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error during test' });
    }
  };

  const parseConfig = (configString: string): GatewayConfig => {
    try {
      return JSON.parse(configString);
    } catch {
      return {};
    }
  };

  const formatConfig = (config: GatewayConfig): string => {
    return JSON.stringify(config, null, 2);
  };

  const getGatewayIcon = (name: string) => {
    switch (name.toLowerCase()) {
      case 'stripe': return CreditCard;
      case 'paypal': return Globe;
      case 'binance': return Zap;
      case 'western_union': return Globe;
      default: return CreditCard;
    }
  };

  const getGatewayStatus = (gateway: PaymentGateway) => {
    const config = parseConfig(gateway.config);
    if (!config.apiKey || !config.secretKey) {
      return { status: 'incomplete', color: 'yellow', text: 'Incomplete Setup' };
    }
    return { 
      status: gateway.isActive ? 'active' : 'inactive', 
      color: gateway.isActive ? 'green' : 'gray',
      text: gateway.isActive ? 'Active' : 'Inactive'
    };
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4">
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
          <h1 className="text-3xl font-bold">Payment Gateway Management</h1>
          <p className="text-muted-foreground">
            Configure and manage payment processing gateways
          </p>
        </div>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Gateway
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add Payment Gateway</DialogTitle>
              <DialogDescription>
                Configure a new payment gateway for the platform
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Gateway Name</Label>
                  <Input
                    id="name"
                    value={newGateway.name}
                    onChange={(e) => setNewGateway(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., stripe, paypal"
                  />
                </div>
                <div>
                  <Label htmlFor="displayName">Display Name</Label>
                  <Input
                    id="displayName"
                    value={newGateway.displayName}
                    onChange={(e) => setNewGateway(prev => ({ ...prev, displayName: e.target.value }))}
                    placeholder="e.g., Stripe, PayPal"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newGateway.description}
                  onChange={(e) => setNewGateway(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Gateway description and features"
                  rows={3}
                />
              </div>
              
              <div>
                <Label htmlFor="config">Configuration (JSON)</Label>
                <Textarea
                  id="config"
                  value={newGateway.config}
                  onChange={(e) => setNewGateway(prev => ({ ...prev, config: e.target.value }))}
                  placeholder='{"apiKey": "", "secretKey": "", "environment": "sandbox"}'
                  rows={6}
                  className="font-mono text-sm"
                />
              </div>
              
              <div className="flex gap-2">
                <Button onClick={handleAddGateway} disabled={!newGateway.name || !newGateway.displayName}>
                  Add Gateway
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

      {/* Gateway Grid */}
      <div className="grid gap-6">
        {gateways.map((gateway) => {
          const GatewayIcon = getGatewayIcon(gateway.name);
          const status = getGatewayStatus(gateway);
          const config = parseConfig(gateway.config);
          
          return (
            <Card key={gateway.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-3">
                      <GatewayIcon className="w-6 h-6 text-primary" />
                      <div>
                        <CardTitle className="text-xl">{gateway.displayName}</CardTitle>
                        <CardDescription className="text-sm">
                          {gateway.name} • {gateway.description}
                        </CardDescription>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Badge variant={status.color === 'green' ? 'default' : 'secondary'}>
                        {status.text}
                      </Badge>
                      {status.status === 'incomplete' && (
                        <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                          Setup Required
                        </Badge>
                      )}
                      {gateway.isActive ? (
                        <Badge variant="outline" className="text-green-600 border-green-600">
                          <ToggleRight className="w-3 h-3 mr-1" />
                          Enabled
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-gray-600 border-gray-600">
                          <ToggleLeft className="w-3 h-3 mr-1" />
                          Disabled
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleTestGateway(gateway.id)}
                    >
                      <TestTube className="w-4 h-4 mr-1" />
                      Test
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleToggleActive(gateway.id, !gateway.isActive)}
                    >
                      {gateway.isActive ? 'Disable' : 'Enable'}
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleEdit(gateway)}
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {editingGateway === gateway.id ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor={`displayName-${gateway.id}`}>Display Name</Label>
                        <Input
                          id={`displayName-${gateway.id}`}
                          value={editForm.displayName}
                          onChange={(e) => setEditForm(prev => ({ ...prev, displayName: e.target.value }))}
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor={`description-${gateway.id}`}>Description</Label>
                      <Textarea
                        id={`description-${gateway.id}`}
                        value={editForm.description}
                        onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                        rows={3}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor={`config-${gateway.id}`}>Configuration (JSON)</Label>
                      <Textarea
                        id={`config-${gateway.id}`}
                        value={editForm.config}
                        onChange={(e) => setEditForm(prev => ({ ...prev, config: e.target.value }))}
                        rows={8}
                        className="font-mono text-sm"
                      />
                    </div>
                    
                    <div className="flex gap-2">
                      <Button onClick={() => handleSave(gateway.id)}>
                        <Save className="w-4 h-4 mr-1" />
                        Save
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => setEditingGateway(null)}
                      >
                        <X className="w-4 h-4 mr-1" />
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Configuration</Label>
                      <div className="mt-2 space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Environment:</span>
                          <Badge variant={config.environment === 'production' ? 'default' : 'secondary'}>
                            {config.environment || 'Not Set'}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">API Key:</span>
                          <code className="bg-muted px-2 py-1 rounded text-xs">
                            {config.apiKey ? '••••••••' : 'Not Set'}
                          </code>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Secret Key:</span>
                          <code className="bg-muted px-2 py-1 rounded text-xs">
                            {config.secretKey ? '••••••••' : 'Not Set'}
                          </code>
                        </div>
                        {config.currency && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Currency:</span>
                            <span>{config.currency}</span>
                          </div>
                        )}
                        {config.fees && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Fees:</span>
                            <span>
                              {config.fees.percentage ? `${config.fees.percentage}%` : ''}
                              {config.fees.percentage && config.fees.fixed ? ' + ' : ''}
                              {config.fees.fixed ? `$${config.fees.fixed}` : ''}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>Last updated: {new Date(gateway.updatedAt).toLocaleDateString()}</span>
                      <Button variant="ghost" size="sm">
                        <Eye className="w-4 h-4 mr-1" />
                        View Details
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {gateways.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <CreditCard className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">No Payment Gateways</h3>
            <p className="text-muted-foreground mb-4">
              Configure payment gateways to start processing payments
            </p>
            <Button onClick={() => setShowAddDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Gateway
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Security Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Security Best Practices
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <h4 className="font-medium">API Key Security</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Use environment variables for sensitive keys</li>
                <li>• Rotate keys regularly</li>
                <li>• Use different keys for sandbox and production</li>
                <li>• Restrict key permissions to minimum required</li>
              </ul>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-medium">Gateway Configuration</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Test in sandbox mode before production</li>
                <li>• Configure webhooks for payment notifications</li>
                <li>• Set up proper error handling</li>
                <li>• Monitor transaction logs regularly</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}