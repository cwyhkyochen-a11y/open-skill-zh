'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CONTENT_TYPES, type ContentTypeId } from '@/lib/content-types';
import { PLATFORM_NAMES, PLATFORM_ICONS } from '@/lib/platform-fields';
import { CheckCircle, FileText, Image, Video, Link } from 'lucide-react';

interface ContentTypeSelectorProps {
  selectedType?: ContentTypeId;
  onSelect: (type: ContentTypeId) => void;
}

const CONTENT_TYPE_ICONS = {
  text: FileText,
  image: Image,
  video: Video,
  link: Link,
};

export function ContentTypeSelector({ selectedType, onSelect }: ContentTypeSelectorProps) {
  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
      {Object.entries(CONTENT_TYPES).map(([id, config], index) => {
        const isSelected = selectedType === id;
        const IconComponent = CONTENT_TYPE_ICONS[id as ContentTypeId];
        
        return (
          <Card
            key={id}
            className={`cursor-pointer transition-all duration-200 hover:-translate-y-1 animate-fade-in ${
              isSelected
                ? 'bg-indigo-50 dark:bg-indigo-950 border-indigo-500 dark:border-indigo-600 ring-2 ring-indigo-500/20'
                : 'border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-lg'
            } rounded-2xl`}
            style={{ animationDelay: `${index * 0.05}s` }}
            onClick={() => onSelect(id as ContentTypeId)}
          >
            <CardHeader className="space-y-4">
              <div className="flex items-center justify-between">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  isSelected 
                    ? 'bg-indigo-600 dark:bg-indigo-500' 
                    : 'bg-slate-100 dark:bg-slate-800'
                }`}>
                  <IconComponent className={`w-6 h-6 ${
                    isSelected 
                      ? 'text-white' 
                      : 'text-slate-600 dark:text-slate-400'
                  }`} />
                </div>
                {isSelected && (
                  <Badge className="rounded-lg px-2 py-1 bg-indigo-600 dark:bg-indigo-500 text-white border-0">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Selected
                  </Badge>
                )}
              </div>
              <div>
                <CardTitle className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
                  {config.label}
                </CardTitle>
                <CardDescription className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  {config.description}
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  Supported platforms
                </p>
                <div className="flex flex-wrap gap-2">
                  {config.platforms.slice(0, 4).map((platform) => {
                    const PlatformIcon = PLATFORM_ICONS[platform] as any;
                    return (
                      <div
                        key={platform}
                        className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center"
                        title={PLATFORM_NAMES[platform]}
                      >
                        {PlatformIcon && <PlatformIcon className="w-4 h-4 text-slate-600 dark:text-slate-400" />}
                      </div>
                    );
                  })}
                  {config.platforms.length > 4 && (
                    <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-medium text-slate-600 dark:text-slate-400">
                      +{config.platforms.length - 4}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
