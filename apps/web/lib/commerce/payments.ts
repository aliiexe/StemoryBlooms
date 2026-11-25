import { createHash, randomUUID } from 'node:crypto';
import { z } from 'zod';
import { db, eq, and, inArray, sql, order, financeEntry, paymentStatusHistory, orderStatusHistory, notificationOutbox } from '@stemory/database';
import type { CommerceDatabase, CommerceTransaction } from './orders';
import type { OrderAddress } from './receipt-access';
import { ReceivedPaymentSchema } from '@stemory/contracts';
import { CommerceError } from './errors';
import { mergePaymentRows, paymentState, fulfillmentMethod, type PaymentRecord } from './payment-state';

const paymentInput = z.object({ operationId: z.string().uuid(), orderId: z.string().min(1).max(128),
  payment: ReceivedPaymentSchema, channel: z.enum(['DIRECT', 'CARRIER']).default('DIRECT'),
  reason: z.string().trim().min(3).max(500), expectedRemainingCents: z.number().int().nonnegative().optional() }).strict();
export async function paymentLedgerReady(reader: CommerceDatabase | CommerceTransaction) {
  const result = await reader.execute(sql`SELECT to_regclass('public."FinanceEntry"') IS NOT NULL AS ready`);
  return Boolean(result.rows[0]?.ready);
}
export async function paymentRowsForOrders(orders: { id: string; deliveryAddress: unknown }[], reader: CommerceDatabase | CommerceTransaction = db) {
  const rows = orders.length && await paymentLedgerReady(reader) ? await reader.select().from(financeEntry).where(inArray(financeEntry.orderId, orders.map(row => row.id))) : [];
  return new Map(orders.map(row => [row.id, mergePaymentRows(row.deliveryAddress, rows.filter(entry => entry.orderId === row.id))]));
}
export async function recordPaymentInTransaction(input: z.input<typeof paymentInput>, actorId: string, tx: CommerceTransaction) {
  const parsed = paymentInput.safeParse(input);
  if (!parsed.success) throw new CommerceError(parsed.error.issues[0]?.message || 'Check this received payment.');
  const data = parsed.data;
  const [current] = await tx.select().from(order).where(eq(order.id, data.orderId)).for('update');
  if (!current) throw new CommerceError('Order not found.');
  const address = current.deliveryAddress as OrderAddress;
  const requestHash = createHash('sha256').update(JSON.stringify({ ...data, expectedRemainingCents: undefined, actorId })).digest('hex');
  const previous = address.paymentRecords?.find(record => record.id === data.operationId);
  if (previous) {
    if (previous.requestHash !== requestHash) throw new CommerceError('This payment reference already records different details.', 'PAYMENT_CONFLICT', 409);
    return { orderId: current.id, replayed: true };
  }
  if (address.archivedAt || current.status === 'CANCELLED') throw new CommerceError('Reopen this order before recording a new payment.');
  const dispatch = await tx.query.notificationOutbox.findFirst({ where: and(eq(notificationOutbox.type, 'COURIER_DISPATCH'), sql`${notificationOutbox.payload}->>'orderId' = ${current.id}`, inArray(notificationOutbox.status, ['PENDING', 'PROCESSING', 'UNCERTAIN'])) });
  if (dispatch) throw new CommerceError('Stop or reconcile the pending courier registration in Deliveries before recording this payment, so the carrier cannot collect an outdated amount.');
  const rows = (await paymentRowsForOrders([current], tx)).get(current.id) || [];
  const state = paymentState(current, rows);
  if (state.refunded) throw new CommerceError('This order has refunds. Review its history before collecting more money.');
  if (data.expectedRemainingCents !== undefined && state.remaining !== data.expectedRemainingCents) throw new CommerceError('A payment was recorded since you opened this form. Refresh the order before recording more.', 'PAYMENT_CONFLICT', 409);
  const allowed = data.payment.allocation === 'ITEMS' ? state.itemsRemaining : data.payment.allocation === 'DELIVERY' ? state.deliveryRemaining : state.remaining;
  if (data.payment.amountCents > allowed || data.payment.amountCents > state.remaining) throw new CommerceError('This payment exceeds the unpaid amount for the selected part of the order.');
  if (data.channel === 'CARRIER' && (data.payment.method !== 'CASH' || fulfillmentMethod(address) !== 'DELIVERY' || !['SHIPPED', 'DELIVERED', 'COMPLETED'].includes(current.status))) throw new CommerceError('Carrier collection is only for cash actually collected after carrier handoff.');
  const record: PaymentRecord = { id: data.operationId, ...data.payment, channel: data.channel, actorId, reason: data.reason, at: new Date().toISOString(), requestHash };
  const nextAddress = { ...address, paymentRecords: [...(address.paymentRecords || []), record],
    ...(current.sentToInfinidis && data.channel !== 'CARRIER' ? { carrierBalanceReviewRequired: true } : {}) };
  const next = paymentState({ ...current, deliveryAddress: nextAddress }, rows);
  const paymentStatus = next.remaining === 0 ? 'PAID' : 'PARTIALLY_PAID';
  // The immutable order snapshot also works during the additive finance-ledger rollout.
  // Ledger readers merge by ID, so these records can never be counted twice.
  if (await paymentLedgerReady(tx)) await tx.insert(financeEntry).values({ id: record.id, orderId: current.id, type: 'COLLECTION', channel: record.channel,
    amountCents: record.amountCents, actorId, reason: record.reason, reference: record.reference, requestHash });
  await tx.update(order).set({ deliveryAddress: nextAddress, paymentStatus, updatedAt: new Date() }).where(eq(order.id, current.id));
  await tx.insert(paymentStatusHistory).values({ id: randomUUID(), orderId: current.id, status: paymentStatus, actorId });
  await tx.insert(orderStatusHistory).values({ id: randomUUID(), orderId: current.id, status: current.status, actorId,
    note: `Received ${(record.amountCents / 100).toFixed(2)} MAD by ${record.method.toLowerCase().replaceAll('_', ' ')} for ${record.allocation.toLowerCase()}${record.reference ? ` · ${record.reference}` : ''}. ${record.reason}` });
  return { orderId: current.id, replayed: false };
}
export async function recordReceivedPayment(input: unknown, actorId: string, database: CommerceDatabase = db) {
  const parsed = paymentInput.safeParse(input);
  if (!parsed.success) throw new CommerceError(parsed.error.issues[0]?.message || 'Review the received payment.');
  return database.transaction(tx => recordPaymentInTransaction(parsed.data, actorId, tx));
}
export async function orderPaymentState(current: typeof order.$inferSelect, database: CommerceDatabase = db) {
  return paymentState(current, (await paymentRowsForOrders([current], database)).get(current.id));
}
export async function confirmCarrierBalance(input: unknown, actorId: string, database: CommerceDatabase = db) {
  const parsed = z.object({ orderId: z.string().min(1).max(128), reference: z.string().trim().min(5).max(150), expectedRemainingCents: z.number().int().nonnegative() }).strict().safeParse(input);
  if (!parsed.success) throw new CommerceError('Enter the carrier confirmation reference.');
  return database.transaction(async tx => {
    const [current] = await tx.select().from(order).where(eq(order.id, parsed.data.orderId)).for('update');
    if (!current) throw new CommerceError('Order not found.');
    const address = current.deliveryAddress as OrderAddress;
    const remaining = (await orderPaymentState(current, tx as unknown as CommerceDatabase)).remaining;
    if (remaining !== parsed.data.expectedRemainingCents) throw new CommerceError('The balance changed. Verify the new balance with the carrier before confirming.', 'PAYMENT_CONFLICT', 409);
    if (!address.carrierBalanceReviewRequired) return { orderId: current.id };
    await tx.update(order).set({ deliveryAddress: { ...address, carrierBalanceReviewRequired: false }, updatedAt: new Date() }).where(eq(order.id, current.id));
    await tx.insert(orderStatusHistory).values({ id: randomUUID(), orderId: current.id, status: current.status, actorId, note: `Confirmed carrier now collects ${(remaining / 100).toFixed(2)} MAD. Reference: ${parsed.data.reference}` });
    return { orderId: current.id };
  });
}
export type OrderPaymentState = ReturnType<typeof paymentState>;
