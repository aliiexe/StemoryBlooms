import React from 'react';
import { db, eq, order, orderItem, customer, deliveryZone } from '@stemory/database';
import { notFound } from 'next/navigation';
import ReceiptClient from './ReceiptClient';

export default async function ReceiptPage({ params }: { params: { orderNumber: string } }) {
  const { orderNumber } = await params;

  const orderRecord = await db.query.order.findFirst({
    where: eq(order.orderNumber, orderNumber),
  });
  
  if (!orderRecord) {
    notFound();
  }

  const [customerData] = await db.select().from(customer).where(eq(customer.id, orderRecord.customerId));
  const items = await db.select().from(orderItem).where(eq(orderItem.orderId, orderRecord.id));

  const fullOrder = {
    ...orderRecord,
    customer: customerData,
    items
  };

  return (
    <div style={{ backgroundColor: '#f3f4f6', minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'flex-start', padding: '2rem 1rem' }}>
      <ReceiptClient order={fullOrder} />
    </div>
  );
}
