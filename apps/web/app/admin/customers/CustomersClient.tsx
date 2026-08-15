'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Users, Mail, Phone, Calendar } from 'lucide-react';
import styles from '../dashboard.module.css';

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05, delayChildren: 0.1 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } }
};

export default function CustomersClient({ customers }: { customers: any[] }) {
  return (
    <motion.div 
      className={styles.dashboard}
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      <header style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'linear-gradient(135deg, var(--brand-primary), #4CAF50)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 16px rgba(46, 125, 50, 0.2)' }}>
          <Users color="white" size={24} />
        </div>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#111827', margin: 0 }}>Customers</h1>
          <p style={{ color: '#6B7280', margin: '0.25rem 0 0 0', fontSize: '0.95rem' }}>Manage your {customers.length} registered customers.</p>
        </div>
      </header>

      <motion.div className={styles.card} style={{ padding: 0, background: 'rgba(255, 255, 255, 0.6)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255, 255, 255, 0.8)', overflow: 'hidden' }} variants={itemVariants}>
        <table className={styles.table} style={{ margin: 0 }}>
          <thead>
            <tr>
              <th style={{ padding: '1rem 1.5rem', background: 'rgba(249, 250, 251, 0.5)', borderBottom: '1px solid #E5E7EB' }}>Customer</th>
              <th style={{ padding: '1rem 1.5rem', background: 'rgba(249, 250, 251, 0.5)', borderBottom: '1px solid #E5E7EB' }}>Contact Info</th>
              <th style={{ padding: '1rem 1.5rem', background: 'rgba(249, 250, 251, 0.5)', borderBottom: '1px solid #E5E7EB', textAlign: 'center' }}>Total Orders</th>
              <th style={{ padding: '1rem 1.5rem', background: 'rgba(249, 250, 251, 0.5)', borderBottom: '1px solid #E5E7EB' }}>Joined</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((c, i) => {
              const initials = c.firstName[0] + (c.lastName ? c.lastName[0] : '');
              return (
                <motion.tr 
                  key={c.id}
                  whileHover={{ backgroundColor: 'rgba(255, 255, 255, 0.9)' }}
                  style={{ borderBottom: i === customers.length - 1 ? 'none' : '1px solid #F3F4F6', transition: 'background-color 0.2s' }}
                >
                  <td style={{ padding: '1.25rem 1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg, #1E3A8A, #3B82F6)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', fontWeight: 700, boxShadow: '0 4px 10px rgba(59, 130, 246, 0.2)' }}>
                        {initials.toUpperCase()}
                      </div>
                      <div style={{ fontWeight: 600, color: '#111827', fontSize: '1rem' }}>
                        {c.firstName} {c.lastName}
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '1.25rem 1.5rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#4B5563', fontSize: '0.9rem' }}>
                        <Phone size={14} color="#9CA3AF" /> {c.phone}
                      </div>
                      {c.email && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#4B5563', fontSize: '0.9rem' }}>
                          <Mail size={14} color="#9CA3AF" /> {c.email}
                        </div>
                      )}
                    </div>
                  </td>
                  <td style={{ padding: '1.25rem 1.5rem', textAlign: 'center' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: '#F0FDF4', color: '#166534', padding: '0.25rem 0.75rem', borderRadius: '9999px', fontSize: '0.85rem', fontWeight: 600, border: '1px solid #DCFCE7' }}>
                      {c.orders?.length || 0}
                    </span>
                  </td>
                  <td style={{ padding: '1.25rem 1.5rem', color: '#6B7280', fontSize: '0.9rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Calendar size={14} /> {new Date(c.createdAt).toLocaleDateString()}
                    </div>
                  </td>
                </motion.tr>
              );
            })}
            {customers.length === 0 && (
              <tr>
                <td colSpan={4} style={{ textAlign: 'center', padding: '4rem', color: '#6B7280' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                    <Users size={48} color="#D1D5DB" />
                    <p style={{ margin: 0, fontSize: '1.1rem' }}>No customers found</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </motion.div>
    </motion.div>
  );
}
