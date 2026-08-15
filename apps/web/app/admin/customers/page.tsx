import React from 'react';
import { db } from '@stemory/database';
import CustomersClient from './CustomersClient';

export default async function AdminCustomersPage() {
  const customers = await db.query.customer.findMany({
    orderBy: (table, { desc }) => [desc(table.createdAt)],
    with: {
      orders: true
    }
  });

  return <CustomersClient customers={customers} />;
}
