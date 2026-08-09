import React from 'react';
import { db } from '@stemory/database';
import { notFound } from 'next/navigation';
import styles from '../../dashboard.module.css';
import { ProductForm } from '../ProductForm';

export default async function EditProductPage({ params }: { params: { id: string } }) {
  const productRaw = await db.query.product.findFirst({
    where: (table, { eq }) => eq(table.id, params.id),
    with: { productMaterials: true }
  });

  const product = productRaw ? { ...productRaw, materials: productRaw.productMaterials } : undefined;

  const materials = await db.query.material.findMany({ orderBy: (table, { asc }) => [asc(table.name)] });

  if (!product) {
    notFound();
  }

  return (
    <div className={styles.dashboard}>
      <header style={{ marginBottom: '2rem' }}>
        <h1 className={styles.shopTitle} style={{ fontSize: '1.75rem', margin: 0 }}>Edit Product</h1>
      </header>
      <ProductForm product={product} materials={materials} />
    </div>
  );
}
