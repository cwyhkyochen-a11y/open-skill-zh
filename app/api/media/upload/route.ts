import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { randomUUID } from 'crypto';
import { existsSync } from 'fs';
import { composioClient } from '@/lib/composio';

// POST /api/media/upload - 上传图片/视频并获取平台 media_id
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const platform = formData.get('platform') as string;
    const userId = formData.get('userId') as string;
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    if (!platform || !userId) {
      return NextResponse.json(
        { error: 'Missing platform or userId' },
        { status: 400 }
      );
    }

    console.log('[Media Upload] Start:', {
      filename: file.name,
      size: file.size,
      type: file.type,
      platform,
      userId,
    });

    // 检查文件类型
    const fileType = file.type.startsWith('image/') ? 'image' : 
                     file.type.startsWith('video/') ? 'video' : 'unknown';
    
    if (fileType === 'unknown') {
      return NextResponse.json(
        { error: 'Invalid file type. Only images and videos are supported.' },
        { status: 400 }
      );
    }

    // 生成文件名
    const ext = file.name.split('.').pop();
    const filename = `${randomUUID()}.${ext}`;
    
    // 创建上传目录
    const uploadDir = join(process.cwd(), 'public', 'uploads', fileType + 's');
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    // 保存文件到本地
    const filepath = join(uploadDir, filename);
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filepath, buffer);

    console.log('[Media Upload] File saved:', filepath);

    // 根据平台上传到对应的服务
    let mediaId: string;
    
    if (platform === 'twitter') {
      // Twitter: 上传媒体并获取 media_id
      mediaId = await uploadToTwitter(userId, filepath, fileType);
    } else if (platform === 'facebook') {
      // Facebook: 上传图片并获取 photo_id
      mediaId = await uploadToFacebook(userId, filepath, fileType);
    } else if (platform === 'instagram') {
      // Instagram: 上传媒体并获取 container_id
      mediaId = await uploadToInstagram(userId, filepath, fileType);
    } else {
      // 其他平台：返回本地 URL
      const fileUrl = `/uploads/${fileType}s/${filename}`;
      const fullUrl = `${process.env.NEXT_PUBLIC_APP_URL || ''}${fileUrl}`;
      mediaId = fullUrl;
    }

    console.log('[Media Upload] Success:', {
      filename,
      mediaId,
      platform,
    });

    return NextResponse.json({
      success: true,
      mediaId,
      filename,
      type: fileType,
      size: file.size,
    });
  } catch (error: any) {
    console.error('[Media Upload] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Upload failed' },
      { status: 500 }
    );
  }
}

// 上传到 Twitter
async function uploadToTwitter(userId: string, filepath: string, fileType: string): Promise<string> {
  try {
    const connectedAccountId = await composioClient.getConnectedAccountId(userId, 'twitter');
    if (!connectedAccountId) {
      throw new Error('Twitter account not connected');
    }

    // 调用 Twitter Media Upload API
    const action = fileType === 'image' 
      ? 'TWITTER_UPLOAD_MEDIA_SIMPLE'
      : 'TWITTER_UPLOAD_MEDIA_CHUNKED';
    
    const result = await composioClient.executeAction(
      connectedAccountId,
      userId,
      action,
      {
        media: filepath, // 本地文件路径
      }
    );

    if (!result.successful || !result.data?.media_id_string) {
      throw new Error(result.error || 'Twitter upload failed');
    }

    return result.data.media_id_string;
  } catch (error: any) {
    console.error('[Twitter Upload] Error:', error);
    throw new Error(`Twitter upload failed: ${error.message}`);
  }
}

// 上传到 Facebook
async function uploadToFacebook(userId: string, filepath: string, fileType: string): Promise<string> {
  try {
    const connectedAccountId = await composioClient.getConnectedAccountId(userId, 'facebook');
    if (!connectedAccountId) {
      throw new Error('Facebook account not connected');
    }

    // 调用 Facebook Photo Upload API
    const result = await composioClient.executeAction(
      connectedAccountId,
      userId,
      'FACEBOOK_UPLOAD_PHOTO',
      {
        photo: filepath,
      }
    );

    if (!result.successful || !result.data?.id) {
      throw new Error(result.error || 'Facebook upload failed');
    }

    return result.data.id;
  } catch (error: any) {
    console.error('[Facebook Upload] Error:', error);
    throw new Error(`Facebook upload failed: ${error.message}`);
  }
}

// 上传到 Instagram
async function uploadToInstagram(userId: string, filepath: string, fileType: string): Promise<string> {
  try {
    const connectedAccountId = await composioClient.getConnectedAccountId(userId, 'instagram');
    if (!connectedAccountId) {
      throw new Error('Instagram account not connected');
    }

    // Instagram 需要先创建 media container
    const result = await composioClient.executeAction(
      connectedAccountId,
      userId,
      'INSTAGRAM_CREATE_MEDIA_CONTAINER',
      {
        image_url: filepath, // 或 video_url
        caption: '',
      }
    );

    if (!result.successful || !result.data?.id) {
      throw new Error(result.error || 'Instagram upload failed');
    }

    return result.data.id;
  } catch (error: any) {
    console.error('[Instagram Upload] Error:', error);
    throw new Error(`Instagram upload failed: ${error.message}`);
  }
}
