import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { db, eq, sql, draftOrder, order, auditLog } from '@stemory/database';
import { AssistedDraftDataSchema } from '@stemory/contracts';
import { CommerceError } from './errors';
import { createStaffOrderInTransaction, type CommerceDatabase, type CommerceTransaction } from './orders';
import { receiptUrl, type OrderAddress } from './receipt-access';

import { readDraftPayload, type DraftEnvelope, type DraftEditor } from './draft-payload';
export { readDraftPayload, type DraftEnvelope, type DraftEditor } from './draft-payload';

const draftInputSchema = z.object({
  id: z.string().uuid(), expectedRevision: z.number().int().nonnegative(),
  title: z.string().trim().min(1, 'Give the draft a title.').max(120), data: AssistedDraftDataSchema,
}).strict();
const convertInputSchema = draftInputSchema.extend({ expectedTotal: z.number().int().nonnegative().max(10000000), quoteVersion: z.string().regex(/^[a-f0-9]{64}$/) });

async function lockDraft(tx: CommerceTransaction, id: string) {
  await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtextextended(${`draft:${id}`}, 0))`);
  return (await tx.select().from(draftOrder).where(eq(draftOrder.id, id)).for('update'))[0];
}
function requireDraft(payload: unknown) {
  const draft = readDraftPayload(payload);
  if (!draft) throw new CommerceError('This earlier draft has an unsupported format. Its original data has been retained.', 'UNSUPPORTED_DRAFT', 409);
  return draft;
}
function checkRevision(current: DraftEnvelope, revision: number) {
  if (current.revision !== revision) throw new CommerceError('Another administrator changed this draft. Reload the saved version before continuing.', 'DRAFT_CONFLICT', 409);
}
async function audit(tx: CommerceTransaction, actorId: string, action: string, id: string, revision: number, orderId?: string) {
  await tx.insert(auditLog).values({ id: randomUUID(), actorId, action, target: 'ORDER_DRAFT', summary: `${action.toLowerCase()} order draft`, details: { draftId: id, revision, orderId } });
}
export function draftEditor(id: string, value: DraftEnvelope): DraftEditor {
  return { id, title: value.title, data: value.data, revision: value.revision, status: value.status, convertedOrderId: value.convertedOrderId, convertedOrderNumber: value.convertedOrderNumber };
}

export async function saveOrderDraft(input: unknown, actorId: string, database: CommerceDatabase = db) {
  const parsed = draftInputSchema.safeParse(input);
  if (!parsed.success) throw new CommerceError(parsed.error.issues[0]?.message || 'Check the draft fields.');
  const { id, expectedRevision, title, data } = parsed.data;
  return database.transaction(async tx => {
    const row = await lockDraft(tx, id);
    const previous = row ? requireDraft(row.payload) : null;
    if (previous && previous.status !== 'DRAFT') throw new CommerceError('Only active drafts can be edited.', 'DRAFT_CLOSED', 409);
    // A response can be lost after save; replay the same content without a second revision.
    if (previous && previous.title === title && JSON.stringify(previous.data) === JSON.stringify(data)) return draftEditor(id, previous);
    if (previous) checkRevision(previous, expectedRevision);
    else if (expectedRevision !== 0) throw new CommerceError('Draft not found.', 'NOT_FOUND', 404);
    const value: DraftEnvelope = { schemaVersion: 1, title, data, revision: (previous?.revision || 0) + 1, status: 'DRAFT', updatedBy: actorId };
    if (row) await tx.update(draftOrder).set({ payload: value, updatedAt: new Date() }).where(eq(draftOrder.id, id));
    else await tx.insert(draftOrder).values({ id, actorId, payload: value, updatedAt: new Date() });
    await audit(tx, actorId, row ? 'UPDATE' : 'CREATE', id, value.revision);
    return draftEditor(id, value);
  });
}

export async function setDraftArchived(id: string, expectedRevision: number, archived: boolean, actorId: string, database: CommerceDatabase = db) {
  if (!z.string().uuid().safeParse(id).success || !Number.isSafeInteger(expectedRevision) || expectedRevision < 0 || typeof archived !== 'boolean') throw new CommerceError('Invalid draft reference.');
  return database.transaction(async tx => {
    const row = await lockDraft(tx, id);
    if (!row) throw new CommerceError('Draft not found.', 'NOT_FOUND', 404);
    const current = requireDraft(row.payload);
    if (current.status === 'CONVERTED') throw new CommerceError('This draft already has an order.', 'DRAFT_CLOSED', 409);
    const status = archived ? 'ARCHIVED' : 'DRAFT';
    if (current.status === status) return draftEditor(id, current);
    checkRevision(current, expectedRevision);
    const value: DraftEnvelope = { ...current, status, revision: current.revision + 1, updatedBy: actorId };
    await tx.update(draftOrder).set({ payload: value, updatedAt: new Date() }).where(eq(draftOrder.id, id));
    await audit(tx, actorId, archived ? 'ARCHIVE' : 'RESTORE', id, value.revision);
    return draftEditor(id, value);
  });
}

export async function convertOrderDraft(input: unknown, actorId: string, database: CommerceDatabase = db) {
  const parsed = convertInputSchema.safeParse(input);
  if (!parsed.success) throw new CommerceError(parsed.error.issues[0]?.message || 'Review a fresh quote before converting the draft.');
  const { id, expectedRevision, title, data, expectedTotal, quoteVersion } = parsed.data;
  return database.transaction(async tx => {
    const row = await lockDraft(tx, id);
    if (!row) throw new CommerceError('Save this draft before converting it.', 'NOT_FOUND', 404);
    const current = requireDraft(row.payload);
    if (current.status === 'CONVERTED') {
      const created = current.convertedOrderId ? await tx.query.order.findFirst({ where: eq(order.id, current.convertedOrderId) }) : null;
      if (!created) throw new CommerceError('The linked order needs administrator review.', 'DRAFT_CLOSED', 409);
      return { id: created.id, orderNumber: created.orderNumber, total: created.total, receiptUrl: receiptUrl(created.orderNumber, created.deliveryAddress as OrderAddress), replayed: true };
    }
    if (current.status !== 'DRAFT') throw new CommerceError('Restore this archived draft before converting it.', 'DRAFT_CLOSED', 409);
    checkRevision(current, expectedRevision);
    const created = await createStaffOrderInTransaction({ ...data, deliveryZoneId: data.isHandDelivered ? undefined : data.deliveryZoneId || undefined,
      expectedTotal, quoteVersion, idempotencyKey: `draft-${id}` }, tx, actorId);
    const value: DraftEnvelope = { ...current, title, data, revision: current.revision + 1, status: 'CONVERTED', updatedBy: actorId,
      convertedOrderId: created.id, convertedOrderNumber: created.orderNumber };
    await tx.update(draftOrder).set({ payload: value, updatedAt: new Date() }).where(eq(draftOrder.id, id));
    await audit(tx, actorId, 'CONVERT', id, value.revision, created.id);
    return created;
  });
}
