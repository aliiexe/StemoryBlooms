import React from 'react';
import styles from '../../dashboard.module.css';
import { ProductForm } from '../ProductForm';

import { db } from '@stemory/database';

export const dynamic = 'force-dynamic';

export default async function NewProductPage() {
  const materials = await db.query.material.findMany({ orderBy: (table, { asc }) => [asc(table.name)] });
  const builderComponents = await db.query.builderComponent.findMany({ orderBy: (table, { asc }) => [asc(table.name)] });

  return (
    <div className={styles.dashboard}>
      <header style={{ marginBottom: '2rem' }}>
        <h1 className={styles.shopTitle} style={{ fontSize: '1.75rem', margin: 0 }}>Add New Product</h1>
      </header>
      <ProductForm materials={materials} builderComponents={builderComponents} />
    </div>
  );
}
