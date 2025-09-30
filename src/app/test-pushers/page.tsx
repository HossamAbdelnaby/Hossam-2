"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  User, 
  RefreshCw, 
  Trophy,
  DollarSign,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Eye,
  ExternalLink
} from "lucide-react";

interface Pusher {
  id: string;
  trophies: number;
  realName: string;
  price: number;
  status: 'AVAILABLE' | 'HIRED' | 'UNAVAILABLE';
  isActive: boolean;
  user: {
    email: string;
    username: string;
  };
}

interface APIResponse {
  message: string;
  pushers: Pusher[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  stats: {
    totalPushers: number;
    availablePushers: number;
    hiredPushers: number;
    averagePrice: number;
    totalContracts: number;
  };
}

export default function TestPushersPage() {
  const [apiResponse, setApiResponse] = useState<APIResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [rawResponse, setRawResponse] = useState("");

  const testAPI = async () => {
    setLoading(true);
    setError("");
    setRawResponse("");
    
    try {
      console.log('🧪 Testing API endpoint...');
      
      const response = await fetch('/api/admin/pushers?limit=10', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Important for cookies
      });
      
      console.log('📡 Response status:', response.status);
      console.log('📡 Response headers:', response.headers);
      
      const responseText = await response.text();
      setRawResponse(responseText);
      
      console.log('📄 Raw response:', responseText);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${responseText}`);
      }
      
      const data = JSON.parse(responseText);
      setApiResponse(data);
      
      console.log('✅ API Response:', data);
      
    } catch (err) {
      console.error('❌ API Test Error:', err);
      setError(err instanceof Error ? err.message : 'Failed to test API');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'AVAILABLE':
        return <Badge className="bg-green-100 text-green-800">Available</Badge>;
      case 'HIRED':
        return <Badge className="bg-blue-100 text-blue-800">Hired</Badge>;
      case 'UNAVAILABLE':
        return <Badge className="bg-red-100 text-red-800">Unavailable</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">🧪 Pushers API Test</h1>
            <p className="text-muted-foreground">
              Test the admin pushers API endpoint directly
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={testAPI} disabled={loading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Test API
            </Button>
            <Button variant="outline" asChild>
              <a href="/admin/pushers" target="_blank" rel="noopener noreferrer">
                <Eye className="w-4 h-4 mr-2" />
                Admin Page
              </a>
            </Button>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>API Test Failed:</strong> {error}
            </AlertDescription>
          </Alert>
        )}

        {/* API Response */}
        {apiResponse && (
          <div className="grid gap-6">
            {/* Stats */}
            <Card>
              <CardHeader>
                <CardTitle>📊 API Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {apiResponse.stats.totalPushers}
                    </div>
                    <div className="text-sm text-muted-foreground">Total Pushers</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {apiResponse.stats.availablePushers}
                    </div>
                    <div className="text-sm text-muted-foreground">Available</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {apiResponse.stats.hiredPushers}
                    </div>
                    <div className="text-sm text-muted-foreground">Hired</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      ${apiResponse.stats.averagePrice}
                    </div>
                    <div className="text-sm text-muted-foreground">Avg Price</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">
                      {apiResponse.stats.totalContracts}
                    </div>
                    <div className="text-sm text-muted-foreground">Contracts</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Pushers List */}
            <Card>
              <CardHeader>
                <CardTitle>🎯 Pushers Data ({apiResponse.pushers.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {apiResponse.pushers.length === 0 ? (
                  <div className="text-center py-8">
                    <User className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-medium mb-2">No pushers found</h3>
                    <p className="text-muted-foreground">
                      The API returned no pusher data
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {apiResponse.pushers.map((pusher) => (
                      <div key={pusher.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                            <User className="w-5 h-5 text-primary-foreground" />
                          </div>
                          <div>
                            <div className="font-medium">{pusher.realName}</div>
                            <div className="text-sm text-muted-foreground">@{pusher.user.username}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2 text-sm">
                            <Trophy className="w-4 h-4 text-yellow-500" />
                            {pusher.trophies.toLocaleString()}
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <DollarSign className="w-4 h-4 text-green-600" />
                            ${pusher.price}
                          </div>
                          {getStatusBadge(pusher.status)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Response Info */}
            <Card>
              <CardHeader>
                <CardTitle>📋 Response Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <div className="font-medium">Message</div>
                    <div className="text-muted-foreground">{apiResponse.message}</div>
                  </div>
                  <div>
                    <div className="font-medium">Total</div>
                    <div className="text-muted-foreground">{apiResponse.total}</div>
                  </div>
                  <div>
                    <div className="font-medium">Page</div>
                    <div className="text-muted-foreground">{apiResponse.page} / {apiResponse.totalPages}</div>
                  </div>
                  <div>
                    <div className="font-medium">Limit</div>
                    <div className="text-muted-foreground">{apiResponse.limit}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Raw Response */}
        {rawResponse && (
          <Card>
            <CardHeader>
              <CardTitle>📄 Raw API Response</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="bg-muted p-4 rounded text-sm overflow-auto max-h-96">
                {rawResponse}
              </pre>
            </CardContent>
          </Card>
        )}

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>🔧 Troubleshooting Steps</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span><strong>Step 1:</strong> Click "Test API" to check if the endpoint works</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span><strong>Step 2:</strong> If you see data here but not in admin page, it's a frontend issue</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span><strong>Step 3:</strong> Check browser console (F12) for JavaScript errors</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span><strong>Step 4:</strong> Make sure you're logged in as an admin</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span><strong>Step 5:</strong> Try opening admin page in private/incognito window</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}