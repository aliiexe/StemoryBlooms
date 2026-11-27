import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { db, builderComponent, auditLog, eq, sql } from '@stemory/database';
import type { CommerceDatabase } from './orders';
import { CommerceError } from './errors';

const inputSchema = z.object({
  id: z.string().uuid(),
  name: z.string().trim().min(1, 'Enter an item name.').max(150),
  type: z.enum(['FLOWER', 'LEAF', 'ANIMAL_BUG']),
  unitPrice: z.number().int('Use a whole MAD amount.').min(0).max(1000000),
}).strict();

// Staff-only caller. Persist immediately, independently of whether the order is saved.
// Hidden online and zero stock are deliberate: this never fabricates inventory.
export async function rememberQuickComponent(input: unknown, actorId: string, database: CommerceDatabase = db) {
  const parsed = inputSchema.safeParse(input);
  if (!parsed.success) throw new CommerceError(parsed.error.issues[0]?.message || 'Check the name and price.');
  const data = parsed.data;
  return database.transaction(async tx => {
    await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtextextended(${`quick-component:${data.id}`},0))`);
    const [previous] = await tx.select().from(builderComponent).where(eq(builderComponent.id, data.id));
    if (previous) {
      if (previous.name !== data.name || previous.type !== data.type || previous.unitPrice !== data.unitPrice) {
        throw new CommerceError('This saved item has changed. Choose it from the library or start a new item.', 'COMPONENT_CONFLICT', 409);
      }
      return previous;
    }
    const [created] = await tx.insert(builderComponent).values({
      ...data, stock: 0, minQuantity: 1, maxQuantity: 100,
      isAvailable: false, imageUrl: null, updatedAt: new Date(),
    }).returning();
    await tx.insert(auditLog).values({
      id: randomUUID(), actorId, action: 'CREATE', target: 'BUILDER_COMPONENT',
      summary: `Remembered order item "${created.name}" for later completion`,
      details: { componentId: created.id, source: 'ASSISTED_ORDER', unitPrice: created.unitPrice },
    });
    return created;
  });
}
