'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { CheckCircle, XCircle, Clock, ExternalLink, Loader2, FileText } from 'lucide-react';
import { PLATFORM_NAMES, PLATFORM_ICONS } from '@/lib/platform-fields';

interface PublishRecord {
  id: string;
  taskName: string;
  contentType: string;
  status: string;
  publishedAt: string;
  publishResults: any;
}

export default function RecordsPage() {
  const [records, setRecords] = useState<PublishRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRecords();
  }, []);

  const loadRecords = async () => {
    try {
      const res = await fetch(process.env.NEXT_PUBLIC_APP_URL + '/api/publish/records');
      const data = await res.json();
      setRecords(data.records || []);
    } catch (error) {
      toast.error('Failed to load records');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      published: { variant: 'default' as const, icon: CheckCircle, text: 'Published', color: 'text-emerald-600 dark:text-emerald-400' },
      partial: { variant: 'secondary' as const, icon: Clock, text: 'Partial', color: 'text-amber-600 dark:text-amber-400' },
      failed: { variant: 'destructive' as const, icon: XCircle, text: 'Failed', color: 'text-red-600 dark:text-red-400' },
    };
    const config = variants[status as keyof typeof variants] || variants.failed;
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
    return IconComponent ? <IconComponent className="w-4 h-4" /> : null;
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
        {/* Header */}
        <div className="mb-8 animate-fade-in">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">
            Publish History
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            View your content publishing history
          </p>
        </div>

        {/* Records List */}
        {records.length === 0 ? (
          <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl animate-fade-in">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
                <FileText className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
                No records yet
              </h3>
              <p className="text-slate-600 dark:text-slate-400 text-center max-w-sm mb-6">
                Your publishing history will appear here
              </p>
              <Button
                onClick={() => (window.location.href = '/contentops/dashboard/publish')}
                className="rounded-xl h-11 px-6 bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                Create First Post
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {records.map((record, index) => {
              const results = JSON.parse(record.publishResults || '[]');
              const successCount = results.filter((r: any) => r.status === 'success').length;
              const failedCount = results.filter((r: any) => r.status === 'failed').length;

              return (
                <Card
                  key={record.id}
                  className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl hover-lift animate-fade-in"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <CardTitle className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                          {record.taskName}
                        </CardTitle>
                        <CardDescription className="text-sm text-slate-600 dark:text-slate-400">
                          {new Date(record.publishedAt).toLocaleString()} · {record.contentType}
                        </CardDescription>
                      </div>
                      {getStatusBadge(record.status)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Stats */}
                      <div className="flex items-center gap-6 text-sm">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                          <span className="text-slate-700 dark:text-slate-300">
                            {successCount} successful
                          </span>
                        </div>
                        {failedCount > 0 && (
                          <div className="flex items-center gap-2">
                            <XCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                            <span className="text-slate-700 dark:text-slate-300">
                              {failedCount} failed
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Results */}
                      <div className="grid gap-3">
                        {results.map((result: any, idx: number) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-white dark:bg-slate-900 flex items-center justify-center">
                                {getPlatformIcon(result.platform)}
                              </div>
                              <div>
                                <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
                                  {result.accountName}
                                </div>
                                <div className="text-xs text-slate-600 dark:text-slate-400">
                                  {PLATFORM_NAMES[result.platform]}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {result.status === 'success' ? (
                                <>
                                  <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                                  {result.postUrl && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => window.open(result.postUrl, '_blank')}
                                      className="h-8 px-3 rounded-lg"
                                    >
                                      <ExternalLink className="w-3 h-3" />
                                    </Button>
                                  )}
                                </>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <XCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                                  <span className="text-xs text-red-600 dark:text-red-400">
                                    {result.error}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
