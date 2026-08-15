import React from 'react';
import { db, eq, product, deliveryZone } from '@stemory/database';
import styles from '../../dashboard.module.css';
import NewAssistedOrderForm from './NewAssistedOrderForm';

export default async function NewAssistedOrderPage() {
  const products = await db.query.product.findMany({
    where: eq(product.isAvailable, true)
  });

  const deliveryZones = await db.query.deliveryZone.findMany({
    where: eq(deliveryZone.isActive, true)
  });

  // Map products to the type expected by the form
  const serializedProducts = products.map(p => ({
    id: p.id,
    name: p.name,
    basePrice: p.basePrice,
    salePrice: p.salePrice
  }));

  const serializedDeliveryZones = deliveryZones.map(z => ({
    id: z.id,
    name: z.name,
    fee: z.fee
  }));

  return (
    <div className={styles.dashboard}>
      <header className={styles.shopHeader} style={{ padding: '0', marginBottom: '2rem' }}>
        <h1 className={styles.shopTitle} style={{ fontSize: '1.75rem' }}>Create Assisted Order</h1>
        <p style={{ color: '#5A5551', marginTop: '0.5rem' }}>
          Record an order taken over the phone, Instagram, or in person.
        </p>
      </header>

      <NewAssistedOrderForm 
        products={serializedProducts} 
        deliveryZones={serializedDeliveryZones} 
      />
    </div>
  );
}
