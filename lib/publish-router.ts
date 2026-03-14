import { readFileSync } from 'fs';
import { composioClient } from './composio';
import type { ContentTypeId } from './content-types';

/**
 * 发布结果
 */
export interface PublishResult {
  success: boolean;
  platform: string;
  accountId: string;
  accountName: string;
  postId?: string;
  postUrl?: string;
  error?: string;
}

/**
 * 账号信息（从 DB 查出来的完整账号数据）
 */
export interface PublishAccount {
  id: string;
  platform: string;
  accountName: string;
  authMode: 'composio' | 'custom';
  composioUserId?: string;
  apiConfig?: any;
  facebookPageIds?: any;
  facebookDefaultPageId?: string | null;
  instagramUserId?: string | null;
}

/**
 * 上传文件的信息（前端上传后传回来的）
 */
interface UploadedFile {
  filePath: string;   // 本地绝对路径
  fileUrl: string;    // 公网 URL
  filename: string;
}

/**
 * 发布路由器
 * 
 * 职责：根据平台 + 内容类型，走不同的发布链路。
 * 媒体文件已经在用户上传时存到本地服务器了，这里按需做平台特定处理。
 */
export class PublishRouter {

  /**
   * 入口：发布内容到指定账号
   */
  async publish(
    account: PublishAccount,
    contentType: ContentTypeId,
    content: any
  ): Promise<PublishResult> {
    const baseResult = {
      platform: account.platform,
      accountId: account.id,
      accountName: account.accountName,
    };

    try {
      if (account.authMode !== 'composio') {
        throw new Error(`Custom OAuth publishing for ${account.platform} is not implemented yet.`);
      }

      if (!account.composioUserId) {
        throw new Error('Composio User ID not found for this account.');
      }

      // 获取 Composio connected account ID
      const connectedAccountId = await composioClient.getConnectedAccountId(
        account.composioUserId,
        account.platform
      );

      if (!connectedAccountId) {
        throw new Error(`No active ${account.platform} connection found. Please re-authorize.`);
      }

      // 按平台分发
      switch (account.platform) {
        case 'twitter':
          return await this.publishTwitter(account, connectedAccountId, contentType, content);
        case 'instagram':
          return await this.publishInstagram(account, connectedAccountId, contentType, content);
        case 'facebook':
          return await this.publishFacebook(account, connectedAccountId, contentType, content);
        case 'linkedin':
          return await this.publishGeneric(account, connectedAccountId, contentType, content);
        case 'reddit':
          return await this.publishGeneric(account, connectedAccountId, contentType, content);
        default:
          return await this.publishGeneric(account, connectedAccountId, contentType, content);
      }
    } catch (error: any) {
      console.error(`[PublishRouter] Error publishing to ${account.platform}/${account.accountName}:`, error.message);
      return {
        ...baseResult,
        success: false,
        error: error.message || 'Unknown error',
      };
    }
  }

  // ============================================================
  // Twitter
  // ============================================================

  /**
   * Twitter 发布链路
   * - 纯文本：直接调 TWITTER_CREATION_OF_A_POST
   * - 图文：先上传图片到 Twitter 获取 media_id，再发推
   * - 链接：文本中拼入 URL
   */
  private async publishTwitter(
    account: PublishAccount,
    connectedAccountId: string,
    contentType: ContentTypeId,
    content: any
  ): Promise<PublishResult> {
    const baseResult = {
      platform: 'twitter',
      accountId: account.id,
      accountName: account.accountName,
    };

    const params: any = {
      text: content.text || '',
    };

    // 链接类型：URL 拼入文本
    if (contentType === 'link' && content.url) {
      if (!params.text.includes(content.url)) {
        params.text = params.text ? `${params.text}\n${content.url}` : content.url;
      }
    }

    // 图文类型：上传图片获取 media_id
    if (contentType === 'image' && content.images) {
      const files = this.normalizeFiles(content.images);
      if (files.length > 0) {
        console.log(`[Twitter] Uploading ${files.length} image(s) to Twitter...`);
        const mediaIds: string[] = [];
        
        for (const file of files.slice(0, 4)) { // Twitter 最多 4 张图
          try {
            const mediaId = await composioClient.uploadMediaToTwitter(
              account.composioUserId || '',
              file.filePath,
              connectedAccountId
            );
            mediaIds.push(mediaId);
            console.log(`[Twitter] Uploaded ${file.filename}, media_id: ${mediaId}`);
          } catch (err: any) {
            console.error(`[Twitter] Failed to upload ${file.filename}:`, err.message);
            throw new Error(`Twitter image upload failed for ${file.filename}: ${err.message}`);
          }
        }

        if (mediaIds.length > 0) {
          params.media__media__ids = mediaIds;
        }
      }
    }

    console.log('[Twitter] Creating post with params:', JSON.stringify(params));

    const result = await composioClient.executeAction(
      connectedAccountId,
      account.composioUserId || '',
      'TWITTER_CREATION_OF_A_POST',
      params
    );

    if (!result.successful) {
      throw new Error(result.error || 'Twitter post creation failed');
    }

    const tweetId = result.data?.data?.id || result.data?.id;
    return {
      ...baseResult,
      success: true,
      postId: tweetId,
      postUrl: tweetId ? `https://x.com/i/status/${tweetId}` : undefined,
    };
  }

  // ============================================================
  // Instagram
  // ============================================================

  /**
   * Instagram 发布链路（两步）
   * 1. INSTAGRAM_CREATE_MEDIA_CONTAINER — 传入公网图片 URL + caption + ig_user_id
   * 2. INSTAGRAM_CREATE_POST — 传入 creation_id + ig_user_id
   */
  private async publishInstagram(
    account: PublishAccount,
    connectedAccountId: string,
    contentType: ContentTypeId,
    content: any
  ): Promise<PublishResult> {
    const baseResult = {
      platform: 'instagram',
      accountId: account.id,
      accountName: account.accountName,
    };

    // 获取 ig_user_id
    let igUserId = account.instagramUserId;
    
    if (!igUserId) {
      // 尝试自动获取
      console.log('[Instagram] ig_user_id missing, fetching via INSTAGRAM_GET_USER_INFO...');
      try {
        const userInfo = await composioClient.executeAction(
          connectedAccountId,
          account.composioUserId || '',
          'INSTAGRAM_GET_USER_INFO',
          {}
        );
        if (userInfo.successful && userInfo.data?.id) {
          igUserId = userInfo.data.id;
          console.log('[Instagram] Auto-fetched ig_user_id:', igUserId);
        }
      } catch (e: any) {
        console.error('[Instagram] Failed to auto-fetch ig_user_id:', e.message);
      }
    }

    if (!igUserId) {
      throw new Error(
        'Instagram Business Account ID not found. Go to Accounts page and click "Fetch IG User ID".'
      );
    }

    // 获取图片公网 URL
    const files = this.normalizeFiles(content.images);
    if (files.length === 0) {
      throw new Error('Instagram requires at least one image.');
    }

    const imageUrl = files[0].fileUrl;
    if (!imageUrl) {
      throw new Error('Image URL is empty. Upload may have failed.');
    }

    console.log('[Instagram] Step 1: Creating media container, image:', imageUrl);

    // 第1步：创建媒体容器
    const containerResult = await composioClient.executeAction(
      connectedAccountId,
      account.composioUserId || '',
      'INSTAGRAM_CREATE_MEDIA_CONTAINER',
      {
        ig_user_id: igUserId,
        image_url: imageUrl,
        caption: content.text || '',
      }
    );

    console.log('[Instagram] Container result:', JSON.stringify(containerResult));

    if (!containerResult.successful) {
      throw new Error(containerResult.error || 'Failed to create media container');
    }

    const creationId =
      containerResult.data?.data?.id ||
      containerResult.data?.id ||
      containerResult.data?.creation_id;

    if (!creationId) {
      throw new Error(
        'No creation_id returned from container. Response: ' +
          JSON.stringify(containerResult.data)
      );
    }

    console.log('[Instagram] Step 2: Publishing, creation_id:', creationId);

    // 第2步：发布
    const publishResult = await composioClient.executeAction(
      connectedAccountId,
      account.composioUserId || '',
      'INSTAGRAM_CREATE_POST',
      {
        ig_user_id: igUserId,
        creation_id: creationId,
      }
    );

    console.log('[Instagram] Publish result:', JSON.stringify(publishResult));

    if (!publishResult.successful) {
      throw new Error(publishResult.error || 'Failed to publish Instagram post');
    }

    return {
      ...baseResult,
      success: true,
      postId: publishResult.data?.data?.id || publishResult.data?.id,
      postUrl: publishResult.data?.data?.permalink || publishResult.data?.permalink,
    };
  }

  // ============================================================
  // Facebook
  // ============================================================

  /**
   * Facebook 发布链路
   * - 纯文本/链接：FACEBOOK_CREATE_POST (page_id, message, link?)
   * - 图文：FACEBOOK_CREATE_PHOTO_POST (page_id, message, url)
   */
  private async publishFacebook(
    account: PublishAccount,
    connectedAccountId: string,
    contentType: ContentTypeId,
    content: any
  ): Promise<PublishResult> {
    const baseResult = {
      platform: 'facebook',
      accountId: account.id,
      accountName: account.accountName,
    };

    // 获取 page_id
    const pageId = await this.resolveFacebookPageId(account, connectedAccountId);

    if (contentType === 'image') {
      // 图文 → FACEBOOK_CREATE_PHOTO_POST
      const files = this.normalizeFiles(content.images);
      if (files.length === 0) {
        throw new Error('Facebook photo post requires at least one image.');
      }

      const imageUrl = files[0].fileUrl;
      if (!imageUrl) {
        throw new Error('Image URL is empty.');
      }

      console.log('[Facebook] Creating photo post, page_id:', pageId, 'image:', imageUrl);

      const result = await composioClient.executeAction(
        connectedAccountId,
        account.composioUserId || '',
        'FACEBOOK_CREATE_PHOTO_POST',
        {
          page_id: pageId,
          message: content.text || '',
          url: imageUrl,
          published: true,
        }
      );

      if (!result.successful) {
        throw new Error(result.error || 'Facebook photo post failed');
      }

      return {
        ...baseResult,
        success: true,
        postId: result.data?.data?.id || result.data?.id || result.data?.post_id,
      };
    } else {
      // 纯文本 / 链接 → FACEBOOK_CREATE_POST
      const fbParams: any = {
        page_id: pageId,
        message: content.text || '',
        published: true,
      };

      if (contentType === 'link' && content.url) {
        fbParams.link = content.url;
      }

      console.log('[Facebook] Creating post, params:', JSON.stringify(fbParams));

      const result = await composioClient.executeAction(
        connectedAccountId,
        account.composioUserId || '',
        'FACEBOOK_CREATE_POST',
        fbParams
      );

      if (!result.successful) {
        throw new Error(result.error || 'Facebook post failed');
      }

      return {
        ...baseResult,
        success: true,
        postId: result.data?.data?.id || result.data?.id,
      };
    }
  }

  // ============================================================
  // 通用平台（LinkedIn, Reddit 等）
  // ============================================================

  private async publishGeneric(
    account: PublishAccount,
    connectedAccountId: string,
    contentType: ContentTypeId,
    content: any
  ): Promise<PublishResult> {
    const baseResult = {
      platform: account.platform,
      accountId: account.id,
      accountName: account.accountName,
    };

    const toolName = this.getGenericToolName(account.platform, contentType);
    const toolParams = this.formatGenericParams(account.platform, contentType, content);

    console.log(`[${account.platform}] Publishing via ${toolName}:`, JSON.stringify(toolParams));

    const result = await composioClient.executeAction(
      connectedAccountId,
      account.composioUserId || '',
      toolName,
      toolParams
    );

    if (!result.successful) {
      throw new Error(result.error || `${account.platform} post failed`);
    }

    return {
      ...baseResult,
      success: true,
      postId: result.data?.data?.id || result.data?.id,
      postUrl: result.data?.data?.url || result.data?.url,
    };
  }

  // ============================================================
  // 辅助方法
  // ============================================================

  /**
   * 获取 Facebook Page ID：优先从 DB，否则自动拉取
   */
  private async resolveFacebookPageId(
    account: PublishAccount,
    connectedAccountId: string
  ): Promise<string> {
    // 优先用已存储的 defaultPageId
    if (account.facebookDefaultPageId) {
      return account.facebookDefaultPageId;
    }

    // 尝试从 facebookPageIds 取第一个
    let pageIds = account.facebookPageIds;
    if (typeof pageIds === 'string') {
      try { pageIds = JSON.parse(pageIds); } catch { pageIds = []; }
    }
    if (Array.isArray(pageIds) && pageIds.length > 0) {
      return pageIds[0];
    }

    // 自动获取
    console.log('[Facebook] page_id missing, fetching via FACEBOOK_GET_USER_PAGES...');
    const pagesResult = await composioClient.executeAction(
      connectedAccountId,
      account.composioUserId || '',
      'FACEBOOK_GET_USER_PAGES',
      {}
    );

    if (pagesResult.successful) {
      const pages = pagesResult.data?.data || [];
      if (pages.length > 0) {
        console.log('[Facebook] Auto-fetched page_id:', pages[0].id, 'name:', pages[0].name);
        return pages[0].id;
      }
    }

    throw new Error(
      'No Facebook Pages found for this account. The account may not manage any Pages.'
    );
  }

  /**
   * 标准化文件列表：兼容旧格式（string[]）和新格式（UploadedFile[]）
   */
  private normalizeFiles(images: any): UploadedFile[] {
    if (!images) return [];

    // 新格式：UploadedFile[]
    if (Array.isArray(images) && images.length > 0 && typeof images[0] === 'object' && images[0].filePath) {
      return images as UploadedFile[];
    }

    // 旧格式：string[]（文件路径或 URL）
    if (Array.isArray(images)) {
      return images.filter(Boolean).map((item: any) => {
        if (typeof item === 'string') {
          const isUrl = item.startsWith('http');
          const isPath = item.startsWith('/');
          return {
            filePath: isPath ? item : '',
            fileUrl: isUrl ? item : this.pathToUrl(item),
            filename: item.split('/').pop() || 'unknown',
          };
        }
        return item;
      });
    }

    return [];
  }

  /**
   * 本地路径转公网 URL
   */
  private pathToUrl(filePath: string): string {
    if (!filePath || filePath.startsWith('http')) return filePath;

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || '';

    if (filePath.includes('/public/uploads/')) {
      const relativePath = filePath.split('/public/')[1];
      return `${appUrl}/${relativePath}`;
    }

    if (filePath.startsWith('/uploads/')) {
      return `${appUrl}${filePath}`;
    }

    const filename = filePath.split('/').pop();
    return `${appUrl}/uploads/images/${filename}`;
  }

  /**
   * 获取通用平台的工具名
   */
  private getGenericToolName(platform: string, contentType: ContentTypeId): string {
    const map: Record<string, Record<string, string>> = {
      linkedin: {
        text: 'LINKEDIN_CREATE_LINKED_IN_POST',
        image: 'LINKEDIN_CREATE_LINKED_IN_POST',
        link: 'LINKEDIN_CREATE_LINKED_IN_POST',
      },
      reddit: {
        text: 'REDDIT_CREATE_REDDIT_POST',
        link: 'REDDIT_CREATE_REDDIT_POST',
      },
      youtube: {
        video: 'YOUTUBE_UPLOAD_VIDEO',
      },
    };

    const toolName = map[platform]?.[contentType];
    if (!toolName) {
      throw new Error(`Unsupported: ${platform} - ${contentType}`);
    }
    return toolName;
  }

  /**
   * 格式化通用平台参数
   */
  private formatGenericParams(platform: string, contentType: ContentTypeId, content: any): any {
    switch (platform) {
      case 'linkedin':
        return {
          author: content.author || '',
          commentary: content.text || '',
          visibility: 'PUBLIC',
          lifecycleState: 'PUBLISHED',
        };

      case 'reddit':
        return {
          subreddit: content.subreddit || '',
          title: content.title || content.text?.substring(0, 300) || '',
          flair_id: content.flair_id || '',
          kind: content.url ? 'link' : 'self',
          ...(content.url ? { url: content.url } : { text: content.text || '' }),
        };

      case 'youtube':
        return {
          title: content.title || 'Untitled',
          description: content.description || content.text || '',
          tags:
            typeof content.tags === 'string'
              ? content.tags.split(',').map((t: string) => t.trim()).filter(Boolean)
              : content.tags || [],
          categoryId: content.categoryId || '22',
          privacyStatus: content.privacyStatus || 'public',
          videoFilePath: content.video || '',
        };

      default:
        return content;
    }
  }
}

export const publishRouter = new PublishRouter();
