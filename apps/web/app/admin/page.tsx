import Link from 'next/link';
import { Plus, MapPin, ShoppingBag, Wallet } from 'lucide-react';
import { assertAdmin } from '@/lib/user-sync';
import { db, order, and, sql, desc, inArray } from '@stemory/database';
import { businessDay } from '@/lib/commerce/reporting';
import { paymentRowsForOrders } from '@/lib/commerce/payments';
import { paymentState, formatPaymentMoney, fulfillmentLabels } from '@/lib/commerce/payment-state';
import type { OrderAddress } from '@/lib/commerce/receipt-access';
import { ORDER_STATUS_LABELS } from '@/lib/commerce/order-status';
import styles from './workspace.module.css';
export default async function AdminDashboardPage() {
  await assertAdmin();
  const visible = sql`${order.deliveryAddress}->>'archivedAt' IS NULL`;
  const [counts, recent, open, today] = await Promise.all([
    db.select({ status: order.status, count: sql<number>`count(*)::int` }).from(order).where(visible).groupBy(order.status),
    db.query.order.findMany({ where: visible, orderBy: [desc(order.createdAt)], limit: 6, with: { customer: true } }),
    db.select().from(order).where(and(visible, inArray(order.status, ['NEW', 'CONFIRMED', 'IN_PRODUCTION', 'PROCESSING', 'READY', 'SHIPPED']))),
    db.select({ count: sql<number>`count(*)::int`, amount: sql<number>`coalesce(sum(${order.total}),0)::int` }).from(order).where(and(visible, sql`(${order.createdAt} AT TIME ZONE 'UTC' AT TIME ZONE 'Africa/Casablanca')::date = ${businessDay(new Date())}::date`, sql`${order.status}<>'CANCELLED'`)),
  ]);
  const paymentRows = await paymentRowsForOrders([...recent, ...open.filter(value => !recent.some(row => row.id === value.id))]);
  const count = (...statuses: string[]) => counts.filter(row => statuses.includes(row.status)).reduce((sum, row) => sum + row.count, 0);
  const outstanding = open.reduce((sum, row) => sum + paymentState(row, paymentRows.get(row.id)).remaining, 0);
  const tasks = [{ label: 'To confirm', count: count('NEW'), href: '/admin/orders?status=NEW', hint: 'Review incoming orders' }, { label: 'To prepare', count: count('CONFIRMED', 'IN_PRODUCTION', 'PROCESSING'), href: '/admin/orders?view=OPEN', hint: 'Your current production queue' }, { label: 'Ready to leave', count: count('READY'), href: '/admin/deliveries?status=READY', hint: 'Delivery and customer pickups' }, { label: 'With the carrier', count: count('SHIPPED'), href: '/admin/deliveries?status=SHIPPED', hint: 'Follow up on delivery' }];
  return <div className={styles.page}><header className={styles.header}><div><h1>Overview</h1><p>A clear view of your day, and a place for everything.</p></div><Link href="/admin/orders/new" className={styles.primary}><Plus size={18} />Create order</Link></header>
    <div className={styles.cards}><div className={styles.stat}><span>Orders today</span><strong>{today[0].count}</strong><small>Africa/Casablanca · {new Date().toLocaleDateString('en-GB', { timeZone: 'Africa/Casablanca', dateStyle: 'medium' })}</small></div><div className={styles.stat}><span>Order value today</span><strong>{formatPaymentMoney(today[0].amount * 100)}</strong><small>Order value, separate from money received</small></div><Link href="/admin/orders?view=OPEN" className={styles.stat}><span>Unpaid on open orders</span><strong>{formatPaymentMoney(outstanding)}</strong><small>Based on recorded payments</small></Link></div>
    <section aria-label="Order workflow"><div className={styles.sectionTitle}><h2>What needs doing</h2><Link href="/admin/orders?view=OPEN">Open orders</Link></div><div className={styles.taskGrid}>{tasks.map(task => <Link key={task.label} href={task.href} className={styles.task}><span>{task.label}</span><strong>{task.count}</strong><small>{task.hint}</small></Link>)}</div></section>
    <section className={`${styles.panel} ${styles.tablePanel}`}><div className={styles.sectionTitle}><h2>Recent orders</h2><Link href="/admin/orders?view=ALL">View all orders</Link></div><div className={styles.tableWrap}><table className={styles.table}><thead><tr><th>Order / customer</th><th>Fulfillment</th><th>Payment</th><th style={{textAlign:'right'}}>Still due</th></tr></thead><tbody>{recent.map(row => { const address = row.deliveryAddress as OrderAddress; const buyer = address.customerSnapshot || row.customer; const payment = paymentState(row, paymentRows.get(row.id)); return <tr key={row.id}><td><Link title={row.orderNumber} href={`/admin/orders/${row.id}`}>{row.orderNumber.length>18?`${row.orderNumber.slice(0,10)}…${row.orderNumber.slice(-4)}`:row.orderNumber}</Link><small>{buyer?.firstName} {buyer?.lastName}</small></td><td><span className={styles.status}>{ORDER_STATUS_LABELS[row.status] || row.status}</span><small>{fulfillmentLabels[payment.fulfillment]}</small></td><td><span className={styles.status} data-tone={payment.remaining===0?'paid':'unpaid'}>{payment.label}</span><small>{payment.methods.map(method => method.toLowerCase().replaceAll('_', ' ')).join(' + ')}</small></td><td style={{textAlign:'right'}}>{formatPaymentMoney(payment.remaining)}</td></tr>; })}{!recent.length && <tr><td colSpan={4} className={styles.empty}><strong>Your next order starts here</strong>Create an order for an Instagram, phone, or in-person customer.</td></tr>}</tbody></table></div></section>
    <div className={styles.actions}><Link href="/admin/deliveries/zones" className={styles.secondary}><MapPin size={17} />Look up delivery prices</Link><Link href="/admin/finances" className={styles.secondary}><Wallet size={17} />Money & expenses</Link><Link href="/admin/custom-orders" className={styles.secondary}><ShoppingBag size={17} />Continue a saved draft</Link></div>
    <p className={styles.subtle}>Your history is still available. Material purchases and stock tracking are optional tools, not prerequisites for taking orders.</p>
  </div>;
}
