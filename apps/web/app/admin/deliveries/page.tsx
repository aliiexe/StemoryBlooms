import { assertAdmin } from '@/lib/user-sync';
import React from 'react';
import { db } from '@stemory/database';
import { sql } from 'drizzle-orm';
import { AdminDeliveriesClient } from './AdminDeliveriesClient';

export default async function AdminDeliveriesPage() {
  await assertAdmin();
  const orders = await db.query.order.findMany({
    where: (table) => sql`${table.deliveryAddress}->>'archivedAt' IS NULL`,
    with: { customer: true, deliveryHandoff: true },
    orderBy: (order, { desc }) => [desc(order.createdAt)],
  });

  const deliveryCompany = await db.query.deliveryCompany.findFirst({ where: (table, { eq }) => eq(table.isActive, true) });

  return (
    <AdminDeliveriesClient
      initialOrders={orders}
      deliveryCompany={deliveryCompany}
    />
  );
}
