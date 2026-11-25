import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { db, eq, and, sql, order, deliveryCompany, deliveryHandoff, notificationOutbox, orderStatusHistory } from '@stemory/database';
import type { CommerceDatabase } from './orders';
import { CommerceError } from './errors';
import { transitionOrderInTransaction } from './order-lifecycle';
import type { OrderAddress } from './receipt-access';
import { fulfillmentMethod } from './payment-state';
import { orderPaymentState } from './payments';
import { submitInfinidisOrder, type CourierShipment, type CourierSubmissionResult } from '@/lib/infinidis';

const shipmentSchema = z.object({ fullname: z.string().min(1).max(300), code: z.string().min(1).max(128), product: z.string().max(12000), qty: z.number().int().positive(), phone: z.string().min(5).max(60), address: z.string().min(1).max(1000), city: z.string().min(1).max(100), price: z.number().nonnegative(), note: z.string().max(1000).optional() });
const registrationSchema = z.object({ orderId: z.string().min(1).max(128), companyId: z.string().min(1).max(128) }).strict();
type DispatchPayload = { orderId: string; companyId: string; companyName: string; actorId: string; shipment: CourierShipment; resolution?: { registered: boolean; note: string; actorId: string; at: string } };
const isDispatch = (orderId: string) => and(eq(notificationOutbox.type, 'COURIER_DISPATCH'), sql`${notificationOutbox.payload}->>'orderId' = ${orderId}`);

export async function queueCarrierRegistration(input: unknown, actorId: string, database: CommerceDatabase = db) {
  const parsed = registrationSchema.safeParse(input);
  if (!parsed.success) throw new CommerceError('Select a ready order and an active carrier.');
  return database.transaction(async tx => {
    const [current] = await tx.select().from(order).where(eq(order.id, parsed.data.orderId)).for('update');
    if (!current || (current.deliveryAddress as OrderAddress).archivedAt) throw new CommerceError('Order not found.', 'NOT_FOUND', 404);
    if (fulfillmentMethod(current.deliveryAddress) !== 'DELIVERY') throw new CommerceError('Pickup and local hand delivery do not need a courier registration.');
    if (current.sentToInfinidis) return { id: '', status: 'SENT', orderId: current.id };
    if (current.status !== 'READY') throw new CommerceError('Only ready orders can be registered with a carrier.');
    const active = await tx.query.notificationOutbox.findFirst({ where: and(isDispatch(current.id), sql`${notificationOutbox.status} IN ('PENDING','PROCESSING','UNCERTAIN','SENT')`) });
    if (active) return { id: active.id, status: active.status, orderId: current.id };
    const carrier = await tx.query.deliveryCompany.findFirst({ where: and(eq(deliveryCompany.id, parsed.data.companyId), eq(deliveryCompany.isActive, true)) });
    if (!carrier || !carrier.name.toLowerCase().includes('infinidis')) throw new CommerceError('Automatic registration supports Infinidis. Record a manual handoff for other carriers.');
    const address = current.deliveryAddress as OrderAddress;
    const buyer = address.customerSnapshot || await tx.query.customer.findFirst({ where: (table, { eq }) => eq(table.id, current.customerId) });
    const items = await tx.query.orderItem.findMany({ where: (table, { eq }) => eq(table.orderId, current.id) });
    if (!buyer) throw new CommerceError('Buyer details are missing. Review this order first.');
    const shipment = shipmentSchema.safeParse({ fullname: address.recipientSnapshot?.name || `${buyer.firstName} ${buyer.lastName}`.trim(),
      phone: address.recipientSnapshot?.phone || buyer.phone, code: current.orderNumber, product: items.map(item => `${item.quantity}x ${item.productName}`).join(', '), qty: items.reduce((sum, item) => sum + item.quantity, 0),
      address: address.addressLine1 || '', city: address.city || '', price: (await orderPaymentState(current, tx as unknown as CommerceDatabase)).remaining / 100, note: current.notes || undefined });
    if (!shipment.success || address.addressLine1 === 'Hand delivered') throw new CommerceError('Review the recipient, address, city, and items before carrier registration.');
    const id = randomUUID();
    await tx.insert(notificationOutbox).values({ id, type: 'COURIER_DISPATCH', recipient: carrier.name, payload: { ...parsed.data, companyName: carrier.name, actorId, shipment: shipment.data } satisfies DispatchPayload, updatedAt: new Date() });
    await tx.insert(orderStatusHistory).values({ id: randomUUID(), orderId: current.id, status: current.status, actorId, note: `Queued carrier registration with ${carrier.name}. Physical handoff has not been recorded.` });
    return { id, status: 'PENDING', orderId: current.id };
  });
}

export async function processCarrierRegistrations(limit = 5, orderId?: string, database: CommerceDatabase = db, submit: (shipment: CourierShipment) => Promise<CourierSubmissionResult> = submitInfinidisOrder) {
  await database.update(notificationOutbox).set({ status: 'UNCERTAIN', error: 'Registration processing was interrupted. Verify the carrier dashboard before retrying.', updatedAt: new Date() })
    .where(and(eq(notificationOutbox.type, 'COURIER_DISPATCH'), eq(notificationOutbox.status, 'PROCESSING'), sql`${notificationOutbox.lastAttempt} < NOW() - INTERVAL '10 minutes'`));
  let completed = 0;
  for (let index = 0; index < limit; index++) {
    const job = await database.transaction(async tx => {
      const [next] = await tx.select().from(notificationOutbox).where(and(eq(notificationOutbox.type, 'COURIER_DISPATCH'), eq(notificationOutbox.status, 'PENDING'), eq(notificationOutbox.attempts, 0), ...(orderId ? [sql`${notificationOutbox.payload}->>'orderId' = ${orderId}`] : [])))
        .orderBy(notificationOutbox.createdAt).limit(1).for('update', { skipLocked: true });
      if (!next) return null;
      await tx.update(notificationOutbox).set({ status: 'PROCESSING', attempts: 1, lastAttempt: new Date(), updatedAt: new Date() }).where(eq(notificationOutbox.id, next.id));
      return next;
    });
    if (!job) break;
    const payload = job.payload as DispatchPayload;
    const current = await database.query.order.findFirst({ where: eq(order.id, payload.orderId) });
    if (!current || current.status !== 'READY' || (current.deliveryAddress as OrderAddress).archivedAt) {
      await database.update(notificationOutbox).set({ status: 'CANCELLED', error: 'Order is no longer eligible for registration.', updatedAt: new Date() }).where(eq(notificationOutbox.id, job.id));
      continue;
    }
    let outcome: CourierSubmissionResult;
    const checked = shipmentSchema.safeParse(payload.shipment);
    const remaining = (await orderPaymentState(current, database)).remaining / 100;
    try { outcome = checked.success && fulfillmentMethod(current.deliveryAddress) === 'DELIVERY' && checked.data.price === remaining
      ? await submit(checked.data) : { outcome: 'REJECTED', error: 'Saved shipment details or amount changed. Review the order before registering again.' }; }
    catch { outcome = { outcome: 'UNCERTAIN', error: 'Carrier registration outcome is unknown. Verify the provider dashboard.' }; }
    await database.transaction(async tx => {
      const [latest] = await tx.select().from(order).where(eq(order.id, current.id)).for('update');
      const [latestJob] = await tx.select().from(notificationOutbox).where(eq(notificationOutbox.id, job.id)).for('update');
      if (!latest || latestJob?.status !== 'PROCESSING') return;
      const acknowledged = outcome.outcome === 'ACKNOWLEDGED' && latest.status === 'READY';
      const status = acknowledged ? 'SENT' : outcome.outcome === 'REJECTED' ? 'FAILED' : 'UNCERTAIN';
      await tx.update(notificationOutbox).set({ status, error: acknowledged ? null : outcome.error || 'Registration result needs review.', updatedAt: new Date() }).where(eq(notificationOutbox.id, job.id));
      if (acknowledged) await tx.update(order).set({ sentToInfinidis: true, updatedAt: new Date() }).where(eq(order.id, current.id));
      await tx.insert(orderStatusHistory).values({ id: randomUUID(), orderId: current.id, status: latest.status, actorId: payload.actorId,
        note: acknowledged ? `${payload.companyName} acknowledged registration using order code ${latest.orderNumber}. Record physical handoff separately.` : `Carrier registration ${status.toLowerCase()}: ${outcome.error || 'Review required'}` });
      if (acknowledged) completed++;
    });
  }
  return { completed };
}

export async function resolveCarrierRegistration(input: unknown, actorId: string, database: CommerceDatabase = db) {
  const parsed = z.object({ jobId: z.string().min(1).max(128), registered: z.boolean(), note: z.string().trim().min(5).max(500) }).strict().safeParse(input);
  if (!parsed.success) throw new CommerceError('Record what you verified in the carrier dashboard.');
  const initial = await database.query.notificationOutbox.findFirst({ where: and(eq(notificationOutbox.id, parsed.data.jobId), eq(notificationOutbox.type, 'COURIER_DISPATCH')) });
  if (!initial) throw new CommerceError('Registration attempt not found.');
  const payload = initial.payload as DispatchPayload;
  return database.transaction(async tx => {
    const [current] = await tx.select().from(order).where(eq(order.id, payload.orderId)).for('update');
    const [job] = await tx.select().from(notificationOutbox).where(eq(notificationOutbox.id, initial.id)).for('update');
    const other = await tx.query.notificationOutbox.findFirst({ where: and(isDispatch(payload.orderId), sql`${notificationOutbox.id} <> ${initial.id}`, sql`${notificationOutbox.status} IN ('PENDING','PROCESSING','UNCERTAIN','SENT')`) });
    if (other) throw new CommerceError('Another registration attempt is active. Reconcile that attempt instead.');
    const stale = job?.status === 'PROCESSING' && job.lastAttempt && job.lastAttempt.getTime() < Date.now() - 600000;
    if (!current || !job || (!['UNCERTAIN', 'FAILED'].includes(job.status) && !stale)) throw new CommerceError('Only failed, uncertain, or interrupted registrations can be reconciled.');
    if (parsed.data.registered && !['READY', 'SHIPPED', 'DELIVERED', 'COMPLETED'].includes(current.status)) throw new CommerceError('The carrier has an order that is no longer fulfillable. Resolve the cancellation with the carrier first.');
    const resolution = { registered: parsed.data.registered, note: parsed.data.note, actorId, at: new Date().toISOString() };
    await tx.update(notificationOutbox).set({ status: parsed.data.registered ? 'SENT' : 'CANCELLED', payload: { ...payload, resolution }, error: null, updatedAt: new Date() }).where(eq(notificationOutbox.id, job.id));
    await tx.update(order).set({ sentToInfinidis: parsed.data.registered, updatedAt: new Date() }).where(eq(order.id, current.id));
    await tx.insert(orderStatusHistory).values({ id: randomUUID(), orderId: current.id, status: current.status, actorId, note: `Verified carrier registration ${parsed.data.registered ? 'exists' : 'does not exist'}: ${parsed.data.note}` });
    return { orderId: current.id };
  });
}

export async function stopQueuedRegistration(jobId: string, actorId: string, database: CommerceDatabase = db) {
  const job = await database.query.notificationOutbox.findFirst({ where: and(eq(notificationOutbox.id, jobId), eq(notificationOutbox.type, 'COURIER_DISPATCH')) });
  if (!job) throw new CommerceError('Registration job not found.');
  return database.transaction(async tx => {
    const payload = job.payload as DispatchPayload;
    const [current] = await tx.select().from(order).where(eq(order.id, payload.orderId)).for('update');
    const updated = await tx.update(notificationOutbox).set({ status: 'CANCELLED', error: 'Stopped by an administrator before submission.', updatedAt: new Date() }).where(and(eq(notificationOutbox.id, jobId), eq(notificationOutbox.status, 'PENDING'))).returning();
    if (!current || !updated.length) throw new CommerceError('This registration has already started. Check its result before retrying.');
    await tx.insert(orderStatusHistory).values({ id: randomUUID(), orderId: current.id, status: current.status, actorId, note: 'Stopped queued carrier registration before submission.' });
    return { orderId: current.id };
  });
}

export async function recordDeliveryHandoff(input: unknown, actorId: string, database: CommerceDatabase = db) {
  const parsed = registrationSchema.extend({ reference: z.string().trim().min(1).max(150) }).strict().safeParse(input);
  if (!parsed.success) throw new CommerceError('Choose a carrier and enter the verified handoff reference.');
  return database.transaction(async tx => {
    const [current] = await tx.select().from(order).where(eq(order.id, parsed.data.orderId)).for('update');
    if (!current) throw new CommerceError('Order not found.');
    if (fulfillmentMethod(current.deliveryAddress) !== 'DELIVERY') throw new CommerceError('This order is for pickup or local hand delivery. Complete it from Orders.');
    if ((current.deliveryAddress as OrderAddress).carrierBalanceReviewRequired) throw new CommerceError('Confirm the revised amount with the carrier before recording handoff.');
    const previous = await tx.query.deliveryHandoff.findFirst({ where: eq(deliveryHandoff.orderId, current.id) });
    if (previous) {
      if (previous.companyId === parsed.data.companyId && previous.reference === parsed.data.reference && current.status !== 'READY') return { orderId: current.id, replayed: true };
      if (previous.companyId !== parsed.data.companyId || previous.reference !== parsed.data.reference) throw new CommerceError('This order already has a different handoff. Its original carrier history has been retained.', 'HANDOFF_CONFLICT', 409);
    }
    const carrier = await tx.query.deliveryCompany.findFirst({ where: and(eq(deliveryCompany.id, parsed.data.companyId), eq(deliveryCompany.isActive, true)) });
    if (!carrier) throw new CommerceError('Choose an active delivery company.');
    await transitionOrderInTransaction(tx, current.id, 'SHIPPED', actorId, { carrierHandoff: true });
    if (!previous) await tx.insert(deliveryHandoff).values({ id: randomUUID(), orderId: current.id, companyId: carrier.id, reference: parsed.data.reference, actorId });
    const address = current.deliveryAddress as OrderAddress;
    await tx.update(order).set({ deliveryAddress: { ...address, carrierHandoff: { companyId: carrier.id, companyName: carrier.name, reference: parsed.data.reference, at: new Date().toISOString() } }, updatedAt: new Date() }).where(eq(order.id, current.id));
    return { orderId: current.id, replayed: false };
  });
}
