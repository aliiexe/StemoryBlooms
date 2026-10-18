import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { db, eq, sql, material, supplier, stockMovement, expense } from '@stemory/database';
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
    if (difference) await tx.insert(stockMovement).values({ id: randomUUID(), materialId, quantity: difference, reason: previous ? 'Stock count correction' : 'Initial stock', actorId });
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
    const [saved] = await tx.update(material).set({ ...values, updatedAt: new Date() }).where(eq(material.id, id)).returning();
    if (values.quantity !== undefined && values.quantity !== current.quantity) await tx.insert(stockMovement).values({ id: randomUUID(), materialId: id, quantity: values.quantity - current.quantity, reason: 'Manual stock count correction', actorId });
    return saved;
  });
}

export async function purchaseMaterial(id: string, quantity: number, actorId: string, database: CommerceDatabase = db) {
  if (!Number.isSafeInteger(quantity) || quantity <= 0 || quantity > 100000) throw new CommerceError('Enter a positive whole restock quantity.');
  return database.transaction(async tx => {
    const [current] = await tx.select().from(material).where(eq(material.id, id)).for('update');
    if (!current || current.cost === null || current.cost < 0) throw new CommerceError('Set a valid purchase cost before restocking.');
    const now = new Date();
    const [saved] = await tx.update(material).set({ quantity: sql`${material.quantity} + ${quantity}`, updatedAt: now }).where(eq(material.id, id)).returning();
    await tx.insert(expense).values({ id: randomUUID(), amount: Math.round(quantity * current.cost * 100) / 100,
      description: `Restock: ${quantity}× ${current.name}`, category: 'SUPPLIES', relatedMaterialId: id, updatedAt: now });
    await tx.insert(stockMovement).values({ id: randomUUID(), materialId: id, quantity, reason: `Purchase at ${current.cost} MAD per unit`, actorId });
    return saved;
  });
}
