import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { db, notificationOutbox, auditLog, eq } from '@stemory/database';
import type { CommerceDatabase } from './orders';
import { CommerceError } from './errors';
const retrySchema = z.object({ id: z.string().uuid(), reason: z.string().trim().min(5).max(500) }).strict();
export async function retryNotificationJob(input: unknown, actorId: string, database: CommerceDatabase = db) {
  const parsed = retrySchema.safeParse(input); if (!parsed.success) throw new CommerceError('Include a reason for retrying this job.');
  return database.transaction(async tx => {
    const [job] = await tx.select().from(notificationOutbox).where(eq(notificationOutbox.id,parsed.data.id)).for('update');
    if (!job || !['ORDER_CONFIRMATION','COURIER_STATUS'].includes(job.type)) throw new CommerceError('Shipment registration must be reconciled in Deliveries. This job cannot be retried here.');
    if (job.status !== 'FAILED') throw new CommerceError('Only failed jobs can be retried. Reload for the current status.');
    await tx.update(notificationOutbox).set({status:'PENDING',attempts:0,lastAttempt:null,error:null,updatedAt:new Date()}).where(eq(notificationOutbox.id,job.id));
    await tx.insert(auditLog).values({id:randomUUID(),actorId,action:'RETRY',target:'NOTIFICATION',summary:'Queued a verified notification retry',details:{jobId:job.id,type:job.type,previousAttempts:job.attempts,reason:parsed.data.reason}});
    return {id:job.id};
  });
}
