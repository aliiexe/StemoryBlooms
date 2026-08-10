'use client';

import React, { useState, useRef, useTransition } from 'react';
import { saveBuilderComponent, deleteBuilderComponent, toggleBuilderComponentAvailable } from './actions';
import styles from '../dashboard.module.css';
import { ImageUploader } from '../../../components/ui/ImageUploader';
import { ToggleSwitch } from '../../../components/ui/ToggleSwitch';

interface BuilderComponent {
  id: string;
  type: string;
  name: string;
  unitPrice: number;
  minQuantity: number;
  maxQuantity: number | null;
  imageUrl: string | null;
  isAvailable: boolean;
}

const COMPONENT_TYPES = ['FLOWER', 'LEAF', 'ANIMAL_BUG', 'WRAPPING', 'CARD'];

function ComponentForm({
  item,
  onCancel,
  onSaved,
}: {
  item?: BuilderComponent | null;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAvailable, setIsAvailable] = useState(item?.isAvailable ?? true);
  const [pendingImageFile, setPendingImageFile] = useState<File | null>(null);

  return (
    <div style={{ width: '100%', maxWidth: '1400px', margin: '0 auto' }}>
      <form
        action={async (formData) => {
          setIsSubmitting(true);
          setError(null);
          if (pendingImageFile) formData.append('newImage', pendingImageFile);
          formData.set('isAvailable', isAvailable ? 'on' : 'off');
          const res = await saveBuilderComponent(formData);
          if (res?.error) {
            setError(res.error);
            setIsSubmitting(false);
          } else {
            onSaved();
          }
        }}
      >
        {item?.id && <input type="hidden" name="id" value={item.id} />}
        {item?.imageUrl && <input type="hidden" name="existingImageUrl" value={item.imageUrl} />}

        {error && (
          <div style={{ color: '#C62828', backgroundColor: '#FFEBEE', padding: '1rem', borderRadius: '12px', marginBottom: '2rem' }}>
            {error}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

          {/* General Info */}
          <div className={styles.card}>
            <h3 style={{ margin: '0 0 1.5rem 0', color: '#3A3531', fontSize: '1.25rem' }}>General Information</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: '#5A5551', fontSize: '0.95rem' }}>Component Type</label>
                <select
                  name="type"
                  defaultValue={item?.type || 'FLOWER'}
                  style={{ width: '100%', padding: '0.85rem 1rem', borderRadius: '12px', border: '1px solid #D6CFE6', fontSize: '1rem', backgroundColor: '#fff' }}
                >
                  <option value="FLOWER">Flower</option>
                  <option value="LEAF">Leaf</option>
                  <option value="ANIMAL_BUG">Animal or Bug</option>
                  <option value="WRAPPING">Wrapping</option>
                  <option value="CARD">Card</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: '#5A5551', fontSize: '0.95rem' }}>Component Name</label>
                <input
                  name="name"
                  required
                  defaultValue={item?.name ?? ''}
                  placeholder="e.g. Premium Dutch Tulip"
                  style={{ width: '100%', padding: '0.85rem 1rem', borderRadius: '12px', border: '1px solid #D6CFE6', fontSize: '1rem' }}
                />
              </div>
            </div>
          </div>

          {/* Media */}
          <div className={styles.card}>
            <h3 style={{ margin: '0 0 1.5rem 0', color: '#3A3531', fontSize: '1.25rem' }}>Media</h3>
            <ImageUploader
              initialImages={item?.imageUrl ? [item.imageUrl] : []}
              onFilesChange={(files) => setPendingImageFile(files[0] ?? null)}
            />
          </div>

          {/* Pricing */}
          <div className={styles.card}>
            <h3 style={{ margin: '0 0 1.5rem 0', color: '#3A3531', fontSize: '1.25rem' }}>Pricing</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: '#5A5551', fontSize: '0.95rem' }}>Unit Price (MAD)</label>
                <input
                  name="unitPrice"
                  type="number"
                  required
                  defaultValue={item?.unitPrice ?? ''}
                  placeholder="0"
                  style={{ width: '100%', padding: '0.85rem 1rem', borderRadius: '12px', border: '1px solid #D6CFE6', fontSize: '1rem' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: '#5A5551', fontSize: '0.95rem' }}>Min Quantity</label>
                <input
                  name="minQuantity"
                  type="number"
                  defaultValue={item?.minQuantity ?? 0}
                  style={{ width: '100%', padding: '0.85rem 1rem', borderRadius: '12px', border: '1px solid #D6CFE6', fontSize: '1rem' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: '#5A5551', fontSize: '0.95rem' }}>Max Quantity (optional)</label>
                <input
                  name="maxQuantity"
                  type="number"
                  defaultValue={item?.maxQuantity ?? ''}
                  placeholder="No limit"
                  style={{ width: '100%', padding: '0.85rem 1rem', borderRadius: '12px', border: '1px solid #D6CFE6', fontSize: '1rem' }}
                />
              </div>
            </div>
          </div>

          {/* Visibility */}
          <div className={styles.card}>
            <h3 style={{ margin: '0 0 1.5rem 0', color: '#3A3531', fontSize: '1.25rem' }}>Visibility</h3>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ margin: 0, fontWeight: 500, color: '#5A5551', fontSize: '0.95rem' }}>Available in Builder</p>
                <p style={{ margin: '0.25rem 0 0', color: '#9A9591', fontSize: '0.85rem' }}>Customers can select this component when building a bouquet</p>
              </div>
              <ToggleSwitch checked={isAvailable} onChange={setIsAvailable} />
            </div>
          </div>
        </div>

        {/* Sticky action bar */}
        <div style={{ position: 'sticky', bottom: 0, marginTop: '3rem', padding: '1.5rem', backgroundColor: 'rgba(253,251,247,0.95)', backdropFilter: 'blur(10px)', borderTop: '1px solid #EAE6DF', display: 'flex', justifyContent: 'flex-end', gap: '1rem', zIndex: 100 }}>
          <button
            type="button"
            onClick={onCancel}
            style={{ padding: '1rem 2rem', color: '#5A5551', background: 'transparent', border: 'none', fontWeight: 500, borderRadius: '50px', cursor: 'pointer' }}
          >
            Discard Changes
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className={styles.submitBtn}
            style={{ width: 'auto', margin: 0, padding: '1rem 3rem', borderRadius: '50px', fontSize: '1.1rem' }}
          >
            {isSubmitting ? 'Saving...' : 'Save Component'}
          </button>
        </div>
      </form>
    </div>
  );
}

export function AdminBuilderClient({ initialComponents }: { initialComponents: BuilderComponent[] }) {
  const [components, setComponents] = useState<BuilderComponent[]>(initialComponents);
  const [isPending, startTransition] = useTransition();
  const [editingItem, setEditingItem] = useState<BuilderComponent | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('ALL');

  const filteredComponents = components.filter(c =>
    selectedTypeFilter === 'ALL' || c.type === selectedTypeFilter
  );

  if (isAdding || editingItem) {
    return (
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        <div style={{ marginBottom: '2rem' }}>
          <button
            onClick={() => { setIsAdding(false); setEditingItem(null); }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#5A5551', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            ← Back to components
          </button>
          <h1 style={{ fontSize: '1.75rem', fontFamily: 'var(--font-editorial)', fontWeight: 500, margin: '0.75rem 0 0' }}>
            {editingItem ? 'Edit Component' : 'New Builder Component'}
          </h1>
        </div>
        <ComponentForm
          item={editingItem}
          onCancel={() => { setIsAdding(false); setEditingItem(null); }}
          onSaved={() => { setIsAdding(false); setEditingItem(null); window.location.reload(); }}
        />
      </div>
    );
  }

  return (
    <div className={styles.dashboard}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontFamily: 'var(--font-editorial)', fontWeight: 500, margin: 0 }}>Bouquet Builder Components</h1>
          <p style={{ color: '#7A7571', fontSize: '0.9rem', marginTop: '0.25rem' }}>Manage flowers, wrappers, ribbons, and add-ons for the custom bouquet builder</p>
        </div>
        <button
          onClick={() => { setEditingItem(null); setIsAdding(true); }}
          className={styles.submitBtn}
          style={{ width: 'auto', padding: '0.75rem 1.25rem', margin: 0 }}
        >
          + Add Component
        </button>
      </header>

      <div className={styles.card}>
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
          {['ALL', ...COMPONENT_TYPES].map(type => (
            <button
              key={type}
              onClick={() => setSelectedTypeFilter(type)}
              style={{ padding: '0.5rem 1rem', borderRadius: '20px', border: '1px solid #D6CFE6', background: selectedTypeFilter === type ? '#3A3531' : 'white', color: selectedTypeFilter === type ? 'white' : '#3A3531', cursor: 'pointer', fontSize: '0.85rem', whiteSpace: 'nowrap' }}
            >
              {type === 'ALL' ? 'All Types' : type}
            </button>
          ))}
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Image</th>
                <th>Type</th>
                <th>Name</th>
                <th>Unit Price</th>
                <th>Qty Limits</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredComponents.map((item) => (
                <tr key={item.id}>
                  <td>
                    {item.imageUrl
                      ? <img src={item.imageUrl} alt={item.name} style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #EAE6DF' }} />
                      : <div style={{ width: '48px', height: '48px', borderRadius: '8px', background: '#F0ECE1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem' }}>🌸</div>
                    }
                  </td>
                  <td>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, padding: '2px 8px', borderRadius: '12px', background: '#F0ECE1', color: '#5A5551' }}>
                      {item.type}
                    </span>
                  </td>
                  <td><strong>{item.name}</strong></td>
                  <td style={{ fontWeight: 600, color: 'var(--brand-primary)' }}>{item.unitPrice} MAD</td>
                  <td>Min: {item.minQuantity}{item.maxQuantity ? ` | Max: ${item.maxQuantity}` : ''}</td>
                  <td>
                    <button
                      onClick={() => {
                        startTransition(async () => {
                          await toggleBuilderComponentAvailable(item.id, !item.isAvailable);
                          setComponents(prev => prev.map(c => c.id === item.id ? { ...c, isAvailable: !item.isAvailable } : c));
                        });
                      }}
                      style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}
                    >
                      <span className={styles.badge} style={{ backgroundColor: item.isAvailable ? '#E8F5E9' : '#F5F5F5', color: item.isAvailable ? '#1B5E20' : '#616161' }}>
                        {item.isAvailable ? 'Available' : 'Disabled'}
                      </span>
                    </button>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                      <button
                        onClick={() => { setEditingItem(item); setIsAdding(false); }}
                        style={{ padding: '0.4rem 0.75rem', borderRadius: '6px', border: '1px solid #D6CFE6', background: 'white', cursor: 'pointer', fontSize: '0.85rem' }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Delete component "${item.name}"?`)) {
                            startTransition(async () => {
                              await deleteBuilderComponent(item.id);
                              setComponents(prev => prev.filter(c => c.id !== item.id));
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
              {filteredComponents.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', color: '#7A7571', padding: '2rem' }}>
                    No builder components found. Click "+ Add Component" to add one.
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
