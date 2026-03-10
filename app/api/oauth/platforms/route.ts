import { NextRequest, NextResponse } from 'next/server';
import { db, platformConfigs } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { SUPPORTED_PLATFORMS } from '@/lib/supported-platforms';

export async function GET() {
  try {
    const dbConfigs = await db.select().from(platformConfigs);
    
    const configMap = new Map(
      dbConfigs.map(config => [config.platform, config])
    );
    
    const configs = SUPPORTED_PLATFORMS.map(platform => {
      const dbConfig = configMap.get(platform.id);
      
      return {
        id: dbConfig?.id || platform.id,
        platform: platform.id,
        name: platform.name,
        description: platform.description,
        icon: platform.icon,
        authMode: dbConfig?.authMode || platform.defaultAuthMode,
        composioAuthConfigId: platform.composioAuthConfigId,
        customOauthConfig: dbConfig?.customOauthConfig || null,
        isEnabled: dbConfig?.isEnabled !== undefined ? dbConfig.isEnabled : true,
        supportsCustomAuth: platform.supportsCustomAuth,
        isConfigured: !!dbConfig
      };
    });
    
    return NextResponse.json({ configs });
    
  } catch (error) {
    console.error('Get platform configs error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch configs' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, platform, authMode, composioConfig, customOauthConfig, isEnabled } = body;

    if (!platform) {
      return NextResponse.json(
        { error: 'Platform is required' },
        { status: 400 }
      );
    }

    const existing = await db
      .select()
      .from(platformConfigs)
      .where(eq(platformConfigs.platform, platform))
      .limit(1);

    if (existing.length > 0) {
      await db
        .update(platformConfigs)
        .set({
          authMode: authMode || 'composio',
          composioConfig: composioConfig || null,
          customOauthConfig: customOauthConfig || null,
          isEnabled: isEnabled !== undefined ? isEnabled : true,
          updatedAt: new Date(),
        })
        .where(eq(platformConfigs.platform, platform));

      return NextResponse.json({ success: true, id: existing[0].id });
    } else {
      const newId = id || randomUUID();
      await db.insert(platformConfigs).values({
        id: newId,
        platform,
        authMode: authMode || 'composio',
        composioConfig: composioConfig || null,
        customOauthConfig: customOauthConfig || null,
        isEnabled: isEnabled !== undefined ? isEnabled : true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      return NextResponse.json({ success: true, id: newId });
    }
  } catch (error: any) {
    console.error('Save platform config error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to save config' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { platformId, isEnabled, authMode } = body;

    if (!platformId) {
      return NextResponse.json(
        { error: 'Platform ID is required' },
        { status: 400 }
      );
    }

    const existing = await db
      .select()
      .from(platformConfigs)
      .where(eq(platformConfigs.platform, platformId))
      .limit(1);

    if (existing.length > 0) {
      const updateData: any = {
        updatedAt: new Date()
      };
      
      if (isEnabled !== undefined) {
        updateData.isEnabled = isEnabled;
      }
      
      if (authMode !== undefined) {
        updateData.authMode = authMode;
      }
      
      await db
        .update(platformConfigs)
        .set(updateData)
        .where(eq(platformConfigs.platform, platformId));
    } else {
      await db.insert(platformConfigs).values({
        id: randomUUID(),
        platform: platformId,
        authMode: authMode || 'composio',
        isEnabled: isEnabled !== undefined ? isEnabled : true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    return NextResponse.json({ success: true });
    
  } catch (error: any) {
    console.error('Update platform config error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update config' },
      { status: 500 }
    );
  }
}
