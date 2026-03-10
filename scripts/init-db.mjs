import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 使用与应用相同的数据库路径逻辑
const dbPath = process.env.DATABASE_PATH || path.join(process.cwd(), 'content-ops.db');
const db = new Database(dbPath);

console.log('🚀 初始化数据库...');
console.log('📁 数据库路径:', dbPath);

// 创建 target_accounts 表
db.exec(`
  CREATE TABLE IF NOT EXISTS target_accounts (
    id TEXT PRIMARY KEY,
    account_type TEXT NOT NULL DEFAULT 'target',
    platform TEXT NOT NULL,
    account_name TEXT NOT NULL,
    account_id TEXT,
    homepage_url TEXT,
    status TEXT NOT NULL DEFAULT 'active',
    auth_mode TEXT NOT NULL DEFAULT 'composio',
    composio_user_id TEXT,
    api_config TEXT,
    positioning TEXT,
    target_audience TEXT,
    content_direction TEXT,
    platform_config TEXT,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );
`);

// 创建 publish_tasks 表
db.exec(`
  CREATE TABLE IF NOT EXISTS publish_tasks (
    id TEXT PRIMARY KEY,
    task_name TEXT NOT NULL,
    target_account_ids TEXT NOT NULL,
    content_type TEXT NOT NULL,
    content_data TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    scheduled_at INTEGER,
    published_at INTEGER,
    publish_results TEXT,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );
`);

// 创建 platform_configs 表
db.exec(`
  CREATE TABLE IF NOT EXISTS platform_configs (
    id TEXT PRIMARY KEY,
    platform TEXT NOT NULL UNIQUE,
    auth_mode TEXT NOT NULL DEFAULT 'composio',
    composio_config TEXT,
    custom_oauth_config TEXT,
    is_enabled INTEGER DEFAULT 1,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );
`);

// 创建 admin_users 表
db.exec(`
  CREATE TABLE IF NOT EXISTS admin_users (
    id TEXT PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );
`);

console.log('✅ 数据库初始化完成！');

// 创建默认管理员账号（如果不存在）
import { randomUUID } from 'crypto';
import bcrypt from 'bcryptjs';

const checkAdmin = db.prepare('SELECT COUNT(*) as count FROM admin_users').get();
if (checkAdmin.count === 0) {
  const defaultPassword = 'admin123';
  const passwordHash = bcrypt.hashSync(defaultPassword, 10);
  const now = Date.now();
  
  db.prepare(`
    INSERT INTO admin_users (id, username, password_hash, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?)
  `).run(randomUUID(), 'admin', passwordHash, now, now);
  
  console.log('✅ 默认管理员账号已创建');
  console.log('   用户名: admin');
  console.log('   密码: admin123');
}

db.close();
