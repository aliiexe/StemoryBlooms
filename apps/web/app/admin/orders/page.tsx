import { assertAdmin } from '@/lib/user-sync';
import { db, order, orderItem, customer, eq, and, sql, inArray, desc } from '@stemory/database';
import Link from 'next/link';
import styles from '../dashboard.module.css';
import { OrderActions } from './OrderActions';
import OrdersFilters from './OrdersFilters';
import { ORDER_STATUS_LABELS } from '@/lib/commerce/order-status';
import type { OrderAddress } from '@/lib/commerce/receipt-access';

type Filters = { search?: string; status?: string; from?: string; to?: string; page?: string; archived?: string };
export default async function AdminOrdersPage({ searchParams }: { searchParams: Promise<Filters> }) {
  await assertAdmin();
  const values = await searchParams;
  const search = (typeof values.search === 'string' ? values.search : '').trim().slice(0,150);
  const status = typeof values.status === 'string' && Object.hasOwn(ORDER_STATUS_LABELS, values.status) ? values.status : '';
  const dateValue = (value?: string) => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(value)) ? value : '';
  const from = dateValue(values.from); const to = dateValue(values.to);
  const archived = values.archived === '1';
  const conditions = [archived ? sql`${order.deliveryAddress}->>'archivedAt' IS NOT NULL` : sql`${order.deliveryAddress}->>'archivedAt' IS NULL`];
  if (status) conditions.push(eq(order.status, status));
  if (search) {
    const pattern = `%${search}%`;
    conditions.push(sql`(${order.orderNumber} ILIKE ${pattern} OR ${customer.firstName} ILIKE ${pattern} OR ${customer.lastName} ILIKE ${pattern} OR ${customer.phone} ILIKE ${pattern} OR ${customer.email} ILIKE ${pattern} OR ${order.deliveryAddress}->'customerSnapshot'->>'firstName' ILIKE ${pattern} OR ${order.deliveryAddress}->'customerSnapshot'->>'phone' ILIKE ${pattern})`);
  }
  if (from) conditions.push(sql`${order.createdAt} >= (${from}::date::timestamp AT TIME ZONE 'Africa/Casablanca')`);
  if (to) conditions.push(sql`${order.createdAt} < ((${to}::date + 1)::timestamp AT TIME ZONE 'Africa/Casablanca')`);
  const where = and(...conditions);
  const [totals] = await db.select({ count: sql<number>`count(*)::int` }).from(order).leftJoin(customer, eq(order.customerId, customer.id)).where(where);
  const pages = Math.max(1, Math.ceil(totals.count / 20));
  const page = Math.max(1, Math.min(pages, Number.parseInt(values.page || '1') || 1));
  const rows = await db.select({ record: order, buyer: customer }).from(order).leftJoin(customer, eq(order.customerId, customer.id)).where(where).orderBy(desc(order.createdAt), order.id).limit(20).offset((page-1)*20);
  const items = rows.length ? await db.select().from(orderItem).where(inArray(orderItem.orderId, rows.map(row => row.record.id))) : [];
  const url = (updates: Record<string,string>) => { const params = new URLSearchParams({ search, status, from, to, ...(archived ? { archived: '1' } : {}), ...updates }); return `/admin/orders?${params}`; };
  return <div className={styles.dashboard}>
    <header className={styles.pageHeader}><div><h1 className={styles.pageTitle}>{archived ? 'Archived orders' : 'Orders'}</h1><p>Find orders, review payment, and manage the next fulfillment step.</p></div><Link href="/admin/orders/new" className={styles.submitBtn} style={{ width: 'auto', textDecoration: 'none', margin: 0 }}>Create order</Link></header>
    <OrdersFilters key={`${search}:${status}:${from}:${to}:${archived}`} search={search} status={status} from={from} to={to} archived={archived} />
    <p>{totals.count} matching orders · <Link href={archived ? '/admin/orders' : url({ archived: '1', page: '1' })}>{archived ? 'Show active orders' : 'Show archived orders'}</Link></p>
    <div className={styles.card}><div className={styles.tableScroller} role="region" aria-label="Order results" tabIndex={0}><table className={styles.table}><thead><tr><th>Order</th><th>Customer</th><th>Amount to collect</th><th>Payment</th><th>Items</th><th>Placed</th><th>Status and actions</th></tr></thead><tbody>
      {rows.map(({ record, buyer }) => { const address = record.deliveryAddress as OrderAddress; const contact = address.customerSnapshot || buyer; const lines = items.filter(item => item.orderId === record.id);
        return <tr key={record.id}><td><Link href={`/admin/orders/${record.id}`}>{record.orderNumber}</Link><div>{record.source}</div></td><td>{contact?.firstName} {contact?.lastName}<div>{contact?.phone}</div></td><td>{record.total} MAD<div style={{ fontSize: '0.8rem' }}>Includes {record.deliveryFee} MAD delivery</div></td><td>{record.paymentStatus === 'PAID' ? 'Collected' : 'Awaiting collection'}</td><td>{lines.slice(0,2).map(item => <div key={item.id}>{item.quantity} × {item.productName}</div>)}{lines.length > 2 && <div>+{lines.length-2} more</div>}</td><td>{new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeZone: 'Africa/Casablanca' }).format(record.createdAt)}</td><td>{archived ? ORDER_STATUS_LABELS[record.status] || record.status : <OrderActions orderId={record.id} currentStatus={record.status} sentToInfinidis={record.sentToInfinidis} />}</td></tr>;
      })}
      {!rows.length && <tr><td colSpan={7}>No orders match these filters. <Link href="/admin/orders">Clear filters</Link></td></tr>}
    </tbody></table></div></div>
    <nav aria-label="Order results pages" style={{ display: 'flex', gap: 16, justifyContent: 'space-between', marginTop: 20 }}>
      {page > 1 ? <Link href={url({ page: String(page-1) })}>← Previous</Link> : <span />}<span>Page {page} of {pages}</span>{page < pages ? <Link href={url({ page: String(page+1) })}>Next →</Link> : <span />}
    </nav>
  </div>;
}
