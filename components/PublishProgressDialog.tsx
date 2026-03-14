'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

interface PublishProgress {
  accountId: string;
  accountName: string;
  platform: string;
  status: 'pending' | 'publishing' | 'success' | 'failed';
  error?: string;
  postUrl?: string;
}

interface PublishProgressDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  progress: PublishProgress[];
  totalAccounts: number;
}

export function PublishProgressDialog({
  open,
  onOpenChange,
  progress,
  totalAccounts,
}: PublishProgressDialogProps) {
  const successCount = progress.filter(p => p.status === 'success').length;
  const failedCount = progress.filter(p => p.status === 'failed').length;
  const publishingCount = progress.filter(p => p.status === 'publishing').length;
  const isComplete = successCount + failedCount === totalAccounts;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className=max-w-2xl max-h-[80vh] overflow-y-auto>
        <DialogHeader>
          <DialogTitle>发布进度</DialogTitle>
        </DialogHeader>

        <div className=space-y-4>
          {/* 进度统计 */}
          <div className=flex items-center gap-4 p-4 bg-gray-50 rounded-lg>
            <div className=flex-1>
              <div className=text-sm text-gray-600>总计</div>
              <div className=text-2xl font-bold>{totalAccounts}</div>
            </div>
            <div className=flex-1>
              <div className=text-sm text-green-600>成功</div>
              <div className=text-2xl font-bold text-green-600>{successCount}</div>
            </div>
            <div className=flex-1>
              <div className=text-sm text-red-600>失败</div>
              <div className=text-2xl font-bold text-red-600>{failedCount}</div>
            </div>
            {publishingCount > 0 && (
              <div className=flex-1>
                <div className=text-sm text-blue-600>发布中</div>
                <div className=text-2xl font-bold text-blue-600>{publishingCount}</div>
              </div>
            )}
          </div>

          {/* 进度条 */}
          <div className=w-full bg-gray-200 rounded-full h-2>
            <div
              className=bg-blue-600 h-2 rounded-full transition-all duration-300
              style={{
                width: `${((successCount + failedCount) / totalAccounts) * 100}%`,
              }}
            />
          </div>

          {/* 账号列表 */}
          <div className=space-y-2>
            {progress.map((item) => (
              <div
                key={item.accountId}
                className=flex items-center gap-3 p-3 border rounded-lg
              >
                {/* 状态图标 */}
                <div className=flex-shrink-0>
                  {item.status === 'pending' && (
                    <div className=w-6 h-6 rounded-full bg-gray-200 />
                  )}
                  {item.status === 'publishing' && (
                    <Loader2 className=w-6 h-6 text-blue-600 animate-spin />
                  )}
                  {item.status === 'success' && (
                    <CheckCircle className=w-6 h-6 text-green-600 />
                  )}
                  {item.status === 'failed' && (
                    <XCircle className=w-6 h-6 text-red-600 />
                  )}
                </div>

                {/* 账号信息 */}
                <div className=flex-1 min-w-0>
                  <div className=flex items-center gap-2>
                    <span className=font-medium truncate>{item.accountName}</span>
                    <Badge variant=outline className=text-xs>
                      {item.platform}
                    </Badge>
                  </div>
                  {item.status === 'failed' && item.error && (
                    <div className=text-xs text-red-600 mt-1 truncate>
                      {item.error}
                    </div>
                  )}
                  {item.status === 'success' && item.postUrl && (
                    <a
                      href={item.postUrl}
                      target=_blank
                      rel=noopener noreferrer
                      className=text-xs text-blue-600 hover:underline mt-1 block truncate
                    >
                      查看帖子
                    </a>
                  )}
                </div>

                {/* 状态标签 */}
                <div className=flex-shrink-0>
                  {item.status === 'pending' && (
                    <Badge variant=secondary>等待中</Badge>
                  )}
                  {item.status === 'publishing' && (
                    <Badge variant=default>发布中</Badge>
                  )}
                  {item.status === 'success' && (
                    <Badge variant=default className=bg-green-600>
                      成功
                    </Badge>
                  )}
                  {item.status === 'failed' && (
                    <Badge variant=destructive>失败</Badge>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* 完成提示 */}
          {isComplete && (
            <div className=text-center p-4 bg-blue-50 rounded-lg>
              <div className=text-lg font-semibold text-blue-900>
                发布完成！
              </div>
              <div className=text-sm text-blue-700 mt-1>
                成功 {successCount} 个，失败 {failedCount} 个
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
