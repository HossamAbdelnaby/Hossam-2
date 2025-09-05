"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/auth-context";
import { 
  FileText, 
  Edit, 
  Save, 
  X, 
  AlertTriangle,
  CheckCircle,
  Loader2
} from "lucide-react";

interface TournamentRulesProps {
  tournamentId: string;
  tournamentName: string;
  isOwner?: boolean;
}

interface TournamentRulesData {
  id: string;
  name: string;
  rules: string;
}

export default function TournamentRules({ 
  tournamentId, 
  tournamentName, 
  isOwner = false 
}: TournamentRulesProps) {
  const [rules, setRules] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchRules();
  }, [tournamentId]);

  const fetchRules = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/tournaments/${tournamentId}/rules`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch tournament rules');
      }

      const data = await response.json();
      setRules(data.tournament.rules || '');
    } catch (err) {
      setError('Failed to load tournament rules');
      console.error('Error fetching rules:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveRules = async () => {
    if (!user) return;

    setSaving(true);
    setError('');

    try {
      const response = await fetch(`/api/tournaments/${tournamentId}/rules`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ rules }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save tournament rules');
      }

      toast({
        title: "Rules Updated!",
        description: "Tournament rules have been saved successfully.",
      });
      
      setEditing(false);
      setIsDialogOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save tournament rules');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditing(false);
    setIsDialogOpen(false);
    // Reset to original rules
    fetchRules();
  };

  const formatRules = (rulesText: string) => {
    if (!rulesText.trim()) return null;

    return rulesText.split('\n').map((line, index) => {
      if (line.trim() === '') {
        return <br key={index} />;
      }
      
      // Handle numbered lists
      if (line.match(/^\d+\./)) {
        return (
          <div key={index} className="flex items-start gap-2 mb-2">
            <Badge variant="secondary" className="mt-0.5">
              {line.split('.')[0]}
            </Badge>
            <span className="flex-1">{line.substring(line.indexOf('.') + 1).trim()}</span>
          </div>
        );
      }
      
      // Handle bullet points
      if (line.trim().startsWith('•') || line.trim().startsWith('-') || line.trim().startsWith('*')) {
        return (
          <div key={index} className="flex items-start gap-2 mb-2">
            <span className="text-muted-foreground mt-1">•</span>
            <span className="flex-1">{line.substring(1).trim()}</span>
          </div>
        );
      }
      
      // Handle headers
      if (line.trim().startsWith('#')) {
        const level = line.trim().split(' ')[0].length;
        const headerText = line.trim().substring(level).trim();
        const HeaderTag = `h${Math.min(level, 6)}` as keyof JSX.IntrinsicElements;
        return (
          <HeaderTag key={index} className={`font-semibold mb-2 mt-4 ${level === 1 ? 'text-lg' : level === 2 ? 'text-base' : 'text-sm'}`}>
            {headerText}
          </HeaderTag>
        );
      }
      
      // Regular paragraph
      return (
        <p key={index} className="mb-2 leading-relaxed">
          {line}
        </p>
      );
    });
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Tournament Rules
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Tournament Rules
            </CardTitle>
            <CardDescription>
              Official rules and regulations for {tournamentName}
            </CardDescription>
          </div>
          
          {isOwner && (
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setEditing(true)}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Rules
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Edit Tournament Rules</DialogTitle>
                  <DialogDescription>
                    Update the rules and regulations for {tournamentName}
                  </DialogDescription>
                </DialogHeader>
                
                {error && (
                  <Alert className="border-red-200 bg-red-50">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-red-800">
                      {error}
                    </AlertDescription>
                  </Alert>
                )}
                
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Tournament Rules
                    </label>
                    <Textarea
                      value={rules}
                      onChange={(e) => setRules(e.target.value)}
                      placeholder="Enter tournament rules here..."
                      className="min-h-[400px] font-mono text-sm"
                    />
                    <p className="text-xs text-muted-foreground mt-2">
                      Tip: Use # for headers, numbers for numbered lists, and • for bullet points
                    </p>
                  </div>
                  
                  <div className="flex gap-2 justify-end">
                    <Button 
                      variant="outline" 
                      onClick={handleCancelEdit}
                      disabled={saving}
                    >
                      <X className="w-4 h-4 mr-2" />
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleSaveRules}
                      disabled={saving}
                    >
                      {saving ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4 mr-2" />
                      )}
                      Save Rules
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        {rules.trim() ? (
          <div className="prose prose-sm max-w-none">
            {formatRules(rules)}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No tournament rules have been set yet.</p>
            {isOwner && (
              <p className="text-sm mt-2">
                Click "Edit Rules" to add rules for this tournament.
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}