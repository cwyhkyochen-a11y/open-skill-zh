'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { CheckCircle, XCircle, Settings, Loader2, AlertCircle } from 'lucide-react';
import * as Icons from 'lucide-react';

interface PlatformConfig {
  id: string;
  platform: string;
  name: string;
  description: string;
  icon: string;
  authMode: 'composio' | 'custom';
  composioAuthConfigId: string | null;
  customOauthConfig: any;
  isEnabled: boolean;
  supportsCustomAuth: boolean;
  isConfigured: boolean;
}

export default function OAuthConfigPage() {
  const [configs, setConfigs] = useState<PlatformConfig[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadConfigs();
  }, []);

  const loadConfigs = async () => {
    try {
      const res = await fetch(process.env.NEXT_PUBLIC_APP_URL + '/api/oauth/platforms');
      const data = await res.json();
      setConfigs((data.configs || []) as PlatformConfig[]);
    } catch (error) {
      toast.error('Failed to load configurations');
    } finally {
      setLoading(false);
    }
  };

  const togglePlatform = async (platformId: string, currentStatus: boolean) => {
    try {
      const res = await fetch(process.env.NEXT_PUBLIC_APP_URL + '/api/oauth/platforms', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platformId,
          isEnabled: !currentStatus,
        }),
      });

      if (!res.ok) throw new Error('Update failed');

      toast.success(currentStatus ? 'Platform disabled' : 'Platform enabled');
      loadConfigs();
    } catch (error) {
      toast.error('Failed to update platform');
    }
  };

  const updateAuthMode = async (platformId: string, authMode: string) => {
    try {
      const res = await fetch(process.env.NEXT_PUBLIC_APP_URL + '/api/oauth/platforms', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platformId,
          authMode,
        }),
      });

      if (!res.ok) throw new Error('Update failed');

      toast.success('Authentication mode updated');
      loadConfigs();
    } catch (error) {
      toast.error('Failed to update auth mode');
    }
  };

  const getPlatformIcon = (iconName: string) => {
    const IconComponent = (Icons as any)[iconName];
    return IconComponent ? <IconComponent className="w-5 h-5 text-slate-600 dark:text-slate-400" /> : <Settings className="w-5 h-5 text-slate-600 dark:text-slate-400" />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="container mx-auto px-6 py-12 max-w-6xl">
        <div className="mb-8 animate-fade-in">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">
            Platform Configuration
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Manage authentication settings for each platform
          </p>
        </div>

        {configs.length === 0 ? (
          <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl animate-fade-in">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
                <Settings className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
                No platforms available
              </h3>
              <p className="text-slate-600 dark:text-slate-400 text-center max-w-sm">
                Platform configurations will appear here
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {configs.map((config, index) => (
              <Card
                key={config.id}
                className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl hover:-translate-y-0.5 transition-all duration-200 animate-fade-in"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <CardHeader>
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                      {getPlatformIcon(config.icon)}
                    </div>
                    <div className="flex flex-col gap-1.5 items-end">
                      {config.isConfigured ? (
                        <Badge variant="default" className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300 rounded-lg px-2 py-0.5 text-xs">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Configured
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300 rounded-lg px-2 py-0.5 text-xs">
                          <AlertCircle className="w-3 h-3 mr-1" />
                          Not Configured
                        </Badge>
                      )}
                      
                      {config.isEnabled ? (
                        <Badge variant="default" className="bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300 rounded-lg px-2 py-0.5 text-xs">
                          Enabled
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="rounded-lg px-2 py-0.5 text-xs">
                          Disabled
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <CardTitle className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                    {config.name}
                  </CardTitle>
                  <CardDescription className="text-sm text-slate-600 dark:text-slate-400">
                    {config.description}
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">
                      Authentication Mode
                    </Label>
                    <Select
                      value={config.authMode}
                      onValueChange={(value) => updateAuthMode(config.platform, value)}
                      disabled={!config.supportsCustomAuth}
                    >
                      <SelectTrigger className="rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="composio">Composio (Unified)</SelectItem>
                        {config.supportsCustomAuth && (
                          <SelectItem value="custom">Custom API</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {config.authMode === 'composio' && config.composioAuthConfigId && (
                    <div>
                      <Label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">
                        Auth Config ID
                      </Label>
                      <Input
                        value={config.composioAuthConfigId}
                        readOnly
                        className="bg-slate-50 dark:bg-slate-800 rounded-xl font-mono text-xs"
                      />
                    </div>
                  )}
                  
                  {config.authMode === 'custom' && (
                    <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-3">
                      <p className="text-xs text-amber-800 dark:text-amber-300">
                        Custom API configuration coming soon
                      </p>
                    </div>
                  )}
                  
                  <div className="flex gap-2 pt-2">
                    <Button
                      variant={config.isEnabled ? 'outline' : 'default'}
                      size="sm"
                      onClick={() => togglePlatform(config.platform, config.isEnabled)}
                      className="flex-1 rounded-xl"
                    >
                      {config.isEnabled ? 'Disable' : 'Enable'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
