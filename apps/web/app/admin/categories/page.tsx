import React from 'react';
import { db, category } from '@stemory/database';
import { asc } from 'drizzle-orm';
import styles from '../dashboard.module.css';
import { CategoriesClient } from './CategoriesClient';

export default async function AdminCategoriesPage() {
  const categories = await db.query.category.findMany({
    orderBy: [asc(category.name)],
  });

  return (
    <div className={styles.dashboard}>
      <header style={{ marginBottom: '2rem' }}>
        <h1 className={styles.shopTitle} style={{ fontSize: '1.75rem', margin: 0 }}>Manage Categories</h1>
        <p style={{ maxWidth: '760px', margin: '0.75rem 0 0', color: '#5A5551', lineHeight: 1.6 }}>
          Categories are freeform labels. The best ones are short, searchable, and useful for filtering products or grouping items on the storefront.
        </p>
      </header>
      <CategoriesClient initialCategories={categories} />
    </div>
  );
}
