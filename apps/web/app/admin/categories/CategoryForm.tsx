'use client';

import React, { useState } from 'react';
import { saveCategory, deleteCategory } from './actions';
import styles from '../dashboard.module.css';
import ConfirmModal from '../components/ConfirmModal';
import { toast } from 'sonner';

export function CategoryForm({ category, onSaved }: { category?: any, onSaved?: () => void }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  const confirmDelete = async () => {
    setShowConfirm(false);
    if (!category?.id) return;
    const res = await deleteCategory(category.id);
    if (res?.error) {
      toast.error(res.error);
    } else {
      toast.success('Category deleted');
      if (onSaved) onSaved();
    }
  };

  return (
    <>
      <form 
        action={async (formData) => {
          setIsSubmitting(true);
          const res = await saveCategory(formData);
          if (res?.error) {
            setError(res.error);
            toast.error(res.error);
          } else {
            toast.success(category?.id ? 'Category updated' : 'Category created');
            if (onSaved) onSaved();
          }
          setIsSubmitting(false);
        }}
        style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
      >
        {error && <div style={{ color: '#C62828', fontSize: '0.9rem' }}>{error}</div>}
        
        {category?.id && <input type="hidden" name="id" value={category.id} />}

        <div>
          <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.85rem', fontWeight: 500, color: '#4A4A4A' }}>Category Name</label>
          <input 
            type="text" 
            name="name" 
            defaultValue={category?.name || ''} 
            required 
            style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #D6CFE6' }} 
          />
        </div>

        <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
          <button 
            type="submit" 
            disabled={isSubmitting}
            className={styles.submitBtn} 
            style={{ flex: 1, padding: '0.5rem', margin: 0 }}
          >
            {isSubmitting ? 'Saving...' : 'Save'}
          </button>
          {category?.id && (
            <button 
              type="button" 
              onClick={() => setShowConfirm(true)}
              style={{ padding: '0.5rem 1rem', border: '1px solid #FFEBEE', backgroundColor: '#FFEBEE', color: '#C62828', borderRadius: '4px', cursor: 'pointer' }}
            >
              Delete
            </button>
          )}
        </div>
      </form>
      
      <ConfirmModal
        isOpen={showConfirm}
        title="Delete Category"
        message="Are you sure you want to delete this category? This action cannot be undone."
        confirmText="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setShowConfirm(false)}
      />
    </>
  );
}
