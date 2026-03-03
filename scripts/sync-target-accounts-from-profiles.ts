#!/usr/bin/env tsx
/**
 * Sync target_accounts from markdown profiles.
 *
 * Profiles directory (default): ~/.openclaw/workspace/content-ops-workspace/accounts
 */

import path from 'path';
import os from 'os';
import { randomUUID } from 'crypto';
import { db } from '../src/db/index.ts';
import { targetAccounts } from '../src/db/schema.ts';
import { eq, and } from 'drizzle-orm';
import { readAccountProfiles, buildApiConfigFromProfile } from '../src/account_sync.ts';

const DEFAULT_DIR = path.join(os.homedir(), '.openclaw/workspace/content-ops-workspace/accounts');

function getArg(name: string): string | null {
  const idx = process.argv.indexOf(name);
  if (idx === -1) return null;
  return process.argv[idx + 1] || null;
}

async function findExisting(platform: string, accountName: string) {
  const rows = await db.select()
    .from(targetAccounts)
    .where(and(eq(targetAccounts.platform, platform), eq(targetAccounts.accountName, accountName)))
    .limit(1);
  return rows[0] || null;
}

async function upsertTargetAccount(profile: Record<string, any>) {
  const platform = profile.platform;
  if (!platform) throw new Error('profile.platform missing');

  const accountName = profile.account_name || profile.accountName;
  if (!accountName) throw new Error(`profile.account_name missing for platform=${platform}`);

  const apiConfig = buildApiConfigFromProfile(profile);

  const existing = await findExisting(platform, accountName);

  const row = {
    platform,
    accountName,
    accountId: profile.account_id || profile.accountId || null,
    homepageUrl: profile.homepage_url || profile.homepageUrl || null,
    status: profile.status || 'active',
    positioning: profile.positioning || null,
    targetAudience: profile.target_audience || profile.targetAudience || null,
    contentDirection: profile.content_direction || profile.contentDirection || null,
    visualStyle: profile.visual_style || profile.visualStyle || null,
    layoutPreference: profile.layout_preference || profile.layoutPreference || null,
    imageAspectRatio: profile.image_aspect_ratio || profile.imageAspectRatio || null,
    platformConfig: profile.platform_config ? JSON.stringify(profile.platform_config) : null,
    apiConfig: apiConfig ? JSON.stringify(apiConfig) : null,
    updatedAt: new Date()
  };

  if (existing) {
    await db.update(targetAccounts)
      .set(row as any)
      .where(eq(targetAccounts.id, (existing as any).id));
    return { action: 'updated', id: (existing as any).id };
  }

  const id = profile.id || randomUUID();
  await db.insert(targetAccounts).values({
    id,
    accountType: 'target',
    ...row,
    createdAt: new Date()
  } as any);

  return { action: 'created', id };
}

async function main() {
  const dir = getArg('--dir') || DEFAULT_DIR;
  console.log(`\n🔄 Sync target accounts from: ${dir}`);

  const profiles = readAccountProfiles(dir);
  if (profiles.length === 0) {
    console.log('⚠️  No profiles found.');
    process.exit(0);
  }

  for (const p of profiles) {
    try {
      const res = await upsertTargetAccount(p.data);
      console.log(`✅ ${p.file}: ${res.action} (${res.id})`);
    } catch (e: any) {
      console.log(`❌ ${p.file}: ${e.message || e}`);
    }
  }

  console.log('\nDone.');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
