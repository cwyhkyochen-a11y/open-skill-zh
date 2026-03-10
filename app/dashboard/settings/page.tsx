'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { Save, TestTube, LogOut, User, AlertTriangle, Info, ExternalLink, Loader2, CheckCircle } from 'lucide-react';

export default function SettingsPage() {
  const router = useRouter();
  const [apiKey, setApiKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [testLoading, setTestLoading] = useState(false);
  const [currentKey, setCurrentKey] = useState('');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => {
    loadCurrentKey();
    loadCurrentUser();
  }, []);

  const loadCurrentUser = async () => {
    try {
      const res = await fetch(process.env.NEXT_PUBLIC_APP_URL + '/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        setCurrentUser(data.user);
      }
    } catch (error) {
      console.error('Load user error:', error);
    }
  };

  const loadCurrentKey = async () => {
    try {
      const res = await fetch(process.env.NEXT_PUBLIC_APP_URL + '/api/settings/composio');
      const data = await res.json();
      if (data.configured) {
        setCurrentKey(maskApiKey(data.apiKey));
      }
    } catch (error) {
      console.error('Load key error:', error);
    }
  };

  const maskApiKey = (key: string) => {
    if (!key || key.length < 8) return 'Not configured';
    return key.substring(0, 8) + '...' + key.substring(key.length - 4);
  };

  const handleSave = async () => {
    if (!apiKey.trim()) {
      toast.error('Please enter API Key');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(process.env.NEXT_PUBLIC_APP_URL + '/api/settings/composio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: apiKey.trim() }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Save failed');
      }

      toast.success('API Key saved successfully');
      setApiKey('');
      loadCurrentKey();
    } catch (error: any) {
      toast.error(error.message || 'Save failed');
    } finally {
      setLoading(false);
    }
  };

  const handleTest = async () => {
    const keyToTest = apiKey.trim() || currentKey;
    
    if (!keyToTest || keyToTest === 'Not configured') {
      toast.error('Please enter or save API Key first');
      return;
    }

    setTestLoading(true);
    try {
      const res = await fetch(process.env.NEXT_PUBLIC_APP_URL + '/api/settings/composio/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: apiKey.trim() || undefined }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Test failed');
      }

      toast.success('API Key is valid');
    } catch (error: any) {
      toast.error(error.message || 'Test failed');
    } finally {
      setTestLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch(process.env.NEXT_PUBLIC_APP_URL + '/api/auth/logout', { method: 'POST' });
      toast.success('Logged out');
      router.push('/contentops/login');
    } catch (error) {
      toast.error('Logout failed');
    }
  };

  const handleCreateUser = async () => {
    if (!newUsername || !newPassword) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      const res = await fetch(process.env.NEXT_PUBLIC_APP_URL + '/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: newUsername, password: newPassword }),
      });

      if (!res.ok) throw new Error('Create user failed');

      toast.success('User created successfully');
      setNewUsername('');
      setNewPassword('');
    } catch (error: any) {
      toast.error(error.message || 'Create user failed');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="container mx-auto px-6 py-12 max-w-4xl">
        {/* Header */}
        <div className="mb-8 animate-fade-in">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">
            Settings
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Configure your Content-Ops Console
          </p>
        </div>

        <div className="space-y-6">
          {/* Composio API Configuration */}
          <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl animate-fade-in stagger-1">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-slate-900 dark:text-slate-100">
                Composio API
              </CardTitle>
              <CardDescription className="text-slate-600 dark:text-slate-400">
                Configure your Composio API credentials
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert className="rounded-xl border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-950">
                <Info className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <AlertDescription className="text-sm text-blue-900 dark:text-blue-100 ml-2">
                  Get your API key from{' '}
                  <a
                    href="https://app.composio.dev/settings"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline hover:text-blue-700 dark:hover:text-blue-300"
                  >
                    Composio Dashboard
                  </a>
                </AlertDescription>
              </Alert>

              {currentKey && currentKey !== 'Not configured' && (
                <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-800">
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-slate-700 dark:text-slate-300">
                      Current: <code className="font-mono">{currentKey}</code>
                    </span>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  API Key
                </Label>
                <Input
                  type="password"
                  placeholder="ak_..."
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="h-11 rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono"
                />
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={handleSave}
                  disabled={loading || !apiKey.trim()}
                  className="rounded-xl h-11 px-6 bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save
                    </>
                  )}
                </Button>
                <Button
                  onClick={handleTest}
                  disabled={testLoading}
                  variant="outline"
                  className="rounded-xl h-11 px-6 border-slate-200 dark:border-slate-700"
                >
                  {testLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Testing...
                    </>
                  ) : (
                    <>
                      <TestTube className="w-4 h-4 mr-2" />
                      Test Connection
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* User Management */}
          <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl animate-fade-in stagger-2">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-slate-900 dark:text-slate-100">
                User Management
              </CardTitle>
              <CardDescription className="text-slate-600 dark:text-slate-400">
                Manage admin users
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {currentUser && (
                <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-800">
                  <div className="flex items-center gap-2 text-sm">
                    <User className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                    <span className="text-slate-700 dark:text-slate-300">
                      Logged in as: <strong>{currentUser.username}</strong>
                    </span>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    New Username
                  </Label>
                  <Input
                    type="text"
                    placeholder="username"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    className="h-11 rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    New Password
                  </Label>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="h-11 rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  />
                </div>

                <Button
                  onClick={handleCreateUser}
                  disabled={!newUsername || !newPassword}
                  className="rounded-xl h-11 px-6 bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  Create User
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card className="border-red-200 dark:border-red-900 bg-white dark:bg-slate-900 rounded-2xl animate-fade-in stagger-3">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-red-600 dark:text-red-400">
                Danger Zone
              </CardTitle>
              <CardDescription className="text-slate-600 dark:text-slate-400">
                Irreversible actions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={handleLogout}
                variant="destructive"
                className="rounded-xl h-11 px-6"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
