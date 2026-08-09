import React from 'react';
import { db, category } from '@stemory/database';
import { asc } from 'drizzle-orm';
import styles from '../dashboard.module.css';
import { CategoryForm } from './CategoryForm';

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
        <div style={{ display: 'grid', gap: '0.75rem' }}>
          {categoryIdeas.map((idea) => (
            <div key={idea} style={{ padding: '0.85rem 1rem', borderRadius: '10px', backgroundColor: '#FBF9F5', border: '1px solid #EAE6DF', color: '#4E473F' }}>
              {idea}
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem', alignItems: 'start' }}>
        <div className={styles.card}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((c) => (
                <tr key={c.id}>
                  <td><strong>{c.name}</strong></td>
                  <td>
                    <button style={{ background: 'none', border: 'none', color: 'var(--brand-primary)', cursor: 'pointer', textDecoration: 'underline' }}>Edit (Client-side toggle omitted for brevity)</button>
                  </td>
                </tr>
              ))}
              {categories.length === 0 && (
                <tr>
                  <td colSpan={3} style={{ textAlign: 'center', padding: '2rem', color: '#7A7571' }}>No categories found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className={styles.card}>
          <h3 style={{ marginTop: 0, marginBottom: '1.5rem', color: '#3A3531' }}>Add Category</h3>
          <CategoryForm />
        </div>
      </div>
    </div>
  );
}
