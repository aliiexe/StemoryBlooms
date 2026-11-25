import { assertAdmin } from '@/lib/user-sync';
import { db, eq, inArray, order, product, builderComponent } from '@stemory/database';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import styles from '../../dashboard.module.css';
import { OrderActions } from '../OrderActions';
import DeleteOrderButton from './DeleteOrderButton';
import { financeSchemaReady, orderFinanceOverview } from '@/lib/commerce/finance';
import OrderFinancePanel from './OrderFinancePanel';
import ReceivedPaymentPanel from './ReceivedPaymentPanel';
import { paymentRowsForOrders } from '@/lib/commerce/payments';
import { paymentState, fulfillmentLabels } from '@/lib/commerce/payment-state';
import type { OrderAddress } from '@/lib/commerce/receipt-access';
import detail from '../order-detail.module.css';
import {ArrowLeft,ArrowUpRight,Clock} from 'lucide-react';
import {formatPaymentMoney} from '@/lib/commerce/payment-state';
import { ORDER_STATUS_LABELS } from '@/lib/commerce/order-status';

export default async function OrderDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  await assertAdmin();
  const { id } = await params;
  const current = await db.query.order.findFirst({ where: eq(order.id, id), with: { customer: true, orderItems: true, orderStatusHistories: true, paymentStatusHistories: true } });
  if (!current) notFound();
  const address = current.deliveryAddress as OrderAddress;
  const buyer = address.customerSnapshot || current.customer;
  const payment = paymentState(current, (await paymentRowsForOrders([current])).get(id));
  const productIds = current.orderItems.flatMap(item => item.productId ? [item.productId] : []);
  const financeReady = await financeSchemaReady();
  const finance = financeReady ? await orderFinanceOverview(id) : null;
  const products = productIds.length ? await db.select({ id: product.id, images: product.images }).from(product).where(inArray(product.id, productIds)) : [];
  const components = await db.select({ id: builderComponent.id, name: builderComponent.name }).from(builderComponent);
  const money = (amount:number)=>formatPaymentMoney(amount*100);
  const shortReference=current.orderNumber.length>18?`${current.orderNumber.slice(0,10)}…${current.orderNumber.slice(-4)}`:current.orderNumber;
  const pickupMismatch=payment.fulfillment==='DELIVERY'&&/\bpick[ -]?up\b|retrait/i.test(address.addressLine1||'');
  const date = (value: Date) => new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Africa/Casablanca' }).format(value);
  return <div className={styles.dashboard}>
    <header className={styles.pageHeader}><div><Link href="/admin/orders" className={detail.back}><ArrowLeft size={14}/>Orders</Link><h1 className={styles.pageTitle}>Order {shortReference}</h1><div className={detail.headerMeta}><span>{date(current.createdAt)}</span><span>· {current.source.toLowerCase().replaceAll('_',' ')}</span>{address.archivedAt&&<span>Archived</span>}</div>{shortReference!==current.orderNumber&&<p className={detail.reference}>{current.orderNumber}</p>}</div>
      {!address.archivedAt&&<div style={{display:'flex',flexWrap:'wrap',gap:12}}><OrderActions orderId={id} currentStatus={current.status} sentToInfinidis={current.sentToInfinidis} pickup={payment.fulfillment==='PICKUP'}/><DeleteOrderButton orderId={id}/></div>}
    </header>
    <div className={styles.orderDetailGrid}><div className={detail.sections}>
    <section className={detail.section}><h2>Order items</h2>{current.orderItems.map(item=>{const config=item.configuration as {components?:Record<string,number>;componentNames?:Record<string,string>;cardMessage?:string}|null;const image=products.find(value=>value.id===item.productId)?.images?.[0];return <article key={item.id} className={detail.item}><img src={image||'/hero-bouquet.png'} alt=""/><div><strong className={detail.itemName}>{item.productName}</strong><p className={detail.itemMeta}>{item.quantity} × {money(item.unitPrice)}</p>{config?.components&&<ul className={detail.ingredients}>{Object.entries(config.components).map(([componentId,quantity])=><li key={componentId}>{quantity} × {config.componentNames?.[componentId]||components.find(value=>value.id===componentId)?.name||'Archived component'}</li>)}</ul>}{config?.cardMessage&&<p className={detail.itemMeta}><strong>Card message:</strong> {config.cardMessage}</p>}</div><span className={detail.itemPrice}>{money(item.totalPrice)}</span></article>;})}
    <dl className={detail.totals}><div><dt>Items subtotal</dt><dd>{money(current.subtotal)}</dd></div>{current.discount>0&&<div><dt>Discounts & gift credit</dt><dd>−{money(current.discount)}</dd></div>}<div><dt>{payment.fulfillment==='PICKUP'?'Pickup':'Delivery'}</dt><dd>{money(current.deliveryFee)}</dd></div><div className={detail.grand}><dt>Order total</dt><dd>{money(current.total)}</dd></div></dl></section>
    {current.notes&&<section className={detail.section}><h2>Order note</h2><p className={detail.itemMeta} style={{whiteSpace:'pre-wrap'}}>{current.notes}</p></section>}
    {address.manualDiscountReason&&<section className={detail.section}><h2>Agreed discount</h2><p className={detail.itemMeta}>{money(address.manualDiscount||0)} · {address.manualDiscountReason}</p></section>}
    <details className={`${detail.section} ${detail.historyDetails}`}><summary className={detail.historyHeading}><Clock size={16}/>Order activity ({current.orderStatusHistories.length})</summary>{current.orderStatusHistories.length?<ol className={detail.history}>{current.orderStatusHistories.sort((a,b)=>b.createdAt.getTime()-a.createdAt.getTime()).map(event=><li key={event.id}><strong>{ORDER_STATUS_LABELS[event.status]||event.status}</strong><time>{date(event.createdAt)}</time>{event.note&&!/^[A-Z_]+\s*→\s*[A-Z_]+$/.test(event.note)&&<p>{event.note}</p>}</li>)}</ol>:<p className={detail.itemMeta}>No activity was recorded for this earlier order.</p>}{current.paymentStatusHistories.length>0&&<details style={{marginTop:20}}><summary className={detail.itemMeta}>Earlier payment status changes</summary><ul>{current.paymentStatusHistories.map(event=><li key={event.id} className={detail.itemMeta}>{event.status.toLowerCase().replaceAll('_',' ')} · {date(event.createdAt)}</li>)}</ul></details>}</details>
    </div><aside className={detail.sections}>
    <ReceivedPaymentPanel orderId={id} status={address.archivedAt?'CANCELLED':current.status} value={payment} entries={(address.paymentRecords||[]).map(({id,amountCents,method,allocation,reference,at})=>({id,amountCents,method,allocation,reference,at}))} carrierReview={Boolean(address.carrierBalanceReviewRequired)}/>
    <section className={detail.section}><h2>Customer & fulfillment</h2><div className={detail.contact}><strong>{buyer.firstName} {buyer.lastName}</strong><a href={`tel:${buyer.phone}`}>{buyer.phone}</a>{buyer.email&&<a href={`mailto:${buyer.email}`}>{buyer.email}</a>}</div><div className={detail.delivery}><h3>{fulfillmentLabels[payment.fulfillment]}</h3><div className={detail.contact}>{address.recipientSnapshot&&<><strong>{address.recipientSnapshot.name}</strong><a href={`tel:${address.recipientSnapshot.phone}`}>{address.recipientSnapshot.phone}</a></>}{payment.fulfillment==='PICKUP'?<p>Customer collection · no courier needed</p>:<><p>{address.addressLine1}</p><p>{address.city}</p>{address.deliveryEstimate&&<p>{address.deliveryEstimate}</p>}</>}{pickupMismatch&&<p style={{padding:12,background:'#faf4e8',borderRadius:6,color:'#947439'}}>The address mentions pickup, but this order was saved as courier delivery with a delivery fee. Review the original arrangement before another handoff or collection.</p>}</div></div></section>
    <Link className={detail.receipt} href={`/receipt/${encodeURIComponent(current.orderNumber)}`}>Open private receipt<ArrowUpRight size={14}/></Link>
    </aside></div>
    {finance&&<details className={detail.section}><summary className={detail.historyHeading}>Settlements, refunds & returns</summary><div style={{marginTop:20}}><OrderFinancePanel orderId={id} status={current.status} total={current.total} giftAmount={address.redemptions?.giftAmount||0} value={finance}/></div></details>}
  </div>;
}
