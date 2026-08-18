"use client";

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDestructive?: boolean;
}

export default function ConfirmModal({
  isOpen, title, message, confirmText = 'Confirm', cancelText = 'Cancel', onConfirm, onCancel, isDestructive = true
}: ConfirmModalProps) {
  
  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isOpen && e.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', handleKeyDown);
    
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onCancel]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 99999, padding: '1rem'
        }}>
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCancel}
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}
          />

          {/* Modal */}
          <motion.div 
            initial={{ scale: 0.95, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 10 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            style={{
              position: 'relative', width: '100%', maxWidth: '400px',
              background: 'white', borderRadius: '16px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
              overflow: 'hidden'
            }}
          >
            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ 
                  width: '40px', height: '40px', borderRadius: '50%', 
                  background: isDestructive ? '#FEE2E2' : '#E0F2FE', 
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <AlertTriangle size={20} color={isDestructive ? '#DC2626' : '#2563EB'} />
                </div>
                <button 
                  onClick={onCancel}
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px', borderRadius: '50%', color: '#9CA3AF' }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = '#F3F4F6'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <X size={20} />
                </button>
              </div>

              <div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600, color: '#111827' }}>{title}</h3>
                <p style={{ margin: '0.5rem 0 0', color: '#6B7280', fontSize: '0.9rem', lineHeight: 1.5 }}>
                  {message}
                </p>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button 
                  onClick={onCancel}
                  style={{ 
                    flex: 1, padding: '0.6rem 1rem', borderRadius: '8px', 
                    background: '#F3F4F6', color: '#374151', border: '1px solid #E5E7EB',
                    fontWeight: 500, cursor: 'pointer', fontSize: '0.9rem'
                  }}
                >
                  {cancelText}
                </button>
                <button 
                  onClick={onConfirm}
                  style={{ 
                    flex: 1, padding: '0.6rem 1rem', borderRadius: '8px', 
                    background: isDestructive ? '#DC2626' : '#1B5E20', color: 'white', border: 'none',
                    fontWeight: 500, cursor: 'pointer', fontSize: '0.9rem'
                  }}
                >
                  {confirmText}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
