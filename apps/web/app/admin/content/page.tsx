import React from 'react';
import { db } from '@stemory/database';
import styles from '../dashboard.module.css';
import PromoForm from './PromoForm';
import { PromoActions } from './PromoActions';

export default async function AdminContentPage() {
  const promos = await db.query.promoCode.findMany({
    orderBy: (table, { desc }) => [desc(table.createdAt)]
  });

  return (
    <div className={styles.dashboard}>
      <header className={styles.shopHeader} style={{ padding: '0', marginBottom: '2rem' }}>
        <h1 className={styles.shopTitle} style={{ fontSize: '1.75rem' }}>Content & Promos</h1>
      </header>

      <PromoForm />

      <div className={styles.card}>
        <h3 className={styles.cardTitle}>Promo Codes</h3>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Code</th>
              <th>Type</th>
              <th>Value</th>
              <th>Usage</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {promos.map((p) => (
              <tr key={p.id}>
                <td><strong>{p.code}</strong></td>
                <td>{p.type}</td>
                <td>{p.value}</td>
                <td>{p.usageCount} / {p.usageLimit || '∞'}</td>
                <td>
                  <span className={styles.badge} style={{ backgroundColor: p.isActive ? '#E8F5E9' : '#F5F5F5', color: p.isActive ? '#1B5E20' : '#616161' }}>
                    {p.isActive ? 'Active' : 'Disabled'}
                  </span>
                </td>
                <td>
                  <PromoActions id={p.id} isActive={p.isActive} />
                </td>
              </tr>
            ))}
            {promos.length === 0 && (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: '#7A7571' }}>No promo codes found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
