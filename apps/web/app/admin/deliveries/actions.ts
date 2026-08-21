'use server';

import { db, eq, order, deliveryHandoff } from '@stemory/database';
import { revalidatePath } from 'next/cache';
import crypto from 'crypto';
import { recordAuditLog } from '@/lib/audit';
import { assertAdmin } from '@/lib/user-sync';

export async function updateOrderStatus(orderId: string, status: string) {
  await assertAdmin();
  try {
    await db.update(order)
      .set({ status, updatedAt: new Date() })
      .where(eq(order.id, orderId));

    revalidatePath('/admin/deliveries');
    revalidatePath('/admin/orders');
    await recordAuditLog({
      action: 'UPDATE',
      target: 'ORDER',
      summary: `Updated order status to ${status} from deliveries`,
      details: { orderId, status },
    });
    return { success: true };
  } catch (error) {
    console.error('Failed to update order status:', error);
    return { error: 'Failed to update order status' };
  }
}

export async function createDeliveryHandoff(orderId: string, companyId: string, reference?: string) {
  await assertAdmin();
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
    await recordAuditLog({
      action: 'CREATE',
      target: 'DELIVERY',
      summary: `Created delivery handoff for order`,
      details: { orderId, companyId, reference },
    });
    return { success: true };
  } catch (error) {
    console.error('Failed to handoff delivery:', error);
    return { error: 'Failed to create delivery handoff' };
  }
}
