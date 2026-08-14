'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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

type ProductBuilderComponentItem = {
  builderComponentId: string;
  quantity: number;
};

type ProductFormValue = {
  id?: string;
  name?: string;
  description?: string | null;
  basePrice?: number;
  salePrice?: number | null;
  status?: string;
  isAvailable?: boolean;
  isFeatured?: boolean;
  stock?: number;
  images?: string[] | null;
  materials?: ProductMaterialItem[];
  builderComponents?: ProductBuilderComponentItem[];
  categories?: string[];
};

export function ProductForm({ 
  product, 
  materials = [], 
  builderComponents = [],
  categories = []
}: { 
  product?: ProductFormValue, 
  materials?: Array<{ id: string; name: string; quantity: number }>,
  builderComponents?: Array<{ id: string; name: string; stock: number }>,
  categories?: Array<{ id: string; name: string }>
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

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

  const [customBom, setCustomBom] = useState<{builderComponentId: string, quantity: number}[]>(
    product?.builderComponents ? product.builderComponents.map((b) => ({ builderComponentId: b.builderComponentId, quantity: b.quantity })) : []
  );

  const addCustomBom = () => setCustomBom([...customBom, { builderComponentId: '', quantity: 1 }]);
  const removeCustomBom = (idx: number) => {
    const newBom = [...customBom];
    newBom.splice(idx, 1);
    setCustomBom(newBom);
  };
  const updateCustomBom = (idx: number, field: 'builderComponentId' | 'quantity', value: string | number) => {
    const newBom = [...customBom];
    newBom[idx] = {
      ...newBom[idx],
      [field]: value,
    } as ProductBuilderComponentItem;
    setCustomBom(newBom);
  };

  const [selectedCategories, setSelectedCategories] = useState<string[]>(product?.categories || []);
  const toggleCategory = (catId: string) => {
    setSelectedCategories(prev => 
      prev.includes(catId) ? prev.filter(id => id !== catId) : [...prev, catId]
    );
  };

  return (
    <div style={{ width: '100%', maxWidth: '1400px', margin: '0 auto' }}>
      <form
        action={async (formData) => {
          setIsSubmitting(true);
          const res = await saveProduct(formData);
          if (res?.error) {
            setError(res.error);
            setIsSubmitting(false);
          } else {
            router.push('/admin/products');
          }
        }}
      >
        {error && <div style={{ color: '#C62828', backgroundColor: '#FFEBEE', padding: '1rem', borderRadius: '12px', marginBottom: '2rem' }}>{error}</div>}
        
        {product?.id && <input type="hidden" name="id" value={product.id} />}
        {/* Hidden inputs to submit the BOM arrays */}
        <input type="hidden" name="productMaterials" value={JSON.stringify(bom.filter(b => b.materialId))} />
        <input type="hidden" name="productBuilderComponents" value={JSON.stringify(customBom.filter(b => b.builderComponentId))} />
        <input type="hidden" name="categoryIds" value={JSON.stringify(selectedCategories)} />

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

              <div style={{ marginTop: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.75rem', fontWeight: 500, color: '#5A5551', fontSize: '0.95rem' }}>Categories</label>
                {categories.length === 0 ? (
                  <p style={{ color: '#9A9591', fontSize: '0.9rem' }}>No categories available.</p>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '1rem', backgroundColor: '#F8F6F2', padding: '1rem', borderRadius: '12px' }}>
                    {categories.map(cat => (
                      <label key={cat.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.95rem', color: '#3A3531', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={selectedCategories.includes(cat.id)}
                          onChange={() => toggleCategory(cat.id)}
                          style={{ accentColor: 'var(--brand-primary)', width: '16px', height: '16px' }}
                        />
                        {cat.name}
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Media Card */}
            <div className={styles.card}>
              <h3 style={{ margin: '0 0 1.5rem 0', color: '#3A3531', fontSize: '1.25rem' }}>Media</h3>
              <ImageUploader
                name="images"
                initialImages={product?.images || []}
              />
            </div>

            {/* Pricing Card */}
            <div className={styles.card}>
              <h3 style={{ margin: '0 0 1.5rem 0', color: '#3A3531', fontSize: '1.25rem' }}>Pricing</h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '2rem' }}>
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

                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: '#5A5551', fontSize: '0.95rem' }}>Initial Stock</label>
                  <input 
                    type="number" 
                    name="stock" 
                    defaultValue={product?.stock ?? 1} 
                    required 
                    min="1"
                    style={{ width: '100%', padding: '0.85rem 1rem', borderRadius: '12px', border: '1px solid #D6CFE6', fontSize: '1rem' }} 
                  />
                </div>
              </div>
            </div>

            {/* Recipe / BOM Card */}
            <div className={styles.card}>
              <h3 style={{ margin: '0 0 0.5rem 0', color: '#3A3531', fontSize: '1.25rem' }}>Recipe (Bill of Materials)</h3>
              <p style={{ color: '#9A9591', fontSize: '0.9rem', marginBottom: '1.5rem' }}>Define exactly which items are consumed when this bouquet is manufactured/sold.</p>
              
              <div style={{ marginBottom: '2rem' }}>
                <h4 style={{ margin: '0 0 1rem 0', color: '#5A5551', fontSize: '1.05rem' }}>Raw Materials</h4>
                {bom.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1rem' }}>
                    {bom.map((item, idx) => (
                      <div key={idx} style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(120px, 1fr) auto', gap: '1rem', alignItems: 'center', width: '100%' }}>
                        <CustomSelect 
                          value={item.materialId}
                          onChange={(val) => updateMaterial(idx, 'materialId', val)}
                          options={[
                            { value: '', label: 'Select Material...' },
                            ...materials.map(m => ({
                              value: m.id,
                              label: `${m.name} (${m.quantity} in stock)`,
                            }))
                          ]}
                        />
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
                  + Add Raw Material
                </button>
              </div>

              <div>
                <h4 style={{ margin: '0 0 1rem 0', color: '#5A5551', fontSize: '1.05rem' }}>Custom Flowers (Assembled Components)</h4>
                {customBom.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1rem' }}>
                    {customBom.map((item, idx) => (
                      <div key={idx} style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(120px, 1fr) auto', gap: '1rem', alignItems: 'center', width: '100%' }}>
                        <CustomSelect 
                          value={item.builderComponentId}
                          onChange={(val) => updateCustomBom(idx, 'builderComponentId', val)}
                          options={[
                            { value: '', label: 'Select Custom Flower...' },
                            ...builderComponents.map(m => ({
                              value: m.id,
                              label: `${m.name} (${m.stock} in stock)`,
                            }))
                          ]}
                        />
                        <input 
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => updateCustomBom(idx, 'quantity', parseInt(e.target.value) || 1)}
                          style={{ width: '100%', minWidth: 0, padding: '0.85rem 1rem', borderRadius: '12px', border: '1px solid #D6CFE6', fontSize: '0.95rem' }}
                        />
                        <button 
                          type="button" 
                          onClick={() => removeCustomBom(idx)}
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
                  onClick={addCustomBom}
                  style={{ padding: '0.75rem 1.5rem', backgroundColor: '#FDFBF7', color: 'var(--brand-primary)', border: '1px dashed var(--brand-primary)', borderRadius: '50px', cursor: 'pointer', fontSize: '0.95rem', fontWeight: 500 }}
                >
                  + Add Custom Flower
                </button>
              </div>
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
                    checked={isAvailable ?? false}
                    onChange={setIsAvailable}
                  />
                  <ToggleSwitch 
                    name="isFeatured"
                    label="Feature on homepage"
                    checked={isFeatured ?? false}
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
