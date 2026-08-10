'use client';

import React, { useState } from 'react';
import styles from '../dashboard.module.css';
import { CategoryForm } from './CategoryForm';
import { usePagination } from '../components/usePagination';
import { TablePagination } from '../components/TablePagination';

export function AdminCategoriesClient({ initialCategories, categoryIdeas }: { initialCategories: any[], categoryIdeas: string[] }) {
  const [editingCategory, setEditingCategory] = useState<any | null>(null);

  const { page, setPage, rowsPerPage, setRowsPerPage, totalPages, paginatedItems, totalItems } = usePagination(initialCategories, 10);

  return (
    <div>
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
              {paginatedItems.map((c) => (
                <tr key={c.id}>
                  <td><strong>{c.name}</strong></td>
                  <td>
                    <button 
                      onClick={() => setEditingCategory(c)}
                      style={{ background: 'none', border: 'none', color: 'var(--brand-primary)', cursor: 'pointer', textDecoration: 'underline' }}
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
              {initialCategories.length === 0 && (
                <tr>
                  <td colSpan={2} style={{ textAlign: 'center', padding: '2rem', color: '#7A7571' }}>No categories found</td>
                </tr>
              )}
            </tbody>
          </table>
          <TablePagination 
            page={page} 
            totalPages={totalPages} 
            totalItems={totalItems} 
            rowsPerPage={rowsPerPage} 
            onPageChange={setPage} 
            onRowsPerPageChange={setRowsPerPage} 
          />
        </div>

        <div className={styles.card}>
          <h3 style={{ marginTop: 0, marginBottom: '1.5rem', color: '#3A3531' }}>
            {editingCategory ? 'Edit Category' : 'Add Category'}
          </h3>
          <CategoryForm 
            key={editingCategory ? editingCategory.id : 'new'} 
            category={editingCategory} 
            onSaved={() => setEditingCategory(null)} 
          />
          {editingCategory && (
            <button 
              onClick={() => setEditingCategory(null)}
              style={{ width: '100%', padding: '0.5rem', marginTop: '0.5rem', background: 'transparent', border: '1px solid #EAE6DF', borderRadius: '4px', cursor: 'pointer' }}
            >
              Cancel Edit
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
