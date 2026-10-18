'use server';

import { db, eq, sql, order } from '@stemory/database';
import { revalidatePath } from 'next/cache';
import { assertAdmin } from '@/lib/user-sync';
import { recordAuditLog } from '@/lib/audit';
import { createStaffOrder } from '@/lib/commerce/orders';
import { transitionOrder, archiveOrder, recordCashCollection } from '@/lib/commerce/order-lifecycle';
import { publicError } from '@/lib/commerce/errors';
import { receiptUrl, type OrderAddress } from '@/lib/commerce/receipt-access';
import { sendOrderToInfinidis } from '@/lib/infinidis';
import { randomBytes } from 'node:crypto';
import { AssistedOrderSchema } from '@stemory/contracts';
import type { z } from 'zod';
import { after } from 'next/server';
import { processNotificationOutbox } from '@/lib/commerce/outbox';

function refreshOrders() {
  for (const path of ['/admin', '/admin/orders', '/admin/deliveries', '/admin/finances', '/admin/reports', '/shop']) revalidatePath(path);
}

export async function updateOrderStatus(orderId: string, status: string) {
  const actor = await assertAdmin();
  try {
    await transitionOrder(orderId, status, actor.id);
    after(() => processNotificationOutbox(2, orderId).catch(console.error));
    refreshOrders();
    revalidatePath(`/admin/orders/${orderId}`);
    await recordAuditLog({ action: 'UPDATE', target: 'ORDER', summary: `Order status changed to ${status}`, details: { orderId, status } });
    return { success: true };
  } catch (error) { return { error: publicError(error).message }; }
}

export type AssistedOrderPayload = z.infer<typeof AssistedOrderSchema>;

export async function createAssistedOrder(payload: unknown) {
  await assertAdmin();
  const created = await createStaffOrder(payload);
  after(() => processNotificationOutbox(2, created.id).catch(console.error));
  refreshOrders();
  await recordAuditLog({ action: 'CREATE', target: 'ORDER', summary: `Created assisted order ${created.orderNumber}`, details: { orderId: created.id } });
  return { success: true, orderId: created.id, orderNumber: created.orderNumber, receiptUrl: created.receiptUrl };
}

// Retain the exported action name for existing clients; business records are archived, never destroyed.
export async function deleteOrder(orderId: string) {
  const actor = await assertAdmin();
  try {
    await archiveOrder(orderId, actor.id);
    refreshOrders();
    await recordAuditLog({ action: 'ARCHIVE', target: 'ORDER', summary: 'Archived order; financial and stock records retained', details: { orderId } });
    return { success: true };
  } catch (error) { return { error: publicError(error).message }; }
}

export async function recordOrderPayment(orderId: string) {
  const actor = await assertAdmin();
  try {
    await recordCashCollection(orderId, actor.id);
    refreshOrders();
    revalidatePath(`/admin/orders/${orderId}`);
    await recordAuditLog({ action: 'UPDATE', target: 'PAYMENT', summary: 'Recorded cash collected', details: { orderId } });
    return { success: true };
  } catch (error) { return { error: publicError(error).message }; }
}

export async function rotateReceiptLink(orderId: string) {
  await assertAdmin();
  const url = await db.transaction(async tx => {
    const [current] = await tx.select().from(order).where(eq(order.id, orderId)).for('update');
    if (!current) throw new Error('Order not found.');
    const address = { ...current.deliveryAddress as OrderAddress, receiptNonce: randomBytes(32).toString('hex') };
    await tx.update(order).set({ deliveryAddress: address, updatedAt: new Date() }).where(eq(order.id, orderId));
    return receiptUrl(current.orderNumber, address);
  });
  await recordAuditLog({ action: 'UPDATE', target: 'RECEIPT_ACCESS', summary: 'Rotated guest receipt link; previous link revoked', details: { orderId } });
  return { url };
}

export async function pushOrderToInfinidis(orderId: string) {
  await assertAdmin();
  try {
    const result = await db.transaction(async tx => {
      await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtextextended(${`dispatch:${orderId}`}, 0))`);
      await tx.select({ id: order.id }).from(order).where(eq(order.id, orderId)).for('update');
      const current = await tx.query.order.findFirst({ where: eq(order.id, orderId), with: { customer: true, orderItems: true } });
      if (!current) return { success: false, error: 'Order not found.' };
      if (current.sentToInfinidis) return { success: false, error: 'This order has already been sent to the carrier.' };
      const address = current.deliveryAddress as OrderAddress;
      if (address.archivedAt || current.status !== 'READY') return { success: false, error: 'Only ready orders can be dispatched.' };
      const buyer = address.customerSnapshot || current.customer;
      const success = await sendOrderToInfinidis({ fullname: `${buyer.firstName} ${buyer.lastName}`.trim(),
        code: current.orderNumber, product: current.orderItems.map(item => `${item.quantity}x ${item.productName}`).join(', '),
        qty: current.orderItems.reduce((sum, item) => sum + item.quantity, 0), phone: buyer.phone,
        address: address.addressLine1 || '', city: address.city || '', price: current.total, note: current.notes || undefined });
      if (!success) return { success: false, error: 'The carrier did not confirm this order. Review the carrier dashboard before retrying.' };
      await tx.update(order).set({ sentToInfinidis: true, updatedAt: new Date() }).where(eq(order.id, orderId));
      return { success: true };
    });
    refreshOrders();
    return result;
  } catch { return { success: false, error: 'Dispatch could not be confirmed. Check the carrier dashboard before retrying.' }; }
}
