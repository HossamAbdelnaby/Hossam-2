"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  User, 
  Search, 
  RefreshCw, 
  Trophy,
  DollarSign,
  Users,
  CheckCircle,
  XCircle,
  Trash2,
  AlertTriangle
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

export default function AdminPushersPage() {
  const [pushers, setPushers] = useState<Pusher[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchPushers();
  }, []);

  const fetchPushers = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await fetch('/api/admin/pushers?limit=10');
      if (response.ok) {
        const data = await response.json();
        setPushers(data.pushers);
      } else {
        setError("Failed to fetch pushers");
      }
    } catch (error) {
      console.error('Error fetching pushers:', error);
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePusher = async (pusherId: string) => {
    if (deleteConfirm !== pusherId) {
      setDeleteConfirm(pusherId);
      return;
    }

    try {
      setDeleting(true);
      const response = await fetch(`/api/admin/pushers/${pusherId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setPushers(prev => prev.filter(p => p.id !== pusherId));
        setDeleteConfirm(null);
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to delete pusher');
      }
    } catch (error) {
      console.error('Error deleting pusher:', error);
      setError("Network error. Please try again.");
    } finally {
      setDeleting(false);
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Pusher Management</h1>
          <p className="text-muted-foreground">
            Manage and monitor all pusher players on the platform
          </p>
        </div>
        <Button variant="outline" onClick={fetchPushers} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Pushers List */}
      <Card>
        <CardHeader>
          <CardTitle>Pusher Directory</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="w-8 h-8 animate-spin text-muted-foreground" />
              <span className="ml-2">Loading pushers...</span>
            </div>
          ) : pushers.length === 0 ? (
            <div className="text-center py-8">
              <User className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">No pushers found</h3>
              <p className="text-muted-foreground">
                There are no pushers registered on the platform yet.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {pushers.map((pusher) => (
                <div key={pusher.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-primary-foreground" />
                    </div>
                    <div>
                      <div className="font-medium">{pusher.realName}</div>
                      <div className="text-sm text-muted-foreground">@{pusher.user.username}</div>
                      <div className="text-sm text-muted-foreground">{pusher.user.email}</div>
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
                    <div className="flex gap-2">
                      {deleteConfirm === pusher.id ? (
                        <>
                          <Button 
                            variant="destructive" 
                            size="sm"
                            onClick={() => handleDeletePusher(pusher.id)}
                            disabled={deleting}
                          >
                            {deleting ? 'Deleting...' : 'Confirm Delete'}
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
                          onClick={() => handleDeletePusher(pusher.id)}
                          disabled={deleting || deleteConfirm !== null}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}