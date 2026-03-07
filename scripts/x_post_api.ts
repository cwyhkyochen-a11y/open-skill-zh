#!/usr/bin/env tsx
import { getXTokens, saveXTokens } from '../src/integrations/x/token-store.js';
import { createTweet } from '../src/integrations/x/client.js';
import { refreshAccessToken } from '../src/integrations/x/oauth.js';
import { attachPublishResult } from '../src/integrations/x/publish-log.js';

const args = process.argv.slice(2);
const getArg = (name: string) => {
  const idx = args.indexOf(name);
  return idx >= 0 ? args[idx + 1] : undefined;
};
const hasFlag = (name: string) => args.includes(name);

const accountId = getArg('--account-id');
const text = getArg('--text');
const taskId = getArg('--task-id');
const dryRun = hasFlag('--dry-run');

if (!accountId || !text) {
  console.error('Usage: npx tsx scripts/x_post_api.ts --account-id <id> --text "hello" [--task-id <taskId>] [--dry-run]');
  process.exit(1);
}

let oauth = await getXTokens(accountId);
if (!oauth?.access_token) {
  console.error('No X oauth token found for account');
  process.exit(1);
}

const exp = oauth?.expires_at ? new Date(oauth.expires_at).getTime() : null;
const shouldRefresh = !!(exp && exp - Date.now() < 5 * 60 * 1000 && oauth.refresh_token);
if (shouldRefresh) {
  const clientId = process.env.X_CLIENT_ID || '';
  const clientSecret = process.env.X_CLIENT_SECRET || '';
  if (!clientId) {
    console.error('Token almost expired but X_CLIENT_ID missing for refresh');
    process.exit(1);
  }
  const token = await refreshAccessToken({
    refreshToken: oauth.refresh_token,
    clientId,
    clientSecret: clientSecret || undefined,
  });
  await saveXTokens(accountId, token, oauth.profile || null);
  oauth = await getXTokens(accountId);
}

if (dryRun) {
  console.log(JSON.stringify({ status: 'dry_run', accountId, textLength: text.length, preview: text.slice(0, 80) }, null, 2));
  process.exit(0);
}

const res = await createTweet(oauth.access_token, { text });
if (taskId) {
  await attachPublishResult(taskId, res);
}
console.log(JSON.stringify(res, null, 2));
