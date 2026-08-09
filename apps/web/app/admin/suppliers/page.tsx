import React from 'react';
import { db, supplier } from '@stemory/database';
import { asc } from 'drizzle-orm';
import { AdminSuppliersClient } from './AdminSuppliersClient';

export default async function AdminSuppliersPage() {
  const suppliers = await db.query.supplier.findMany({
    orderBy: [asc(supplier.name)],
  });

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '1rem' }}>
      <AdminSuppliersClient initialSuppliers={suppliers} />
    </div>
  );
}
