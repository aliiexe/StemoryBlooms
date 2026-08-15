'use client';

import React, { useTransition } from 'react';
import { motion } from 'framer-motion';
import { Users, Shield, User, Mail } from 'lucide-react';
import styles from '../dashboard.module.css';
import { updateUserRole } from './actions';

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05, delayChildren: 0.1 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } }
};

export default function UsersClient({ users }: { users: any[] }) {
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
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#111827', margin: 0 }}>User Management</h1>
          <p style={{ color: '#6B7280', margin: '0.25rem 0 0 0', fontSize: '0.95rem' }}>Review synced users and update their access levels.</p>
        </div>
      </header>

      <motion.div className={styles.card} style={{ padding: 0, background: 'rgba(255, 255, 255, 0.6)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255, 255, 255, 0.8)', overflow: 'hidden' }} variants={itemVariants}>
        <div style={{ overflowX: 'auto' }}>
          <table className={styles.table} style={{ margin: 0 }}>
            <thead>
              <tr>
                <th style={{ padding: '1rem 1.5rem', background: 'rgba(249, 250, 251, 0.5)', borderBottom: '1px solid #E5E7EB' }}>User</th>
                <th style={{ padding: '1rem 1.5rem', background: 'rgba(249, 250, 251, 0.5)', borderBottom: '1px solid #E5E7EB' }}>Role</th>
                <th style={{ padding: '1rem 1.5rem', background: 'rgba(249, 250, 251, 0.5)', borderBottom: '1px solid #E5E7EB', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user, i) => {
                const isAdmin = user.role?.name === 'ADMIN';
                const initials = user.firstName || user.lastName 
                  ? `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`
                  : 'U';

                return (
                  <motion.tr 
                    key={user.id}
                    whileHover={{ backgroundColor: 'rgba(255, 255, 255, 0.9)' }}
                    style={{ borderBottom: i === users.length - 1 ? 'none' : '1px solid #F3F4F6', transition: 'background-color 0.2s' }}
                  >
                    <td style={{ padding: '1.25rem 1.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ 
                          width: '40px', height: '40px', borderRadius: '50%', 
                          background: isAdmin ? 'linear-gradient(135deg, #10B981, #059669)' : 'linear-gradient(135deg, #6B7280, #4B5563)', 
                          color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', 
                          fontSize: '0.9rem', fontWeight: 700, 
                          boxShadow: isAdmin ? '0 4px 10px rgba(16, 185, 129, 0.2)' : 'none' 
                        }}>
                          {initials.toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, color: '#111827', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            {user.firstName || user.lastName ? `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() : '—'}
                            {isAdmin && <Shield size={14} color="#10B981" />}
                          </div>
                          <div style={{ color: '#6B7280', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.2rem' }}>
                            <Mail size={12} /> {user.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '1.25rem 1.5rem' }}>
                      <span style={{ 
                        display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
                        padding: '0.25rem 0.75rem', 
                        backgroundColor: isAdmin ? '#ECFDF5' : '#F3F4F6', 
                        color: isAdmin ? '#059669' : '#4B5563', 
                        borderRadius: '9999px', 
                        fontSize: '0.85rem', 
                        fontWeight: 600, 
                        border: `1px solid ${isAdmin ? '#D1FAE5' : '#E5E7EB'}` 
                      }}>
                        {isAdmin ? <Shield size={12} /> : <User size={12} />}
                        {user.role?.name ?? 'CUSTOMER'}
                      </span>
                    </td>
                    <td style={{ padding: '1.25rem 1.5rem', textAlign: 'right' }}>
                      <form action={updateUserRole}>
                        <input type="hidden" name="userId" value={user.id} />
                        <input type="hidden" name="nextRole" value={isAdmin ? 'CUSTOMER' : 'ADMIN'} />
                        <motion.button 
                          type="submit" 
                          whileHover={{ scale: 1.02, backgroundColor: isAdmin ? '#FEF2F2' : '#F0FDF4', color: isAdmin ? '#DC2626' : '#166534', borderColor: isAdmin ? '#FEE2E2' : '#DCFCE7' }}
                          whileTap={{ scale: 0.98 }}
                          style={{ 
                            border: '1px solid #E5E7EB', 
                            background: 'white', 
                            color: '#374151',
                            borderRadius: '8px', 
                            padding: '0.4rem 0.85rem', 
                            cursor: 'pointer',
                            fontSize: '0.85rem',
                            fontWeight: 500,
                            transition: 'all 0.2s'
                          }}
                        >
                          {isAdmin ? 'Demote to Customer' : 'Promote to Admin'}
                        </motion.button>
                      </form>
                    </td>
                  </motion.tr>
                );
              })}
              
              {users.length === 0 && (
                <tr>
                  <td colSpan={3} style={{ textAlign: 'center', padding: '4rem', color: '#6B7280' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                      <Users size={48} color="#D1D5DB" />
                      <p style={{ margin: 0, fontSize: '1.1rem' }}>No users synced yet.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </motion.div>
  );
}
