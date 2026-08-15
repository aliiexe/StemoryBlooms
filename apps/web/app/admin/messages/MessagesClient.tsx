'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Mail, CheckCircle2, Circle, Clock } from 'lucide-react';
import styles from '../dashboard.module.css';
import { MessageActions } from './MessageActions';

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.1 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } }
};

export default function MessagesClient({ messages }: { messages: any[] }) {
  const unreadCount = messages.filter(m => m.status === 'UNREAD').length;

  return (
    <motion.div 
      className={styles.dashboard}
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      <header style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(99, 102, 241, 0.1)', color: '#4F46E5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Mail size={24} />
        </div>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#111827', margin: 0 }}>Support Messages</h1>
          <p style={{ color: '#6B7280', margin: '0.25rem 0 0 0', fontSize: '0.95rem' }}>
            {unreadCount > 0 
              ? `You have ${unreadCount} unread message${unreadCount !== 1 ? 's' : ''}.` 
              : "You're all caught up!"}
          </p>
        </div>
      </header>

      <div style={{ display: 'grid', gap: '1rem' }}>
        {messages.map((m, i) => (
          <motion.div 
            key={m.id}
            variants={itemVariants}
            whileHover={{ y: -2 }}
            style={{ 
              background: m.status === 'UNREAD' ? 'rgba(255, 255, 255, 0.95)' : 'rgba(255, 255, 255, 0.5)', 
              backdropFilter: 'blur(16px)', 
              border: m.status === 'UNREAD' ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(255, 255, 255, 0.8)', 
              borderRadius: '16px',
              padding: '1.5rem',
              boxShadow: m.status === 'UNREAD' ? '0 10px 25px rgba(16, 185, 129, 0.1)' : '0 4px 12px rgba(0,0,0,0.03)',
              transition: 'all 0.2s',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            {m.status === 'UNREAD' && (
              <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: '4px', background: 'var(--brand-primary)' }} />
            )}
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(99, 102, 241, 0.1)', color: '#4F46E5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', fontWeight: 700 }}>
                  {m.firstName[0]}{m.lastName ? m.lastName[0] : ''}
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: m.status === 'UNREAD' ? 700 : 500, color: '#111827' }}>{m.firstName} {m.lastName}</h3>
                  <a href={`mailto:${m.email}`} style={{ color: '#6B7280', fontSize: '0.9rem', textDecoration: 'none' }}>{m.email}</a>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: '#9CA3AF' }}>
                  <Clock size={14} />
                  {new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(m.createdAt))}
                </div>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.35rem', 
                  fontSize: '0.75rem', 
                  fontWeight: 600, 
                  padding: '0.2rem 0.6rem', 
                  borderRadius: '9999px',
                  background: m.status === 'UNREAD' ? '#FEF3C7' : m.status === 'READ' ? '#E0F2FE' : '#F3F4F6',
                  color: m.status === 'UNREAD' ? '#D97706' : m.status === 'READ' ? '#0369A1' : '#4B5563'
                }}>
                  {m.status === 'UNREAD' ? <Circle size={10} fill="currentColor" /> : <CheckCircle2 size={12} />}
                  {m.status}
                </div>
              </div>
            </div>

            <div style={{ marginLeft: '3.5rem' }}>
              <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem', fontWeight: 600, color: '#374151' }}>{m.subject.toUpperCase()}</h4>
              <p style={{ margin: 0, color: '#4B5563', lineHeight: 1.6, fontSize: '0.95rem' }}>{m.message}</p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid #F3F4F6', marginTop: '0.5rem', paddingTop: '1rem' }}>
              <MessageActions id={m.id} status={m.status} />
            </div>
          </motion.div>
        ))}

        {messages.length === 0 && (
          <motion.div variants={itemVariants} style={{ padding: '4rem', textAlign: 'center', background: 'rgba(255,255,255,0.4)', borderRadius: '16px' }}>
            <Mail size={48} color="#D1D5DB" style={{ marginBottom: '1rem' }} />
            <h3 style={{ margin: 0, color: '#4B5563', fontSize: '1.25rem' }}>No messages</h3>
            <p style={{ color: '#9CA3AF' }}>Your inbox is empty.</p>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
