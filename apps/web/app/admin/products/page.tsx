import React from 'react';
import { PrismaClient } from '@stemory/database';
import styles from '../dashboard.module.css';

const prisma = new PrismaClient();

export default async function AdminProductsPage() {
  const products = await prisma.product.findMany({
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className={styles.dashboard}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 className={styles.shopTitle} style={{ fontSize: '1.75rem', margin: 0 }}>Manage Products</h1>
        <button className={styles.submitBtn} style={{ width: 'auto', padding: '0.75rem 1.5rem', marginTop: 0 }}>Add Product</button>
      </header>

      <div className={styles.card}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Name</th>
              <th>Price</th>
              <th>Status</th>
              <th>Available</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id}>
                <td>{p.name}</td>
                <td>{p.basePrice} MAD</td>
                <td>
                  <span className={styles.badge} style={{ backgroundColor: p.status === 'PUBLISHED' ? '#E8F5E9' : '#F5F5F5', color: p.status === 'PUBLISHED' ? '#1B5E20' : '#616161' }}>
                    {p.status}
                  </span>
                </td>
                <td>{p.isAvailable ? 'Yes' : 'No'}</td>
              </tr>
            ))}
            {products.length === 0 && (
              <tr>
                <td colSpan={4} style={{ textAlign: 'center', padding: '2rem', color: '#7A7571' }}>No products found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
