'use client';

import React, {  useState, useTransition  } from 'react';
import { useSearchParams } from 'next/navigation';
import { saveSupplier, deleteSupplier } from './actions';
import styles from '../dashboard.module.css';

interface Supplier {
  id: string;
  name: string;
  contactName: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  createdAt: Date;
}

export function AdminSuppliersClient({ initialSuppliers }: { initialSuppliers: Supplier[] }) {
  const searchParams = useSearchParams();
  const page = Number(searchParams.get('page')) || 1;
  const limit = Number(searchParams.get('limit')) || 10;

  const [suppliers, setSuppliers] = useState<Supplier[]>(initialSuppliers);
  const [isPending, startTransition] = useTransition();
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredSuppliers = suppliers.filter(s =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.contactName && s.contactName.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (s.email && s.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className={styles.dashboard}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontFamily: 'var(--font-editorial)', fontWeight: 500, margin: 0 }}>Supplier Management</h1>
          <p style={{ color: '#7A7571', fontSize: '0.9rem', marginTop: '0.25rem' }}>Manage raw material vendors and suppliers</p>
        </div>
        <button
          onClick={() => { setEditingSupplier(null); setIsAdding(true); }}
          className={styles.submitBtn}
          style={{ width: 'auto', padding: '0.75rem 1.25rem', margin: 0 }}
        >
          + Add Supplier
        </button>
      </header>

      {(isAdding || editingSupplier) && (
        <div className={styles.card} style={{ marginBottom: '2rem' }}>
          <h3 className={styles.cardTitle}>{editingSupplier ? 'Edit Supplier' : 'New Supplier'}</h3>
          <form action={async (formData) => {
            startTransition(async () => {
              const res = await saveSupplier(formData);
              if (res?.success) {
                setIsAdding(false);
                setEditingSupplier(null);
                window.location.reload();
              }
            });
          }} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
            {editingSupplier && <input type="hidden" name="id" value={editingSupplier.id} />}
            
            <div>
              <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.9rem', color: '#5A5551' }}>Company Name *</label>
              <input name="name" required defaultValue={editingSupplier?.name ?? ''} placeholder="e.g. Floral Imports Ltd" style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '10px', border: '1px solid #D6CFE6' }} />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.9rem', color: '#5A5551' }}>Contact Person</label>
              <input name="contactName" defaultValue={editingSupplier?.contactName ?? ''} placeholder="e.g. Hassan Amrani" style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '10px', border: '1px solid #D6CFE6' }} />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.9rem', color: '#5A5551' }}>Email</label>
              <input name="email" type="email" defaultValue={editingSupplier?.email ?? ''} placeholder="supplier@example.com" style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '10px', border: '1px solid #D6CFE6' }} />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.9rem', color: '#5A5551' }}>Phone</label>
              <input name="phone" defaultValue={editingSupplier?.phone ?? ''} placeholder="06 12 34 56 78" style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '10px', border: '1px solid #D6CFE6' }} />
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.9rem', color: '#5A5551' }}>Address</label>
              <input name="address" defaultValue={editingSupplier?.address ?? ''} placeholder="Industrial Zone, Casablanca" style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '10px', border: '1px solid #D6CFE6' }} />
            </div>

            <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
              <button type="button" onClick={() => { setIsAdding(false); setEditingSupplier(null); }} style={{ padding: '0.75rem 1.25rem', borderRadius: '10px', border: '1px solid #EAE6DF', background: '#F8F6F2', cursor: 'pointer' }}>Cancel</button>
              <button type="submit" disabled={isPending} className={styles.submitBtn} style={{ width: 'auto', margin: 0, padding: '0.75rem 1.5rem' }}>
                {isPending ? 'Saving...' : 'Save Supplier'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className={styles.card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <input
            type="text"
            placeholder="Search suppliers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ padding: '0.65rem 1rem', borderRadius: '10px', border: '1px solid #D6CFE6', width: '280px', fontSize: '0.9rem' }}
          />
          <span style={{ fontSize: '0.85rem', color: '#7A7571' }}>{filteredSuppliers.length} supplier(s)</span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Company Name</th>
                <th>Contact Person</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Address</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredSuppliers.map((sup) => (
                <tr key={sup.id}>
                  <td><strong>{sup.name}</strong></td>
                  <td>{sup.contactName || '-'}</td>
                  <td>{sup.email || '-'}</td>
                  <td>{sup.phone || '-'}</td>
                  <td>{sup.address || '-'}</td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                      <button
                        onClick={() => { setEditingSupplier(sup); setIsAdding(false); }}
                        style={{ padding: '0.4rem 0.75rem', borderRadius: '6px', border: '1px solid #D6CFE6', background: 'white', cursor: 'pointer', fontSize: '0.85rem' }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={async () => {
                          if (confirm(`Delete supplier "${sup.name}"?`)) {
                            startTransition(async () => {
                              await deleteSupplier(sup.id);
                              setSuppliers(prev => prev.filter(s => s.id !== sup.id));
                            });
                          }
                        }}
                        style={{ padding: '0.4rem 0.75rem', borderRadius: '6px', border: '1px solid #FFEBEE', background: '#FFEBEE', color: '#C62828', cursor: 'pointer', fontSize: '0.85rem' }}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredSuppliers.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', color: '#7A7571', padding: '2rem' }}>
                    No suppliers found. Click "+ Add Supplier" to create one.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
