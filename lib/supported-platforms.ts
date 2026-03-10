// 支持的平台列表
export interface SupportedPlatform {
  id: string;
  name: string;
  description: string;
  icon: string;
  defaultAuthMode: 'composio' | 'custom';
  composioAuthConfigId: string | null;
  supportsCustomAuth: boolean;
}

export const SUPPORTED_PLATFORMS: SupportedPlatform[] = [
  {
    id: 'twitter',
    name: 'Twitter / X',
    description: 'Post tweets, threads, and media',
    icon: 'Twitter',
    defaultAuthMode: 'composio',
    composioAuthConfigId: 'ac_Ql-Ov-Yx-Iqz',
    supportsCustomAuth: true
  },
  {
    id: 'facebook',
    name: 'Facebook',
    description: 'Share posts and updates',
    icon: 'Facebook',
    defaultAuthMode: 'composio',
    composioAuthConfigId: 'ac_uQna486gqnNQ',
    supportsCustomAuth: true
  },
  {
    id: 'instagram',
    name: 'Instagram',
    description: 'Post photos and videos',
    icon: 'Instagram',
    defaultAuthMode: 'composio',
    composioAuthConfigId: 'ac_dHVOT2jWinIh',
    supportsCustomAuth: true
  },
  {
    id: 'youtube',
    name: 'YouTube',
    description: 'Upload and publish videos',
    icon: 'Youtube',
    defaultAuthMode: 'composio',
    composioAuthConfigId: 'ac_4lShTlNrQgjs',
    supportsCustomAuth: true
  },
  {
    id: 'reddit',
    name: 'Reddit',
    description: 'Post to subreddits',
    icon: 'MessageSquare',
    defaultAuthMode: 'composio',
    composioAuthConfigId: 'ac_nHytl_JK4FQx',
    supportsCustomAuth: true
  },
  {
    id: 'discord',
    name: 'Discord',
    description: 'Send messages to channels',
    icon: 'MessageCircle',
    defaultAuthMode: 'composio',
    composioAuthConfigId: 'ac_XHBXXn2V7B-r',
    supportsCustomAuth: false
  },
  {
    id: 'slack',
    name: 'Slack',
    description: 'Post to Slack channels',
    icon: 'Hash',
    defaultAuthMode: 'composio',
    composioAuthConfigId: 'ac_BKA_50cEKNez',
    supportsCustomAuth: true
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    description: 'Share professional updates',
    icon: 'Linkedin',
    defaultAuthMode: 'composio',
    composioAuthConfigId: null,
    supportsCustomAuth: true
  },
  {
    id: 'tiktok',
    name: 'TikTok',
    description: 'Upload short videos',
    icon: 'Video',
    defaultAuthMode: 'custom',
    composioAuthConfigId: null,
    supportsCustomAuth: true
  }
];
