import React from 'react';
import { db } from '@stemory/database';
import styles from '../dashboard.module.css';



export default async function AdminDeliveriesPage() {
  const zones = await db.query.deliveryZone.findMany({
    orderBy: (table, { asc }) => [asc(table.name)]
  });

  return (
    <div className={styles.dashboard}>
      <header className={styles.shopHeader} style={{ padding: '0', marginBottom: '2rem' }}>
        <h1 className={styles.shopTitle} style={{ fontSize: '1.75rem' }}>Delivery Zones</h1>
      </header>

      <div className={styles.card}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Zone Name</th>
              <th>Fee</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {zones.map((z) => (
              <tr key={z.id}>
                <td>{z.name}</td>
                <td>{z.fee} MAD</td>
                <td>
                  <span className={styles.badge} style={{ backgroundColor: z.isActive ? '#E8F5E9' : '#F5F5F5', color: z.isActive ? '#1B5E20' : '#616161' }}>
                    {z.isActive ? 'Active' : 'Disabled'}
                  </span>
                </td>
              </tr>
            ))}
            {zones.length === 0 && (
              <tr>
                <td colSpan={3} style={{ textAlign: 'center', padding: '2rem', color: '#7A7571' }}>No delivery zones configured.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
