import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema';
import path from 'path';

// 使用现有的数据库文件
// 优先使用环境变量，否则使用当前目录下的 content-ops.db
const dbPath = process.env.DATABASE_PATH || path.join(process.cwd(), 'content-ops.db');
const sqlite = new Database(dbPath);
export const db = drizzle(sqlite, { schema });

export * from './schema';
