'use client';

import React, { useState } from 'react';
import { Plus, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import styles from '../dashboard.module.css';
import { ExpenseForm } from './ExpenseForm';

export function AdminFinancesClient({ initialExpenses }: { initialExpenses: any[] }) {
  const router = useRouter();
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<any>(null);

  // Pagination Logic
  const totalPages = Math.max(1, Math.ceil(initialExpenses.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentExpenses = initialExpenses.slice(startIndex, startIndex + itemsPerPage);

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(p => p + 1);
  };

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage(p => p - 1);
  };

  const openAddModal = () => {
    setEditingExpense(null);
    setIsModalOpen(true);
  };

  const openEditModal = (expense: any) => {
    setEditingExpense(expense);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingExpense(null);
  };

  const handleSaved = () => {
    closeModal();
    router.refresh();
  };

  return (
    <>
      <div className={styles.card} style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h3 style={{ margin: 0, color: '#3A3531', fontSize: '1.25rem' }}>Expenses ({initialExpenses.length})</h3>
          <button 
            onClick={openAddModal}
            className={styles.actionButton} 
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <Plus size={16} /> Log Expense
          </button>
        </div>

        <div style={{ overflowX: 'auto', flex: 1 }}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Date</th>
                <th>Description</th>
                <th>Category</th>
                <th>Amount</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentExpenses.map((e) => (
                <tr key={e.id}>
                  <td>{new Intl.DateTimeFormat('en-GB').format(new Date(e.date))}</td>
                  <td><strong>{e.description}</strong></td>
                  <td><span style={{ padding: '0.25rem 0.5rem', backgroundColor: '#F5F5F5', borderRadius: '4px', fontSize: '0.8rem' }}>{e.category}</span></td>
                  <td style={{ color: '#C62828', fontWeight: 500 }}>-{e.amount} MAD</td>
                  <td style={{ textAlign: 'right' }}>
                    <button 
                      onClick={() => openEditModal(e)}
                      style={{ background: 'none', border: 'none', color: 'var(--brand-primary)', cursor: 'pointer', textDecoration: 'underline' }}
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
              {initialExpenses.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '3rem', color: '#7A7571' }}>No expenses logged yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {initialExpenses.length > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid #EAE6DF' }}>
            <span style={{ fontSize: '0.9rem', color: '#7A7571' }}>
              Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, initialExpenses.length)} of {initialExpenses.length}
            </span>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button 
                onClick={handlePrevPage} 
                disabled={currentPage === 1}
                className={styles.modeBtn}
                style={{ padding: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <ChevronLeft size={18} />
              </button>
              <span style={{ display: 'flex', alignItems: 'center', padding: '0 0.5rem', fontSize: '0.9rem', color: '#3A3531' }}>
                Page {currentPage} of {totalPages}
              </span>
              <button 
                onClick={handleNextPage} 
                disabled={currentPage === totalPages}
                className={styles.modeBtn}
                style={{ padding: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal Overlay */}
      {isModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '1rem'
        }}>
          <div style={{
            backgroundColor: '#fff',
            borderRadius: '12px',
            width: '100%',
            maxWidth: '500px',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '2rem',
            position: 'relative',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
          }}>
            <button 
              onClick={closeModal}
              style={{
                position: 'absolute',
                top: '1.5rem',
                right: '1.5rem',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#7A7571'
              }}
            >
              <X size={20} />
            </button>
            
            <h2 style={{ margin: '0 0 1.5rem 0', fontSize: '1.5rem', color: '#3A3531' }}>
              {editingExpense ? 'Edit Expense' : 'Log Expense'}
            </h2>
            
            <ExpenseForm 
              expense={editingExpense} 
              onSaved={handleSaved} 
            />
          </div>
        </div>
      )}
    </>
  );
}
