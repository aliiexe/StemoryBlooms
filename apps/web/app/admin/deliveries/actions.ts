'use server';

import { db, eq, and, deliveryHandoff, deliveryCompany } from '@stemory/database';
import { revalidatePath } from 'next/cache';
import { randomUUID } from 'node:crypto';
import { assertAdmin } from '@/lib/user-sync';
import { transitionOrder, transitionOrderInTransaction } from '@/lib/commerce/order-lifecycle';
import { publicError } from '@/lib/commerce/errors';
import { after } from 'next/server';
import { processNotificationOutbox } from '@/lib/commerce/outbox';
import { recordAuditLog } from '@/lib/audit';

export async function updateOrderStatus(orderId: string, status: string) {
  const actor = await assertAdmin();
  try {
    await transitionOrder(orderId, status, actor.id);
    after(() => processNotificationOutbox(2, orderId).catch(console.error));
    for (const path of ['/admin', '/admin/deliveries', '/admin/orders', `/admin/orders/${orderId}`]) revalidatePath(path);
    return { success: true };
  } catch (error) { return { error: publicError(error).message }; }
}

export async function createDeliveryHandoff(orderId: string, companyId: string, reference?: string) {
  const actor = await assertAdmin();
  if (!companyId || !reference?.trim() || reference.length > 150) return { error: 'Choose a carrier and enter its dispatch reference.' };
  try {
    await db.transaction(async tx => {
      const carrier = await tx.query.deliveryCompany.findFirst({ where: and(eq(deliveryCompany.id, companyId), eq(deliveryCompany.isActive, true)) });
      if (!carrier) throw new Error('Choose an active delivery company.');
      await transitionOrderInTransaction(tx, orderId, 'SHIPPED', actor.id);
      await tx.insert(deliveryHandoff).values({ id: randomUUID(), orderId, companyId, reference: reference.trim(), actorId: actor.id })
        .onConflictDoUpdate({ target: deliveryHandoff.orderId, set: { companyId, reference: reference.trim(), actorId: actor.id } });
    });
    for (const path of ['/admin/deliveries', '/admin/orders', `/admin/orders/${orderId}`]) revalidatePath(path);
    await recordAuditLog({ action: 'CREATE', target: 'DELIVERY', summary: 'Recorded carrier handoff', details: { orderId, companyId, reference } });
    return { success: true };
  } catch (error) { return { error: error instanceof Error ? error.message : 'Could not record dispatch.' }; }
}
