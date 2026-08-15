'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, ChevronLeft, ChevronRight, TrendingUp, TrendingDown, DollarSign, Package } from 'lucide-react';
import { useRouter } from 'next/navigation';
import styles from '../dashboard.module.css';
import { ExpenseForm } from './ExpenseForm';

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.1 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } }
};

interface FinanceProps {
  initialExpenses: any[];
  totalRevenue: number;
  totalDeliveryFees: number;
  totalExpenses: number;
  netProfit: number;
}

export function AdminFinancesClient({ 
  initialExpenses,
  totalRevenue,
  totalDeliveryFees,
  totalExpenses,
  netProfit
}: FinanceProps) {
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

  const formatMoney = (val: number) => {
    return new Intl.NumberFormat('en-MA', { style: 'currency', currency: 'MAD', maximumFractionDigits: 0 }).format(val);
  };

  return (
    <motion.div 
      className={styles.dashboard}
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#111827', margin: 0 }}>Financial Tracking</h1>
        <p style={{ color: '#6B7280', margin: '0.5rem 0 0 0', fontSize: '0.95rem' }}>Track revenue, business expenses, and net profit.</p>
      </header>

      {/* Metric Cards */}
      <motion.div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.25rem', marginBottom: '2rem' }} variants={itemVariants}>
        <div className={styles.metricCard} style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
              <span className={styles.metricLabel}>Total Revenue</span>
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.1)', color: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <TrendingUp size={18} />
              </div>
            </div>
            <div className={styles.metricValue}>{formatMoney(totalRevenue)}</div>
          </div>
          <div className={styles.metricTrend} style={{ color: '#6B7280', marginTop: '0.5rem' }}>Product sales only</div>
        </div>

        <div className={styles.metricCard} style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
              <span className={styles.metricLabel}>Delivery Fees</span>
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(245, 158, 11, 0.1)', color: '#F59E0B', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Package size={18} />
              </div>
            </div>
            <div className={styles.metricValue} style={{ color: '#D97706' }}>{formatMoney(totalDeliveryFees)}</div>
          </div>
          <div className={styles.metricTrend} style={{ color: '#6B7280', marginTop: '0.5rem' }}>Passed to carrier</div>
        </div>

        <div className={styles.metricCard} style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
              <span className={styles.metricLabel}>Total Expenses</span>
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.1)', color: '#EF4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <TrendingDown size={18} />
              </div>
            </div>
            <div className={styles.metricValue} style={{ color: '#DC2626' }}>{formatMoney(totalExpenses)}</div>
          </div>
          <div className={styles.metricTrend} style={{ color: 'transparent', marginTop: '0.5rem', userSelect: 'none' }}>-</div>
        </div>

        <div className={styles.metricCard} style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between', background: netProfit >= 0 ? 'rgba(240, 253, 244, 0.5)' : 'rgba(254, 242, 242, 0.5)' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
              <span className={styles.metricLabel} style={{ color: netProfit >= 0 ? '#166534' : '#991B1B' }}>Net Profit</span>
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: netProfit >= 0 ? 'rgba(22, 101, 52, 0.1)' : 'rgba(153, 27, 27, 0.1)', color: netProfit >= 0 ? '#166534' : '#991B1B', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <DollarSign size={18} />
              </div>
            </div>
            <div className={styles.metricValue} style={{ color: netProfit >= 0 ? '#15803D' : '#DC2626' }}>{formatMoney(netProfit)}</div>
          </div>
          <div className={styles.metricTrend} style={{ color: 'transparent', marginTop: '0.5rem', userSelect: 'none' }}>-</div>
        </div>
      </motion.div>

      {/* Expenses Table */}
      <motion.div className={styles.card} style={{ background: 'rgba(255, 255, 255, 0.6)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255, 255, 255, 0.8)', overflow: 'hidden', padding: 0 }} variants={itemVariants}>
        <div style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #E5E7EB' }}>
          <h3 style={{ margin: 0, color: '#111827', fontSize: '1.25rem', fontWeight: 600 }}>Logged Expenses</h3>
          <motion.button 
            onClick={openAddModal}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            style={{ 
              background: 'var(--brand-primary)',
              color: 'white',
              border: 'none',
              padding: '0.6rem 1rem',
              borderRadius: '8px',
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
            }}
          >
            <Plus size={16} /> Log Expense
          </motion.button>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className={styles.table} style={{ margin: 0 }}>
            <thead>
              <tr>
                <th style={{ background: 'rgba(249, 250, 251, 0.5)', padding: '1rem 1.5rem' }}>Date</th>
                <th style={{ background: 'rgba(249, 250, 251, 0.5)', padding: '1rem 1.5rem' }}>Description</th>
                <th style={{ background: 'rgba(249, 250, 251, 0.5)', padding: '1rem 1.5rem' }}>Category</th>
                <th style={{ background: 'rgba(249, 250, 251, 0.5)', padding: '1rem 1.5rem' }}>Amount</th>
                <th style={{ background: 'rgba(249, 250, 251, 0.5)', padding: '1rem 1.5rem', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentExpenses.map((e, i) => (
                <motion.tr 
                  key={e.id}
                  whileHover={{ backgroundColor: 'rgba(255, 255, 255, 0.9)' }}
                  style={{ borderBottom: i === currentExpenses.length - 1 ? 'none' : '1px solid #F3F4F6' }}
                >
                  <td style={{ padding: '1rem 1.5rem', color: '#4B5563' }}>{new Intl.DateTimeFormat('en-GB').format(new Date(e.date))}</td>
                  <td style={{ padding: '1rem 1.5rem', fontWeight: 500, color: '#111827' }}>{e.description}</td>
                  <td style={{ padding: '1rem 1.5rem' }}>
                    <span style={{ padding: '0.25rem 0.75rem', backgroundColor: '#F3F4F6', color: '#4B5563', borderRadius: '9999px', fontSize: '0.85rem', fontWeight: 500 }}>
                      {e.category}
                    </span>
                  </td>
                  <td style={{ padding: '1rem 1.5rem', color: '#DC2626', fontWeight: 600 }}>-{formatMoney(e.amount)}</td>
                  <td style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>
                    <button 
                      onClick={() => openEditModal(e)}
                      style={{ background: 'none', border: 'none', color: 'var(--brand-primary)', cursor: 'pointer', fontWeight: 500, padding: '0.25rem 0.5rem', borderRadius: '4px' }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(46, 125, 50, 0.05)')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      Edit
                    </button>
                  </td>
                </motion.tr>
              ))}
              {initialExpenses.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '4rem', color: '#6B7280' }}>
                    No expenses logged yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination controls */}
        {totalPages > 1 && (
          <div style={{ padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #E5E7EB', background: 'rgba(249, 250, 251, 0.3)' }}>
            <span style={{ fontSize: '0.9rem', color: '#6B7280' }}>
              Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, initialExpenses.length)} of {initialExpenses.length}
            </span>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button 
                onClick={handlePrevPage} 
                disabled={currentPage === 1}
                className={styles.paginationBtn}
              >
                <ChevronLeft size={18} />
              </button>
              <span style={{ display: 'flex', alignItems: 'center', padding: '0 0.5rem', fontSize: '0.9rem', color: '#4B5563', fontWeight: 500 }}>
                Page {currentPage} of {totalPages}
              </span>
              <button 
                onClick={handleNextPage} 
                disabled={currentPage === totalPages}
                className={styles.paginationBtn}
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </motion.div>

      {/* Modal logic omitted for brevity, assuming it renders properly as a controlled overlay */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ 
              position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
              backgroundColor: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              zIndex: 100 
            }}
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className={styles.modal} 
              style={{ width: '400px', maxWidth: '90vw', background: 'white', borderRadius: '16px', boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}
            >
              <ExpenseForm 
                expense={editingExpense} 
                onSaved={handleSaved} 
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
