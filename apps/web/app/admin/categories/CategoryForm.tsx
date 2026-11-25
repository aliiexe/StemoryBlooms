'use client';

import type {category as categoryTable} from '@stemory/database';
import {useRouter} from 'next/navigation';
import React, { useId, useState } from 'react';
import { saveCategory, deleteCategory } from './actions';
import styles from '../dashboard.module.css';
import ConfirmModal from '../components/ConfirmModal';
import { toast } from 'sonner';

export function CategoryForm({ category, onSaved,onBusyChange }: { category?: typeof categoryTable.$inferSelect | null, onSaved?: () => void;onBusyChange?:(value:boolean)=>void }) {
  const router=useRouter();
  const nameId=useId();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  const confirmDelete = async () => {
    if (!category?.id || isSubmitting) return;
    setIsSubmitting(true);onBusyChange?.(true);try{const res=await deleteCategory(category.id);if(res.error)setError(res.error);else{toast.success('Category removed');router.refresh();onSaved?.();}}catch{setError('Could not confirm the removal. Check the category list before retrying.');}finally{setIsSubmitting(false);onBusyChange?.(false);setShowConfirm(false);}
  };

  return (
    <>
      <form 
        onSubmit={async event => { event.preventDefault(); const formData = new FormData(event.currentTarget);
          if(isSubmitting)return;setError(null);
          setIsSubmitting(true);onBusyChange?.(true);
          try {const res = await saveCategory(formData);
          if (res?.error) {
            setError(res.error);
            toast.error(res.error);
          } else {
            toast.success(category?.id ? 'Category updated' : 'Category created');router.refresh();
            if (onSaved) onSaved();
          }
          }catch{setError('Save could not be confirmed. Please retry.');}finally{setIsSubmitting(false);onBusyChange?.(false);}
        }}
        style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
      >
        {error && <div style={{ color: '#C62828', fontSize: '0.9rem' }}>{error}</div>}
        
        {category?.id && <input type="hidden" name="id" value={category.id} />}

        <div>
          <label htmlFor={nameId} style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.85rem', fontWeight: 500, color: '#4A4A4A' }}>Category Name</label>
          <input 
            type="text" 
            id={nameId}
            name="name" 
            defaultValue={category?.name || ''} 
            required 
            style={{ width: '100%', padding: '0.5rem', borderRadius: '7px', border: '1px solid #dce1db' }}
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
        busy={isSubmitting}
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
