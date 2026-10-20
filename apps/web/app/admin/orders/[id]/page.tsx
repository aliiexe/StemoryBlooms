import { assertAdmin } from '@/lib/user-sync';
import { db, eq, inArray, order, product, builderComponent } from '@stemory/database';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import styles from '../../dashboard.module.css';
import { OrderActions } from '../OrderActions';
import DeleteOrderButton from './DeleteOrderButton';
import PaymentActions from './PaymentActions';
import type { OrderAddress } from '@/lib/commerce/receipt-access';
import { ORDER_STATUS_LABELS } from '@/lib/commerce/order-status';

export default async function OrderDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  await assertAdmin();
  const { id } = await params;
  const current = await db.query.order.findFirst({ where: eq(order.id, id), with: { customer: true, orderItems: true, orderStatusHistories: true, paymentStatusHistories: true } });
  if (!current) notFound();
  const address = current.deliveryAddress as OrderAddress;
  const buyer = address.customerSnapshot || current.customer;
  const productIds = current.orderItems.flatMap(item => item.productId ? [item.productId] : []);
  const products = productIds.length ? await db.select({ id: product.id, images: product.images }).from(product).where(inArray(product.id, productIds)) : [];
  const components = await db.select({ id: builderComponent.id, name: builderComponent.name }).from(builderComponent);
  const money = (amount: number) => `${amount.toLocaleString('en-MA', { maximumFractionDigits: 2 })} MAD`;
  const date = (value: Date) => new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Africa/Casablanca' }).format(value);
  return <div className={styles.dashboard}>
    <header className={styles.pageHeader}><div><Link href="/admin/orders">← Back to orders</Link><h1 className={styles.pageTitle}>Order {current.orderNumber}</h1><p>{date(current.createdAt)} · {current.source}{address.archivedAt ? ' · Archived' : ''}</p></div>
      {!address.archivedAt && <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}><OrderActions orderId={id} currentStatus={current.status} sentToInfinidis={current.sentToInfinidis} /><DeleteOrderButton orderId={id} /></div>}
    </header>
    <div className={styles.orderDetailGrid}>
      <div style={{ display: 'grid', gap: 24 }}>
        <section className={styles.card} style={{ padding: '1.25rem' }}><h2>Order items</h2>
          {current.orderItems.map(item => {
            const config = item.configuration as { components?: Record<string, number>; componentNames?: Record<string, string>; cardMessage?: string } | null;
            const image = products.find(value => value.id === item.productId)?.images?.[0];
            return <article key={item.id} style={{ padding: '1rem 0', borderBottom: '1px solid #EAE6DF' }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'start' }}>{image && <img src={image} alt="" width={56} height={56} style={{ objectFit: 'cover', borderRadius: 8 }} />}<div style={{ minWidth: 0 }}><strong>{item.productName}</strong><p>{item.quantity} × {money(item.unitPrice)} = {money(item.totalPrice)}</p></div></div>
              {config?.components && <ul>{Object.entries(config.components).map(([componentId, quantity]) => <li key={componentId}>{quantity} × {config.componentNames?.[componentId] || components.find(value => value.id === componentId)?.name || 'Archived component'}</li>)}</ul>}
              {config?.cardMessage && <p><strong>Card message:</strong> {config.cardMessage}</p>}
            </article>;
          })}
          <dl style={{ marginTop: 24 }}><div className={styles.summaryLine}><dt>Merchandise subtotal</dt><dd>{money(current.subtotal)}</dd></div>
            <div className={styles.summaryLine}><dt>Discounts and gift credit</dt><dd>−{money(current.discount)}</dd></div>
            <div className={styles.summaryLine}><dt>Delivery fee</dt><dd>{money(current.deliveryFee)}</dd></div>
            <div className={styles.summaryLine}><dt><strong>Order total</strong></dt><dd><strong>{money(current.total)}</strong></dd></div></dl>
        </section>
        <section className={styles.card} style={{ padding: '1.25rem' }}><h2>Order history</h2>
          {current.orderStatusHistories.length ? <ol>{current.orderStatusHistories.sort((a,b) => a.createdAt.getTime() - b.createdAt.getTime()).map(event => <li key={event.id}><strong>{ORDER_STATUS_LABELS[event.status] || event.status}</strong> — {date(event.createdAt)}{event.note && <p>{event.note}</p>}</li>)}</ol> : <p>No status events were recorded for this older order.</p>}
          {current.paymentStatusHistories.length > 0 && <><h3>Payment events</h3><ul>{current.paymentStatusHistories.map(event => <li key={event.id}>{event.status} — {date(event.createdAt)}</li>)}</ul></>}
        </section>
      </div>
      <div style={{ display: 'grid', gap: 24 }}>
        <section className={styles.card} style={{ padding: '1.25rem', overflowWrap: 'anywhere' }}><h2>Customer</h2><strong>{buyer.firstName} {buyer.lastName}</strong><p><a href={`tel:${buyer.phone}`}>{buyer.phone}</a></p>{buyer.email && <a href={`mailto:${buyer.email}`}>{buyer.email}</a>}</section>
        <section className={styles.card} style={{ padding: '1.25rem', overflowWrap: 'anywhere' }}><h2>Delivery</h2>{address.recipientSnapshot && <><h3>Recipient</h3><p>{address.recipientSnapshot.name}</p><p><a href={`tel:${address.recipientSnapshot.phone}`}>{address.recipientSnapshot.phone}</a></p></>}<p>{address.addressLine1}</p><p>{address.city}</p>{address.deliveryEstimate && <p>{address.deliveryEstimate}</p>}{current.notes && <><h3>Notes</h3><p style={{ whiteSpace: 'pre-wrap' }}>{current.notes}</p></>}</section>
        {address.manualDiscountReason && <section className={styles.card} style={{ padding: '1.25rem' }}><h2>Manual discount</h2><p>{money(address.manualDiscount || 0)} — {address.manualDiscountReason}</p></section>}
        <section className={styles.card} style={{ padding: '1.25rem' }}><h2>Payment</h2><p>{current.paymentStatus === 'PAID' ? 'Cash collection recorded' : 'Awaiting cash collection'}</p><p>Cash on delivery · {money(current.total)}</p>{!address.archivedAt && <PaymentActions orderId={id} paid={current.paymentStatus === 'PAID'} delivered={['DELIVERED', 'COMPLETED'].includes(current.status)} />}</section>
        <Link href={`/receipt/${encodeURIComponent(current.orderNumber)}`}>View private receipt</Link>
      </div>
    </div>
  </div>;
}
