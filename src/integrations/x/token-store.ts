import { randomUUID } from 'crypto';
import { db, targetAccounts } from '../../db/index.js';
import { eq } from 'drizzle-orm';

export type XTokenBundle = {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  scope?: string;
  token_type?: string;
};

export async function saveXTokens(targetAccountId: string, token: XTokenBundle, profile?: any) {
  const expiresAt = token.expires_in ? new Date(Date.now() + token.expires_in * 1000).toISOString() : null;
  const apiConfig = {
    oauth: {
      platform: 'x',
      connected_at: new Date().toISOString(),
      access_token: token.access_token,
      refresh_token: token.refresh_token || null,
      expires_at: expiresAt,
      scope: token.scope || null,
      token_type: token.token_type || 'bearer',
      profile: profile || null,
    }
  };

  await db.update(targetAccounts)
    .set({ apiConfig: apiConfig as any, updatedAt: new Date() })
    .where(eq(targetAccounts.id, targetAccountId));
}

export async function getXTokens(targetAccountId: string) {
  const rows = await db.select().from(targetAccounts).where(eq(targetAccounts.id, targetAccountId)).limit(1);
  const row = rows[0] as any;
  let apiConfig = row?.apiConfig;
  if (typeof apiConfig === 'string') {
    try { apiConfig = JSON.parse(apiConfig); } catch {}
  }
  const oauth = apiConfig?.oauth;
  return oauth || null;
}

export async function createPlaceholderXTargetAccount(accountName: string) {
  const id = randomUUID();
  await db.insert(targetAccounts).values({
    id,
    accountType: 'target',
    platform: 'x',
    accountName,
    homepageUrl: `https://x.com/${accountName.replace(/^@/, '')}`,
    status: 'active',
    platformConfig: {
      max_chars: 280,
      supports_media: true,
      max_images: 4,
      publish_via: 'api'
    } as any,
    imageAspectRatio: '16:9',
  });
  return id;
}
