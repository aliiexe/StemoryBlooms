'use client';

import React, { useState, useTransition, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit2, Trash2, Check, X, Tag } from 'lucide-react';
import styles from '../dashboard.module.css';
import { saveCategory, deleteCategory } from './actions';
import ConfirmModal from '../components/ConfirmModal';

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05, delayChildren: 0.1 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } }
};

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

  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  const confirmDelete = (id: string) => {
    // Optimistic update
    setCategories(categories.filter(c => c.id !== id));
    
    startTransition(async () => {
      await deleteCategory(id);
    });
    setItemToDelete(null);
  };

  const handleDeleteClick = (id: string) => {
    setItemToDelete(id);
  };

  return (
    <motion.div 
      className={styles.twoColumnResponsive}
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      
      {/* Categories List */}
      <motion.div className={styles.card} style={{ padding: '2rem', background: 'rgba(255, 255, 255, 0.6)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255, 255, 255, 0.8)', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.03)' }} variants={itemVariants}>
        <h3 style={{ marginTop: 0, marginBottom: '1.5rem', color: '#111827', fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: 600 }}>
          <Tag size={20} color="var(--brand-primary)" />
          Existing Categories
        </h3>
        
        {categories.length === 0 ? (
          <div style={{ padding: '3rem 1rem', textAlign: 'center', backgroundColor: 'rgba(249, 250, 251, 0.5)', borderRadius: '12px', color: '#6B7280', border: '1px dashed #E5E7EB' }}>
            No categories yet. Create your first one to organize your catalog.
          </div>
        ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
            {categories.map((c) => {
              const isEditing = editingId === c.id;
              
              return (
                <motion.div 
                  key={c.id}
                  whileHover={!isEditing ? { scale: 1.02, y: -2 } : {}}
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '0.5rem',
                    padding: '0.4rem 0.75rem', 
                    backgroundColor: isEditing ? '#FFFFFF' : 'rgba(255, 255, 255, 0.8)', 
                    border: isEditing ? '1px solid var(--brand-primary)' : '1px solid rgba(0,0,0,0.05)',
                    borderRadius: '20px',
                    transition: 'all 0.2s',
                    boxShadow: isEditing ? '0 4px 12px rgba(0,0,0,0.05)' : '0 2px 4px rgba(0,0,0,0.02)'
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
                      style={{ width: '120px', padding: '0.2rem 0.5rem', borderRadius: '4px', border: '1px solid #D1D5DB', fontSize: '0.85rem', outline: 'none' }}
                    />
                  ) : (
                    <strong style={{ fontSize: '0.9rem', color: '#374151', fontWeight: 500 }}>{c.name}</strong>
                  )}
                  
                  <div style={{ display: 'flex', gap: '0.25rem' }}>
                    {isEditing ? (
                      <>
                        <button 
                          onClick={() => handleSaveEdit(c.id)}
                          style={{ padding: '0.5rem', background: 'transparent', border: 'none', cursor: 'pointer', color: '#10B981' }}
                          title="Save"
                        >
                          <Check size={16} />
                        </button>
                        <button 
                          onClick={cancelEdit}
                          style={{ padding: '0.5rem', background: 'transparent', border: 'none', cursor: 'pointer', color: '#6B7280' }}
                          title="Cancel"
                        >
                          <X size={16} />
                        </button>
                      </>
                    ) : (
                      <>
                        <button 
                          onClick={() => handleEdit(c)}
                          style={{ padding: '0.5rem', background: 'transparent', border: 'none', cursor: 'pointer', color: '#6B7280' }}
                          title="Edit"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button 
                          onClick={() => handleDeleteClick(c.id)}
                          style={{ padding: '0.5rem', background: 'transparent', border: 'none', cursor: 'pointer', color: '#EF4444' }}
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>

      {/* Add Category Card */}
      <motion.div className={styles.card} style={{ padding: '2rem', background: 'rgba(255, 255, 255, 0.4)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255, 255, 255, 0.6)' }} variants={itemVariants}>
        <h3 style={{ marginTop: 0, marginBottom: '1.5rem', color: '#111827', fontSize: '1.15rem', fontWeight: 600 }}>Add New Category</h3>
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
            <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.9rem', color: '#374151', fontWeight: 500 }}>Category Name</label>
            <input 
              type="text" 
              name="name" 
              placeholder="e.g. Birthday Bouquets"
              required 
              className={styles.input}
              style={{ width: '100%' }} 
            />
          </div>
          <motion.button 
            type="submit" 
            disabled={isPending}
            className={styles.submitBtn} 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.85rem', margin: '0.5rem 0 0 0', borderRadius: '8px' }}
          >
            <Plus size={18} />
            {isPending ? 'Adding...' : 'Add Category'}
          </motion.button>
        </form>
      </motion.div>
      
      <ConfirmModal
        isOpen={!!itemToDelete}
        title="Delete Category"
        message="Are you sure you want to delete this category? This action cannot be undone."
        confirmText="Delete"
        onConfirm={() => itemToDelete && confirmDelete(itemToDelete)}
        onCancel={() => setItemToDelete(null)}
      />
    </motion.div>
  );
}
