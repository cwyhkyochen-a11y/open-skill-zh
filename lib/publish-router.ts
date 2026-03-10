import { composioClient } from './composio';
import type { ContentTypeId } from './content-types';

// 发布结果
export interface PublishResult {
  success: boolean;
  platform: string;
  accountId: string;
  accountName: string;
  postId?: string;
  postUrl?: string;
  error?: string;
}

// 账号信息
export interface PublishAccount {
  id: string;
  platform: string;
  accountName: string;
  authMode: 'composio' | 'custom';
  composioUserId?: string;
  apiConfig?: any;
}

// 发布路由器
export class PublishRouter {
  /**
   * 发布内容到指定账号
   */
  async publish(
    account: PublishAccount,
    contentType: ContentTypeId,
    content: any
  ): Promise<PublishResult> {
    try {
      if (account.authMode === 'composio') {
        return await this.publishViaComposio(account, contentType, content);
      } else {
        return await this.publishViaCustom(account, contentType, content);
      }
    } catch (error: any) {
      return {
        success: false,
        platform: account.platform,
        accountId: account.id,
        accountName: account.accountName,
        error: error.message || 'Unknown error',
      };
    }
  }

  /**
   * 通过 Composio 发布
   */
  private async publishViaComposio(
    account: PublishAccount,
    contentType: ContentTypeId,
    content: any
  ): Promise<PublishResult> {
    if (!account.composioUserId) {
      throw new Error('Composio User ID not found');
    }

    // 获取 connected account ID
    const connectedAccountId = await composioClient.getConnectedAccountId(
      account.composioUserId,
      account.platform
    );

    if (!connectedAccountId) {
      throw new Error(`No active connection found for ${account.platform}`);
    }

    const toolName = this.getComposioActionName(account.platform, contentType);
    const toolParams = this.formatContentForComposio(account.platform, contentType, content);

    const result = await composioClient.executeAction(
      connectedAccountId,
      account.composioUserId, // 添加 userId 参数
      toolName,
      toolParams
    );

    // 检查 Composio 的 successful 字段
    if (!result.successful) {
      throw new Error(result.error || 'Tool execution failed');
    }

    return {
      success: true,
      platform: account.platform,
      accountId: account.id,
      accountName: account.accountName,
      postId: result.data?.data?.id || result.data?.id,
      postUrl: result.data?.data?.url || result.data?.url,
    };
  }

  /**
   * 通过自定义 OAuth 发布
   */
  private async publishViaCustom(
    account: PublishAccount,
    contentType: ContentTypeId,
    content: any
  ): Promise<PublishResult> {
    const handler = this.getCustomHandler(account.platform);
    if (!handler) {
      throw new Error(`Custom handler not found for platform: ${account.platform}`);
    }

    const result = await handler(account, contentType, content);

    return {
      success: true,
      platform: account.platform,
      accountId: account.id,
      accountName: account.accountName,
      postId: result.id,
      postUrl: result.url,
    };
  }

  /**
   * 获取 Composio Action 名称
   */
  private getComposioActionName(platform: string, contentType: ContentTypeId): string {
    const actionMap: Record<string, Record<string, string>> = {
      twitter: {
        text: 'TWITTER_CREATION_OF_A_POST',
        image: 'TWITTER_CREATION_OF_A_POST',
        video: 'TWITTER_CREATION_OF_A_POST',
        link: 'TWITTER_CREATION_OF_A_POST',
      },
      instagram: {
        image: 'INSTAGRAM_CREATE_POST',
        video: 'INSTAGRAM_CREATE_POST',
      },
      youtube: {
        video: 'YOUTUBE_UPLOAD_VIDEO',
      },
      facebook: {
        text: 'FACEBOOK_CREATE_POST',
        image: 'FACEBOOK_CREATE_POST',
        video: 'FACEBOOK_CREATE_POST',
        link: 'FACEBOOK_CREATE_POST',
      },
      linkedin: {
        text: 'LINKEDIN_CREATE_LINKED_IN_POST',
        image: 'LINKEDIN_CREATE_LINKED_IN_POST',
        video: 'LINKEDIN_CREATE_LINKED_IN_POST',
        link: 'LINKEDIN_CREATE_LINKED_IN_POST',
      },
      reddit: {
        text: 'REDDIT_CREATE_REDDIT_POST',
        link: 'REDDIT_CREATE_REDDIT_POST',
      },
    };

    const action = actionMap[platform]?.[contentType];
    if (!action) {
      throw new Error(`Unsupported platform or content type: ${platform} - ${contentType}`);
    }
    return action;
  }

  /**
   * 格式化内容为 Composio 格式
   */
  private formatContentForComposio(
    platform: string,
    contentType: ContentTypeId,
    content: any
  ): any {
    switch (platform) {
      case 'twitter':
        // Twitter: text, media__media__ids (数组)
        const params: any = {
          text: content.text || '',
        };
        
        // 处理图片：确保是有效的 media_id 数组
        if (content.images) {
          let mediaIds: string[] = [];
          
          if (Array.isArray(content.images)) {
            // 如果是数组，过滤出有效的字符串
            mediaIds = content.images.filter((id: any) => typeof id === 'string' && id.trim());
          } else if (typeof content.images === 'object') {
            // 如果是对象 { "0": "media_id_1", "1": "media_id_2" }
            mediaIds = Object.values(content.images)
              .filter((id: any) => typeof id === 'string' && id.trim()) as string[];
          }
          
          // 只有当有有效的 media_id 时才添加参数
          if (mediaIds.length > 0) {
            params.media__media__ids = mediaIds;
          }
        }
        
        return params;
        
      case 'instagram':
        // Instagram: ig_user_id (必需), creation_id (必需)
        // 注意：Instagram 需要先创建草稿，然后发布
        return {
          ig_user_id: content.ig_user_id || '', // 需要从账号配置获取
          creation_id: content.creation_id || '', // 需要先调用创建草稿 API
        };
        
      case 'youtube':
        // YouTube: title, description, tags, categoryId, privacyStatus, videoFilePath (都是必需)
        return {
          title: content.title || 'Untitled',
          description: content.description || '',
          tags: content.tags || [],
          categoryId: content.categoryId || '22', // 默认: People & Blogs
          privacyStatus: content.privacyStatus || 'public',
          videoFilePath: content.video || '',
        };
        
      case 'facebook':
        // Facebook: page_id (必需), message (必需), link, published
        return {
          page_id: content.page_id || '', // 需要从账号配置获取
          message: content.text || '',
          ...(content.url && { link: content.url }),
          published: true,
        };
        
      case 'linkedin':
        // LinkedIn: author (必需), commentary (必需), visibility, lifecycleState
        return {
          author: content.author || '', // 需要从账号配置获取 (URN)
          commentary: content.text || '',
          visibility: 'PUBLIC',
          lifecycleState: 'PUBLISHED',
        };
        
      case 'reddit':
        // Reddit: subreddit (必需), title (必需), flair_id (必需), kind (必需), text/url
        return {
          subreddit: content.subreddit || '',
          title: content.title || content.text?.substring(0, 300) || '',
          flair_id: content.flair_id || '',
          kind: content.url ? 'link' : 'self',
          ...(content.url ? { url: content.url } : { text: content.text || '' }),
        };
        
      default:
        return content;
    }
  }

  /**
   * 获取自定义平台处理器
   */
  private getCustomHandler(platform: string): any {
    const handlers: Record<string, any> = {
      twitter: this.publishToTwitter,
      instagram: this.publishToInstagram,
      youtube: this.publishToYouTube,
      facebook: this.publishToFacebook,
      linkedin: this.publishToLinkedIn,
      reddit: this.publishToReddit,
    };

    return handlers[platform];
  }

  /**
   * 自定义平台发布方法（示例）
   */
  private async publishToTwitter(account: PublishAccount, contentType: ContentTypeId, content: any) {
    // TODO: 实现 Twitter API v2 调用
    throw new Error('Twitter custom OAuth not implemented yet');
  }

  private async publishToInstagram(account: PublishAccount, contentType: ContentTypeId, content: any) {
    // TODO: 实现 Instagram Graph API 调用
    throw new Error('Instagram custom OAuth not implemented yet');
  }

  private async publishToYouTube(account: PublishAccount, contentType: ContentTypeId, content: any) {
    // TODO: 实现 YouTube Data API 调用
    throw new Error('YouTube custom OAuth not implemented yet');
  }

  private async publishToFacebook(account: PublishAccount, contentType: ContentTypeId, content: any) {
    // TODO: 实现 Facebook Graph API 调用
    throw new Error('Facebook custom OAuth not implemented yet');
  }

  private async publishToLinkedIn(account: PublishAccount, contentType: ContentTypeId, content: any) {
    // TODO: 实现 LinkedIn API 调用
    throw new Error('LinkedIn custom OAuth not implemented yet');
  }

  private async publishToReddit(account: PublishAccount, contentType: ContentTypeId, content: any) {
    // TODO: 实现 Reddit API 调用
    throw new Error('Reddit custom OAuth not implemented yet');
  }
}

export const publishRouter = new PublishRouter();
