import ContextLink from '@/components/navigation/ContextLink';
import { assertAdmin } from '@/lib/user-sync';
import { db, order, orderItem, customer, eq, and, sql, inArray, desc } from '@stemory/database';
import Link from 'next/link';
import styles from '../dashboard.module.css';
import { Plus, ArrowUpRight, ShoppingBag } from 'lucide-react';
import OrdersFilters from './OrdersFilters';
import { ORDER_STATUS_LABELS } from '@/lib/commerce/order-status';
import type { OrderAddress } from '@/lib/commerce/receipt-access';
import { paymentRowsForOrders } from '@/lib/commerce/payments';
import { paymentState, fulfillmentLabels, formatPaymentMoney } from '@/lib/commerce/payment-state';
import workspace from '../workspace.module.css';

type Filters = { search?: string; status?: string; from?: string; to?: string; page?: string; archived?: string; view?: string };
export default async function AdminOrdersPage({ searchParams }: { searchParams: Promise<Filters> }) {
  await assertAdmin();
  const values = await searchParams;
  const search = (typeof values.search === 'string' ? values.search : '').trim().slice(0,150);
  const status = typeof values.status === 'string' && Object.hasOwn(ORDER_STATUS_LABELS, values.status) ? values.status : '';
  const dateValue = (value?: string) => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(value)) ? value : '';
  const from = dateValue(values.from); const to = dateValue(values.to);
  const archived = values.archived === '1';
  const view = ['ALL','DONE'].includes(values.view || '') ? values.view! : 'OPEN';
  const conditions = [archived ? sql`${order.deliveryAddress}->>'archivedAt' IS NOT NULL` : sql`${order.deliveryAddress}->>'archivedAt' IS NULL`];
  if (status) conditions.push(eq(order.status, status));
  else if (!archived && view === 'OPEN') conditions.push(inArray(order.status, ['NEW','CONFIRMED','IN_PRODUCTION','PROCESSING','READY','SHIPPED']));
  else if (!archived && view === 'DONE') conditions.push(inArray(order.status, ['DELIVERED','COMPLETED','CANCELLED']));
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
  const payments = await paymentRowsForOrders(rows.map(row => row.record));
  const items = rows.length ? await db.select().from(orderItem).where(inArray(orderItem.orderId, rows.map(row => row.record.id))) : [];
  const url = (updates: Record<string,string>) => { const params = new URLSearchParams({ search, status, from, to, view, ...(archived ? { archived: '1' } : {}), ...updates }); return `/admin/orders?${params}`; };
  return <div className={styles.dashboard}>
    <header className={styles.pageHeader}><div><h1 className={styles.pageTitle}>{archived?'Archived orders':'Orders'}</h1><p>Your customers, their bouquets, and the next thing to do.</p></div><ContextLink href="/admin/orders/new" className={workspace.primary}><Plus size={16}/>Create order</ContextLink></header>
    <nav className={workspace.tabs} aria-label="Order views">{[{value:'OPEN',label:'Open orders'},{value:'DONE',label:'Completed & cancelled'},{value:'ALL',label:'All history'}].map(tab=><Link key={tab.value} className={workspace.tab} aria-current={view===tab.value?'page':undefined} href={`/admin/orders?view=${tab.value}${archived?'&archived=1':''}`}>{tab.label}</Link>)}</nav>
    <OrdersFilters key={`${search}:${status}:${from}:${to}:${archived}:${view}`} search={search} status={status} from={from} to={to} archived={archived} view={view}/>
    <section className={workspace.tableSurface} aria-label="Orders"><div className={workspace.tableToolbar}><strong>{archived?'Archived orders':view==='OPEN'?'Orders to work on':view==='DONE'?'Completed & cancelled':'Order history'}</strong><span>{totals.count} {totals.count===1?'order':'orders'}</span></div>
    {rows.length?<div className={workspace.tableWrap} role="region" aria-label="Order results" tabIndex={0}><table className={`${workspace.table} ${workspace.ordersTable}`}><thead><tr><th>Order / customer</th><th className={workspace.optionalColumn}>Bouquet</th><th>Fulfillment</th><th>Payment</th><th style={{textAlign:'right'}}> </th></tr></thead><tbody>
      {rows.map(({record,buyer})=>{const address=record.deliveryAddress as OrderAddress;const contact=address.customerSnapshot||buyer;const lines=items.filter(item=>item.orderId===record.id);const payment=paymentState(record,payments.get(record.id));const short=record.orderNumber.length>18?`${record.orderNumber.slice(0,10)}…${record.orderNumber.slice(-4)}`:record.orderNumber;return <tr key={record.id}>
      <td><ContextLink className={workspace.rowTitle} href={`/admin/orders/${record.id}`}>{contact?.firstName} {contact?.lastName || ''}</ContextLink><span className={workspace.rowMeta} title={record.orderNumber}>{short} · {new Intl.DateTimeFormat('en-GB',{day:'numeric',month:'short',timeZone:'Africa/Casablanca'}).format(record.createdAt)}</span></td>
      <td className={workspace.optionalColumn}><span className={workspace.rowTitle} title={lines[0]?.productName}>{lines[0]?`${lines[0].quantity} × ${lines[0].productName}`:'Custom order'}</span><span className={workspace.rowMeta}>{lines.length>1?`+${lines.length-1} more · `:''}{record.source.toLowerCase().replaceAll('_',' ')}</span></td>
      <td><span className={workspace.status}>{payment.fulfillment==='PICKUP'&&record.status==='DELIVERED'?'Picked up':ORDER_STATUS_LABELS[record.status]||record.status}</span><span className={workspace.rowMeta}>{fulfillmentLabels[payment.fulfillment]}</span></td>
      <td><span className={workspace.money}>{formatPaymentMoney(payment.remaining)}{payment.remaining>0&&(payment.collected>0||!['DELIVERED','COMPLETED'].includes(record.status))?' due':''}</span><span className={workspace.rowMeta}>{payment.remaining===0?payment.label:`${payment.label} · ${formatPaymentMoney(record.total*100)} total`}</span></td>
      <td style={{textAlign:'right'}}><ContextLink className={workspace.rowAction} href={`/admin/orders/${record.id}`} aria-label={`Open order ${record.orderNumber}`}>Open<ArrowUpRight size={14}/></ContextLink></td></tr>;})}
    </tbody></table></div>:<div className={workspace.emptyState}><ShoppingBag size={32} strokeWidth={1.25}/><h2>{search||status||from||to?'No matching orders':view==='OPEN'?'You’re all caught up':'No orders in this view'}</h2><p>{search||status||from||to?'Try another search or clear the filters.':'New orders will appear here. Your completed orders are always available in All history.'}</p><Link className={workspace.secondary} href={search||status||from||to?`/admin/orders?view=${view}`:'/admin/orders?view=ALL'}>{search||status||from||to?'Clear filters':'View order history'}</Link></div>}
    <nav aria-label="Order results pages" className={workspace.pagination}><Link href={archived?'/admin/orders':url({archived:'1',page:'1'})}>{archived?'Back to orders':'Archived orders'}</Link><div className={workspace.actions}>{page>1&&<Link href={url({page:String(page-1)})}>Previous</Link>}<span>{page} / {pages}</span>{page<pages&&<Link href={url({page:String(page+1)})}>Next</Link>}</div></nav></section>
  </div>;
}
