import React from 'react';
import { db, material } from '@stemory/database';
import { asc } from 'drizzle-orm';
import styles from '../dashboard.module.css';

export default async function AdminInventoryPage() {
  const materials = await db.query.material.findMany({
    orderBy: [asc(material.name)]
  });

  const totalUnits = materials.reduce((sum, item) => sum + item.quantity, 0);
  const lowStockCount = materials.filter((item) => item.quantity < 20).length;
  return (
    <div className={styles.dashboard}>
      <header className={styles.shopHeader} style={{ padding: '0', marginBottom: '2rem' }}>
        <h1 className={styles.shopTitle} style={{ fontSize: '1.75rem' }}>Inventory & Raw Materials</h1>
        <p style={{ maxWidth: '720px', margin: '0.75rem auto 0', color: '#5A5551', lineHeight: 1.6 }}>
          Inventory and raw materials are managed in one place here. Use this page to monitor stock, spot reorder risk, and understand what ingredients are feeding current products.
        </p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div className={styles.card} style={{ padding: '1.25rem' }}>
          <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#7A7571', marginBottom: '0.5rem' }}>Tracked materials</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--brand-primary)' }}>{materials.length}</div>
        </div>
        <div className={styles.card} style={{ padding: '1.25rem' }}>
          <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#7A7571', marginBottom: '0.5rem' }}>Total units</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--brand-primary)' }}>{totalUnits}</div>
        </div>
        <div className={styles.card} style={{ padding: '1.25rem' }}>
          <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#7A7571', marginBottom: '0.5rem' }}>Low stock items</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, color: lowStockCount > 0 ? '#C62828' : 'var(--brand-primary)' }}>{lowStockCount}</div>
        </div>
      </div>

      <div className={styles.card}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Material</th>
              <th>Quantity in Stock</th>
              <th>Status</th>
              <th>Used In Products</th>
              <th>Cost</th>
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
                <td>{m.productMaterials?.length ?? 0}</td>
                <td>{m.cost ? `${m.cost} MAD` : '-'}</td>
              </tr>
            ))}
            {materials.length === 0 && (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: '#7A7571' }}>No materials tracked yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
