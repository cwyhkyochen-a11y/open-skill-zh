'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ContentTypeSelector } from '@/components/content-type-selector';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { CONTENT_TYPES, CONTENT_TYPE_FIELDS, type ContentTypeId, getSupportedPlatforms } from '@/lib/content-types';
import { Send, ArrowLeft, ArrowRight, CheckCircle, Loader2, Sparkles } from 'lucide-react';
import { PLATFORM_NAMES, PLATFORM_ICONS } from '@/lib/platform-fields';

interface Account {
  id: string;
  accountName: string;
  platform: string;
  status: string;
  authMode: string;
  composioUserId?: string;
}

export default function PublishPage() {
  const [step, setStep] = useState(1);
  const [contentType, setContentType] = useState<ContentTypeId | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    try {
      const res = await fetch(process.env.NEXT_PUBLIC_APP_URL + '/api/accounts');
      const data = await res.json();
      const activeAccounts = (data.accounts || []).filter(
        (acc: Account) => acc.status === 'active'
      );
      setAccounts(activeAccounts);
    } catch (error) {
      toast.error('Failed to load accounts');
    }
  };

  const getFilteredAccounts = () => {
    if (!contentType) return [];
    const supportedPlatforms = getSupportedPlatforms(contentType);
    return accounts.filter((acc) => supportedPlatforms.includes(acc.platform));
  };

  const groupAccountsByPlatform = () => {
    const filtered = getFilteredAccounts();
    return filtered.reduce((acc, account) => {
      if (!acc[account.platform]) {
        acc[account.platform] = [];
      }
      acc[account.platform].push(account);
      return acc;
    }, {} as Record<string, Account[]>);
  };

  const toggleAccount = (accountId: string) => {
    setSelectedAccounts((prev) =>
      prev.includes(accountId)
        ? prev.filter((id) => id !== accountId)
        : [...prev, accountId]
    );
  };

  const updateFormData = (fieldName: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [fieldName]: value,
    }));
  };

  const handleFileUpload = async (fieldName: string, files: FileList | null) => {
    if (!files || files.length === 0) {
      updateFormData(fieldName, []);
      return;
    }

    toast.info(`Uploading ${files.length} file(s)...`);
    
    try {
      const mediaIds: string[] = [];
      
      const firstAccountId = selectedAccounts[0];
      if (!firstAccountId) {
        toast.error('Please select an account first');
        return;
      }
      
      const account = accounts.find(a => a.id === firstAccountId);
      if (!account || !account.composioUserId) {
        toast.error('Account information incomplete');
        return;
      }
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        const uploadFormData = new FormData();
        uploadFormData.append('file', file);
        uploadFormData.append('platform', account.platform);
        uploadFormData.append('userId', account.composioUserId);
        
        const uploadRes = await fetch(process.env.NEXT_PUBLIC_APP_URL + '/api/media/upload', {
          method: 'POST',
          body: uploadFormData,
        });
        
        if (!uploadRes.ok) {
          const error = await uploadRes.json();
          throw new Error(`${file.name} upload failed: ${error.error}`);
        }
        
        const uploadResult = await uploadRes.json();
        mediaIds.push(uploadResult.mediaId);
      }
      
      updateFormData(fieldName, mediaIds);
      toast.success(`${files.length} file(s) uploaded successfully`);
    } catch (error: any) {
      toast.error(error.message || 'Upload failed');
      updateFormData(fieldName, []);
    }
  };

  const renderField = (fieldName: string, config: any) => {
    const value = formData[fieldName] || '';

    switch (config.type) {
      case 'text':
        return (
          <div key={fieldName} className="space-y-2">
            <Label htmlFor={fieldName} className="text-sm font-medium text-slate-700 dark:text-slate-300">
              {config.label}
              {config.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              id={fieldName}
              type="text"
              placeholder={config.placeholder}
              value={value}
              onChange={(e) => updateFormData(fieldName, e.target.value)}
              maxLength={config.maxLength}
              className="h-11 rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            />
            {config.maxLength && (
              <p className="text-xs text-slate-500 text-right">
                {value.length} / {config.maxLength}
              </p>
            )}
          </div>
        );

      case 'textarea':
        return (
          <div key={fieldName} className="space-y-2">
            <Label htmlFor={fieldName} className="text-sm font-medium text-slate-700 dark:text-slate-300">
              {config.label}
              {config.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Textarea
              id={fieldName}
              placeholder={config.placeholder}
              value={value}
              onChange={(e) => updateFormData(fieldName, e.target.value)}
              maxLength={config.maxLength}
              rows={6}
              className="rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 resize-none"
            />
            {config.maxLength && (
              <p className="text-xs text-slate-500 text-right">
                {value.length} / {config.maxLength}
              </p>
            )}
          </div>
        );

      case 'file':
        return (
          <div key={fieldName} className="space-y-2">
            <Label htmlFor={fieldName} className="text-sm font-medium text-slate-700 dark:text-slate-300">
              {config.label}
              {config.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              id={fieldName}
              type="file"
              accept={config.accept}
              multiple={config.multiple}
              onChange={(e) => handleFileUpload(fieldName, e.target.files)}
              className="h-11 rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 file:mr-4 file:px-4 file:py-2 file:rounded-lg file:border-0 file:bg-indigo-50 dark:file:bg-indigo-950 file:text-indigo-600 dark:file:text-indigo-400 file:font-medium"
            />
            {config.maxFiles && (
              <p className="text-xs text-slate-500">
                Max {config.maxFiles} files
              </p>
            )}
            {Array.isArray(formData[fieldName]) && formData[fieldName].length > 0 && (
              <div className="text-xs text-emerald-600 dark:text-emerald-400">
                {formData[fieldName].length} file(s) uploaded
              </div>
            )}
          </div>
        );

      case 'url':
        return (
          <div key={fieldName} className="space-y-2">
            <Label htmlFor={fieldName} className="text-sm font-medium text-slate-700 dark:text-slate-300">
              {config.label}
              {config.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              id={fieldName}
              type="url"
              placeholder={config.placeholder}
              value={value}
              onChange={(e) => updateFormData(fieldName, e.target.value)}
              className="h-11 rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            />
          </div>
        );

      case 'tags':
        return (
          <div key={fieldName} className="space-y-2">
            <Label htmlFor={fieldName} className="text-sm font-medium text-slate-700 dark:text-slate-300">
              {config.label}
              {config.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              id={fieldName}
              placeholder={config.placeholder}
              value={value}
              onChange={(e) => updateFormData(fieldName, e.target.value)}
              className="h-11 rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            />
            <p className="text-xs text-slate-500">Separate tags with commas</p>
          </div>
        );

      default:
        return null;
    }
  };

  const validateForm = () => {
    if (!contentType) {
      toast.error('Please select content type');
      return false;
    }

    if (selectedAccounts.length === 0) {
      toast.error('Please select at least one account');
      return false;
    }

    const selectedPlatforms = selectedAccounts
      .map(id => accounts.find(acc => acc.id === id)?.platform)
      .filter(Boolean);
    const hasReddit = selectedPlatforms.includes('reddit');

    const fields = CONTENT_TYPE_FIELDS[contentType];
    for (const [fieldName, config] of Object.entries(fields)) {
      if (config.platforms && !config.platforms.some((p: string) => selectedPlatforms.includes(p))) {
        continue;
      }
      
      if (hasReddit && (fieldName === 'subreddit' || (fieldName === 'title' && (contentType === 'text' || contentType === 'link')))) {
        if (!formData[fieldName]) {
          toast.error(`Reddit requires ${config.label}`);
          return false;
        }
      } else if (config.required && !formData[fieldName]) {
        toast.error(`Please fill in ${config.label}`);
        return false;
      }
    }

    return true;
  };

  const handlePublish = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const res = await fetch(process.env.NEXT_PUBLIC_APP_URL + '/api/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountIds: selectedAccounts,
          contentType: contentType,
          content: formData,
        }),
      });

      if (!res.ok) throw new Error('Publish failed');

      const data = await res.json();
      
      toast.success(`Published to ${data.success} account(s)`);
      if (data.failed > 0) {
        toast.error(`Failed on ${data.failed} account(s)`);
      }

      setStep(1);
      setContentType(null);
      setSelectedAccounts([]);
      setFormData({});
    } catch (error: any) {
      toast.error(error.message || 'Publish failed');
    } finally {
      setLoading(false);
    }
  };

  const filteredAccounts = getFilteredAccounts();
  const groupedAccounts = groupAccountsByPlatform();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="container mx-auto px-6 py-12 max-w-5xl">
        {/* Header */}
        <div className="mb-8 animate-fade-in">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">
            Publish Content
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Create and publish content across multiple platforms
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-4 mb-12 animate-fade-in stagger-1">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center font-semibold transition-all duration-200 ${
                  step >= s
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30'
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-400'
                }`}
              >
                {s}
              </div>
              {s < 3 && (
                <div
                  className={`w-16 h-0.5 mx-2 transition-all duration-200 ${
                    step > s ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-800'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step 1: Select Content Type */}
        {step === 1 && (
          <div className="space-y-6 animate-fade-in">
            <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl">
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  Choose Content Type
                </CardTitle>
                <CardDescription className="text-slate-600 dark:text-slate-400">
                  Select the type of content you want to publish
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ContentTypeSelector
                  selectedType={contentType || undefined}
                  onSelect={setContentType}
                />
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button
                onClick={() => setStep(2)}
                disabled={!contentType}
                className="rounded-xl h-11 px-8 bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50"
              >
                Next
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Select Accounts */}
        {step === 2 && (
          <div className="space-y-6 animate-fade-in">
            <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl">
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  Select Accounts
                </CardTitle>
                <CardDescription className="text-slate-600 dark:text-slate-400">
                  {selectedAccounts.length} selected · {filteredAccounts.length} available
                </CardDescription>
              </CardHeader>
              <CardContent>
                {filteredAccounts.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-slate-600 dark:text-slate-400 mb-4">
                      No accounts support this content type
                    </p>
                    <Button
                      variant="outline"
                      onClick={() => (window.location.href = '/contentops/dashboard/accounts')}
                      className="rounded-xl"
                    >
                      Add Account
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {Object.entries(groupedAccounts).map(([platform, platformAccounts]) => (
                      <div key={platform} className="space-y-3">
                        <div className="flex items-center gap-2">
                          {PLATFORM_ICONS[platform] && (
                            <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                              {(() => {
                                const IconComponent = PLATFORM_ICONS[platform] as any;
                                return IconComponent ? <IconComponent className="w-4 h-4" /> : null;
                              })()}
                            </div>
                          )}
                          <span className="font-semibold text-slate-900 dark:text-slate-100">
                            {PLATFORM_NAMES[platform]}
                          </span>
                        </div>
                        <div className="grid gap-3">
                          {platformAccounts.map((account) => (
                            <label
                              key={account.id}
                              className="flex items-center gap-3 p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 cursor-pointer hover:border-indigo-300 dark:hover:border-indigo-700 transition-all duration-200 hover:-translate-y-0.5"
                            >
                              <Checkbox
                                checked={selectedAccounts.includes(account.id)}
                                onCheckedChange={() => toggleAccount(account.id)}
                                className="rounded-md"
                              />
                              <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                                {account.accountName}
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={() => setStep(1)}
                className="rounded-xl h-11 px-6 border-slate-200 dark:border-slate-700"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <Button
                onClick={() => setStep(3)}
                disabled={selectedAccounts.length === 0}
                className="rounded-xl h-11 px-8 bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50"
              >
                Next
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Create Content */}
        {step === 3 && contentType && (
          <div className="space-y-6 animate-fade-in">
            <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl">
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  Create Content
                </CardTitle>
                <CardDescription className="text-slate-600 dark:text-slate-400">
                  Publishing to {selectedAccounts.length} account(s)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {Object.entries(CONTENT_TYPE_FIELDS[contentType]).map(([fieldName, config]) =>
                  renderField(fieldName, config)
                )}
              </CardContent>
            </Card>

            {/* Selected Accounts Preview */}
            <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  Publishing To
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {selectedAccounts.map((id) => {
                    const account = accounts.find((a) => a.id === id);
                    if (!account) return null;
                    const IconComponent = PLATFORM_ICONS[account.platform] as any;
                    return (
                      <Badge
                        key={id}
                        variant="secondary"
                        className="rounded-lg px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                      >
                        {IconComponent && <IconComponent className="w-3 h-3 mr-1.5" />}
                        {account.accountName}
                      </Badge>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={() => setStep(2)}
                disabled={loading}
                className="rounded-xl h-11 px-6 border-slate-200 dark:border-slate-700"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <Button
                onClick={handlePublish}
                disabled={loading}
                className="rounded-xl h-11 px-8 bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20 hover:shadow-xl hover:shadow-indigo-500/30 transition-all duration-200 hover:-translate-y-0.5 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Publishing...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Publish to {selectedAccounts.length} Account(s)
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
