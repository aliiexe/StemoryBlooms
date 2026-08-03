'use client';

import React, { useState } from 'react';
import { saveProduct } from './actions';
import styles from '../dashboard.module.css';

export function ProductForm({ product }: { product?: any }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className={styles.card} style={{ maxWidth: '800px' }}>
      <form 
        action={async (formData) => {
          setIsSubmitting(true);
          const res = await saveProduct(formData);
          if (res?.error) setError(res.error);
          setIsSubmitting(false);
        }}
        style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}
      >
        {error && <div style={{ color: '#C62828', backgroundColor: '#FFEBEE', padding: '1rem', borderRadius: '8px' }}>{error}</div>}
        
        {product?.id && <input type="hidden" name="id" value={product.id} />}

        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: '#3A3531' }}>Name</label>
          <input 
            type="text" 
            name="name" 
            defaultValue={product?.name || ''} 
            required 
            style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #D6CFE6' }} 
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: '#3A3531' }}>Description</label>
          <textarea 
            name="description" 
            defaultValue={product?.description || ''} 
            rows={4}
            style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #D6CFE6', resize: 'vertical' }} 
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: '#3A3531' }}>Base Price (MAD)</label>
          <input 
            type="number" 
            name="basePrice" 
            defaultValue={product?.basePrice || ''} 
            required 
            style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #D6CFE6' }} 
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: '#3A3531' }}>Status</label>
            <select 
              name="status" 
              defaultValue={product?.status || 'PUBLISHED'} 
              style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #D6CFE6' }}
            >
              <option value="PUBLISHED">Published</option>
              <option value="HIDDEN">Hidden</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', marginTop: '1.75rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontWeight: 500, color: '#3A3531' }}>
              <input 
                type="checkbox" 
                name="isAvailable" 
                defaultChecked={product ? product.isAvailable : true} 
                style={{ width: '1.25rem', height: '1.25rem' }}
              />
              Available for Purchase
            </label>
          </div>
        </div>

        <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
          <a href="/admin/products" style={{ padding: '0.75rem 1.5rem', color: '#5A5551', textDecoration: 'none', fontWeight: 500 }}>
            Cancel
          </a>
          <button 
            type="submit" 
            disabled={isSubmitting}
            className={styles.submitBtn} 
            style={{ width: 'auto', margin: 0 }}
          >
            {isSubmitting ? 'Saving...' : 'Save Product'}
          </button>
        </div>
      </form>
    </div>
  );
}
