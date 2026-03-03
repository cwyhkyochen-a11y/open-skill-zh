import fs from 'fs';
import path from 'path';

export type MarkdownFrontMatter = Record<string, any>;

export function parseSimpleFrontMatter(md: string): MarkdownFrontMatter {
  // Very small YAML-ish parser:
  // expects:
  // ---
  // key: value
  // ---
  const m = md.match(/^---\n([\s\S]*?)\n---\n?/);
  if (!m) return {};
  const body = m[1];
  const out: Record<string, any> = {};
  for (const line of body.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf(':');
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx).trim();
    let value: any = trimmed.slice(idx + 1).trim();
    if (value === 'null' || value === 'NULL' || value === '') value = null;
    out[key] = value;
  }
  return out;
}

export function readAccountProfiles(dir: string): { file: string; data: MarkdownFrontMatter }[] {
  if (!fs.existsSync(dir)) return [];
  const files = fs.readdirSync(dir)
    .filter(f => f.endsWith('.md'))
    .filter(f => f !== 'README.md');

  return files.map(file => {
    const full = path.join(dir, file);
    const md = fs.readFileSync(full, 'utf-8');
    const data = parseSimpleFrontMatter(md);
    return { file, data };
  });
}

export function buildApiConfigFromProfile(profile: MarkdownFrontMatter): any {
  // Convert profile fields into apiConfig JSON.
  // We store only references to secret files (token_file) and non-secret options.
  const platform = (profile.platform || '').toString();

  switch (platform) {
    case 'pinterest':
      return {
        access_token_file: profile.access_token_file || profile.access_token_location || null,
        default_board_id: profile.default_board_id || null
      };
    case 'facebook':
      return {
        access_token_file: profile.access_token_file || profile.access_token_location || null,
        is_page: (profile.is_page === true || profile.is_page === 'true' || profile.account_type === 'page'),
        page_id: profile.page_id || null
      };
    case 'threads':
      return {
        access_token_file: profile.access_token_file || profile.access_token_location || null
      };
    case 'instagram':
      return {
        // DO NOT store password.
        session_file: profile.session_file || null,
        proxy: profile.proxy || null,
        // Optional: password_file if user insists, but kept as file reference.
        password_file: profile.password_file || null
      };
    case 'x':
      return {
        // X uses CDP. We keep a profile dir for Chrome user data.
        chrome_profile_dir: profile.chrome_profile_dir || null
      };
    default:
      return profile.api_config ? profile.api_config : null;
  }
}
