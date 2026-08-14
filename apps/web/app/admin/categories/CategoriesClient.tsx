'use client';

import React, { useState, useTransition, useEffect } from 'react';
import { Plus, Edit2, Trash2, Check, X, Tag } from 'lucide-react';
import styles from '../dashboard.module.css';
import { saveCategory, deleteCategory } from './actions';

export function CategoriesClient({ initialCategories }: { initialCategories: any[] }) {
  const [categories, setCategories] = useState(initialCategories);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setCategories(initialCategories);
  }, [initialCategories]);

  const handleEdit = (cat: any) => {
    setEditingId(cat.id);
    setEditName(cat.name);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName('');
  };

  const handleSaveEdit = (id: string) => {
    if (!editName.trim()) return;
    
    // Optimistic update
    setCategories(categories.map(c => c.id === id ? { ...c, name: editName } : c));
    setEditingId(null);
    
    startTransition(async () => {
      const formData = new FormData();
      formData.append('id', id);
      formData.append('name', editName);
      await saveCategory(formData);
    });
  };

  const handleDelete = (id: string) => {
    if (!confirm('Are you sure you want to delete this category?')) return;
    
    // Optimistic update
    setCategories(categories.filter(c => c.id !== id));
    
    startTransition(async () => {
      await deleteCategory(id);
    });
  };

  return (
    <div className={styles.twoColumnResponsive}>
      
      {/* Categories List */}
      <div className={styles.card} style={{ padding: '2rem' }}>
        <h3 style={{ marginTop: 0, marginBottom: '1.5rem', color: '#3A3531', fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Tag size={20} color="var(--brand-primary)" />
          Existing Categories
        </h3>
        
        {categories.length === 0 ? (
          <div style={{ padding: '3rem 1rem', textAlign: 'center', backgroundColor: '#FBF9F5', borderRadius: '12px', color: '#7A7571', border: '1px dashed #D6CFE6' }}>
            No categories yet. Create your first one to organize your catalog.
          </div>
        ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
            {categories.map((c) => {
              const isEditing = editingId === c.id;
              
              return (
                <div 
                  key={c.id} 
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '0.5rem',
                    padding: '0.4rem 0.75rem', 
                    backgroundColor: isEditing ? '#FFFFFF' : '#FDFBF7', 
                    border: isEditing ? '1px solid var(--brand-primary)' : '1px solid #EAE6DF',
                    borderRadius: '20px',
                    transition: 'all 0.2s',
                    boxShadow: isEditing ? '0 2px 8px rgba(0,0,0,0.05)' : 'none'
                  }}
                >
                  {isEditing ? (
                    <input 
                      autoFocus
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveEdit(c.id);
                        if (e.key === 'Escape') cancelEdit();
                      }}
                      style={{ width: '120px', padding: '0.2rem 0.5rem', borderRadius: '4px', border: '1px solid #D6CFE6', fontSize: '0.85rem', outline: 'none' }}
                    />
                  ) : (
                    <strong style={{ fontSize: '0.9rem', color: '#3A3531', fontWeight: 500 }}>{c.name}</strong>
                  )}
                  
                  <div style={{ display: 'flex', gap: '0.2rem' }}>
                    {isEditing ? (
                      <>
                        <button 
                          onClick={() => handleSaveEdit(c.id)}
                          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '24px', height: '24px', borderRadius: '50%', backgroundColor: '#E8F5E9', color: '#1B5E20', border: 'none', cursor: 'pointer' }}
                          title="Save"
                        >
                          <Check size={12} />
                        </button>
                        <button 
                          onClick={cancelEdit}
                          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '24px', height: '24px', borderRadius: '50%', backgroundColor: '#FDECEC', color: '#C62828', border: 'none', cursor: 'pointer' }}
                          title="Cancel"
                        >
                          <X size={12} />
                        </button>
                      </>
                    ) : (
                      <>
                        <button 
                          onClick={() => handleEdit(c)}
                          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '24px', height: '24px', borderRadius: '50%', backgroundColor: 'transparent', color: '#5A5551', border: 'none', cursor: 'pointer' }}
                          onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#F5F5F5'; }}
                          onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                          title="Edit"
                        >
                          <Edit2 size={12} />
                        </button>
                        <button 
                          onClick={() => handleDelete(c.id)}
                          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '24px', height: '24px', borderRadius: '50%', backgroundColor: 'transparent', color: '#C62828', border: 'none', cursor: 'pointer' }}
                          onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#FFEBEE'; }}
                          onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                          title="Delete"
                        >
                          <Trash2 size={12} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Category Card */}
      <div className={styles.card} style={{ padding: '2rem', backgroundColor: '#FAFAFA', border: '1px solid #EAE6DF', boxShadow: 'none' }}>
        <h3 style={{ marginTop: 0, marginBottom: '1.5rem', color: '#3A3531', fontSize: '1.15rem' }}>Add New Category</h3>
        <form 
          action={async (formData) => {
            const name = formData.get('name') as string;
            if (!name.trim()) return;
            
            startTransition(async () => {
              await saveCategory(formData);
              const formElement = document.getElementById('add-category-form') as HTMLFormElement;
              if (formElement) formElement.reset();
            });
          }}
          id="add-category-form"
          style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
        >
          <div>
            <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.9rem', color: '#5A5551', fontWeight: 500 }}>Category Name</label>
            <input 
              type="text" 
              name="name" 
              placeholder="e.g. Birthday Bouquets"
              required 
              style={{ width: '100%', padding: '0.85rem', borderRadius: '8px', border: '1px solid #D6CFE6', fontSize: '0.95rem', outline: 'none', transition: 'border-color 0.2s' }} 
              onFocus={(e) => e.target.style.borderColor = 'var(--brand-primary)'}
              onBlur={(e) => e.target.style.borderColor = '#D6CFE6'}
            />
          </div>
          <button 
            type="submit" 
            disabled={isPending}
            className={styles.submitBtn} 
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.85rem', margin: '0.5rem 0 0 0', borderRadius: '8px' }}
          >
            <Plus size={18} />
            {isPending ? 'Adding...' : 'Add Category'}
          </button>
        </form>
      </div>
    </div>
  );
}
