'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Mail, Clock, ShieldCheck, MailCheck } from 'lucide-react';
import styles from '../dashboard.module.css';

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05, delayChildren: 0.1 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } }
};

export default function WaitlistClient({ waitlist }: { waitlist: any[] }) {
  return (
    <motion.div 
      className={styles.dashboard}
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      <header style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'linear-gradient(135deg, var(--brand-primary), #6366F1)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 16px rgba(99, 102, 241, 0.2)' }}>
          <MailCheck color="white" size={24} />
        </div>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#111827', margin: 0 }}>Waitlist Subscribers</h1>
          <p style={{ color: '#6B7280', margin: '0.25rem 0 0 0', fontSize: '0.95rem' }}>View the {waitlist.length} people waiting for Stemory Blooms.</p>
        </div>
      </header>

      <motion.div className={styles.card} style={{ padding: 0, background: 'rgba(255, 255, 255, 0.6)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255, 255, 255, 0.8)', overflow: 'hidden' }} variants={itemVariants}>
        <div style={{ overflowX: 'auto' }}>
          <table className={styles.table} style={{ margin: 0 }}>
            <thead>
              <tr>
                <th style={{ padding: '1rem 1.5rem', background: 'rgba(249, 250, 251, 0.5)', borderBottom: '1px solid #E5E7EB' }}>Email</th>
                <th style={{ padding: '1rem 1.5rem', background: 'rgba(249, 250, 251, 0.5)', borderBottom: '1px solid #E5E7EB' }}>Date Joined</th>
                <th style={{ padding: '1rem 1.5rem', background: 'rgba(249, 250, 251, 0.5)', borderBottom: '1px solid #E5E7EB', textAlign: 'right' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {waitlist.map((w, i) => (
                <motion.tr 
                  key={w.id}
                  whileHover={{ backgroundColor: 'rgba(255, 255, 255, 0.9)' }}
                  style={{ borderBottom: i === waitlist.length - 1 ? 'none' : '1px solid #F3F4F6', transition: 'background-color 0.2s' }}
                >
                  <td style={{ padding: '1.25rem 1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(99, 102, 241, 0.1)', color: '#4F46E5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Mail size={16} />
                      </div>
                      <div style={{ fontWeight: 600, color: '#111827', fontSize: '1rem' }}>
                        {w.email}
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '1.25rem 1.5rem', color: '#4B5563', fontSize: '0.9rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Clock size={14} color="#9CA3AF" />
                      {new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(w.createdAt))}
                    </div>
                  </td>
                  <td style={{ padding: '1.25rem 1.5rem', textAlign: 'right' }}>
                    <span style={{ 
                      display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
                      padding: '0.25rem 0.75rem', 
                      backgroundColor: '#ECFDF5', 
                      color: '#059669', 
                      borderRadius: '9999px', 
                      fontSize: '0.85rem', 
                      fontWeight: 600, 
                      border: '1px solid #D1FAE5'
                    }}>
                      <ShieldCheck size={12} />
                      Active
                    </span>
                  </td>
                </motion.tr>
              ))}
              
              {waitlist.length === 0 && (
                <tr>
                  <td colSpan={3} style={{ textAlign: 'center', padding: '4rem', color: '#6B7280' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                      <MailCheck size={48} color="#D1D5DB" />
                      <p style={{ margin: 0, fontSize: '1.1rem' }}>No waitlist subscribers yet.</p>
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
