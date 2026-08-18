'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { saveMaterial } from '../materials/actions';

import { CustomSelect } from '../../../components/ui/CustomSelect';

interface MaterialModalProps {
  isOpen: boolean;
  onClose: () => void;
  suppliers?: { id: string; name: string }[];
}

export function MaterialModal({ isOpen, onClose, suppliers }: MaterialModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [supplierId, setSupplierId] = useState('');

  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }} 
          style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(2px)' }} 
          onClick={onClose}
        />
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }} 
          animate={{ opacity: 1, scale: 1, y: 0 }} 
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          style={{ position: 'relative', width: '100%', maxWidth: '500px', backgroundColor: '#fff', borderRadius: '16px', padding: '2rem', boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}
        >
          <h2 style={{ margin: '0 0 1.5rem 0', color: '#3A3531', fontSize: '1.25rem' }}>Add New Material</h2>
          
          <form
            action={async (formData) => {
              setIsSubmitting(true);
              const res = await saveMaterial(formData);
              if (res?.error) setError(res.error);
              else { setError(null); onClose(); }
              setIsSubmitting(false);
            }}
            style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
          >
            {error && <div style={{ color: '#D32F2F', backgroundColor: '#FFEBEE', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.9rem' }}>{error}</div>}
            
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: '#5A5551', fontSize: '0.9rem' }}>Material Name</label>
              <input type="text" name="name" required style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #D6CFE6' }} />
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: '#5A5551', fontSize: '0.9rem' }}>Quantity</label>
                <input type="number" name="quantity" defaultValue={0} required className="no-spinners" style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #D6CFE6' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: '#5A5551', fontSize: '0.9rem' }}>Cost (MAD)</label>
                <input type="number" step="0.01" name="cost" required className="no-spinners" style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #D6CFE6' }} />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: '#5A5551', fontSize: '0.9rem' }}>Supplier</label>
              <CustomSelect
                name="supplierId"
                value={supplierId}
                onChange={setSupplierId}
                options={[
                  { value: '', label: 'No Supplier Selected' },
                  ...(suppliers?.map(sup => ({ value: sup.id, label: sup.name })) || [])
                ]}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: '#5A5551', fontSize: '0.9rem' }}>Low Stock Alert Threshold</label>
              <input type="number" name="lowStockThreshold" placeholder="e.g. 10" className="no-spinners" style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #D6CFE6' }} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
              <button type="button" onClick={onClose} style={{ padding: '0.75rem 1.5rem', borderRadius: '8px', border: '1px solid #D6CFE6', backgroundColor: '#fff', cursor: 'pointer' }}>Cancel</button>
              <button type="submit" disabled={isSubmitting} style={{ padding: '0.75rem 1.5rem', borderRadius: '8px', border: 'none', backgroundColor: 'var(--brand-primary)', color: '#fff', cursor: 'pointer' }}>
                {isSubmitting ? 'Saving...' : 'Add Material'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
