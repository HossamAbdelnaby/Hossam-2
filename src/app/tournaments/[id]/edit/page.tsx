"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/contexts/auth-context";
import { 
  ArrowLeft, 
  Save, 
  Trash2, 
  Calendar,
  DollarSign,
  Trophy,
  Loader2,
  AlertTriangle
} from "lucide-react";

const teamSlotsOptions = [
  { value: 8, label: "8 Teams" },
  { value: 16, label: "16 Teams" },
  { value: 32, label: "32 Teams" },
  { value: 64, label: "64 Teams" },
  { value: 128, label: "128 Teams" },
  { value: 256, label: "256 Teams" },
];

interface Tournament {
  id: string;
  name: string;
  description?: string;
  host: string;
  url?: string;
  prizeAmount: number;
  maxTeams: number;
  registrationStart: string;
  registrationEnd?: string;
  tournamentStart: string;
  tournamentEnd?: string;
  status: string;
  bracketType: string;
  packageType: string;
  graphicRequests?: string;
  isActive: boolean;
  organizer: {
    id: string;
    email: string;
    name?: string;
  };
}

export default function EditTournamentPage() {
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    host: "",
    url: "",
    prizeAmount: "",
    maxTeams: 16,
    registrationStart: "",
    registrationEnd: "",
    tournamentStart: "",
    tournamentEnd: "",
    status: "",
    bracketType: "",
    packageType: "",
    graphicRequests: "",
    isActive: true,
  });
  
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  
  const tournamentId = params.id as string;

  useEffect(() => {
    fetchTournament();
  }, [tournamentId]);

  const fetchTournament = async () => {
    try {
      const response = await fetch(`/api/tournaments/${tournamentId}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          setError('Tournament not found');
        } else {
          setError('Failed to fetch tournament');
        }
        return;
      }

      const data = await response.json();
      setTournament(data.tournament);
      
      // Populate form data
      setFormData({
        name: data.tournament.name,
        description: data.tournament.description || "",
        host: data.tournament.host,
        url: data.tournament.url || "",
        prizeAmount: data.tournament.prizeAmount.toString(),
        maxTeams: data.tournament.maxTeams || 16,
        registrationStart: new Date(data.tournament.registrationStart).toISOString().slice(0, 16),
        registrationEnd: data.tournament.registrationEnd ? new Date(data.tournament.registrationEnd).toISOString().slice(0, 16) : "",
        tournamentStart: new Date(data.tournament.tournamentStart).toISOString().slice(0, 16),
        tournamentEnd: data.tournament.tournamentEnd ? new Date(data.tournament.tournamentEnd).toISOString().slice(0, 16) : "",
        status: data.tournament.status,
        bracketType: data.tournament.bracketType,
        packageType: data.tournament.packageType,
        graphicRequests: data.tournament.graphicRequests || "",
        isActive: data.tournament.isActive,
      });
    } catch (err) {
      setError('Failed to fetch tournament');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string | boolean | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      // Only send editable fields, exclude restricted fields
      const editableData = {
        name: formData.name,
        description: formData.description,
        host: formData.host,
        url: formData.url,
        registrationStart: new Date(formData.registrationStart).toISOString(),
        registrationEnd: formData.registrationEnd ? new Date(formData.registrationEnd).toISOString() : null,
        tournamentStart: new Date(formData.tournamentStart).toISOString(),
        tournamentEnd: formData.tournamentEnd ? new Date(formData.tournamentEnd).toISOString() : null,
        status: formData.status,
        graphicRequests: formData.graphicRequests,
        isActive: formData.isActive,
      };

      const response = await fetch(`/api/tournaments/${tournamentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editableData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update tournament');
      }

      setSuccess('Tournament updated successfully!');
      // Refresh tournament data
      fetchTournament();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update tournament');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    setError("");

    try {
      const response = await fetch(`/api/tournaments/${tournamentId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete tournament');
      }

      router.push('/tournaments');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete tournament');
      setShowDeleteConfirm(false);
    } finally {
      setDeleting(false);
    }
  };

  const isOwner = user && tournament && user.id === tournament.organizer.id;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (error || !tournament) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">{error || 'Tournament not found'}</h1>
          <Button asChild>
            <Link href="/tournaments">Back to Tournaments</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (!isOwner) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">Unauthorized</h1>
          <p className="text-muted-foreground mb-6">You don't have permission to edit this tournament.</p>
          <Button asChild>
            <Link href={`/tournaments/${tournamentId}`}>Back to Tournament</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <Link href={`/tournaments/${tournamentId}`} className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="w-4 h-4" />
          Back to Tournament
        </Link>
        
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">Edit Tournament</h1>
            <p className="text-muted-foreground">
              Update tournament information and settings
            </p>
          </div>
          
          <Button 
            variant="destructive" 
            onClick={() => setShowDeleteConfirm(true)}
            className="gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Delete Tournament
          </Button>
        </div>
      </div>

      {/* Information Alert */}
      <Alert className="mb-6 border-blue-200 bg-blue-50">
        <AlertDescription className="text-blue-800">
          <div className="space-y-2">
            <p className="font-medium">Tournament Restrictions</p>
            <p className="text-sm">Some tournament fields cannot be edited after creation to maintain tournament integrity:</p>
            <ul className="text-sm list-disc list-inside space-y-1 ml-2">
              <li>Bracket Type (Single Elimination, Double Elimination, etc.)</li>
              <li>Package Type (Free, Graphics, Discord, Full Management)</li>
              <li>Prize Amount</li>
              <li>Team Slots (Maximum number of teams)</li>
            </ul>
            <p className="text-sm">These fields are now displayed as read-only information below.</p>
          </div>
        </AlertDescription>
      </Alert>

      {/* Success Message */}
      {success && (
        <Alert className="mb-6 border-green-200 bg-green-50">
          <AlertDescription className="text-green-800">
            {success}
          </AlertDescription>
        </Alert>
      )}

      {/* Error Message */}
      {error && (
        <Alert className="mb-6 border-red-200 bg-red-50">
          <AlertDescription className="text-red-800">
            {error}
          </AlertDescription>
        </Alert>
      )}

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <Alert className="mb-6 border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <div className="space-y-2">
              <p className="font-medium">Are you sure you want to delete this tournament?</p>
              <p className="text-sm">This action cannot be undone and will remove all tournament data including teams, matches, and stages.</p>
              <div className="flex gap-2 mt-4">
                <Button 
                  variant="destructive" 
                  onClick={handleDelete}
                  disabled={deleting}
                  className="gap-2"
                >
                  {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  {deleting ? 'Deleting...' : 'Yes, Delete Tournament'}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={deleting}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Edit Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>
              Update the basic details of your tournament
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Tournament Name</label>
              <Input
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                required
                placeholder="Enter tournament name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Description</label>
              <Textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Describe your tournament"
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Host Name</label>
              <Input
                value={formData.host}
                onChange={(e) => handleInputChange('host', e.target.value)}
                required
                placeholder="Enter host name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Tournament URL (Optional)</label>
              <Input
                value={formData.url}
                onChange={(e) => handleInputChange('url', e.target.value)}
                placeholder="https://example.com/tournament"
                type="url"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Prize & Settings
            </CardTitle>
            <CardDescription>
              View tournament prize and settings (these fields cannot be edited after creation)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Prize Amount - Read Only */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-muted-foreground">Prize Amount (USD)</label>
                <div className="p-2 bg-muted rounded-md border">
                  ${parseFloat(formData.prizeAmount).toFixed(2)}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-muted-foreground">Team Slots</label>
                <div className="p-2 bg-muted rounded-md border">
                  {formData.maxTeams} Teams
                </div>
              </div>
            </div>

            {/* Bracket Type and Package Type - Read Only */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-muted-foreground">Bracket Type</label>
                <div className="p-2 bg-muted rounded-md border">
                  {formData.bracketType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-muted-foreground">Package Type</label>
                <div className="p-2 bg-muted rounded-md border">
                  {formData.packageType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </div>
              </div>
            </div>

            {/* Editable Date and Status Fields */}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Registration Start</label>
                <Input
                  value={formData.registrationStart}
                  onChange={(e) => handleInputChange('registrationStart', e.target.value)}
                  required
                  type="datetime-local"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Registration will automatically open at this date and time
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Registration End</label>
                <Input
                  value={formData.registrationEnd}
                  onChange={(e) => handleInputChange('registrationEnd', e.target.value)}
                  required
                  type="datetime-local"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Registration will automatically close at this date and time
                </p>
              </div>
            </div>

            {/* Tournament Dates */}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Tournament Start</label>
                <Input
                  value={formData.tournamentStart}
                  onChange={(e) => handleInputChange('tournamentStart', e.target.value)}
                  required
                  type="datetime-local"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  When the actual tournament competition begins
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Tournament End</label>
                <Input
                  value={formData.tournamentEnd}
                  onChange={(e) => handleInputChange('tournamentEnd', e.target.value)}
                  type="datetime-local"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  When the tournament competition ends (optional)
                </p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Status</label>
              <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DRAFT">Draft</SelectItem>
                  <SelectItem value="REGISTRATION_OPEN">Registration Open</SelectItem>
                  <SelectItem value="REGISTRATION_CLOSED">Registration Closed</SelectItem>
                  <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground mt-2">
                <strong>Note:</strong> Tournament status is automatically managed based on your tournament dates. Manual changes may be overridden by the system.
              </p>
            </div>

            {formData.packageType !== 'FREE' && (
              <div>
                <label className="block text-sm font-medium mb-2">Graphic Requests</label>
                <Textarea
                  value={formData.graphicRequests}
                  onChange={(e) => handleInputChange('graphicRequests', e.target.value)}
                  placeholder="Describe your graphic design requirements"
                  rows={3}
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-4">
          <Button type="submit" disabled={saving} className="gap-2">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
          
          <Button type="button" variant="outline" asChild>
            <Link href={`/tournaments/${tournamentId}`}>
              Cancel
            </Link>
          </Button>
        </div>
      </form>
    </div>
  );
}