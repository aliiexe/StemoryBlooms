import { randomUUID } from 'node:crypto';
import { db, eq, and, sql, order, orderItem, product, builderComponent, promoCode, giftCard,
  orderStatusHistory, paymentStatusHistory, notificationOutbox } from '@stemory/database';
import type { CommerceDatabase } from './orders';
import type { OrderAddress } from './receipt-access';
import { CommerceError } from './errors';
import { canTransitionOrder } from './order-status';

type Transaction = Parameters<Parameters<CommerceDatabase['transaction']>[0]>[0];

export async function transitionOrderInTransaction(tx: Transaction, id: string, status: string, actorId: string) {
  const [current] = await tx.select().from(order).where(eq(order.id, id)).for('update');
  if (!current || (current.deliveryAddress as OrderAddress).archivedAt) throw new CommerceError('Order not found.', 'NOT_FOUND', 404);
  if (!canTransitionOrder(current.status, status)) throw new CommerceError('This status change is not allowed. Delivered orders require a return workflow.', 'INVALID_TRANSITION', 409);
  if (current.status === status) return current;
  const now = new Date();
  const cancelling = status === 'CANCELLED';
  const reopening = current.status === 'CANCELLED';
  const address = current.deliveryAddress as OrderAddress;
  if (cancelling || reopening) {
    const lines = await tx.select().from(orderItem).where(eq(orderItem.orderId, id));
    const products = new Map<string, number>();
    const components = new Map<string, number>();
    for (const line of lines) {
      if (line.productId) products.set(line.productId, (products.get(line.productId) || 0) + line.quantity);
      else if (line.configuration && typeof line.configuration === 'object') {
        const config = line.configuration as Record<string, unknown>;
        const entries = config.components && typeof config.components === 'object' ? config.components as Record<string, unknown> : config;
        for (const [componentId, quantity] of Object.entries(entries)) {
          // Legacy configurations may also contain text metadata, never inventory quantities.
          if (typeof quantity === 'number' && Number.isSafeInteger(quantity) && quantity > 0) components.set(componentId, (components.get(componentId) || 0) + quantity * line.quantity);
        }
      }
    }
    for (const [itemId, quantity] of [...products].sort(([a], [b]) => a.localeCompare(b))) {
      const updated = await tx.update(product).set({ stock: cancelling ? sql`${product.stock} + ${quantity}` : sql`${product.stock} - ${quantity}`,
        ...(cancelling ? {} : { isAvailable: sql`${product.stock} - ${quantity} > 0` }), updatedAt: now })
        .where(and(eq(product.id, itemId), ...(reopening ? [eq(product.status, 'PUBLISHED'), eq(product.isAvailable, true), sql`${product.stock} >= ${quantity}`] : []))).returning({ id: product.id });
      if (updated.length !== 1) throw new CommerceError('Stock is unavailable. The order was not reopened.', 'OUT_OF_STOCK', 409);
      if (cancelling) await tx.update(product).set({ isAvailable: true }).where(and(eq(product.id, itemId), eq(product.status, 'PUBLISHED')));
    }
    for (const [itemId, quantity] of [...components].sort(([a], [b]) => a.localeCompare(b))) {
      const updated = await tx.update(builderComponent).set({ stock: cancelling ? sql`${builderComponent.stock} + ${quantity}` : sql`${builderComponent.stock} - ${quantity}`,
        isAvailable: cancelling ? true : sql`${builderComponent.stock} - ${quantity} > 0`, updatedAt: now })
        .where(and(eq(builderComponent.id, itemId), ...(reopening ? [eq(builderComponent.isAvailable, true), sql`${builderComponent.stock} >= ${quantity}`] : []))).returning({ id: builderComponent.id });
      // Deleted legacy components cannot be recreated by cancelling an old order.
      if (reopening && updated.length !== 1) throw new CommerceError('Bouquet components are unavailable. The order was not reopened.', 'OUT_OF_STOCK', 409);
    }
    const redemption = address.redemptions;
    if (reopening && redemption && (redemption.promoId || redemption.giftAmount > 0)) throw new CommerceError('Create a new order to reapply a cancelled promotion or gift card.', 'REQUOTE_REQUIRED', 409);
    if (cancelling && redemption?.promoId) await tx.update(promoCode).set({ usageCount: sql`GREATEST(0, ${promoCode.usageCount} - 1)`, updatedAt: now }).where(eq(promoCode.id, redemption.promoId));
    if (cancelling && redemption?.giftCardId && redemption.giftAmount > 0) await tx.update(giftCard).set({ currentBalance: sql`${giftCard.currentBalance} + ${redemption.giftAmount}`, updatedAt: now }).where(eq(giftCard.id, redemption.giftCardId));
  }
  const [updated] = await tx.update(order).set({ status, updatedAt: now }).where(eq(order.id, id)).returning();
  await tx.insert(orderStatusHistory).values({ id: randomUUID(), orderId: id, status, actorId, note: `${current.status} → ${status}`, createdAt: now });
  if (current.sentToInfinidis && ['CANCELLED', 'DELIVERED'].includes(status)) await tx.insert(notificationOutbox).values({ id: randomUUID(), type: 'COURIER_STATUS', recipient: 'INFINIDIS', payload: { orderId: id, orderNumber: current.orderNumber, status }, updatedAt: now });
  return updated;
}

export async function transitionOrder(id: string, status: string, actorId: string, database: CommerceDatabase = db) {
  return database.transaction(tx => transitionOrderInTransaction(tx, id, status, actorId));
}

export async function archiveOrder(id: string, actorId: string, database: CommerceDatabase = db) {
  return database.transaction(async tx => {
    const [current] = await tx.select().from(order).where(eq(order.id, id)).for('update');
    if (!current) throw new CommerceError('Order not found.', 'NOT_FOUND', 404);
    const address = current.deliveryAddress as OrderAddress;
    if (address.archivedAt) return;
    if (!['CANCELLED', 'DELIVERED', 'COMPLETED'].includes(current.status)) throw new CommerceError('Cancel or fulfill this order before archiving it.', 'INVALID_TRANSITION', 409);
    await tx.update(order).set({ deliveryAddress: { ...address, archivedAt: new Date().toISOString() }, updatedAt: new Date() }).where(eq(order.id, id));
    await tx.insert(orderStatusHistory).values({ id: randomUUID(), orderId: id, status: current.status, actorId, note: 'Archived. Stock and payment history retained.' });
  });
}

export async function recordCashCollection(id: string, actorId: string, database: CommerceDatabase = db) {
  return database.transaction(async tx => {
    const [current] = await tx.select().from(order).where(eq(order.id, id)).for('update');
    if (!current || (current.deliveryAddress as OrderAddress).archivedAt) throw new CommerceError('Order not found.', 'NOT_FOUND', 404);
    if (!['DELIVERED', 'COMPLETED'].includes(current.status)) throw new CommerceError('Record collection after delivery.');
    if (current.paymentStatus === 'PAID') return;
    await tx.update(order).set({ paymentStatus: 'PAID', updatedAt: new Date() }).where(eq(order.id, id));
    await tx.insert(paymentStatusHistory).values({ id: randomUUID(), orderId: id, status: 'PAID', actorId });
  });
}
