"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { QRCodeSVG } from "qrcode.react";
import { 
  Shield, 
  Smartphone, 
  Key, 
  CheckCircle, 
  AlertTriangle,
  Copy,
  Download,
  RefreshCw,
  Eye,
  EyeOff
} from "lucide-react";

interface TwoFactorAuth {
  isEnabled: boolean;
  secret?: string;
  backupCodes?: string[];
  qrCodeUrl?: string;
}

export default function TwoFactorAuthPage() {
  const [twoFactor, setTwoFactor] = useState<TwoFactorAuth>({ isEnabled: false });
  const [loading, setLoading] = useState(true);
  const [setupStep, setSetupStep] = useState<'disabled' | 'setup' | 'verify' | 'enabled'>('disabled');
  const [verificationCode, setVerificationCode] = useState("");
  const [showBackupCodes, setShowBackupCodes] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchTwoFactorStatus();
  }, []);

  const fetchTwoFactorStatus = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/2fa/status');
      if (response.ok) {
        const data = await response.json();
        setTwoFactor(data);
        setSetupStep(data.isEnabled ? 'enabled' : 'disabled');
      }
    } catch (error) {
      console.error('Error fetching 2FA status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEnable2FA = async () => {
    try {
      const response = await fetch('/api/admin/2fa/enable', {
        method: 'POST'
      });

      if (response.ok) {
        const data = await response.json();
        setTwoFactor(prev => ({ ...prev, ...data }));
        setSetupStep('setup');
        setMessage({ type: 'success', text: '2FA setup initiated! Please scan the QR code.' });
      } else {
        const data = await response.json();
        setMessage({ type: 'error', text: data.error || 'Failed to enable 2FA' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error' });
    }
  };

  const handleVerifyAndEnable = async () => {
    try {
      const response = await fetch('/api/admin/2fa/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: verificationCode })
      });

      if (response.ok) {
        const data = await response.json();
        setTwoFactor(prev => ({ ...prev, ...data, isEnabled: true }));
        setSetupStep('enabled');
        setVerificationCode("");
        setMessage({ type: 'success', text: '2FA enabled successfully!' });
      } else {
        const data = await response.json();
        setMessage({ type: 'error', text: data.error || 'Invalid verification code' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error' });
    }
  };

  const handleDisable2FA = async () => {
    if (!confirm('Are you sure you want to disable 2FA? This will make your account less secure.')) {
      return;
    }

    try {
      const response = await fetch('/api/admin/2fa/disable', {
        method: 'POST'
      });

      if (response.ok) {
        setTwoFactor({ isEnabled: false });
        setSetupStep('disabled');
        setMessage({ type: 'success', text: '2FA disabled successfully!' });
      } else {
        const data = await response.json();
        setMessage({ type: 'error', text: data.error || 'Failed to disable 2FA' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error' });
    }
  };

  const handleRegenerateBackupCodes = async () => {
    try {
      const response = await fetch('/api/admin/2fa/backup-codes', {
        method: 'POST'
      });

      if (response.ok) {
        const data = await response.json();
        setTwoFactor(prev => ({ ...prev, backupCodes: data.backupCodes }));
        setMessage({ type: 'success', text: 'Backup codes regenerated successfully!' });
      } else {
        const data = await response.json();
        setMessage({ type: 'error', text: data.error || 'Failed to regenerate backup codes' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error' });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setMessage({ type: 'success', text: 'Copied to clipboard!' });
  };

  const downloadBackupCodes = () => {
    if (!twoFactor.backupCodes) return;
    
    const content = twoFactor.backupCodes.join('\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = '2fa-backup-codes.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Two-Factor Authentication</h1>
        <p className="text-muted-foreground">
          Add an extra layer of security to your admin account
        </p>
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

      {/* Current Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Security Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${twoFactor.isEnabled ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="font-medium">
                {twoFactor.isEnabled ? '2FA is Enabled' : '2FA is Disabled'}
              </span>
              <Badge variant={twoFactor.isEnabled ? 'default' : 'secondary'}>
                {twoFactor.isEnabled ? 'Protected' : 'Vulnerable'}
              </Badge>
            </div>
            
            {twoFactor.isEnabled ? (
              <Button variant="destructive" onClick={handleDisable2FA}>
                Disable 2FA
              </Button>
            ) : (
              <Button onClick={handleEnable2FA}>
                Enable 2FA
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Setup Steps */}
      {setupStep === 'setup' && twoFactor.qrCodeUrl && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="w-5 h-5" />
              Set Up Authenticator App
            </CardTitle>
            <CardDescription>
              Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col items-center space-y-4">
              <div className="p-4 bg-white rounded-lg">
                <QRCodeSVG value={twoFactor.qrCodeUrl} size={200} />
              </div>
              
              {twoFactor.secret && (
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-2">
                    Or enter this secret key manually:
                  </p>
                  <div className="flex items-center gap-2">
                    <code className="bg-muted px-3 py-2 rounded text-sm font-mono">
                      {twoFactor.secret}
                    </code>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => copyToClipboard(twoFactor.secret!)}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="verification-code">Enter Verification Code</Label>
                <Input
                  id="verification-code"
                  type="text"
                  placeholder="Enter 6-digit code"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  maxLength={6}
                  className="font-mono text-center text-lg tracking-widest"
                />
              </div>
              
              <Button 
                onClick={handleVerifyAndEnable} 
                disabled={verificationCode.length !== 6}
                className="w-full"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Verify and Enable 2FA
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Backup Codes */}
      {setupStep === 'enabled' && twoFactor.backupCodes && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Key className="w-5 h-5" />
                  Backup Codes
                </CardTitle>
                <CardDescription>
                  Save these codes in a secure place. You can use them to access your account if you lose your authenticator device.
                </CardDescription>
              </div>
              <Button variant="outline" onClick={handleRegenerateBackupCodes}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Regenerate
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                onClick={() => setShowBackupCodes(!showBackupCodes)}
              >
                {showBackupCodes ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
                {showBackupCodes ? 'Hide Codes' : 'Show Codes'}
              </Button>
              <Button variant="outline" onClick={downloadBackupCodes}>
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
            </div>
            
            {showBackupCodes && (
              <div className="grid grid-cols-2 gap-2">
                {twoFactor.backupCodes.map((code, index) => (
                  <div key={index} className="bg-muted p-3 rounded font-mono text-sm text-center">
                    {code}
                  </div>
                ))}
              </div>
            )}
            
            <Alert>
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-yellow-800">
                <strong>Important:</strong> Store these codes securely. Each code can only be used once. 
                Keep them somewhere safe but accessible, like a password manager or printed copy.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}

      {/* Security Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle>Security Best Practices</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
            <div>
              <p className="font-medium">Use a dedicated authenticator app</p>
              <p className="text-sm text-muted-foreground">
                Google Authenticator, Authy, or Microsoft Authenticator are recommended
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
            <div>
              <p className="font-medium">Store backup codes securely</p>
              <p className="text-sm text-muted-foreground">
                Keep them in a separate location from your authenticator device
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
            <div>
              <p className="font-medium">Enable 2FA on all admin accounts</p>
              <p className="text-sm text-muted-foreground">
                Ensure all users with admin access have 2FA enabled
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
            <div>
              <p className="font-medium">Regular security audits</p>
              <p className="text-sm text-muted-foreground">
                Review admin access and 2FA status periodically
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}