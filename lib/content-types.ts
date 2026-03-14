// 内容类型定义
export const CONTENT_TYPES = {
  text: {
    id: 'text',
    label: '纯文本',
    icon: 'text',
    description: '发布纯文本内容，适合快速分享想法和观点',
    platforms: ['twitter', 'facebook', 'linkedin', 'reddit', 'discord', 'telegram', 'slack'],
    fields: ['text', 'title', 'subreddit'],
    maxLength: 280,
  },
  image: {
    id: 'image',
    label: '图文',
    icon: 'image',
    description: '发布图片配文字，适合视觉内容分享',
    platforms: ['twitter', 'instagram', 'facebook', 'linkedin', 'pinterest', 'tumblr'],
    fields: ['text', 'images'],
    maxImages: 10,
  },
  video: {
    id: 'video',
    label: '视频',
    icon: 'video',
    description: '发布视频内容，适合长视频和短视频',
    platforms: ['youtube', 'tiktok', 'twitter', 'facebook', 'linkedin', 'instagram'],
    fields: ['title', 'description', 'video', 'tags'],
    maxDuration: 3600,
  },
  link: {
    id: 'link',
    label: '链接分享',
    icon: 'link',
    description: '分享外部链接，适合文章和网页推荐',
    platforms: ['twitter', 'facebook', 'linkedin', 'reddit'],
    fields: ['text', 'url', 'title', 'description', 'subreddit'],
  },
} as const;

export type ContentTypeId = keyof typeof CONTENT_TYPES;

export function getSupportedPlatforms(contentType: ContentTypeId): readonly string[] {
  return CONTENT_TYPES[contentType]?.platforms || [];
}

export function isPlatformSupported(platform: string, contentType: ContentTypeId): boolean {
  return CONTENT_TYPES[contentType]?.platforms.includes(platform as any) || false;
}

export function getPlatformContentTypes(platform: string): ContentTypeId[] {
  return Object.entries(CONTENT_TYPES)
    .filter(([_, config]) => config.platforms.includes(platform as any))
    .map(([id]) => id as ContentTypeId);
}

export const CONTENT_TYPE_FIELDS = {
  text: {
    text: {
      type: 'textarea',
      label: '文本内容',
      placeholder: '输入你想分享的内容...',
      required: true,
      maxLength: 5000,
    },
    title: {
      type: 'text',
      label: '标题 (Reddit 必需)',
      placeholder: '输入帖子标题...',
      required: false,
      maxLength: 300,
      platforms: ['reddit'],
    },
    subreddit: {
      type: 'text',
      label: 'Subreddit (Reddit 必需)',
      placeholder: '例如: programming',
      required: false,
      platforms: ['reddit'],
    },
  },
  image: {
    text: {
      type: 'textarea',
      label: '图片说明',
      placeholder: '为你的图片添加说明...',
      required: false,
      maxLength: 2200,
    },
    images: {
      type: 'file',
      label: '图片',
      accept: 'image/*',
      multiple: true,
      required: true,
      maxFiles: 10,
    },


  },
  video: {
    title: {
      type: 'text',
      label: '视频标题',
      placeholder: '输入视频标题...',
      required: true,
      maxLength: 100,
    },
    description: {
      type: 'textarea',
      label: '视频描述',
      placeholder: '描述你的视频内容...',
      required: false,
      maxLength: 5000,
    },
    video: {
      type: 'file',
      label: '视频文件',
      accept: 'video/*',
      required: true,
    },
    tags: {
      type: 'tags',
      label: '标签',
      placeholder: '添加标签，用逗号分隔',
      required: false,
    },
  },
  link: {
    url: {
      type: 'url',
      label: '链接地址',
      placeholder: 'https://example.com',
      required: true,
    },
    title: {
      type: 'text',
      label: '标题',
      placeholder: '输入链接标题...',
      required: false,
      maxLength: 300,
    },
    text: {
      type: 'textarea',
      label: '分享文案',
      placeholder: '添加你的评论或介绍...',
      required: false,
      maxLength: 280,
    },
    description: {
      type: 'textarea',
      label: '链接描述',
      placeholder: '描述链接内容...',
      required: false,
      maxLength: 500,
    },
    subreddit: {
      type: 'text',
      label: 'Subreddit (Reddit 必需)',
      placeholder: '例如: programming',
      required: false,
      platforms: ['reddit'],
    },
  },
} as const;
