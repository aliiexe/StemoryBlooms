import { createHash, randomUUID } from 'node:crypto';
import { db, sql, analyticsEvent } from '@stemory/database';
import { CommerceError } from './errors';

// Shared PostgreSQL state enforces the quota across application instances.
export async function enforceSubmissionLimit(action: string, requestHeaders: Pick<Headers, 'get'>, limit: number) {
  const ip = (requestHeaders.get('x-forwarded-for')?.split(',')[0] || requestHeaders.get('x-real-ip') || 'unknown').trim().slice(0, 100);
  const subject = createHash('sha256').update(`${process.env.CLERK_SECRET_KEY || 'stemory'}:${ip}`).digest('hex');
  const event = `RATE_LIMIT:${action}:${subject}`;
  await db.transaction(async tx => {
    await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtextextended(${event}, 0))`);
    const rows = await tx.select({ count: sql<number>`count(*)::int` }).from(analyticsEvent)
      .where(sql`${analyticsEvent.event} = ${event} AND ${analyticsEvent.createdAt} > NOW() - INTERVAL '1 minute'`);
    if (rows[0].count >= limit) throw new CommerceError('Too many requests. Please wait a minute and try again.', 'RATE_LIMITED', 429);
    await tx.insert(analyticsEvent).values({ id: randomUUID(), event });
    await tx.delete(analyticsEvent).where(sql`${analyticsEvent.event} LIKE 'RATE_LIMIT:%' AND ${analyticsEvent.createdAt} < NOW() - INTERVAL '1 day'`);
  });
}
