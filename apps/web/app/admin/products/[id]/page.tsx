import React from 'react';
import { prisma } from '@stemory/database';
import { notFound } from 'next/navigation';
import styles from '../../dashboard.module.css';
import { ProductForm } from '../ProductForm';

export default async function EditProductPage({ params }: { params: { id: string } }) {
  const product = await prisma.product.findUnique({
    where: { id: params.id }
  });

  if (!product) {
    notFound();
  }

  return (
    <div className={styles.dashboard}>
      <header style={{ marginBottom: '2rem' }}>
        <h1 className={styles.shopTitle} style={{ fontSize: '1.75rem', margin: 0 }}>Edit Product</h1>
      </header>
      <ProductForm product={product} />
    </div>
  );
}
