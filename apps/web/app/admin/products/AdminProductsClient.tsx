'use client';

import React, {  useState, useTransition  } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { quickUpdateProduct, deleteProduct } from './actions';
import styles from '../dashboard.module.css';
import ConfirmModal from '../components/ConfirmModal';

interface Product {
  id: string;
  name: string;
  basePrice: number;
  salePrice: number | null;
  images: string[] | null;
  status: string;
  stock: number;
  isSaleEnabled: boolean;
}

export function AdminProductsClient({ initialProducts }: { initialProducts: Product[] }) {

  const [products, setProducts] = useState(initialProducts);
  const [isPending, startTransition] = useTransition();
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  const handleUpdate = (id: string, updates: Partial<Product>) => {
    // Optimistic UI update
    setProducts(current =>
      current.map(p => (p.id === id ? { ...p, ...updates } : p))
    );
    startTransition(() => {
      quickUpdateProduct(id, updates);
    });
  };

  const confirmDelete = async (id: string) => {
    setItemToDelete(null);
    setProducts(current => current.filter(p => p.id !== id));
    startTransition(() => {
      deleteProduct(id);
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'MAD' }).format(amount);
  };

  if (products.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 2rem', backgroundColor: '#fff', borderRadius: '16px', border: '1px solid #EAE6DF' }}>
        <p style={{ color: '#7A7571', fontSize: '1.1rem', marginBottom: '1rem' }}>No products found.</p>
        <Link href="/admin/products/new" className={styles.submitBtn} style={{ textDecoration: 'none', display: 'inline-block' }}>
          Create your first product
        </Link>
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
      {products.map((p) => {
        const imageUrl = Array.isArray(p.images) && p.images.length > 0 ? p.images[0] : '/hero-bouquet.png';

        return (
          <div key={p.id} style={{ backgroundColor: '#fff', borderRadius: '16px', border: '1px solid #EAE6DF', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div style={{ position: 'relative', width: '100%', aspectRatio: '1/1', backgroundColor: '#F9F8F6' }}>
              <Image src={imageUrl} alt={p.name} fill style={{ objectFit: 'cover' }} />
              {p.stock === 0 && (
                <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ color: '#fff', fontWeight: 700, fontSize: '1rem', letterSpacing: '0.08em', textTransform: 'uppercase', backgroundColor: '#C62828', padding: '0.4rem 1rem', borderRadius: '6px' }}>Sold Out</span>
                </div>
              )}
              <div style={{ position: 'absolute', top: '0.75rem', right: '0.75rem', display: 'flex', gap: '0.5rem' }}>
                <span style={{ padding: '0.25rem 0.5rem', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 600, backgroundColor: p.status === 'PUBLISHED' ? '#E8F5E9' : '#F5F5F5', color: p.status === 'PUBLISHED' ? '#1B5E20' : '#616161' }}>
                  {p.status}
                </span>
                {p.isSaleEnabled && (
                  <span style={{ padding: '0.25rem 0.5rem', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 600, backgroundColor: '#FFF8E1', color: '#F57F17' }}>
                    % Sale
                  </span>
                )}
              </div>
            </div>

            <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', flex: 1 }}>
              <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem', color: '#3A3531' }}>{p.name}</h3>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                {p.isSaleEnabled && p.salePrice ? (
                  <>
                    <span style={{ fontWeight: 'bold', color: 'var(--brand-primary)' }}>{formatCurrency(p.salePrice)}</span>
                    <span style={{ textDecoration: 'line-through', fontSize: '0.9rem', color: '#888' }}>{formatCurrency(p.basePrice)}</span>
                  </>
                ) : (
                  <span style={{ fontWeight: 'bold', color: '#3A3531' }}>{formatCurrency(p.basePrice)}</span>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem', backgroundColor: '#F9F8F6', padding: '1rem', borderRadius: '12px' }}>
                {/* Stock Controls */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.85rem', color: '#5A5551', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Stock</span>
                  <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #D6CFE6', overflow: 'hidden' }}>
                    <button 
                      onClick={() => handleUpdate(p.id, { stock: Math.max(0, p.stock - 1) })}
                      style={{ padding: '0.4rem 0.6rem', border: 'none', background: 'transparent', cursor: 'pointer', color: '#5A5551' }}
                    >-</button>
                    <input 
                      type="number"
                      min="0"
                      className="no-spinners"
                      value={p.stock}
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        if (!isNaN(val)) handleUpdate(p.id, { stock: val });
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') e.currentTarget.blur();
                      }}
                      style={{ width: '100%', textAlign: 'center', padding: '0.4rem 0', border: 'none', fontSize: '0.9rem', outline: 'none' }}
                    />
                    <button 
                      onClick={() => handleUpdate(p.id, { stock: p.stock + 1 })}
                      style={{ padding: '0.4rem 0.6rem', border: 'none', background: 'transparent', cursor: 'pointer', color: '#5A5551' }}
                    >+</button>
                  </div>
                </div>

                {/* Sale Controls */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: '#5A5551', fontWeight: 600, cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    <input
                      type="checkbox"
                      checked={p.isSaleEnabled}
                      onChange={(e) => handleUpdate(p.id, { isSaleEnabled: e.target.checked })}
                      style={{ accentColor: 'var(--brand-primary)', width: '14px', height: '14px' }}
                    />
                    On Sale
                  </label>
                  {p.isSaleEnabled ? (
                    <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #F57F17', overflow: 'hidden' }}>
                      <span style={{ paddingLeft: '0.6rem', color: '#5A5551', fontSize: '0.9rem' }}>MAD</span>
                      <input 
                        type="number"
                        className="no-spinners"
                        value={p.salePrice || ''}
                        placeholder="Price"
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          if (!isNaN(val)) handleUpdate(p.id, { salePrice: val });
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') e.currentTarget.blur();
                        }}
                        style={{ width: '100%', padding: '0.4rem 0.5rem', border: 'none', fontSize: '0.9rem', outline: 'none' }}
                      />
                    </div>
                  ) : (
                    <div style={{ height: '31px' }} /> /* Placeholder to keep height consistent */
                  )}
                </div>
              </div>

              <div style={{ marginTop: 'auto', display: 'flex', gap: '0.5rem' }}>
                <Link 
                  href={`/shop/${p.id}`} 
                  target="_blank" 
                  style={{ flex: 1, textAlign: 'center', padding: '0.5rem', borderRadius: '8px', border: '1px solid #D6CFE6', color: '#5A5551', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 500 }}
                >
                  Preview
                </Link>
                <Link 
                  href={`/admin/products/${p.id}`} 
                  style={{ flex: 1, textAlign: 'center', padding: '0.5rem', borderRadius: '8px', backgroundColor: 'var(--brand-primary)', color: '#fff', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 500 }}
                >
                  Edit all
                </Link>
                <button 
                  onClick={() => setItemToDelete(p.id)}
                  style={{ padding: '0.5rem', borderRadius: '8px', border: '1px solid #FFCDD2', backgroundColor: '#FFEBEE', color: '#C62828', cursor: 'pointer' }}
                  title="Delete Product"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
                </button>
              </div>
            </div>
          </div>
        );
      })}

      <ConfirmModal
        isOpen={!!itemToDelete}
        title="Delete Product"
        message="Are you sure you want to delete this product? This action cannot be undone."
        confirmText="Delete"
        onConfirm={() => itemToDelete && confirmDelete(itemToDelete)}
        onCancel={() => setItemToDelete(null)}
      />
    </div>
  );
}
