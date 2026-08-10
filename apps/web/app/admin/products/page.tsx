import React from 'react';
import Link from 'next/link';
import { db } from '@stemory/database';
import styles from '../dashboard.module.css';
import { AdminProductsClient } from './AdminProductsClient';

export default async function AdminProductsPage() {
  const products = await db.query.product.findMany({
    orderBy: (product, { desc }) => [desc(product.createdAt)],
  });

  return (
    <div className={styles.dashboard}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 className={styles.shopTitle} style={{ fontSize: '1.75rem', margin: 0 }}>Manage Products</h1>
        <Link href="/admin/products/new" className={styles.submitBtn} style={{ width: 'auto', padding: '0.75rem 1.5rem', marginTop: 0, textDecoration: 'none' }}>
          Add Product
        </Link>
      </header>

      <AdminProductsClient initialProducts={products as any} />
    </div>
  );
}
