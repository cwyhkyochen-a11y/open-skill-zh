'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { RefreshCw, Plus, Trash2, Check } from 'lucide-react';

interface AccountDetailDialogProps {
  accountId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRefresh?: () => void;
}

export function AccountDetailDialog({
  accountId,
  open,
  onOpenChange,
  onRefresh,
}: AccountDetailDialogProps) {
  const [account, setAccount] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  // Facebook Page IDs
  const [pageIds, setPageIds] = useState<string[]>([]);
  const [defaultPageId, setDefaultPageId] = useState<string | null>(null);
  const [newPageId, setNewPageId] = useState('');
  const [savingPages, setSavingPages] = useState(false);
  
  // Instagram User ID
  const [fetchingInstagramId, setFetchingInstagramId] = useState(false);

  useEffect(() => {
    if (open && accountId) {
      fetchAccountDetail();
    }
  }, [open, accountId]);

  const fetchAccountDetail = async () => {
    if (!accountId) return;
    
    setLoading(true);
    try {
      console.log('[AccountDetail] Fetching account:', accountId);
      const res = await fetch(`/contentops/api/accounts/${accountId}`, { credentials: 'include' });
      console.log('[AccountDetail] Response status:', res.status);
      console.log('[AccountDetail] Response headers:', Object.fromEntries(res.headers.entries()));
      
      if (!res.ok) {
        const text = await res.text();
        console.error('[AccountDetail] Error response:', text);
        throw new Error(`Failed to fetch account: ${res.status} ${text}`);
      }
      
      const text = await res.text();
      console.log('[AccountDetail] Response text:', text);
      
      if (!text) {
        throw new Error('Empty response from server');
      }
      
      const data = JSON.parse(text);
      setAccount(data);
      
      // 加载 Facebook Page IDs
      if (data.platform === 'facebook') {
        setPageIds(data.facebookPageIds || []);
        setDefaultPageId(data.facebookDefaultPageId);
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshStatus = async () => {
    if (!accountId) return;
    
    setRefreshing(true);
    try {
      const res = await fetch(`/contentops/api/accounts/refresh`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountId }),
      });
      
      if (!res.ok) throw new Error('Failed to refresh status');
      
      toast.success('Status refreshed');
      await fetchAccountDetail();
      onRefresh?.();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setRefreshing(false);
    }
  };

  const handleAddPageId = () => {
    if (!newPageId.trim()) {
      toast.error('Please enter a Page ID');
      return;
    }
    
    if (pageIds.includes(newPageId.trim())) {
      toast.error('Page ID already exists');
      return;
    }
    
    setPageIds([...pageIds, newPageId.trim()]);
    setNewPageId('');
  };

  const handleRemovePageId = (pageId: string) => {
    setPageIds(pageIds.filter(id => id !== pageId));
    if (defaultPageId === pageId) {
      setDefaultPageId(null);
    }
  };

  const handleSavePageIds = async () => {
    if (!accountId) return;
    
    setSavingPages(true);
    try {
      const res = await fetch(`/contentops/api/accounts/${accountId}/facebook-pages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pageIds, defaultPageId }),
      });
      
      if (!res.ok) throw new Error('Failed to save Page IDs');
      
      toast.success('Page IDs saved');
      await fetchAccountDetail();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSavingPages(false);
    }
  };

  const handleFetchInstagramUserId = async () => {
    if (!accountId) return;
    
    setFetchingInstagramId(true);
    try {
      const res = await fetch(`/contentops/api/accounts/${accountId}/instagram-user-id`, { credentials: 'include' });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to fetch Instagram User ID');
      }
      
      const data = await res.json();
      toast.success(`Instagram User ID: ${data.userId}`);
      await fetchAccountDetail();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setFetchingInstagramId(false);
    }
  };

  if (!account) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl">
        <DialogHeader>
          <DialogTitle>账号详情</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* 基本信息 */}
          <div className="space-y-4">
            <div>
              <Label>账号名称</Label>
              <div className="mt-1 text-sm">{account.accountName}</div>
            </div>

            <div>
              <Label>平台</Label>
              <div className="mt-1">
                <Badge variant="outline">{account.platform}</Badge>
              </div>
            </div>

            <div>
              <Label>状态</Label>
              <div className="mt-1 flex items-center gap-2">
                <Badge variant={account.status === 'active' ? 'default' : 'secondary'}>
                  {account.status}
                </Badge>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleRefreshStatus}
                  disabled={refreshing}
                >
                  <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                </Button>
              </div>
            </div>

            <div>
              <Label>创建时间</Label>
              <div className="mt-1 text-sm">
                {new Date(account.createdAt).toLocaleString('zh-CN')}
              </div>
            </div>
          </div>

          {/* Facebook Page IDs */}
          {account.platform === 'facebook' && (
            <div className="space-y-4 border-t pt-4">
              <div>
                <Label>Facebook Page IDs</Label>
                <p className="text-xs text-gray-500 mt-1">
                  添加多个 Page ID，选择一个作为默认
                </p>
              </div>

              <div className="space-y-2">
                {pageIds.map((pageId) => (
                  <div key={pageId} className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant={defaultPageId === pageId ? 'default' : 'outline'}
                      onClick={() => setDefaultPageId(pageId)}
                      className="flex-shrink-0"
                    >
                      {defaultPageId === pageId && <Check className="h-4 w-4 mr-1" />}
                      默认
                    </Button>
                    <div className="flex-1 px-3 py-2 border rounded text-sm">
                      {pageId}
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleRemovePageId(pageId)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <Input
                  placeholder="输入 Page ID"
                  value={newPageId}
                  onChange={(e) => setNewPageId(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddPageId()}
                />
                <Button onClick={handleAddPageId}>
                  <Plus className="h-4 w-4 mr-1" />
                  添加
                </Button>
              </div>

              <Button
                onClick={handleSavePageIds}
                disabled={savingPages}
                className="w-full"
              >
                {savingPages ? '保存中...' : '保存 Page IDs'}
              </Button>
            </div>
          )}

          {/* Instagram User ID */}
          {account.platform === 'instagram' && (
            <div className="space-y-4 border-t pt-4">
              <div>
                <Label>Instagram User ID</Label>
                {account.instagramUserId ? (
                  <div className="mt-1 text-sm font-mono bg-gray-50 p-2 rounded">
                    {account.instagramUserId}
                  </div>
                ) : (
                  <p className="text-xs text-gray-500 mt-1">
                    未获取，点击下方按钮获取
                  </p>
                )}
              </div>

              <Button
                onClick={handleFetchInstagramUserId}
                disabled={fetchingInstagramId}
                className="w-full"
              >
                {fetchingInstagramId ? '获取中...' : '获取 Instagram User ID'}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
