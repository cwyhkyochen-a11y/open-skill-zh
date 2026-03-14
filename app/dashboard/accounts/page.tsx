'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { PLATFORM_NAMES, PLATFORM_ICONS } from '@/lib/platform-fields';
import { CheckCircle, Clock, XCircle, Plus, RefreshCw, Trash2, Loader2, ExternalLink } from 'lucide-react';
import { AccountDetailDialog } from '@/components/AccountDetailDialog';

interface Account {
  id: string;
  accountName: string;
  platform: string;
  status: string;
  composioUserId: string;
  authMode: string;
  createdAt: string;
  updatedAt: string;
}

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [authUrl, setAuthUrl] = useState('');
  const [pollingAccountId, setPollingAccountId] = useState<string | null>(null);
  const [refreshingAccountId, setRefreshingAccountId] = useState<string | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  
  const [newAccount, setNewAccount] = useState({
    accountName: '',
    platform: 'twitter',
  });

  const loadAccounts = async () => {
    try {
      const res = await fetch(process.env.NEXT_PUBLIC_APP_URL + '/api/accounts');
      const data = await res.json();
      setAccounts(data.accounts || []);
    } catch (error) {
      toast.error('Failed to load accounts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAccounts();
  }, []);

  const handleAddAccount = async () => {
    if (!newAccount.accountName || !newAccount.platform) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      const entityId = `${newAccount.platform}_${newAccount.accountName}_${Date.now()}`;
      
      const authRes = await fetch(process.env.NEXT_PUBLIC_APP_URL + '/api/composio/authorize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entityId,
          platform: newAccount.platform,
        }),
      });

      if (!authRes.ok) throw new Error('Failed to generate auth URL');

      const authData = await authRes.json();
      setAuthUrl(authData.authUrl);
      setAuthDialogOpen(true);

      const createRes = await fetch(process.env.NEXT_PUBLIC_APP_URL + '/api/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountName: newAccount.accountName,
          platform: newAccount.platform,
          composioUserId: entityId,
          authMode: 'composio',
          status: 'pending',
        }),
      });

      if (!createRes.ok) throw new Error('Failed to create account');

      const createData = await createRes.json();
      setPollingAccountId(createData.account.id);
      
      setDialogOpen(false);
      setNewAccount({ accountName: '', platform: 'twitter' });
      loadAccounts();
    } catch (error: any) {
      toast.error(error.message || 'Failed to add account');
    }
  };


  const handleRefreshStatus = async (accountId: string) => {
    setRefreshingAccountId(accountId);
    try {
      const res = await fetch(process.env.NEXT_PUBLIC_APP_URL + '/api/accounts/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountId }),
      });

      if (!res.ok) throw new Error('Failed to refresh status');

      const data = await res.json();
      
      if (data.success) {
        toast.success('Status refreshed successfully');
        loadAccounts();
      } else {
        toast.error('Failed to refresh status');
      }
    } catch (error) {
      toast.error('Failed to refresh status');
    } finally {
      setRefreshingAccountId(null);
    }
  };

  const handleDeleteAccount = async (id: string) => {
    if (!confirm('Are you sure you want to delete this account?')) return;

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/accounts/${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Delete failed');

      toast.success('Account deleted');
      loadAccounts();
    } catch (error) {
      toast.error('Failed to delete account');
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      active: { variant: 'default' as const, icon: CheckCircle, text: 'Active', color: 'text-emerald-600 dark:text-emerald-400' },
      pending: { variant: 'secondary' as const, icon: Clock, text: 'Pending', color: 'text-amber-600 dark:text-amber-400' },
      failed: { variant: 'destructive' as const, icon: XCircle, text: 'Failed', color: 'text-red-600 dark:text-red-400' },
    };
    const config = variants[status as keyof typeof variants] || variants.pending;
    const Icon = config.icon;
    
    return (
      <Badge variant={config.variant} className="rounded-lg px-3 py-1">
        <Icon className={`w-3 h-3 mr-1.5 ${config.color}`} />
        {config.text}
      </Badge>
    );
  };

  const getPlatformIcon = (platform: string) => {
    const IconComponent = PLATFORM_ICONS[platform] as any;
    return IconComponent ? <IconComponent className="w-5 h-5" /> : null;
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
      <div className="container mx-auto px-6 py-12 max-w-7xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 animate-fade-in">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">
              Connected Accounts
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
              Manage your social media accounts
            </p>
          </div>
          
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger>
              <Button className="rounded-xl h-11 px-6 bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20 hover:shadow-xl hover:shadow-indigo-500/30 transition-all duration-200 hover:-translate-y-0.5">
                <Plus className="w-4 h-4 mr-2" />
                Add Account
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  Add New Account
                </DialogTitle>
                <DialogDescription className="text-slate-600 dark:text-slate-400">
                  Connect a new social media account
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-6 pt-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Platform
                  </Label>
                  <Select
                    value={newAccount.platform}
                    onValueChange={(value) => setNewAccount({ ...newAccount, platform: value || "twitter" })}
                  >
                    <SelectTrigger className="h-11 rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                      {Object.entries(PLATFORM_NAMES).map(([key, name]) => (
                        <SelectItem key={key} value={key} className="rounded-lg">
                          <div className="flex items-center gap-2">
                            {getPlatformIcon(key)}
                            {name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Account Name
                  </Label>
                  <Input
                    placeholder="e.g., @username"
                    value={newAccount.accountName}
                    onChange={(e) => setNewAccount({ ...newAccount, accountName: e.target.value })}
                    className="h-11 rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  />
                </div>

                <Button
                  onClick={handleAddAccount}
                  className="w-full h-11 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  Continue to Authorization
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Auth Dialog */}
        <Dialog open={authDialogOpen} onOpenChange={setAuthDialogOpen}>
          <DialogContent className="rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                Authorize Account
              </DialogTitle>
              <DialogDescription className="text-slate-600 dark:text-slate-400">
                Click the button below to authorize your account
              </DialogDescription>
            </DialogHeader>
            <div className="pt-4">
              <Button
                onClick={() => window.open(authUrl, '_blank')}
                className="w-full h-11 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Open Authorization Page
              </Button>
              <p className="text-xs text-slate-500 dark:text-slate-500 mt-4 text-center">
                After authorization, return to this page
              </p>
            </div>
          </DialogContent>
        </Dialog>

        {/* Accounts Grid */}
        {accounts.length === 0 ? (
          <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl animate-fade-in">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
                <Plus className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
                No accounts yet
              </h3>
              <p className="text-slate-600 dark:text-slate-400 text-center max-w-sm">
                Get started by connecting your first social media account
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {accounts.map((account, index) => (
              <Card
                key={account.id}
                className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl hover-lift animate-fade-in cursor-pointer"
                style={{ animationDelay: `${index * 0.05}s` }}
                onClick={() => {
                  setSelectedAccountId(account.id);
                  setDetailDialogOpen(true);
                }}
              >
                <CardHeader className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                        {getPlatformIcon(account.platform)}
                      </div>
                      <div>
                        <CardTitle className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                          {account.accountName}
                        </CardTitle>
                        <CardDescription className="text-sm text-slate-600 dark:text-slate-400">
                          {PLATFORM_NAMES[account.platform]}
                        </CardDescription>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    {getStatusBadge(account.status)}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteAccount(account.id);
                      }}
                      className="h-8 w-8 p-0 rounded-lg hover:bg-red-50 dark:hover:bg-red-950 hover:text-red-600 dark:hover:text-red-400"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Account Detail Dialog */}
      <AccountDetailDialog
        accountId={selectedAccountId}
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
        onRefresh={loadAccounts}
      />
    </div>

  );
}
