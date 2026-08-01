import React from 'react';
import { PrismaClient } from '@stemory/database';
import styles from '../dashboard.module.css';

const prisma = new PrismaClient();

export default async function AdminInventoryPage() {
  const materials = await prisma.material.findMany({
    orderBy: { name: 'asc' }
  });

  return (
    <div className={styles.dashboard}>
      <header className={styles.shopHeader} style={{ padding: '0', marginBottom: '2rem' }}>
        <h1 className={styles.shopTitle} style={{ fontSize: '1.75rem' }}>Inventory</h1>
      </header>

      <div className={styles.card}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Material</th>
              <th>Quantity in Stock</th>
              <th>Status</th>
              <th>Last Restocked</th>
            </tr>
          </thead>
          <tbody>
            {materials.map((m) => (
              <tr key={m.id}>
                <td>{m.name}</td>
                <td>{m.quantity}</td>
                <td>
                  <span className={styles.badge} style={{ backgroundColor: m.quantity < 20 ? '#FCE4EC' : '#E8F5E9', color: m.quantity < 20 ? '#880E4F' : '#1B5E20' }}>
                    {m.quantity < 20 ? 'Low Stock' : 'In Stock'}
                  </span>
                </td>
                <td>{new Date(m.updatedAt).toLocaleDateString()}</td>
              </tr>
            ))}
            {materials.length === 0 && (
              <tr>
                <td colSpan={4} style={{ textAlign: 'center', padding: '2rem', color: '#7A7571' }}>No materials tracked yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
