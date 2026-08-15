'use client';

import React, { useState, useTransition } from 'react';
import Image from 'next/image';
import { saveBuilderComponent, deleteBuilderComponent, toggleBuilderComponentAvailable, updateBuilderComponentStock } from './actions';
import { saveBuilderSections } from '../settings/actions';
import styles from '../dashboard.module.css';
import { ImageUploader } from '../../../components/ui/ImageUploader';
import { ToggleSwitch } from '../../../components/ui/ToggleSwitch';
import { CustomSelect } from '../../../components/ui/CustomSelect';
import ConfirmModal from '../components/ConfirmModal';

interface BuilderComponent {
  id: string;
  type: string;
  name: string;
  unitPrice: number;
  stock: number;
  minQuantity: number;
  maxQuantity: number | null;
  imageUrl: string | null;
  isAvailable: boolean;
  materials?: { materialId: string; quantity: number }[] | null;
}

interface MaterialItem {
  id: string;
  name: string;
  quantity: number;
}

const COMPONENT_TYPES = ['FLOWER', 'LEAF', 'ANIMAL_BUG', 'WRAPPING', 'CARD'];
const TYPE_LABELS: Record<string, string> = {
  FLOWER: 'Flower',
  LEAF: 'Leaf',
  ANIMAL_BUG: 'Animal or Bug',
  WRAPPING: 'Wrapping',
  CARD: 'Card',
};
const SECTION_STEPS = ['Flowers', 'Leaves', 'Animals or Bugs', 'Wrapping', 'Cards'];
const SECTION_TO_TYPE: Record<string, string> = {
  'Flowers': 'FLOWER',
  'Leaves': 'LEAF',
  'Animals or Bugs': 'ANIMAL_BUG',
  'Wrapping': 'WRAPPING',
  'Cards': 'CARD',
};

function ComponentForm({
  item,
  allMaterials,
  onCancel,
  onSaved,
}: {
  item?: BuilderComponent | null;
  allMaterials: MaterialItem[];
  onCancel: () => void;
  onSaved: () => void;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAvailable, setIsAvailable] = useState(item?.isAvailable ?? true);
  const [type, setType] = useState(item?.type || 'FLOWER');

  // BOM state
  const [bom, setBom] = useState<{ materialId: string; quantity: number }[]>(
    item?.materials ?? []
  );
  const addBomRow = () => setBom(prev => [...prev, { materialId: '', quantity: 1 }]);
  const removeBomRow = (idx: number) => setBom(prev => prev.filter((_, i) => i !== idx));
  const updateBom = (idx: number, field: 'materialId' | 'quantity', value: string | number) => {
    setBom(prev => prev.map((row, i) => i === idx ? { ...row, [field]: value } : row));
  };

  return (
    <div style={{ width: '100%', maxWidth: '1400px', margin: '0 auto' }}>
      <form
        action={async (formData) => {
          setIsSubmitting(true);
          setError(null);
          formData.set('isAvailable', isAvailable ? 'on' : 'off');
          formData.set('componentMaterials', JSON.stringify(bom.filter(b => b.materialId)));
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
                <CustomSelect
                  name="type"
                  value={type}
                  onChange={setType}
                  options={[
                    { value: 'FLOWER', label: 'Flower' },
                    { value: 'LEAF', label: 'Leaf' },
                    { value: 'ANIMAL_BUG', label: 'Animal or Bug' },
                    { value: 'WRAPPING', label: 'Wrapping' },
                    { value: 'CARD', label: 'Card' }
                  ]}
                />
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
              name="images"
              initialImages={item?.imageUrl ? [item.imageUrl] : []}
            />
          </div>

          {/* Pricing & Inventory */}
          <div className={styles.card}>
            <h3 style={{ margin: '0 0 1.5rem 0', color: '#3A3531', fontSize: '1.25rem' }}>Pricing & Inventory</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: '#5A5551', fontSize: '0.95rem' }}>Unit Price (MAD) — set 0 for free</label>
                <input
                  name="unitPrice"
                  type="number"
                  min="0"
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
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: '#5A5551', fontSize: '0.95rem' }}>Stock (Assembled)</label>
                <input
                  name="stock"
                  type="number"
                  defaultValue={item?.stock ?? 0}
                  style={{ width: '100%', padding: '0.85rem 1rem', borderRadius: '12px', border: '1px solid #D6CFE6', fontSize: '1rem' }}
                />
              </div>
            </div>
          </div>

          {/* Raw Materials (BOM) */}
          <div className={styles.card}>
            <h3 style={{ margin: '0 0 0.5rem 0', color: '#3A3531', fontSize: '1.25rem' }}>Raw Materials Used</h3>
            <p style={{ color: '#9A9591', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
              Track which raw materials are consumed when this component is used in an order.
            </p>
            {bom.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
                {bom.map((row, idx) => (
                  <div key={idx} style={{ display: 'grid', gridTemplateColumns: 'minmax(0,2fr) minmax(120px,1fr) auto', gap: '1rem', alignItems: 'center' }}>
                    <CustomSelect
                      value={row.materialId}
                      onChange={(val) => updateBom(idx, 'materialId', val)}
                      options={[
                        { value: '', label: 'Select Material...' },
                        ...allMaterials.map(m => ({
                          value: m.id,
                          label: `${m.name} (${m.quantity} in stock)`,
                        }))
                      ]}
                      placeholder="Select Material..."
                    />
                    <input
                      type="number"
                      min="1"
                      value={row.quantity}
                      onChange={(e) => updateBom(idx, 'quantity', parseInt(e.target.value) || 1)}
                      style={{ width: '100%', padding: '0.85rem 1rem', borderRadius: '12px', border: '1px solid #D6CFE6', fontSize: '0.95rem' }}
                    />
                    <button
                      type="button"
                      onClick={() => removeBomRow(idx)}
                      style={{ padding: '0.5rem 0.75rem', backgroundColor: '#FFEBEE', color: '#C62828', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem' }}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
            <button
              type="button"
              onClick={addBomRow}
              style={{ padding: '0.75rem 1.5rem', backgroundColor: '#FDFBF7', color: 'var(--brand-primary)', border: '1px dashed var(--brand-primary)', borderRadius: '50px', cursor: 'pointer', fontSize: '0.95rem', fontWeight: 500 }}
            >
              + Add Material
            </button>
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

// Sections panel
function SectionsPanel({ initialSections, components }: { initialSections: Record<string, boolean>; components: BuilderComponent[] }) {
  const [sections, setSections] = useState(initialSections);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const toggle = (name: string) => {
    setSections(prev => ({ ...prev, [name]: !prev[name] }));
  };

  const handleSave = async () => {
    setSaving(true);
    await saveBuilderSections(sections);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <p style={{ color: '#7A7571', fontSize: '0.95rem', margin: '0 0 1rem 0' }}>
        Control which sections appear in the custom bouquet builder. Disabled sections are hidden from customers.
      </p>
      {SECTION_STEPS.map(section => {
        const type = SECTION_TO_TYPE[section];
        const count = components.filter(c => c.type === type).length;
        const availableCount = components.filter(c => c.type === type && c.isAvailable).length;
        const enabled = sections[section] ?? true;

        return (
          <div
            key={section}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '1.25rem 1.5rem',
              borderRadius: '16px',
              border: `2px solid ${enabled ? 'var(--brand-primary)' : '#EAE6DF'}`,
              backgroundColor: enabled ? 'rgba(var(--brand-primary-rgb, 92,75,60), 0.04)' : '#FAFAF8',
              transition: 'all 0.2s ease',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div
                style={{
                  width: '48px', height: '48px', borderRadius: '12px',
                  background: enabled ? 'var(--brand-primary)' : '#E0DDD8',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1.5rem', transition: 'background 0.2s ease'
                }}
              >
                {section === 'Flowers' ? '🌸' : section === 'Leaves' ? '🍃' : section === 'Animals or Bugs' ? '🦋' : section === 'Wrapping' ? '🎀' : '💌'}
              </div>
              <div>
                <p style={{ margin: 0, fontWeight: 600, color: '#3A3531', fontSize: '1rem' }}>{section}</p>
                <p style={{ margin: '0.2rem 0 0', color: '#9A9591', fontSize: '0.85rem' }}>
                  {count} component{count !== 1 ? 's' : ''} total · {availableCount} available
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <span
                style={{
                  fontSize: '0.8rem', fontWeight: 600, padding: '0.3rem 0.75rem', borderRadius: '20px',
                  backgroundColor: enabled ? '#E8F5E9' : '#F5F5F5',
                  color: enabled ? '#1B5E20' : '#757575',
                }}
              >
                {enabled ? 'Visible' : 'Hidden'}
              </span>
              <ToggleSwitch checked={enabled} onChange={() => toggle(section)} />
            </div>
          </div>
        );
      })}

      <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
        <button
          onClick={handleSave}
          disabled={saving}
          className={styles.submitBtn}
          style={{ width: 'auto', margin: 0, padding: '0.85rem 2rem', borderRadius: '50px' }}
        >
          {saving ? 'Saving...' : saved ? '✓ Saved!' : 'Save Section Settings'}
        </button>
      </div>
    </div>
  );
}

export function AdminBuilderClient({
  initialComponents,
  allMaterials,
  initialSections,
}: {
  initialComponents: BuilderComponent[];
  allMaterials: MaterialItem[];
  initialSections: Record<string, boolean>;
}) {
  const [components, setComponents] = useState<BuilderComponent[]>(initialComponents);
  const [isPending, startTransition] = useTransition();
  const [editingItem, setEditingItem] = useState<BuilderComponent | null>(null);
  const [itemToDelete, setItemToDelete] = useState<BuilderComponent | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('ALL');
  const [activeTab, setActiveTab] = useState<'components' | 'sections'>('components');

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
          <h1 style={{ fontSize: '1.75rem', fontWeight: 500, margin: '0.75rem 0 0' }}>
            {editingItem ? 'Edit Component' : 'New Builder Component'}
          </h1>
        </div>
        <ComponentForm
          item={editingItem}
          allMaterials={allMaterials}
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
          <h1 style={{ fontSize: '1.75rem', fontWeight: 500, margin: 0 }}>Bouquet Builder</h1>
          <p style={{ color: '#7A7571', fontSize: '0.9rem', marginTop: '0.25rem' }}>Manage components and builder sections for the custom bouquet builder</p>
        </div>
        {activeTab === 'components' && (
          <button
            onClick={() => { setEditingItem(null); setIsAdding(true); }}
            className={styles.submitBtn}
            style={{ width: 'auto', padding: '0.75rem 1.25rem', margin: 0 }}
          >
            + Add Component
          </button>
        )}
      </header>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '2px solid #EAE6DF' }}>
        {(['components', 'sections'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '0.75rem 1.5rem',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === tab ? '2px solid var(--brand-primary)' : '2px solid transparent',
              marginBottom: '-2px',
              cursor: 'pointer',
              fontWeight: activeTab === tab ? 600 : 400,
              color: activeTab === tab ? 'var(--brand-primary)' : '#7A7571',
              fontSize: '0.95rem',
              transition: 'all 0.15s ease',
              textTransform: 'capitalize',
            }}
          >
            {tab === 'components' ? 'Components' : 'Sections & Visibility'}
          </button>
        ))}
      </div>

      {activeTab === 'sections' ? (
        <div className={styles.card}>
          <SectionsPanel initialSections={initialSections} components={components} />
        </div>
      ) : (
        <div className={styles.card}>
          {/* Type filters */}
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
            {['ALL', ...COMPONENT_TYPES].map(type => (
              <button
                key={type}
                onClick={() => setSelectedTypeFilter(type)}
                style={{ padding: '0.5rem 1rem', borderRadius: '20px', border: '1px solid #D6CFE6', background: selectedTypeFilter === type ? '#3A3531' : 'white', color: selectedTypeFilter === type ? 'white' : '#3A3531', cursor: 'pointer', fontSize: '0.85rem', whiteSpace: 'nowrap' }}
              >
                {type === 'ALL' ? 'All Types' : TYPE_LABELS[type]}
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
                  <th>Materials</th>
                  <th>Stock</th>
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
                        {TYPE_LABELS[item.type] ?? item.type}
                      </span>
                    </td>
                    <td><strong>{item.name}</strong></td>
                    <td style={{ fontWeight: 600, color: 'var(--brand-primary)' }}>
                      {item.unitPrice === 0 ? <span style={{ color: '#1B5E20' }}>Free</span> : `${item.unitPrice} MAD`}
                    </td>
                    <td>Min: {item.minQuantity}{item.maxQuantity ? ` | Max: ${item.maxQuantity}` : ''}</td>
                    <td>
                      {item.materials && item.materials.length > 0 ? (
                        <span style={{ fontSize: '0.8rem', color: '#5A5551' }}>
                          {item.materials.length} material{item.materials.length !== 1 ? 's' : ''}
                        </span>
                      ) : (
                        <span style={{ fontSize: '0.8rem', color: '#C4C0BB' }}>—</span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
                        <button
                          onClick={() => {
                            const newStock = Math.max(0, item.stock - 1);
                            if (newStock !== item.stock) {
                              startTransition(async () => {
                                await updateBuilderComponentStock(item.id, newStock);
                                setComponents(prev => prev.map(c => c.id === item.id ? { ...c, stock: newStock } : c));
                              });
                            }
                          }}
                          style={{ width: '24px', height: '24px', borderRadius: '4px', border: '1px solid #D6CFE6', background: '#fff', cursor: 'pointer' }}
                        >-</button>
                        <input 
                          type="number" 
                          min="0"
                          className="no-spinners"
                          value={item.stock}
                          onChange={(e) => {
                            let newStock = parseInt(e.target.value);
                            if (isNaN(newStock)) return;
                            if (newStock !== item.stock) {
                              startTransition(async () => {
                                await updateBuilderComponentStock(item.id, newStock);
                                setComponents(prev => prev.map(c => c.id === item.id ? { ...c, stock: newStock } : c));
                              });
                            }
                          }}
                          style={{ 
                            width: '50px', 
                            padding: '0.25rem', 
                            borderRadius: '4px', 
                            border: '1px solid #D6CFE6', 
                            fontSize: '0.9rem',
                            textAlign: 'center'
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') e.currentTarget.blur();
                          }}
                        />
                        <button
                          onClick={() => {
                            const newStock = item.stock + 1;
                            startTransition(async () => {
                              await updateBuilderComponentStock(item.id, newStock);
                              setComponents(prev => prev.map(c => c.id === item.id ? { ...c, stock: newStock } : c));
                            });
                          }}
                          style={{ width: '24px', height: '24px', borderRadius: '4px', border: '1px solid #D6CFE6', background: '#fff', cursor: 'pointer' }}
                        >+</button>
                      </div>
                    </td>
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
                            setItemToDelete(item);
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
                    <td colSpan={8} style={{ textAlign: 'center', color: '#7A7571', padding: '2rem' }}>
                      No builder components found. Click &quot;+ Add Component&quot; to add one.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={!!itemToDelete}
        title="Delete Component"
        message={`Are you sure you want to delete "${itemToDelete?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        onConfirm={async () => {
          if (itemToDelete) {
            startTransition(async () => {
              await deleteBuilderComponent(itemToDelete.id);
              setComponents(prev => prev.filter(c => c.id !== itemToDelete.id));
              setItemToDelete(null);
            });
          }
        }}
        onCancel={() => setItemToDelete(null)}
      />
    </div>
  );
}
