import React from 'react';
import { db, eq, order, orderItem, customer } from '@stemory/database';
import { notFound } from 'next/navigation';
import ReceiptClient from './ReceiptClient';
import { auth } from '@clerk/nextjs/server';
import { getUserRoleName } from '@/lib/user-sync';
import { getReceiptSecret, verifyReceiptToken, type OrderAddress } from '@/lib/commerce/receipt-access';
import type { Metadata } from 'next';
import { orderPaymentState } from '@/lib/commerce/payments';

export const metadata: Metadata = { title: 'Order receipt', robots: { index: false, follow: false }, referrer: 'no-referrer' };

export default async function ReceiptPage({ params, searchParams }: {
  params: Promise<{ orderNumber: string }>;
  searchParams: Promise<{ token?: string | string[]; received?: string }>;
}) {
  const { orderNumber } = await params;

  const orderRecord = await db.query.order.findFirst({
    where: eq(order.orderNumber, orderNumber),
  });

  if (!orderRecord) {
    notFound();
  }

  const address = orderRecord.deliveryAddress as OrderAddress;
  const { token, received } = await searchParams;
  const { userId } = await auth();
  const ownsOrder = Boolean(userId && address.ownerClerkId === userId);
  const isAdmin = userId ? await getUserRoleName(userId) === 'ADMIN' : false;
  const hasToken = Boolean(address.receiptNonce && verifyReceiptToken(token, orderNumber, address.receiptNonce, getReceiptSecret()));
  if (!ownsOrder && !isAdmin && !hasToken) notFound();

  const [customerData] = address.customerSnapshot ? [address.customerSnapshot] : await db.select({
    firstName: customer.firstName, lastName: customer.lastName, email: customer.email, phone: customer.phone,
  }).from(customer).where(eq(customer.id, orderRecord.customerId));
  if (!customerData) notFound();
  const items = await db.select().from(orderItem).where(eq(orderItem.orderId, orderRecord.id));

  const payment = await orderPaymentState(orderRecord);
  const fullOrder = {
    payment: { label: payment.label, collected: payment.collected, remaining: payment.remaining, itemsRemaining: payment.itemsRemaining, deliveryRemaining: payment.deliveryRemaining },
    orderNumber: orderRecord.orderNumber,
    createdAt: orderRecord.createdAt.toISOString(),
    subtotal: orderRecord.subtotal, deliveryFee: orderRecord.deliveryFee,
    discount: orderRecord.discount, total: orderRecord.total, paymentStatus: orderRecord.paymentStatus,
    deliveryAddress: { city: address.city, addressLine1: address.addressLine1, recipient: address.recipientSnapshot },
    customer: customerData,
    items: items.map(({ id, productName, quantity, unitPrice, totalPrice }) => ({ id, productName, quantity, unitPrice, totalPrice })),
  };

  return (
    <div style={{ backgroundColor: '#f3f4f6', minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'flex-start', padding: '2rem 1rem' }}>
      <div style={{ width: '100%', maxWidth: 800 }}>
        {received === '1' && <div role="status" style={{ padding: '1rem', marginBottom: '1rem', borderRadius: 12, background: '#EEF2E8', color: '#30412D' }}><h1>Order received</h1><p>Thank you. Our team will confirm your order and delivery details. Keep this private receipt link for your records.</p></div>}
        <ReceiptClient order={fullOrder} />
      </div>
    </div>
  );
}
