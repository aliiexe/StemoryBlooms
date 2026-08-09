import React from 'react';
import { db } from '@stemory/database';
import { productMaterial } from '@stemory/database/schema';
import styles from '../dashboard.module.css';
import { MaterialForm } from './MaterialForm';

export default async function AdminMaterialsPage() {
  const materialsRaw = await db.query.material.findMany({
    orderBy: (material, { asc }) => [asc(material.name)],
  });

  const pmRaw = await db.select({ materialId: productMaterial.materialId }).from(productMaterial);

  const materials = materialsRaw.map((m) => ({
    ...m,
    _count: {
      products: pmRaw.filter((pm) => pm.materialId === m.id).length
    }
  }));

  return (
    <div className={styles.dashboard}>
      <header style={{ marginBottom: '2rem' }}>
        <h1 className={styles.shopTitle} style={{ fontSize: '1.75rem', margin: 0 }}>Raw Materials Inventory</h1>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem', alignItems: 'start' }}>
        <div className={styles.card}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Stock</th>
                <th>Cost</th>
                <th>Products Using</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {materials.map((m) => (
                <tr key={m.id}>
                  <td><strong>{m.name}</strong></td>
                  <td>
                    <span style={{ 
                      color: m.lowStockThreshold && m.quantity <= m.lowStockThreshold ? '#C62828' : 'inherit',
                      fontWeight: m.lowStockThreshold && m.quantity <= m.lowStockThreshold ? 600 : 'normal'
                    }}>
                      {m.quantity}
                    </span>
                  </td>
                  <td>{m.cost ? `${m.cost} MAD` : '-'}</td>
                  <td>{m._count.products}</td>
                  <td>
                    <button style={{ background: 'none', border: 'none', color: 'var(--brand-primary)', cursor: 'pointer', textDecoration: 'underline' }}>Edit</button>
                  </td>
                </tr>
              ))}
              {materials.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: '#7A7571' }}>No materials found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className={styles.card}>
          <h3 style={{ marginTop: 0, marginBottom: '1.5rem', color: '#3A3531' }}>Add Material</h3>
          <MaterialForm />
        </div>
      </div>
    </div>
  );
}
