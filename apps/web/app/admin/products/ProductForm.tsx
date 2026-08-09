'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { saveProduct } from './actions';
import styles from '../dashboard.module.css';
import { CustomSelect } from '../../../components/ui/CustomSelect';
import { ToggleSwitch } from '../../../components/ui/ToggleSwitch';
import { ImageUploader } from '../../../components/ui/ImageUploader';

const STATUS_OPTIONS = [
  { label: 'Published (Visible to everyone)', value: 'PUBLISHED' },
  { label: 'Hidden (Requires direct link)', value: 'HIDDEN' },
  { label: 'Archived (Removed from store)', value: 'ARCHIVED' },
];

type ProductMaterialItem = {
  materialId: string;
  quantity: number;
};

type ProductFormValue = {
  id?: string;
  name?: string;
  description?: string;
  basePrice?: number;
  salePrice?: number | null;
  status?: string;
  isAvailable?: boolean;
  isFeatured?: boolean;
  images?: string[];
  materials?: ProductMaterialItem[];
};

export function ProductForm({ product, materials = [] }: { product?: ProductFormValue, materials?: Array<{ id: string; name: string; quantity: number }> }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingImageFiles, setPendingImageFiles] = useState<File[]>([]);

  const [status, setStatus] = useState(product?.status || 'PUBLISHED');
  const [isAvailable, setIsAvailable] = useState(product ? product.isAvailable : true);
  const [isFeatured, setIsFeatured] = useState(product ? product.isFeatured : false);
  const [isOnSale, setIsOnSale] = useState(!!product?.salePrice);

  // Parse existing BOM
  const [bom, setBom] = useState<{materialId: string, quantity: number}[]>(
    product?.materials ? product.materials.map((m) => ({ materialId: m.materialId, quantity: m.quantity })) : []
  );

  const addMaterial = () => setBom([...bom, { materialId: '', quantity: 1 }]);
  const removeMaterial = (idx: number) => {
    const newBom = [...bom];
    newBom.splice(idx, 1);
    setBom(newBom);
  };
  const updateMaterial = (idx: number, field: 'materialId' | 'quantity', value: string | number) => {
    const newBom = [...bom];
    newBom[idx] = {
      ...newBom[idx],
      [field]: value,
    } as ProductMaterialItem;
    setBom(newBom);
  };

  return (
    <div style={{ width: '100%', maxWidth: '1400px', margin: '0 auto' }}>
      <form
        action={async (formData) => {
          setIsSubmitting(true);
          pendingImageFiles.forEach((file) => formData.append('newImages', file));
          const res = await saveProduct(formData);
          if (res?.error) setError(res.error);
          setIsSubmitting(false);
        }}
      >
        {error && <div style={{ color: '#C62828', backgroundColor: '#FFEBEE', padding: '1rem', borderRadius: '12px', marginBottom: '2rem' }}>{error}</div>}
        
        {product?.id && <input type="hidden" name="id" value={product.id} />}
        {/* Hidden input to submit the BOM array */}
        <input type="hidden" name="productMaterials" value={JSON.stringify(bom.filter(b => b.materialId))} />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }}>
          
          {/* Main Content Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            
            {/* General Info Card */}
            <div className={styles.card}>
              <h3 style={{ margin: '0 0 1.5rem 0', color: '#3A3531', fontSize: '1.25rem' }}>General Information</h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: '#5A5551', fontSize: '0.95rem' }}>Product Name</label>
                  <input 
                    type="text" 
                    name="name" 
                    defaultValue={product?.name || ''} 
                    required 
                    placeholder="e.g., The Velvet Rose Bouquet"
                    style={{ width: '100%', padding: '0.85rem 1rem', borderRadius: '12px', border: '1px solid #D6CFE6', fontSize: '1rem', transition: 'border-color 0.2s' }} 
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: '#5A5551', fontSize: '0.95rem' }}>Description</label>
                  <textarea 
                    name="description" 
                    defaultValue={product?.description || ''} 
                    rows={5}
                    required
                    placeholder="Describe the arrangement, materials used, and ideal occasions..."
                    style={{ width: '100%', padding: '0.85rem 1rem', borderRadius: '12px', border: '1px solid #D6CFE6', resize: 'vertical', fontSize: '1rem', lineHeight: 1.6 }} 
                  />
                </div>
              </div>
            </div>

            {/* Media Card */}
            <div className={styles.card}>
              <h3 style={{ margin: '0 0 1.5rem 0', color: '#3A3531', fontSize: '1.25rem' }}>Media</h3>
              <ImageUploader
                name="images"
                initialImages={product?.images || []}
                onFilesChange={setPendingImageFiles}
              />
            </div>

            {/* Pricing Card */}
            <div className={styles.card}>
              <h3 style={{ margin: '0 0 1.5rem 0', color: '#3A3531', fontSize: '1.25rem' }}>Pricing</h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: '#5A5551', fontSize: '0.95rem' }}>Base Price (MAD)</label>
                  <input 
                    type="number" 
                    name="basePrice" 
                    defaultValue={product?.basePrice ?? ''} 
                    required 
                    placeholder="0.00"
                    style={{ width: '100%', padding: '0.85rem 1rem', borderRadius: '12px', border: '1px solid #D6CFE6', fontSize: '1rem' }} 
                  />
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <label style={{ fontWeight: 500, color: '#5A5551', fontSize: '0.95rem' }}>Sale Price (MAD)</label>
                    <ToggleSwitch checked={isOnSale} onChange={setIsOnSale} />
                  </div>
                  <input 
                    type="number" 
                    name="salePrice" 
                    defaultValue={product?.salePrice ?? ''} 
                    disabled={!isOnSale}
                    placeholder={isOnSale ? "0.00" : "Enable sale to set price"}
                    style={{ width: '100%', padding: '0.85rem 1rem', borderRadius: '12px', border: '1px solid #D6CFE6', fontSize: '1rem', backgroundColor: isOnSale ? '#FFFFFF' : '#F5F5F5', cursor: isOnSale ? 'text' : 'not-allowed' }} 
                  />
                </div>
              </div>
            </div>

            {/* Recipe / BOM Card */}
            <div className={styles.card}>
              <h3 style={{ margin: '0 0 0.5rem 0', color: '#3A3531', fontSize: '1.25rem' }}>Recipe (Bill of Materials)</h3>
              <p style={{ color: '#9A9591', fontSize: '0.9rem', marginBottom: '1.5rem' }}>Define exactly which raw materials are consumed when this bouquet is sold.</p>
              
              {bom.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
                  {bom.map((item, idx) => (
                      <div key={idx} style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(120px, 1fr) auto', gap: '1rem', alignItems: 'center', width: '100%' }}>
                      <select 
                        value={item.materialId}
                        onChange={(e) => updateMaterial(idx, 'materialId', e.target.value)}
                          style={{ width: '100%', minWidth: 0, padding: '0.85rem 1rem', borderRadius: '12px', border: '1px solid #D6CFE6', fontSize: '0.95rem', backgroundColor: '#FFFFFF' }}
                      >
                        <option value="">Select Material...</option>
                        {materials.map(m => (
                          <option key={m.id} value={m.id}>{m.name} ({m.quantity} in stock)</option>
                        ))}
                      </select>
                      <input 
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateMaterial(idx, 'quantity', parseInt(e.target.value) || 1)}
                        style={{ width: '100%', minWidth: 0, padding: '0.85rem 1rem', borderRadius: '12px', border: '1px solid #D6CFE6', fontSize: '0.95rem' }}
                      />
                      <button 
                        type="button" 
                        onClick={() => removeMaterial(idx)}
                        style={{ padding: '0.5rem', backgroundColor: '#FFEBEE', color: '#C62828', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <button 
                type="button"
                onClick={addMaterial}
                style={{ padding: '0.75rem 1.5rem', backgroundColor: '#FDFBF7', color: 'var(--brand-primary)', border: '1px dashed var(--brand-primary)', borderRadius: '50px', cursor: 'pointer', fontSize: '0.95rem', fontWeight: 500 }}
              >
                + Add Material
              </button>
            </div>
          </div>

          {/* Sidebar Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            
            {/* Status Card */}
            <div className={styles.card}>
              <h3 style={{ margin: '0 0 1.5rem 0', color: '#3A3531', fontSize: '1.25rem' }}>Visibility</h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: '#5A5551', fontSize: '0.95rem' }}>Status</label>
                  <CustomSelect 
                    name="status"
                    options={STATUS_OPTIONS}
                    value={status}
                    onChange={setStatus}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', paddingTop: '1rem', borderTop: '1px solid #EAE6DF' }}>
                  <ToggleSwitch 
                    name="isAvailable"
                    label="Available in stock"
                    checked={isAvailable}
                    onChange={setIsAvailable}
                  />
                  <ToggleSwitch 
                    name="isFeatured"
                    label="Feature on homepage"
                    checked={isFeatured}
                    onChange={setIsFeatured}
                  />
                </div>
              </div>
            </div>
            
          </div>
        </div>

        {/* Floating Action Bar */}
        <div style={{ position: 'sticky', bottom: 0, left: 0, right: 0, marginTop: '3rem', padding: '1.5rem', backgroundColor: 'rgba(253, 251, 247, 0.95)', backdropFilter: 'blur(10px)', borderTop: '1px solid #EAE6DF', display: 'flex', justifyContent: 'flex-end', gap: '1rem', zIndex: 100 }}>
          <Link href="/admin/products" style={{ padding: '1rem 2rem', color: '#5A5551', textDecoration: 'none', fontWeight: 500, borderRadius: '50px', transition: 'background-color 0.2s' }} onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#F5F5F5'} onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
            Discard Changes
          </Link>
          <button 
            type="submit" 
            disabled={isSubmitting}
            className={styles.submitBtn} 
            style={{ width: 'auto', margin: 0, padding: '1rem 3rem', borderRadius: '50px', fontSize: '1.1rem' }}
          >
            {isSubmitting ? 'Saving...' : 'Save Product'}
          </button>
        </div>
      </form>
    </div>
  );
}
