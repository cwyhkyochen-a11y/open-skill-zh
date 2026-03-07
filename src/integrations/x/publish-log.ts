import { db, publishTasks } from '../../db/index.js';
import { eq } from 'drizzle-orm';

export async function attachPublishResult(taskId: string, result: any) {
  const rows = await db.select().from(publishTasks).where(eq(publishTasks.id, taskId)).limit(1);
  const row = rows[0] as any;
  let content = row?.content;
  if (typeof content === 'string') {
    try { content = JSON.parse(content); } catch {}
  }
  const next = {
    ...(content || {}),
    x_result: result,
  };
  await db.update(publishTasks)
    .set({
      content: next as any,
      status: 'published',
      publishedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(publishTasks.id, taskId));
}
