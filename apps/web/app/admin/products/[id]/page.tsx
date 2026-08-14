import React from 'react';
import { db } from '@stemory/database';
import { notFound } from 'next/navigation';
import styles from '../../dashboard.module.css';
import { ProductForm } from '../ProductForm';

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const productRaw = await db.query.product.findFirst({
    where: (table, { eq }) => eq(table.id, id),
    with: { 
      productMaterials: true,
      productBuilderComponents: true,
      categoryToProducts: true
    }
  });

  const product = productRaw ? { 
    ...productRaw, 
    materials: productRaw.productMaterials,
    builderComponents: productRaw.productBuilderComponents,
    categories: productRaw.categoryToProducts.map(c => c.a)
  } : undefined;

  const materials = await db.query.material.findMany({ orderBy: (table, { asc }) => [asc(table.name)] });
  const builderComponents = await db.query.builderComponent.findMany({ orderBy: (table, { asc }) => [asc(table.name)] });
  const categories = await db.query.category.findMany({ orderBy: (table, { asc }) => [asc(table.name)] });

  if (!product) {
    notFound();
  }

  return (
    <div className={styles.dashboard}>
      <header style={{ marginBottom: '2rem' }}>
        <h1 className={styles.shopTitle} style={{ fontSize: '1.75rem', margin: 0 }}>Edit Product</h1>
      </header>
      <ProductForm product={product} materials={materials} builderComponents={builderComponents} categories={categories} />
    </div>
  );
}
