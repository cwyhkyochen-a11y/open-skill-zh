#!/usr/bin/env tsx
import { db, targetAccounts } from '../src/db/index.js';
import { eq } from 'drizzle-orm';
import { getXTokens, saveXTokens } from '../src/integrations/x/token-store.js';
import { refreshAccessToken } from '../src/integrations/x/oauth.js';

const args = process.argv.slice(2);
const idx = args.indexOf('--account-id');
const accountId = idx >= 0 ? args[idx + 1] : undefined;

if (!accountId) {
  console.error('Usage: npx tsx scripts/x_refresh_token.ts --account-id <id>');
  process.exit(1);
}

const oauth = await getXTokens(accountId);
if (!oauth?.refresh_token) {
  console.error('No refresh token found for account');
  process.exit(1);
}

const clientId = process.env.X_CLIENT_ID || '';
const clientSecret = process.env.X_CLIENT_SECRET || '';
if (!clientId) {
  console.error('Missing X_CLIENT_ID');
  process.exit(1);
}

const token = await refreshAccessToken({
  refreshToken: oauth.refresh_token,
  clientId,
  clientSecret: clientSecret || undefined,
});

await saveXTokens(accountId, token, oauth.profile || null);
const rows = await db.select().from(targetAccounts).where(eq(targetAccounts.id, accountId)).limit(1);
console.log(JSON.stringify({ status: 'ok', accountId, accountName: (rows[0] as any)?.accountName, expires_in: token.expires_in }, null, 2));
