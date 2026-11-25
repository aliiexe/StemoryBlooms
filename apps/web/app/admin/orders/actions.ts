'use server';

import { db, eq, order } from '@stemory/database';
import { revalidatePath } from 'next/cache';
import { assertAdmin } from '@/lib/user-sync';
import { recordAuditLog } from '@/lib/audit';
import { createStaffOrder, quoteStaffOrder } from '@/lib/commerce/orders';
import { transitionOrder, archiveOrder, recordCashCollection } from '@/lib/commerce/order-lifecycle';
import { publicError } from '@/lib/commerce/errors';
import { receiptUrl, type OrderAddress } from '@/lib/commerce/receipt-access';
import { queueCarrierRegistration } from '@/lib/commerce/delivery';
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

export async function getAssistedOrderQuote(payload: unknown) {
  await assertAdmin();
  try { return { success: true as const, quote: await quoteStaffOrder(payload) }; }
  catch (error) { return { success: false as const, ...publicError(error) }; }
}

export async function createAssistedOrder(payload: unknown) {
  const actor = await assertAdmin();
  try {
    const created = await createStaffOrder(payload, db, actor.id);
    after(() => processNotificationOutbox(2, created.id).catch(console.error));
    refreshOrders();
    await recordAuditLog({ action: 'CREATE', target: 'ORDER', summary: `Created assisted order ${created.orderNumber}`, details: { orderId: created.id } });
    return { success: true as const, orderId: created.id, orderNumber: created.orderNumber, receiptUrl: created.receiptUrl };
  } catch (error) { return { success: false as const, ...publicError(error) }; }
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
  const actor = await assertAdmin();
  try {
    const carriers = await db.query.deliveryCompany.findMany({ where: (table, { eq }) => eq(table.isActive, true) });
    const matches = carriers.filter(value => value.name.toLowerCase().includes('infinidis'));
    if (matches.length !== 1) return { success: false, error: 'Select an active Infinidis carrier in Deliveries before registering this order.' };
    const result = await queueCarrierRegistration({ orderId, companyId: matches[0].id }, actor.id);
    after(() => processNotificationOutbox(2, orderId).catch(console.error));
    refreshOrders(); return { success: true, queued: result.status !== 'SENT', status: result.status };
  } catch (error) { return { success: false, error: publicError(error).message }; }
}
