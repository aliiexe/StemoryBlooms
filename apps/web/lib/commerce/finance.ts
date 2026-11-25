import { createHash, randomUUID } from 'node:crypto';
import { z } from 'zod';
import { db, eq, sql, order, financeEntry, orderReturn, giftCard, paymentStatusHistory, orderStatusHistory, expense } from '@stemory/database';
import type { CommerceDatabase, CommerceTransaction } from './orders';
import type { OrderAddress } from './receipt-access';
import { CommerceError } from './errors';
import { beginStockOperation, finishStockOperation, readStockTarget, writeStockTarget, type StockChange } from './stock-ledger';
import {businessDay} from './reporting';
import { mergePaymentRows, paymentState } from './payment-state';

const cents = z.number().int().min(0).max(1000000000);
const base = z.object({ operationId: z.string().uuid(), orderId: z.string().min(1).max(128), reason: z.string().trim().min(3).max(500), reference: z.string().trim().max(150).default('') });
const entrySchema = base.extend({ type: z.enum(['COLLECTION', 'REMITTANCE', 'CASH_REFUND', 'GIFT_REFUND']), channel: z.enum(['DIRECT', 'CARRIER', 'GIFT']), amountCents: cents.optional(), feeCents: cents.default(0) }).strict();
export async function financeSchemaReady(database: CommerceDatabase = db) {
  const result = await database.execute(sql`SELECT to_regclass('public."FinanceEntry"') IS NOT NULL AND to_regclass('public."OrderReturn"') IS NOT NULL AS ready`);
  return Boolean(result.rows[0]?.ready);
}
async function requireFinance(tx: CommerceTransaction) {
  const result = await tx.execute(sql`SELECT to_regclass('public."FinanceEntry"') IS NOT NULL AND to_regclass('public."OrderReturn"') IS NOT NULL AS ready`);
  if (!result.rows[0]?.ready) throw new CommerceError('Apply the finance migration before recording payments or refunds.', 'MIGRATION_REQUIRED', 503);
}
export function summarizeEntries(entries: { type: string; channel: string; amountCents: number }[]) {
  const sum = (type: string, channel?: string) => entries.filter(row => row.type === type && (!channel || row.channel === channel)).reduce((total, row) => total + row.amountCents, 0);
  const collected = sum('COLLECTION'); const carrierCollected = sum('COLLECTION', 'CARRIER'); const remitted = sum('REMITTANCE'); const fees = sum('CARRIER_FEE'); const cashRefunded = sum('CASH_REFUND'); const giftRestored = sum('GIFT_REFUND');
  return { collected, carrierCollected, directCollected: sum('COLLECTION', 'DIRECT'), remitted, fees, cashRefunded, giftRestored,
    carrierOutstanding: carrierCollected - remitted - fees - sum('CASH_REFUND', 'CARRIER'), ownerCashIn: sum('COLLECTION', 'DIRECT') + remitted - sum('CASH_REFUND', 'DIRECT') };
}
export async function recordFinanceEntry(input: unknown, actorId: string, database: CommerceDatabase = db) {
  const parsed = entrySchema.safeParse(input);
  if (!parsed.success) throw new CommerceError(parsed.error.issues[0]?.message || 'Review the financial record.');
  const data = parsed.data; const requestHash = createHash('sha256').update(JSON.stringify({ data, actorId })).digest('hex');
  return database.transaction(async tx => {
    await requireFinance(tx);
    const [current] = await tx.select().from(order).where(eq(order.id, data.orderId)).for('update');
    if (!current) throw new CommerceError('Order not found.');
    const previous = await tx.query.financeEntry.findFirst({ where: eq(financeEntry.id, data.operationId) });
    if (previous) { if (previous.requestHash !== requestHash) throw new CommerceError('This reference was used for different financial details.', 'FINANCE_CONFLICT', 409); return { orderId: current.id, replayed: true }; }
    const entries = mergePaymentRows(current.deliveryAddress, await tx.select().from(financeEntry).where(eq(financeEntry.orderId, current.id)));
    const totals = summarizeEntries(entries); const due = current.total * 100; let amount = data.amountCents || 0;
    if (data.type === 'COLLECTION') {
      if (!['DIRECT', 'CARRIER'].includes(data.channel)) throw new CommerceError('Choose who collected the customer’s cash.');
      if (!['DELIVERED', 'COMPLETED'].includes(current.status)) throw new CommerceError('Record cash collection after delivery.');
      if (due === 0) throw new CommerceError('No cash is due on this order.');
      const collected = entries.find(row => row.type === 'COLLECTION');
      if (collected) { if (collected.channel !== data.channel) throw new CommerceError('Collection is already recorded with another holder. Review the original entry.'); return { orderId: current.id, replayed: true }; }
      amount = paymentState(current, entries).remaining;
      if (!amount) throw new CommerceError('This order is already paid.');
    } else if (data.type === 'REMITTANCE') {
      if (data.channel !== 'CARRIER' || !data.reference || amount + data.feeCents <= 0 || amount + data.feeCents > totals.carrierOutstanding) throw new CommerceError('Remittance plus withheld fees must not exceed cash still held by the carrier. Include its settlement reference.');
    } else if (data.type === 'CASH_REFUND') {
      if (!['DIRECT', 'CARRIER'].includes(data.channel) || amount <= 0 || amount > totals.collected - totals.cashRefunded) throw new CommerceError('The cash refund exceeds the collected cash still available to refund.');
      if (data.channel === 'CARRIER' && amount > totals.carrierOutstanding) throw new CommerceError('The carrier does not hold enough unreconciled cash for this refund.');
    } else {
      const redemption = (current.deliveryAddress as OrderAddress).redemptions;
      if (data.channel !== 'GIFT' || current.status === 'CANCELLED' || !redemption?.giftCardId || amount <= 0 || amount % 100 !== 0 || amount > redemption.giftAmount * 100 - totals.giftRestored) throw new CommerceError('Restore only the remaining redeemed gift amount, in whole MAD. Cancelled orders already reverse their gift redemption.');
      const [card] = await tx.select().from(giftCard).where(eq(giftCard.id, redemption.giftCardId)).for('update');
      if (!card) throw new CommerceError('The original gift card needs administrator review.');
      await tx.update(giftCard).set({ currentBalance: sql`${giftCard.currentBalance} + ${amount / 100}`, updatedAt: new Date() }).where(eq(giftCard.id, card.id));
    }
    if (data.type !== 'REMITTANCE' && data.feeCents !== 0) throw new CommerceError('Withheld fees belong to a carrier remittance.');
    await tx.insert(financeEntry).values({ id: data.operationId, orderId: current.id, type: data.type, channel: data.channel, amountCents: amount, actorId, reason: data.reason, reference: data.reference, requestHash });
    if (data.type === 'REMITTANCE' && data.feeCents) await tx.insert(financeEntry).values({ id: `${data.operationId}-fee`, orderId: current.id, type: 'CARRIER_FEE', channel: 'CARRIER', amountCents: data.feeCents, actorId, reason: data.reason, reference: data.reference, requestHash });
    let payment = current.paymentStatus;
    if (data.type === 'COLLECTION') payment = 'PAID';
    if (data.type === 'CASH_REFUND') payment = totals.cashRefunded + amount >= due ? 'REFUNDED' : 'PARTIALLY_REFUNDED';
    if (payment !== current.paymentStatus) {
      await tx.update(order).set({ paymentStatus: payment, updatedAt: new Date() }).where(eq(order.id, current.id));
      await tx.insert(paymentStatusHistory).values({ id: randomUUID(), orderId: current.id, status: payment, actorId });
    }
    return { orderId: current.id, replayed: false };
  });
}

const returnItem = z.object({ kind: z.enum(['PRODUCT', 'COMPONENT']), id: z.string().min(1).max(128), quantity: z.number().int().min(1).max(10000), disposition: z.enum(['RESTOCK', 'DAMAGED']) }).strict();
const returnSchema = base.omit({ reference: true }).extend({ items: z.array(returnItem).min(1).max(100) }).strict();
export type ReturnTarget = { kind: 'PRODUCT' | 'COMPONENT'; id: string; name: string; remaining: number };
async function targetsForOrder(tx: CommerceDatabase | CommerceTransaction, orderId: string): Promise<ReturnTarget[]> {
  const current = await tx.query.order.findFirst({ where: eq(order.id, orderId) });
  if ((current?.deliveryAddress as OrderAddress | null)?.stockReserved === false) return [];
  const lines = await tx.query.orderItem.findMany({ where: (table, { eq }) => eq(table.orderId, orderId) });
  const targets = new Map<string, ReturnTarget>();
  const add = (kind: ReturnTarget['kind'], id: string, name: string, quantity: number) => { const key = `${kind}:${id}`; const previous = targets.get(key); targets.set(key, { kind, id, name, remaining: (previous?.remaining || 0) + quantity }); };
  for (const line of lines) {
    if (line.productId) add('PRODUCT', line.productId, line.productName, line.quantity);
    else if (line.configuration && typeof line.configuration === 'object') {
      const config = line.configuration as { components?: Record<string, unknown>; componentNames?: Record<string, string> };
      const components = config.components || line.configuration as Record<string, unknown>;
      for (const [id, quantity] of Object.entries(components)) if (typeof quantity === 'number' && Number.isSafeInteger(quantity) && quantity > 0) add('COMPONENT', id, config.componentNames?.[id] || id, quantity * line.quantity);
    }
  }
  const returns = await tx.query.orderReturn.findMany({ where: eq(orderReturn.orderId, orderId) });
  for (const record of returns) {
    const parsed = z.array(returnItem).safeParse(record.items);
    if (!parsed.success) throw new CommerceError('An earlier return record needs review before processing more stock.');
    for (const item of parsed.data) { const target = targets.get(`${item.kind}:${item.id}`); if (target) target.remaining -= item.quantity; }
  }
  if ([...targets.values()].some(target => target.remaining < 0)) throw new CommerceError('Earlier returned quantities exceed the order. Reconcile this record first.');
  return [...targets.values()].filter(target => target.remaining > 0);
}
export async function recordInspectedReturn(input: unknown, actorId: string, database: CommerceDatabase = db) {
  const parsed = returnSchema.safeParse(input);
  if (!parsed.success) throw new CommerceError(parsed.error.issues[0]?.message || 'Enter the inspected quantities and condition.');
  const data = parsed.data;
  return database.transaction(async tx => {
    await requireFinance(tx);
    const [current] = await tx.select().from(order).where(eq(order.id, data.orderId)).for('update');
    if (!current || !['DELIVERED', 'COMPLETED'].includes(current.status)) throw new CommerceError('Record inspected returns for delivered orders. Unshipped cancellations use the cancellation workflow.');
    const attempt = await beginStockOperation(tx, data.operationId, data, actorId);
    if (attempt.previous) return { orderId: current.id, replayed: true };
    const targets = await targetsForOrder(tx, current.id); const totals = new Map<string, number>();
    for (const item of data.items) { const key = `${item.kind}:${item.id}`; const quantity = (totals.get(key) || 0) + item.quantity; const available = targets.find(target => `${target.kind}:${target.id}` === key); if (!available || quantity > available.remaining) throw new CommerceError('Returned quantities exceed the unprocessed items in this order.'); totals.set(key, quantity); }
    const restock = new Map<string, { kind: 'PRODUCT' | 'COMPONENT'; id: string; quantity: number }>();
    for (const item of data.items.filter(item => item.disposition === 'RESTOCK')) { const key = `${item.kind}:${item.id}`; restock.set(key, { ...item, quantity: (restock.get(key)?.quantity || 0) + item.quantity }); }
    const changes: StockChange[] = [];
    for (const item of [...restock.values()].sort((a, b) => (a.kind === b.kind ? a.id.localeCompare(b.id) : a.kind === 'PRODUCT' ? -1 : 1))) {
      const target = await readStockTarget(tx, item.kind, item.id, true); if (!target) throw new CommerceError('This historical stock item no longer exists. Retain it as damaged or ask for reconciliation.');
      await writeStockTarget(tx, item.kind, item.id, target.quantity + item.quantity);
      changes.push({ kind: item.kind, id: item.id, name: target.name, before: target.quantity, after: target.quantity + item.quantity, delta: item.quantity });
    }
    await finishStockOperation(tx, { id: data.operationId, type: 'INSPECTED_RETURN', actorId, reason: data.reason, requestHash: attempt.requestHash, subjectName: current.orderNumber, finalQuantity: 0, changes });
    await tx.insert(orderReturn).values({ id: data.operationId, orderId: current.id, actorId, reason: data.reason, items: data.items, requestHash: attempt.requestHash });
    await tx.insert(orderStatusHistory).values({ id: randomUUID(), orderId: current.id, status: current.status, actorId, note: `Inspected return: ${data.items.map(item => `${item.quantity} ${item.kind.toLowerCase()} (${item.disposition.toLowerCase()})`).join(', ')}. ${data.reason}` });
    return { orderId: current.id, replayed: false };
  });
}
export async function orderFinanceOverview(orderId: string, database: CommerceDatabase = db) {
  const current=await database.query.order.findFirst({where:eq(order.id,orderId)});
  const ledger=await financeSchemaReady(database)?await database.query.financeEntry.findMany({where:eq(financeEntry.orderId,orderId),orderBy:financeEntry.createdAt}):[];
  const entries=mergePaymentRows(current?.deliveryAddress,ledger);
  const metadata=new Map(((current?.deliveryAddress as OrderAddress)?.paymentRecords||[]).map(row=>[row.id,row]));
  return {entries:entries.map(row=>{const original=ledger.find(entry=>entry.id===row.id);const snapshot=metadata.get(row.id);return {id:row.id,type:row.type,channel:row.channel,amountCents:row.amountCents,reason:original?.reason||snapshot?.reason||'Received payment',reference:original?.reference||snapshot?.reference||null,at:original?.createdAt.toISOString()||snapshot?.at||''};}),...summarizeEntries(entries),returnTargets:await targetsForOrder(database,orderId)};
}
export async function financeSummary(database: CommerceDatabase = db,range?:{from:string;to:string}) {
  const ready=await financeSchemaReady(database);const ledger=ready?await database.select().from(financeEntry):[];const orders=await database.select().from(order);
  const entries=orders.flatMap(row=>mergePaymentRows(row.deliveryAddress,ledger.filter(entry=>entry.orderId===row.id)));
  const dates=new Map(ledger.map(row=>[row.id,row.createdAt]));for(const row of orders)for(const entry of (row.deliveryAddress as OrderAddress)?.paymentRecords||[])if(!dates.has(entry.id))dates.set(entry.id,new Date(entry.at));
  const inRange=(date:Date)=>{if(!Number.isFinite(date.getTime()))return !range?.from&&!range?.to;const day=businessDay(date);return (!range?.from||day>=range.from)&&(!range?.to||day<=range.to);};
  const selected=entries.filter(row=>!range||Boolean(dates.get(row.id)&&inRange(dates.get(row.id)!)));
  const expenses=await database.select({amount:expense.amount,date:expense.date}).from(expense);const expensesCents=expenses.filter(row=>inRange(row.date)).reduce((sum,row)=>sum+Math.round(row.amount*100),0);
  const totals=summarizeEntries(selected);const allTotals=summarizeEntries(entries);
  const legacy=orders.filter(row=>inRange(row.createdAt)&&paymentState(row,ledger.filter(entry=>entry.orderId===row.id)).legacyPaid).reduce((sum,row)=>sum+row.total*100,0);
  const unrecordedCompletedCount=orders.filter(row=>inRange(row.createdAt)&&['DELIVERED','COMPLETED'].includes(row.status)&&!paymentState(row,ledger.filter(entry=>entry.orderId===row.id)).collected&&row.paymentStatus!=='PAID').length;
  return {ready,...totals,carrierOutstanding:allTotals.carrierOutstanding,expensesCents,cashPosition:totals.ownerCashIn-expensesCents,unclassifiedLegacyCents:legacy,allTimeCarrierOutstanding:allTotals.carrierOutstanding,unrecordedCompletedCount};
}
