import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

// 复用现有的 target_accounts 表结构
export const targetAccounts = sqliteTable('target_accounts', {
  id: text('id').primaryKey(),
  accountType: text('account_type').notNull().$default(() => 'target'),
  platform: text('platform').notNull(),
  accountName: text('account_name').notNull(),
  accountId: text('account_id'),
  homepageUrl: text('homepage_url'),
  status: text('status').notNull().$default(() => 'active'),
  authMode: text('auth_mode').notNull().$default(() => 'composio'),
  composioUserId: text('composio_user_id'),
  apiConfig: text('api_config', { mode: 'json' }),
  positioning: text('positioning'),
  targetAudience: text('target_audience'),
  contentDirection: text('content_direction'),
  platformConfig: text('platform_config', { mode: 'json' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$default(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$default(() => new Date()),
  facebookPageIds: text('facebook_page_ids', { mode: 'json' }).$default(() => '[]'),
  facebookDefaultPageId: text('facebook_default_page_id'),
  instagramUserId: text('instagram_user_id'),
});

// 发布任务表
export const publishTasks = sqliteTable('publish_tasks', {
  id: text('id').primaryKey(),
  taskName: text('task_name').notNull(),
  targetAccountIds: text('target_account_ids', { mode: 'json' }).notNull(),
  contentType: text('content_type').notNull(),
  contentData: text('content_data', { mode: 'json' }).notNull(),
  status: text('status').notNull().$default(() => 'pending'),
  scheduledAt: integer('scheduled_at', { mode: 'timestamp' }),
  publishedAt: integer('published_at', { mode: 'timestamp' }),
  publishResults: text('publish_results', { mode: 'json' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$default(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$default(() => new Date()),
});

// 平台 OAuth 配置表
export const platformConfigs = sqliteTable('platform_configs', {
  id: text('id').primaryKey(),
  platform: text('platform').notNull(),
  authMode: text('auth_mode').notNull().$default(() => 'composio'),
  composioConfig: text('composio_config', { mode: 'json' }),
  customOauthConfig: text('custom_oauth_config', { mode: 'json' }),
  isEnabled: integer('is_enabled', { mode: 'boolean' }).notNull().$default(() => true),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$default(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$default(() => new Date()),
});

// 管理员用户表
export const adminUsers = sqliteTable('admin_users', {
  id: text('id').primaryKey(),
  username: text('username').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$default(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$default(() => new Date()),
});

export type TargetAccount = typeof targetAccounts.$inferSelect;
export type NewTargetAccount = typeof targetAccounts.$inferInsert;
export type PublishTask = typeof publishTasks.$inferSelect;
export type NewPublishTask = typeof publishTasks.$inferInsert;
export type PlatformConfig = typeof platformConfigs.$inferSelect;
export type NewPlatformConfig = typeof platformConfigs.$inferInsert;
export type AdminUser = typeof adminUsers.$inferSelect;
export type NewAdminUser = typeof adminUsers.$inferInsert;
