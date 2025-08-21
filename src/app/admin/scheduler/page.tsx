"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Clock, 
  Play, 
  Pause, 
  RefreshCw, 
  CheckCircle, 
  AlertCircle,
  Calendar,
  Users,
  Activity
} from "lucide-react";

interface SchedulerStatus {
  isRunning: boolean;
  lastCheck?: Date;
  nextCheck?: Date;
}

interface TournamentUpdate {
  id: string;
  name: string;
  currentStatus: string;
  newStatus: string;
  reason: string;
}

export default function AdminSchedulerPage() {
  const [schedulerStatus, setSchedulerStatus] = useState<SchedulerStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [forceCheckLoading, setForceCheckLoading] = useState(false);
  const [recentUpdates, setRecentUpdates] = useState<TournamentUpdate[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchSchedulerStatus();
  }, []);

  const fetchSchedulerStatus = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/scheduler/tournament-status');
      
      if (!response.ok) {
        throw new Error('Failed to fetch scheduler status');
      }

      const data = await response.json();
      setSchedulerStatus(data.scheduler);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch scheduler status');
    } finally {
      setLoading(false);
    }
  };

  const handleForceCheck = async () => {
    try {
      setForceCheckLoading(true);
      setError("");

      const response = await fetch('/api/scheduler/tournament-status', {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to force tournament status check');
      }

      const data = await response.json();
      setRecentUpdates(data.updates);
      
      // Refresh scheduler status
      await fetchSchedulerStatus();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to force tournament status check');
    } finally {
      setForceCheckLoading(false);
    }
  };

  const formatDateTime = (date: Date | string | undefined) => {
    if (!date) return 'N/A';
    const d = new Date(date);
    return d.toLocaleString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT': return 'secondary';
      case 'REGISTRATION_OPEN': return 'default';
      case 'REGISTRATION_CLOSED': return 'outline';
      case 'IN_PROGRESS': return 'default';
      case 'COMPLETED': return 'secondary';
      case 'CANCELLED': return 'destructive';
      default: return 'secondary';
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Tournament Scheduler</h1>
        <p className="text-muted-foreground">
          Manage automatic tournament registration control and status updates
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <Alert className="mb-6 border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            {error}
          </AlertDescription>
        </Alert>
      )}

      {/* Scheduler Status Card */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Scheduler Status
          </CardTitle>
          <CardDescription>
            Current status of the tournament scheduler service
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Loading scheduler status...</span>
            </div>
          ) : schedulerStatus ? (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  {schedulerStatus.isRunning ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-600" />
                  )}
                  <span className="font-medium">
                    {schedulerStatus.isRunning ? 'Running' : 'Stopped'}
                  </span>
                </div>
                <Badge variant={schedulerStatus.isRunning ? 'default' : 'secondary'}>
                  {schedulerStatus.isRunning ? 'Active' : 'Inactive'}
                </Badge>
              </div>

              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Last Check:</span>
                  <div className="text-muted-foreground">
                    {formatDateTime(schedulerStatus.lastCheck)}
                  </div>
                </div>
                <div>
                  <span className="font-medium">Next Check:</span>
                  <div className="text-muted-foreground">
                    {formatDateTime(schedulerStatus.nextCheck)}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-muted-foreground">No scheduler status available</div>
          )}
        </CardContent>
      </Card>

      {/* Control Actions */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Scheduler Controls
          </CardTitle>
          <CardDescription>
            Manually control the scheduler and force status checks
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <Button
              onClick={fetchSchedulerStatus}
              disabled={loading}
              variant="outline"
              className="gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh Status
            </Button>
            
            <Button
              onClick={handleForceCheck}
              disabled={forceCheckLoading}
              className="gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${forceCheckLoading ? 'animate-spin' : ''}`} />
              {forceCheckLoading ? 'Checking...' : 'Force Check Now'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Updates */}
      {recentUpdates.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Recent Tournament Updates
            </CardTitle>
            <CardDescription>
              Latest automatic status changes applied to tournaments
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentUpdates.map((update, index) => (
                <div key={update.id} className="border rounded-lg p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">{update.name}</h4>
                    <div className="flex items-center gap-2">
                      <Badge variant={getStatusColor(update.currentStatus)}>
                        {update.currentStatus.replace('_', ' ')}
                      </Badge>
                      <span className="text-muted-foreground">→</span>
                      <Badge variant={getStatusColor(update.newStatus)}>
                        {update.newStatus.replace('_', ' ')}
                      </Badge>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">{update.reason}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Information Section */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            How Automatic Registration Control Works
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 text-sm">
            <div>
              <h4 className="font-medium mb-2">Automatic Status Transitions:</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• <strong>DRAFT → REGISTRATION_OPEN:</strong> When the start date is reached</li>
                <li>• <strong>REGISTRATION_OPEN → REGISTRATION_CLOSED:</strong> When the end date is reached</li>
                <li>• <strong>REGISTRATION_CLOSED → IN_PROGRESS:</strong> When the start date is reached and registration is closed</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">Scheduler Behavior:</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Checks tournament statuses every minute automatically</li>
                <li>• Updates tournaments based on their start and end dates</li>
                <li>• No manual intervention required from administrators</li>
                <li>• Graceful shutdown on server restart</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">Best Practices:</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Set appropriate start and end dates when creating tournaments</li>
                <li>• Use "DRAFT" as the initial status for new tournaments</li>
                <li>• Monitor scheduler status regularly</li>
                <li>• Use "Force Check" for immediate status updates if needed</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}