import { beginStockOperation, finishStockOperation } from './stock-ledger';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { db, eq, sql, material, supplier, expense } from '@stemory/database';
import type { CommerceDatabase } from './orders';
import { CommerceError } from './errors';

export const MaterialInputSchema = z.object({ name: z.string().trim().min(1).max(150), quantity: z.number().int().min(0).max(1000000),
  cost: z.number().finite().min(0).max(1000000), lowStockThreshold: z.number().int().min(0).max(1000000).nullable(), supplierId: z.string().max(128).nullable().optional(), expectedQuantity: z.number().int().optional() }).strict();
export const MaterialUpdateSchema = z.object({ quantity: z.number().int().min(0).max(1000000).optional(), expectedQuantity: z.number().int().optional(),
  cost: z.number().finite().min(0).max(1000000).nullable().optional(), lowStockThreshold: z.number().int().min(0).max(1000000).nullable().optional() }).strict();

export async function saveInventoryMaterial(id: string | null, input: unknown, actorId: string, database: CommerceDatabase = db) {
  const parsed = MaterialInputSchema.safeParse(input);
  if (!parsed.success) throw new CommerceError('Enter a name, nonnegative cost, and whole stock quantities.');
  return database.transaction(async tx => {
    const { expectedQuantity, ...data } = parsed.data;
    if (data.supplierId && !await tx.query.supplier.findFirst({ where: eq(supplier.id, data.supplierId) })) throw new CommerceError('Supplier not found.');
    const previous = id ? (await tx.select().from(material).where(eq(material.id, id)).for('update'))[0] : null;
    if (id && !previous) throw new CommerceError('Material not found.');
    if (previous && previous.quantity !== expectedQuantity) throw new CommerceError('Stock changed. Refresh and try again.', 'STOCK_CONFLICT', 409);
    const materialId = id || randomUUID();
    const now = new Date();
    const values = { ...data, supplierId: data.supplierId || null, updatedAt: now };
    const [saved] = previous ? await tx.update(material).set(values).where(eq(material.id, materialId)).returning() : await tx.insert(material).values({ ...values, id: materialId }).returning();
    const difference = saved.quantity - (previous?.quantity || 0);
    if (previous && difference) throw new CommerceError('Use a stock correction to change an existing material count.');
    if (difference) {
      const operationId = randomUUID();
      const attempt = await beginStockOperation(tx, operationId, { materialId, quantity: saved.quantity, cost: data.cost }, actorId);
      await finishStockOperation(tx, { id: operationId, type: 'PURCHASE', actorId, reason: 'Initial material purchase', requestHash: attempt.requestHash, subjectName: saved.name, finalQuantity: saved.quantity, changes: [{ kind: 'MATERIAL', id: materialId, name: saved.name, before: 0, after: saved.quantity, delta: saved.quantity }] });
    }
    if (!previous && saved.quantity > 0) await tx.insert(expense).values({ id: randomUUID(), amount: Math.round(saved.quantity * data.cost * 100) / 100,
      description: `Initial stock: ${saved.quantity}× ${saved.name}`, category: 'SUPPLIES', relatedMaterialId: materialId, updatedAt: now });
    return saved;
  });
}

export async function correctMaterial(id: string, input: unknown, actorId: string, database: CommerceDatabase = db) {
  const parsed = MaterialUpdateSchema.safeParse(input);
  if (!parsed.success) throw new CommerceError('Enter nonnegative costs and whole stock quantities.');
  return database.transaction(async tx => {
    const [current] = await tx.select().from(material).where(eq(material.id, id)).for('update');
    if (!current) throw new CommerceError('Material not found.');
    const { expectedQuantity, ...values } = parsed.data;
    if (values.quantity !== undefined && current.quantity !== expectedQuantity) throw new CommerceError('Stock changed. Refresh and try again.', 'STOCK_CONFLICT', 409);
    if (values.quantity !== undefined && values.quantity !== current.quantity) throw new CommerceError('Use a reasoned stock correction to change the count.');
    const [saved] = await tx.update(material).set({ ...values, updatedAt: new Date() }).where(eq(material.id, id)).returning();
    return saved;
  });
}

export async function purchaseMaterial(id: string, quantity: number, actorId: string, database: CommerceDatabase = db, operationId: string = randomUUID(), unitCost?: number, reason = 'Material purchase') {
  if (!Number.isSafeInteger(quantity) || quantity <= 0 || quantity > 100000) throw new CommerceError('Enter a positive whole restock quantity.');
  if (unitCost !== undefined && (!Number.isFinite(unitCost) || unitCost < 0 || unitCost > 1000000 || Math.abs(unitCost * 100 - Math.round(unitCost * 100)) > 0.00001)) throw new CommerceError('Enter a nonnegative unit cost with at most two decimal places.');
  if (typeof reason !== 'string' || reason.trim().length < 3 || reason.length > 500) throw new CommerceError('Enter a purchase note with at least three characters.');
  return database.transaction(async tx => {
    const attempt = await beginStockOperation(tx, operationId, { id, quantity, unitCost, reason: reason.trim() }, actorId);
    if (attempt.previous) return attempt.previous;
    const [current] = await tx.select().from(material).where(eq(material.id, id)).for('update');
    const cost = unitCost ?? current?.cost;
    if (!current || cost === null || cost === undefined || !Number.isFinite(cost) || cost < 0) throw new CommerceError('Set a valid purchase cost before restocking.');
    if (current.quantity < 0 || current.quantity + quantity > 1000000) throw new CommerceError('Recount historical negative stock before recording this purchase.');
    const roundedCost = Math.round(cost * 100) / 100;
    const now = new Date();
    await tx.update(material).set({ quantity: sql`${material.quantity} + ${quantity}`, cost: roundedCost, updatedAt: now }).where(eq(material.id, id));
    await tx.insert(expense).values({ id: randomUUID(), amount: Math.round(quantity * roundedCost * 100) / 100,
      description: `${reason.trim()}: ${quantity}× ${current.name} at ${roundedCost} MAD`, category: 'SUPPLIES', relatedMaterialId: id, updatedAt: now });
    return finishStockOperation(tx, { id: operationId, type: 'PURCHASE', actorId, reason: `${reason.trim()} · ${quantity} units at ${roundedCost} MAD`, requestHash: attempt.requestHash, subjectName: current.name,
      finalQuantity: current.quantity + quantity, changes: [{ kind: 'MATERIAL', id, name: current.name, before: current.quantity, after: current.quantity + quantity, delta: quantity }] });
  });
}
