'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ExpenseForm } from './ExpenseForm';

interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  expense?: any;
}

export function ExpenseModal({ isOpen, onClose, expense }: ExpenseModalProps) {
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2 style={{ margin: 0, color: '#3A3531', fontSize: '1.25rem' }}>
              {expense ? 'Edit Expense' : 'Log Manual Expense'}
            </h2>
            <button 
              onClick={onClose}
              style={{ background: 'none', border: 'none', fontSize: '1.25rem', cursor: 'pointer', color: '#7A7571' }}
            >
              ✕
            </button>
          </div>
          
          <ExpenseForm expense={expense} onSaved={onClose} />
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
