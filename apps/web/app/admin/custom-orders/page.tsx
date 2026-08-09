import React from 'react';
import { db } from '@stemory/database';
import styles from '../dashboard.module.css';



export default async function AdminCustomOrdersPage() {
  const draftOrders = await db.query.draftOrder.findMany({
    orderBy: (table, { desc }) => [desc(table.createdAt)]
  });

  return (
    <div className={styles.dashboard}>
      <header className={styles.shopHeader} style={{ padding: '0', marginBottom: '2rem' }}>
        <h1 className={styles.shopTitle} style={{ fontSize: '1.75rem' }}>Custom Orders (Drafts)</h1>
      </header>

      <div className={styles.card}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Draft ID</th>
              <th>Created By</th>
              <th>Last Updated</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {draftOrders.map((d) => (
              <tr key={d.id}>
                <td>{d.id.slice(0, 8)}...</td>
                <td>{d.actorId || 'System'}</td>
                <td>{new Date(d.updatedAt).toLocaleDateString()}</td>
                <td>
                  <button className={styles.submitBtn} style={{ padding: '0.25rem 0.75rem', fontSize: '0.8rem', width: 'auto' }}>View</button>
                </td>
              </tr>
            ))}
            {draftOrders.length === 0 && (
              <tr>
                <td colSpan={4} style={{ textAlign: 'center', padding: '2rem', color: '#7A7571' }}>No draft custom orders found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
