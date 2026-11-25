import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { db, contactMessage, review, product, auditLog, eq } from '@stemory/database';
import type { CommerceDatabase } from './orders';
import { CommerceError } from './errors';

const changeSchema = z.object({
  id: z.string().min(1).max(128),
  expectedStatus: z.string().min(1).max(30),
  status: z.string(),
}).strict();

export async function changeSupportStatus(kind: 'MESSAGE' | 'REVIEW', input: unknown, actorId: string, database: CommerceDatabase = db) {
  const parsed = changeSchema.safeParse(input);
  if (!parsed.success) throw new CommerceError('Choose a valid record and status.');
  const data = parsed.data;
  const allowed = kind === 'MESSAGE' ? ['UNREAD', 'READ', 'RESOLVED'] : ['PENDING', 'APPROVED', 'REJECTED'];
  if (!allowed.includes(data.status) || !allowed.includes(data.expectedStatus)) throw new CommerceError('Unsupported status.');
  return database.transaction(async tx => {
    const table = kind === 'MESSAGE' ? contactMessage : review;
    const [before] = await tx.select({ id: table.id, status: table.status }).from(table).where(eq(table.id, data.id)).for('update');
    if (!before) throw new CommerceError('Record not found.');
    if (before.status !== data.expectedStatus) throw new CommerceError('Another administrator changed this record. Reload before continuing.', 'SUPPORT_CONFLICT', 409);
    if (before.status !== data.status) {
      await tx.update(table).set({ status: data.status, updatedAt: new Date() }).where(eq(table.id, data.id));
      await tx.insert(auditLog).values({ id: randomUUID(), actorId, action: 'UPDATE', target: kind, summary: `${kind === 'MESSAGE' ? 'Message' : 'Review'}: ${before.status} → ${data.status}`, details: { id: data.id, before: before.status, after: data.status } });
    }
    if (kind === 'REVIEW') {
      const [row] = await tx.select({ slug: product.id }).from(review).innerJoin(product, eq(product.id, review.productId)).where(eq(review.id, data.id));
      return { slug: row?.slug || null };
    }
    return { slug: null };
  });
}
