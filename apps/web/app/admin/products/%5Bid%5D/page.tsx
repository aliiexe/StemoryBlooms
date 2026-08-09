import React from 'react';
import { db, eq, sql, product, material } from '@stemory/database';
import { asc, desc } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import styles from '../../dashboard.module.css';
import { ProductForm } from '../ProductForm';

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const dbProduct = await db.query.product.findFirst({
    where: eq(product.id, id),
    with: { productMaterials: true }
  });

  const materials = await db.query.material.findMany({ orderBy: [asc(material.name)] });

  if (!dbProduct) {
    notFound();
  }

  return (
    <div className={styles.dashboard}>
      <header style={{ marginBottom: '2rem' }}>
        <h1 className={styles.shopTitle} style={{ fontSize: '1.75rem', margin: 0 }}>Edit Product</h1>
      </header>
      <ProductForm product={dbProduct} materials={materials} />
    </div>
  );
}
