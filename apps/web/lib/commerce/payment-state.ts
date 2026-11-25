import type { OrderAddress } from './receipt-access';

export type PaymentRecord = NonNullable<OrderAddress['paymentRecords']>[number];
export type PaymentRow = { id: string; type: string; channel: string; amountCents: number; method?: PaymentRecord['method']; allocation?: PaymentRecord['allocation'] };
export type PaymentOrder = { total: number; deliveryFee: number; paymentStatus: string; deliveryAddress: unknown };
export const formatPaymentMoney = (cents: number) => `${new Intl.NumberFormat('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(cents / 100)} MAD`;
export function fulfillmentMethod(address: unknown) {
  const value = address as OrderAddress | null;
  return value?.fulfillmentMethod || (value?.addressLine1 === 'Hand delivered' ? 'HAND_DELIVERY' : 'DELIVERY');
}
export const fulfillmentLabels = { DELIVERY: 'Courier delivery', PICKUP: 'Customer pickup', HAND_DELIVERY: 'Local hand delivery' } as const;
export function mergePaymentRows(address: unknown, rows: PaymentRow[] = []): PaymentRow[] {
  const records = (address as OrderAddress | null)?.paymentRecords || [];
  const metadata = new Map(records.map(record => [record.id, record]));
  const result = rows.map(row => ({ ...row, method: metadata.get(row.id)?.method || row.method, allocation: metadata.get(row.id)?.allocation || row.allocation }));
  const ids = new Set(rows.map(row => row.id));
  for (const record of records) if (!ids.has(record.id)) result.push({ ...record, type: 'COLLECTION' });
  return result;
}
export function paymentState(current: PaymentOrder, rows: PaymentRow[] = []) {
  const all = mergePaymentRows(current.deliveryAddress, rows);
  const total = current.total * 100;
  const delivery = current.deliveryFee * 100;
  const items = total - delivery;
  let itemsPaid = 0; let deliveryPaid = 0;
  const collections = all.filter(row => row.type === 'COLLECTION');
  for (const row of collections) {
    if (row.allocation === 'DELIVERY') deliveryPaid += row.amountCents;
    else if (row.allocation === 'ITEMS') itemsPaid += row.amountCents;
    else {
      const forItems = Math.min(row.amountCents, Math.max(0, items - itemsPaid));
      itemsPaid += forItems; deliveryPaid += row.amountCents - forItems;
    }
  }
  const refunded = all.filter(row => row.type === 'CASH_REFUND').reduce((sum, row) => sum + row.amountCents, 0);
  const collected = collections.reduce((sum, row) => sum + row.amountCents, 0);
  const legacyPaid = current.paymentStatus === 'PAID' && !collections.length;
  const remaining = legacyPaid ? 0 : Math.max(0, total - collected + refunded);
  const deliveryRefund = Math.min(deliveryPaid, refunded);
  deliveryPaid -= deliveryRefund; itemsPaid -= Math.min(itemsPaid, refunded - deliveryRefund);
  return { total, items, delivery, collected, refunded, remaining, legacyPaid,
    itemsRemaining: legacyPaid ? 0 : Math.max(0, items - itemsPaid),
    deliveryRemaining: legacyPaid ? 0 : Math.max(0, delivery - deliveryPaid),
    label: legacyPaid ? 'Paid · earlier record' : refunded ? (refunded >= collected ? 'Refunded' : 'Partially refunded') : remaining === 0 ? 'Paid in full' : collected > 0 ? 'Partially paid' : 'No payment recorded',
    methods: [...new Set(collections.map(row => row.method || 'CASH'))],
    fulfillment: fulfillmentMethod(current.deliveryAddress) };
}
