// 平台字段配置
import { Twitter, Youtube, Instagram, Facebook, MessageCircle, Hash, Briefcase, Music, Send as TelegramIcon, Hash as SlackIcon, Pin, FileText, LucideIcon } from 'lucide-react';

export type FieldType = 'text' | 'textarea' | 'file' | 'select' | 'tags' | 'url' | 'number';

export interface FieldConfig {
  type: FieldType;
  label: string;
  placeholder?: string;
  required: boolean;
  maxLength?: number;
  accept?: string;
  multiple?: boolean;
  options?: Array<{ value: string; label: string }>;
  description?: string;
}

export const PLATFORM_FIELDS: Record<string, Record<string, FieldConfig>> = {
  twitter: {
    text: {
      type: 'textarea',
      label: '推文内容',
      placeholder: '有什么新鲜事？',
      required: true,
      maxLength: 280,
      description: '最多280个字符'
    },
    media: {
      type: 'file',
      label: '图片/视频',
      accept: 'image/*,video/*',
      multiple: true,
      required: false,
      description: '最多4张图片或1个视频'
    }
  },
  youtube: {
    title: {
      type: 'text',
      label: '视频标题',
      placeholder: '输入视频标题',
      required: true,
      maxLength: 100
    },
    description: {
      type: 'textarea',
      label: '视频描述',
      placeholder: '输入视频描述',
      required: true,
      maxLength: 5000
    },
    video: {
      type: 'file',
      label: '视频文件',
      accept: 'video/*',
      required: true
    },
    tags: {
      type: 'tags',
      label: '标签',
      placeholder: '用逗号分隔',
      required: false,
      description: '帮助用户发现你的视频'
    }
  },
  instagram: {
    caption: {
      type: 'textarea',
      label: '图片说明',
      placeholder: '写下你的想法...',
      required: true,
      maxLength: 2200
    },
    image: {
      type: 'file',
      label: '图片',
      accept: 'image/*',
      required: true
    },
    location: {
      type: 'text',
      label: '位置',
      placeholder: '添加位置',
      required: false
    }
  },
  facebook: {
    message: {
      type: 'textarea',
      label: '帖子内容',
      placeholder: '你在想什么？',
      required: true
    },
    media: {
      type: 'file',
      label: '图片/视频',
      accept: 'image/*,video/*',
      multiple: true,
      required: false
    },
    link: {
      type: 'url',
      label: '链接',
      placeholder: 'https://',
      required: false
    }
  },
  reddit: {
    title: {
      type: 'text',
      label: '标题',
      placeholder: '输入标题',
      required: true,
      maxLength: 300
    },
    text: {
      type: 'textarea',
      label: '正文',
      placeholder: '输入正文（可选）',
      required: false
    },
    subreddit: {
      type: 'text',
      label: 'Subreddit',
      placeholder: 'r/example',
      required: true
    }
  },
  discord: {
    content: {
      type: 'textarea',
      label: '消息内容',
      placeholder: '输入消息',
      required: true,
      maxLength: 2000
    },
    channel_id: {
      type: 'text',
      label: '频道ID',
      placeholder: '输入频道ID',
      required: true
    }
  }
};

export const PLATFORM_NAMES: Record<string, string> = {
  twitter: 'Twitter/X',
  youtube: 'YouTube',
  instagram: 'Instagram',
  facebook: 'Facebook',
  reddit: 'Reddit',
  discord: 'Discord',
  linkedin: 'LinkedIn',
  tiktok: 'TikTok',
  telegram: 'Telegram',
  slack: 'Slack',
  pinterest: 'Pinterest',
  tumblr: 'Tumblr',
};

// 平台图标 - 使用 Lucide React 组件
export const PLATFORM_ICONS: Record<string, LucideIcon> = {
  twitter: Twitter,
  youtube: Youtube,
  instagram: Instagram,
  facebook: Facebook,
  reddit: MessageCircle,
  discord: MessageCircle,
  linkedin: Briefcase,
  tiktok: Music,
  telegram: TelegramIcon,
  slack: SlackIcon,
  pinterest: Pin,
  tumblr: FileText,
};
