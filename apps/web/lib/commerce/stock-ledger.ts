import { createHash, randomUUID } from 'node:crypto';
import { z } from 'zod';
import { db, eq, sql, material, product, builderComponent, inventoryOperation, inventoryMovement, stockMovement } from '@stemory/database';
import type { CommerceDatabase, CommerceTransaction } from './orders';
import { CommerceError } from './errors';

export const stockKindSchema = z.enum(['MATERIAL', 'COMPONENT', 'PRODUCT']);
export type StockKind = z.infer<typeof stockKindSchema>;
export const operationReasonSchema = z.string().trim().min(3, 'Enter a reason with at least three characters.').max(500);
export type StockChange = { kind: StockKind; id: string; name: string; before: number; after: number; delta: number };
export type StockResult = { operationId: string; subjectName: string; finalQuantity: number; changes: StockChange[] };
type Reader = CommerceDatabase | CommerceTransaction;

export async function inventorySchemaReady(reader: Reader = db) {
  const result = await reader.execute(sql`SELECT to_regclass('public."InventoryOperation"') IS NOT NULL AND to_regclass('public."InventoryMovement"') IS NOT NULL AS ready`);
  return Boolean(result.rows[0]?.ready);
}
export async function requireInventorySchema(reader: Reader) {
  if (!await inventorySchemaReady(reader)) throw new CommerceError('Apply the inventory migration before recording stock operations.', 'MIGRATION_REQUIRED', 503);
}
export async function beginStockOperation(tx: CommerceTransaction, id: string, input: unknown, actorId: string) {
  await requireInventorySchema(tx);
  if (!z.string().uuid().safeParse(id).success) throw new CommerceError('A valid operation reference is required.');
  await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtextextended(${`stock-operation:${id}`}, 0))`);
  const requestHash = createHash('sha256').update(JSON.stringify({ input, actorId })).digest('hex');
  const previous = await tx.query.inventoryOperation.findFirst({ where: eq(inventoryOperation.id, id) });
  if (previous && previous.requestHash !== requestHash) throw new CommerceError('This operation reference was already used with different details.', 'OPERATION_CONFLICT', 409);
  return { requestHash, previous: previous ? previous.result as StockResult : null };
}
export async function finishStockOperation(tx: CommerceTransaction, args: {
  id: string; type: string; actorId: string | null; reason: string; requestHash: string; subjectName: string; finalQuantity: number; changes: StockChange[];
}) {
  const { id, type, actorId, reason, requestHash, subjectName, finalQuantity, changes } = args;
  const result: StockResult = { operationId: id, subjectName, finalQuantity, changes };
  await tx.insert(inventoryOperation).values({ id, type, actorId, reason, requestHash, result });
  for (const change of changes) {
    if (!change.delta) continue;
    const legacyMovementId = change.kind === 'MATERIAL' ? randomUUID() : null;
    if (legacyMovementId) await tx.insert(stockMovement).values({ id: legacyMovementId, materialId: change.id, quantity: change.delta, reason, actorId });
    await tx.insert(inventoryMovement).values({ id: randomUUID(), operationId: id, subjectKind: change.kind, subjectId: change.id, subjectName: change.name,
      quantity: change.delta, balanceBefore: change.before, balanceAfter: change.after, legacyMovementId });
  }
  return result;
}
export async function readStockTarget(reader: Reader, kind: StockKind, id: string, lock = false) {
  if (kind === 'MATERIAL') {
    const query = reader.select({ id: material.id, name: material.name, quantity: material.quantity }).from(material).where(eq(material.id, id));
    return (await (lock ? query.for('update') : query))[0];
  }
  if (kind === 'COMPONENT') {
    const query = reader.select({ id: builderComponent.id, name: builderComponent.name, quantity: builderComponent.stock }).from(builderComponent).where(eq(builderComponent.id, id));
    return (await (lock ? query.for('update') : query))[0];
  }
  const query = reader.select({ id: product.id, name: product.name, quantity: product.stock }).from(product).where(eq(product.id, id));
  return (await (lock ? query.for('update') : query))[0];
}
export async function writeStockTarget(tx: CommerceTransaction, kind: StockKind, id: string, quantity: number) {
  if (!Number.isSafeInteger(quantity) || quantity < 0 || quantity > 1000000) throw new CommerceError('The resulting stock must be a whole count between zero and 1,000,000.');
  if (kind === 'MATERIAL') await tx.update(material).set({ quantity, updatedAt: new Date() }).where(eq(material.id, id));
  else if (kind === 'COMPONENT') await tx.update(builderComponent).set({ stock: quantity, updatedAt: new Date() }).where(eq(builderComponent.id, id));
  else await tx.update(product).set({ stock: quantity, updatedAt: new Date() }).where(eq(product.id, id));
}
const correctionSchema = z.object({ operationId: z.string().uuid(), kind: stockKindSchema, id: z.string().min(1).max(128),
  expectedQuantity: z.number().int(), quantity: z.number().int().min(0).max(1000000), reason: operationReasonSchema }).strict();
export async function correctStock(input: unknown, actorId: string, database: CommerceDatabase = db) {
  const parsed = correctionSchema.safeParse(input);
  if (!parsed.success) throw new CommerceError(parsed.error.issues[0]?.message || 'Check the stock correction.');
  const data = parsed.data;
  return database.transaction(async tx => {
    const attempt = await beginStockOperation(tx, data.operationId, data, actorId);
    if (attempt.previous) return attempt.previous;
    const target = await readStockTarget(tx, data.kind, data.id, true);
    if (!target) throw new CommerceError('Stock item not found.', 'NOT_FOUND', 404);
    if (target.quantity !== data.expectedQuantity) throw new CommerceError('Stock changed. Refresh before recording a count correction.', 'STOCK_CONFLICT', 409);
    await writeStockTarget(tx, data.kind, data.id, data.quantity);
    return finishStockOperation(tx, { id: data.operationId, type: 'CORRECTION', actorId, reason: data.reason, requestHash: attempt.requestHash,
      subjectName: target.name, finalQuantity: data.quantity, changes: [{ kind: data.kind, id: target.id, name: target.name, before: target.quantity, after: data.quantity, delta: data.quantity - target.quantity }] });
  });
}
