"use client";

import React, { useState, useRef, useEffect, useTransition } from 'react';
import { Bell, Check, Trash2 } from 'lucide-react';
import styles from './admin.module.css';
import { getNotifications, markNotificationAsRead, markAllNotificationsAsRead, deleteNotification } from './actions/notifications';

export function AdminNotifications() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    // Fetch notifications on mount
    getNotifications().then(setNotifications).catch(console.error);
    
    // Optional: could set up an interval here for polling, but simple fetch on mount + action revalidations is okay for now.
  }, []);

  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleMarkAsRead = async (id: string) => {
    setNotifications(notifications.map(n => n.id === id ? { ...n, isRead: true } : n));
    startTransition(() => {
      markNotificationAsRead(id);
    });
  };

  const handleMarkAllAsRead = async () => {
    setNotifications(notifications.map(n => ({ ...n, isRead: true })));
    startTransition(() => {
      markAllNotificationsAsRead();
    });
  };

  const handleDelete = async (id: string) => {
    setNotifications(notifications.filter(n => n.id !== id));
    startTransition(() => {
      deleteNotification(id);
    });
  };

  return (
    <div className={styles.notificationsWrapper} ref={dropdownRef} style={{ position: 'relative' }}>
      <button 
        className={styles.topBarIcon} 
        aria-label="Notifications"
        onClick={() => setIsOpen(!isOpen)}
        style={{ position: 'relative', cursor: 'pointer', background: 'none', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute',
            top: '0px',
            right: '0px',
            backgroundColor: '#E65100',
            color: 'white',
            borderRadius: '50%',
            width: '8px',
            height: '8px',
            display: 'block'
          }} />
        )}
      </button>

      {isOpen && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 8px)',
          right: '-10px',
          width: '320px',
          backgroundColor: '#FFFFFF',
          border: '1px solid #EAE6DF',
          borderRadius: '16px',
          boxShadow: '0 10px 40px rgba(0,0,0,0.08)',
          zIndex: 50,
          overflow: 'hidden'
        }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            padding: '1rem',
            borderBottom: '1px solid #EAE6DF',
            backgroundColor: '#FAFAFA'
          }}>
            <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600, color: '#3A3531' }}>Notifications</h3>
            {unreadCount > 0 && (
              <button 
                onClick={handleMarkAllAsRead}
                style={{ background: 'none', border: 'none', color: '#1565C0', fontSize: '0.8rem', cursor: 'pointer', padding: 0 }}
              >
                Mark all as read
              </button>
            )}
          </div>
          
          <div style={{ maxHeight: '360px', overflowY: 'auto' }}>
            {notifications.length === 0 ? (
              <div style={{ padding: '2rem 1rem', textAlign: 'center', color: '#7A7571', fontSize: '0.9rem' }}>
                You have no notifications.
              </div>
            ) : (
              notifications.map((n) => (
                <div key={n.id} style={{
                  padding: '1rem',
                  borderBottom: '1px solid #F5F5F5',
                  backgroundColor: n.isRead ? '#FFFFFF' : '#F5FBFF',
                  display: 'flex',
                  gap: '0.75rem',
                  transition: 'background-color 0.2s'
                }}>
                  <div style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: n.isRead ? 'transparent' : '#1565C0',
                    marginTop: '0.4rem',
                    flexShrink: 0
                  }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                      <strong style={{ fontSize: '0.9rem', color: '#3A3531' }}>{n.title}</strong>
                      <span style={{ fontSize: '0.75rem', color: '#9A9591' }}>{new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <p style={{ fontSize: '0.85rem', color: '#5A5551', margin: '0 0 0.5rem 0', lineHeight: 1.4 }}>
                      {n.message}
                    </p>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      {!n.isRead && (
                        <button 
                          onClick={() => handleMarkAsRead(n.id)}
                          style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', background: 'none', border: 'none', color: '#1565C0', fontSize: '0.75rem', cursor: 'pointer', padding: 0 }}
                        >
                          <Check size={12} /> Mark as read
                        </button>
                      )}
                      <button 
                        onClick={() => handleDelete(n.id)}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', background: 'none', border: 'none', color: '#9A9591', fontSize: '0.75rem', cursor: 'pointer', padding: 0 }}
                      >
                        <Trash2 size={12} /> Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
