import { readFileSync } from "fs";
import { Composio } from "@composio/core";
import { Composio as ComposioRestClient } from "@composio/client";
// Composio API v3 客户端
const COMPOSIO_BASE_URL = 'https://backend.composio.dev/api/v3';

// 动态获取 API Key
function getComposioApiKey(): string {
  return process.env.COMPOSIO_API_KEY || '';
}

export interface ComposioAuthResponse {
  redirectUrl: string;
  connectionId: string;
}

export interface ComposioAuthConfig {
  id: string;
  toolkit: {
    slug: string;
    logo: string;
  };
  name: string;
  auth_scheme: string;
  status: string;
}

export interface ComposioConnectedAccount {
  id: string;
  user_id: string;
  auth_config_id: string;
  status: 'ACTIVE' | 'INITIATED' | 'FAILED';
  toolkit: {
    slug: string;
  };
}

export class ComposioClient {
  private apiKey: string;
  private baseUrl: string;
  private composio: Composio;

  private _client: ComposioRestClient | null = null;

  constructor(apiKey?: string) {
    // 如果提供了 apiKey 参数，使用它；否则动态获取
    this.apiKey = apiKey || getComposioApiKey();
    this.baseUrl = COMPOSIO_BASE_URL;
    // 初始化 Composio SDK (core for tool execution)
    this.composio = new Composio({ apiKey: this.apiKey });
  }

  /**
   * 懒加载 Composio Client（用于 proxy API 调用）
   * 避免在构造时就初始化导致递归 stack overflow
   */
  private getClient(): ComposioRestClient {
    if (!this._client) {
      // 使用动态 API key（可能在构造时 env 还没加载）
      const key = this.apiKey || getComposioApiKey();
      console.log('[Composio] Initializing REST client, apiKey:', key ? 'present' : 'MISSING');
      this._client = new ComposioRestClient({ apiKey: key });
    }
    return this._client;
  }

  /**
   * 获取 Auth Config ID（通过 toolkit slug）
   * @param toolkitSlug 平台名称（如 twitter, youtube）
   */
  async getAuthConfigId(toolkitSlug: string): Promise<string> {
    console.log('[Composio] getAuthConfigId - toolkitSlug:', toolkitSlug);
    console.log('[Composio] API Key:', this.apiKey ? 'exists' : 'missing');
    console.log('[Composio] Base URL:', this.baseUrl);
    
    const url = `${this.baseUrl}/auth_configs?toolkit_slug=${toolkitSlug}`;
    console.log('[Composio] Fetching:', url);
    
    const response = await fetch(url, {
      headers: {
        'x-api-key': this.apiKey,
      },
      // 禁用 Next.js 缓存
      cache: 'no-store',
      // 增加超时时间
      signal: AbortSignal.timeout(30000), // 30 秒超时
    });

    console.log('[Composio] Response status:', response.status);

    if (!response.ok) {
      const error = await response.text();
      console.error('[Composio] Get auth config error:', error);
      throw new Error(`Get auth config failed: ${error}`);
    }

    const data = await response.json();
    console.log('[Composio] Auth configs count:', data.items?.length || 0);
    
    if (!data.items || data.items.length === 0) {
      throw new Error(`No auth config found for toolkit: ${toolkitSlug}`);
    }

    // 返回第一个 auth config 的 ID
    const authConfigId = data.items[0].id;
    console.log('[Composio] Selected auth config ID:', authConfigId);
    return authConfigId;
  }

  /**
   * 生成授权链接 (v3 API)
   * @param userId 用户 ID
   * @param toolkitSlug 平台名称（如 twitter, youtube）
   * @param callbackUrl 授权完成后的回调地址
   */
  async getAuthUrl(userId: string, toolkitSlug: string, callbackUrl?: string): Promise<string> {
    console.log('[Composio] getAuthUrl - userId:', userId, 'toolkitSlug:', toolkitSlug);
    
    // 优先使用环境变量中指定的 Auth Config ID
    let authConfigId = process.env.COMPOSIO_AUTH_CONFIG_ID;
    
    if (!authConfigId) {
      // 如果没有指定，则动态获取
      console.log('[Composio] Getting auth config ID...');
      authConfigId = await this.getAuthConfigId(toolkitSlug);
    }
    
    console.log('[Composio] Auth config ID:', authConfigId);

    // 如果没有提供 callbackUrl，尝试从环境变量获取，否则使用默认值
    const finalCallbackUrl = callbackUrl || 
      process.env.NEXT_PUBLIC_APP_URL || 
      process.env.APP_URL || 
      'http://localhost:3005';
    
    console.log('[Composio] Callback URL:', finalCallbackUrl);

    // 根据平台设置所需的 scopes
    const scopes = this.getScopesForPlatform(toolkitSlug);
    console.log('[Composio] Scopes:', scopes);

    // 创建授权链接
    console.log('[Composio] Creating auth link...');
    const requestBody: any = {
      auth_config_id: authConfigId,
      user_id: userId,
      callback_url: finalCallbackUrl,
    };
    
    // 如果有 scopes，添加到请求中
    if (scopes.length > 0) {
      requestBody.scopes = scopes;
    }
    
    const response = await fetch(`${this.baseUrl}/connected_accounts/link`, {
      method: 'POST',
      headers: {
        'x-api-key': this.apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
      // 禁用 Next.js 缓存
      cache: 'no-store',
      // 增加超时时间
      signal: AbortSignal.timeout(30000), // 30 秒超时
    });

    console.log('[Composio] Response status:', response.status);
    
    if (!response.ok) {
      const error = await response.text();
      console.error('[Composio] API error:', error);
      throw new Error(`Composio API error: ${error}`);
    }

    const data = await response.json();
    console.log('[Composio] Response data:', data);
    return data.redirect_url || data.redirectUrl;
  }

  /**
   * 获取平台所需的 OAuth scopes
   */
  private getScopesForPlatform(platform: string): string[] {
    const scopesMap: Record<string, string[]> = {
      twitter: [
        'tweet.read',
        'tweet.write',
        'users.read',
        'offline.access',
      ],
      // 其他平台可以在这里添加
    };
    
    return scopesMap[platform] || [];
  }

  /**
   * 检查连接状态 (v3 API)
   * @param userId 用户 ID
   * @param toolkitSlug 平台名称
   */
  async checkConnection(userId: string, toolkitSlug: string): Promise<boolean> {
    try {
      const response = await fetch(
        `${this.baseUrl}/connected_accounts?user_id=${userId}&limit=50`,
        {
          headers: {
            'x-api-key': this.apiKey,
          },
        }
      );

      if (!response.ok) {
        return false;
      }

      const data = await response.json();
      
      // v3 API 返回格式：{ items: [...] }
      if (!data.items || data.items.length === 0) {
        return false;
      }

      // 查找匹配的 toolkit 且状态为 ACTIVE
      const connection = data.items.find((item: ComposioConnectedAccount) => 
        item.toolkit?.slug === toolkitSlug && item.status === 'ACTIVE'
      );

      return !!connection;
    } catch (error) {
      console.error('Check connection error:', error);
      return false;
    }
  }

  /**
   * 获取用户的连接账号 ID
   * @param userId 用户 ID
   * @param toolkitSlug 平台名称
   */
  async getConnectedAccountId(userId: string, toolkitSlug: string): Promise<string | null> {
    try {
      const response = await fetch(
        `${this.baseUrl}/connected_accounts?user_id=${encodeURIComponent(userId)}&limit=50`,
        {
          headers: {
            'x-api-key': this.apiKey,
          },
        }
      );

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      
      if (!data.items || data.items.length === 0) {
        return null;
      }

      // 必须严格匹配 user_id + toolkit slug + ACTIVE 状态
      // Composio API 可能忽略 user_id 过滤参数，返回所有 accounts
      const connection = data.items.find((item: ComposioConnectedAccount) => 
        item.user_id === userId && 
        item.toolkit?.slug === toolkitSlug && 
        item.status === 'ACTIVE'
      );

      if (connection) {
        console.log(`[Composio] Found exact match: ${connection.id} for ${userId}/${toolkitSlug}`);
        return connection.id;
      }

      // 如果精确匹配失败，说明该 user_id 没有对应平台的连接
      console.warn(`[Composio] No connected account for user_id=${userId}, toolkit=${toolkitSlug}`);
      return null;
    } catch (error) {
      console.error('Get connected account ID error:', error);
      return null;
    }
  }

  /**
   * 执行工具 (v3 API)
   * @param connectedAccountId 连接账号 ID
   * @param userId 用户 ID
   * @param toolSlug 工具名称（如 TWITTER_CREATION_OF_A_POST）
   * @param params 工具参数
   */
  async executeAction(connectedAccountId: string, userId: string, toolSlug: string, params: any) {
    console.log('[Composio] executeAction:', toolSlug, 'connectedAccount:', connectedAccountId);
    
    try {
      const result = await this.composio.tools.execute(toolSlug, {
        userId: userId,
        arguments: params,
        connectedAccountId: connectedAccountId,
        dangerouslySkipVersionCheck: true,
      });
      
      console.log('[Composio] Result:', JSON.stringify(result).substring(0, 500));
      return result;
      
    } catch (error: any) {
      console.error('[Composio] Execution error:', error.message);
      throw error;
    }
  }


  /**
   * 获取所有可用的 Auth Configs
   */
  async getAuthConfigs(): Promise<ComposioAuthConfig[]> {
    const response = await fetch(`${this.baseUrl}/auth_configs`, {
      headers: {
        'x-api-key': this.apiKey,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Get auth configs failed: ${error}`);
    }

    const data = await response.json();
    return data.items || [];
  }

  /**
   * 获取工具列表
   * @param toolkitSlug 平台名称（可选）
   */
  async getTools(toolkitSlug?: string): Promise<any[]> {
    const url = toolkitSlug 
      ? `${this.baseUrl}/tools?toolkit_slug=${toolkitSlug}`
      : `${this.baseUrl}/tools`;
      
    const response = await fetch(url, {
      headers: {
        'x-api-key': this.apiKey,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Get tools failed: ${error}`);
    }

    const data = await response.json();
    return data.items || [];
  }


  /**
   * 上传图片到 Twitter（通过 Composio proxy 调用 Twitter v2 media upload API）
   * 
   * 流程：读取本地文件 → base64 编码 → 通过 Composio tools.proxy 调用
   * POST https://api.x.com/2/media/upload → 返回 media_id
   */
  async uploadMediaToTwitter(userId: string, filePath: string, connectedAccountId?: string): Promise<string> {
    try {
      const fileBuffer = readFileSync(filePath);
      const base64Media = fileBuffer.toString('base64');
      
      // 检测 MIME type
      const ext = filePath.split('.').pop()?.toLowerCase();
      const mimeMap: Record<string, string> = {
        jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png',
        gif: 'image/gif', webp: 'image/webp',
      };
      const mediaType = mimeMap[ext || ''] || 'image/jpeg';
      
      console.log(`[Composio] Uploading to Twitter v2, file: ${filePath}, size: ${fileBuffer.length}, type: ${mediaType}`);
      
      // 使用 Composio tools.proxy 调用 Twitter v2 media upload
      const result = await this.getClient().tools.proxy({
        endpoint: 'https://api.x.com/2/media/upload',
        method: 'POST',
        connected_account_id: connectedAccountId || '',
        body: {
          media: base64Media,
          media_category: 'tweet_image',
          media_type: mediaType,
        },
      });
      
      console.log('[Composio] Twitter media upload status:', result.status);
      
      if (result.status !== 200) {
        const errorData = typeof result.data === 'string' ? result.data : JSON.stringify(result.data);
        throw new Error(`Twitter media upload failed (${result.status}): ${errorData}`);
      }
      
      const mediaId = result.data?.data?.id || result.data?.id;
      if (!mediaId) {
        throw new Error(`No media_id in response: ${JSON.stringify(result.data)}`);
      }
      
      console.log(`[Composio] Twitter media uploaded, media_id: ${mediaId}`);
      return String(mediaId);
      
    } catch (error: any) {
      console.error('[Composio] Twitter media upload error:', error.message);
      throw error;
    }
  }


}

export const composioClient = new ComposioClient();
