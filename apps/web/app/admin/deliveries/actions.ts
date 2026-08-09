'use server';

import { db, eq, order, deliveryHandoff } from '@stemory/database';
import { revalidatePath } from 'next/cache';
import crypto from 'crypto';

export async function updateOrderStatus(orderId: string, status: string) {
  try {
    await db.update(order)
      .set({ status, updatedAt: new Date() })
      .where(eq(order.id, orderId));

    revalidatePath('/admin/deliveries');
    revalidatePath('/admin/orders');
    return { success: true };
  } catch (error) {
    console.error('Failed to update order status:', error);
    return { error: 'Failed to update order status' };
  }
}

export async function createDeliveryHandoff(orderId: string, companyId: string, reference?: string) {
  try {
    const existing = await db.query.deliveryHandoff.findFirst({
      where: eq(deliveryHandoff.orderId, orderId)
    });

    if (existing) {
      await db.update(deliveryHandoff).set({
        reference: reference || null,
        companyId,
      }).where(eq(deliveryHandoff.id, existing.id));
    } else {
      await db.insert(deliveryHandoff).values({
        id: crypto.randomUUID(),
        orderId,
        companyId,
        reference: reference || null,
        actorId: 'ADMIN',
        createdAt: new Date(),
      });
    }

    await db.update(order).set({ status: 'SHIPPED', updatedAt: new Date() }).where(eq(order.id, orderId));

    revalidatePath('/admin/deliveries');
    revalidatePath('/admin/orders');
    return { success: true };
  } catch (error) {
    console.error('Failed to handoff delivery:', error);
    return { error: 'Failed to create delivery handoff' };
  }
}
