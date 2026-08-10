import React from 'react';
import { db, category } from '@stemory/database';
import { asc } from 'drizzle-orm';
import styles from '../dashboard.module.css';
import { CategoriesClient } from './CategoriesClient';

const categoryIdeas = [
  'Product type: bouquets, gifts, custom arrangements',
  'Occasion: birthday, anniversary, graduation, thank you',
  'Style: minimalist, luxury, colorful, romantic',
  'Palette: white, pink, neutral, seasonal mix',
  'Season or campaign: Ramadan, Valentine\'s, spring, holiday',
  'Budget or size: mini, standard, premium',
];

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

      <div className={styles.card} style={{ marginBottom: '2rem' }}>
        <h3 style={{ marginTop: 0, marginBottom: '1rem', color: '#3A3531' }}>Good category options</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '0.75rem' }}>
          {categoryIdeas.map((idea) => (
            <div key={idea} style={{ padding: '0.85rem 1rem', borderRadius: '10px', backgroundColor: '#FBF9F5', border: '1px solid #EAE6DF', color: '#4E473F', fontSize: '0.9rem' }}>
              {idea}
            </div>
          ))}
        </div>
      </div>

      <CategoriesClient initialCategories={categories} />
    </div>
  );
}
