import React from 'react';
import { db } from '@stemory/database';
import { desc } from 'drizzle-orm';
import { AdminDeliveriesClient } from './AdminDeliveriesClient';

export default async function AdminDeliveriesPage() {
  const orders = await db.query.order.findMany({
    orderBy: (order, { desc }) => [desc(order.createdAt)],
  });

  const deliveryCompany = await db.query.deliveryCompany.findFirst();

  return (
    <AdminDeliveriesClient 
      initialOrders={orders} 
      deliveryCompany={deliveryCompany} 
    />
  );
}
