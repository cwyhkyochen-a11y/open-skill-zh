import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { randomUUID } from 'crypto';
import { existsSync } from 'fs';

/**
 * POST /api/media/upload - 上传媒体文件到服务器
 * 
 * 这是纯本地存储，不调用任何平台 API。
 * 平台特定的媒体处理（如 Twitter media_id）在发布时由 publish-router 处理。
 * 
 * 返回：
 * - filePath: 本地文件绝对路径
 * - fileUrl: 公网可访问的 URL
 * - filename: 文件名
 * - type: image | video
 * - size: 文件大小
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // 检查文件类型
    const fileType = file.type.startsWith('image/') ? 'image' : 
                     file.type.startsWith('video/') ? 'video' : 'unknown';
    
    if (fileType === 'unknown') {
      return NextResponse.json(
        { error: 'Invalid file type. Only images and videos are supported.' },
        { status: 400 }
      );
    }

    // 限制文件大小：图片 20MB，视频 512MB
    const maxSize = fileType === 'image' ? 20 * 1024 * 1024 : 512 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: `File too large. Max ${fileType === 'image' ? '20MB' : '512MB'}.` },
        { status: 400 }
      );
    }

    // 生成文件名
    const ext = file.name.split('.').pop() || 'bin';
    const filename = `${randomUUID()}.${ext}`;
    
    // 创建上传目录
    const subDir = fileType + 's'; // images or videos
    const uploadDir = join(process.cwd(), 'public', 'uploads', subDir);
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    // 保存文件到本地
    const filePath = join(uploadDir, filename);
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // 生成公网 URL
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || '';
    const fileUrl = `${appUrl}/uploads/${subDir}/${filename}`;

    console.log('[Media Upload] Saved:', {
      filename,
      type: fileType,
      size: file.size,
      filePath,
      fileUrl,
    });

    return NextResponse.json({
      success: true,
      filePath,      // 本地绝对路径
      fileUrl,       // 公网 URL
      filename,
      type: fileType,
      size: file.size,
      mimeType: file.type,
    });
  } catch (error: any) {
    console.error('[Media Upload] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Upload failed' },
      { status: 500 }
    );
  }
}
