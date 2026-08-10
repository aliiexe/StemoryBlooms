import React from 'react';
import { db, material, supplier } from '@stemory/database';
import { asc } from 'drizzle-orm';
import styles from '../dashboard.module.css';
import { InventoryTableClient } from './InventoryTableClient';

export default async function AdminInventoryPage() {
  const materials = await db.query.material.findMany({
    orderBy: [asc(material.name)],
    with: {
      productMaterials: true,
      supplier: true,
    }
  });

  const suppliers = await db.query.supplier.findMany({
    orderBy: [asc(supplier.name)],
  });

  const totalUnits = materials.reduce((sum, item) => sum + item.quantity, 0);
  const totalValue = materials.reduce((sum, item) => sum + ((item.quantity || 0) * (item.cost || 0)), 0);
  const lowStockCount = materials.filter((item) => item.lowStockThreshold !== null && item.quantity <= item.lowStockThreshold).length;

  return (
    <div className={styles.dashboard}>
      <header className={styles.shopHeader} style={{ padding: '0', marginBottom: '2rem' }}>
        <h1 className={styles.shopTitle} style={{ fontSize: '1.75rem' }}>Inventory & Raw Materials</h1>
        <p style={{ maxWidth: '720px', margin: '0.75rem auto 0', color: '#5A5551', lineHeight: 1.6 }}>
          Inventory and raw materials are managed in one place here. Use this page to monitor stock, spot reorder risk, and understand what ingredients are feeding current products.
        </p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div className={styles.card} style={{ padding: '1.25rem' }}>
          <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#7A7571', marginBottom: '0.5rem' }}>Tracked materials</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--brand-primary)' }}>{materials.length}</div>
        </div>
        <div className={styles.card} style={{ padding: '1.25rem' }}>
          <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#7A7571', marginBottom: '0.5rem' }}>Total units</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--brand-primary)' }}>{totalUnits}</div>
        </div>
        <div className={styles.card} style={{ padding: '1.25rem' }}>
          <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#7A7571', marginBottom: '0.5rem' }}>Total Value</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--brand-primary)' }}>{totalValue.toFixed(2)} MAD</div>
        </div>
        <div className={styles.card} style={{ padding: '1.25rem' }}>
          <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#7A7571', marginBottom: '0.5rem' }}>Low stock items</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, color: lowStockCount > 0 ? '#C62828' : 'var(--brand-primary)' }}>{lowStockCount}</div>
        </div>
      </div>

      <InventoryTableClient 
        initialMaterials={materials.map(m => ({...m, cost: m.cost ? Number(m.cost) : null}))} 
        suppliers={suppliers} 
      />
    </div>
  );
}
