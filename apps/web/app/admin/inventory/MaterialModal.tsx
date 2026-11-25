'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { saveMaterial } from '../materials/actions';
import { CustomSelect } from '@/components/ui/CustomSelect';
import AdminDialog from '../components/AdminDialog';
import styles from '../dashboard.module.css';
type MaterialValue = { id: string; name: string; quantity: number; cost: number | null; lowStockThreshold: number | null; supplierId?: string | null };
export function MaterialModal({ isOpen, onClose, suppliers = [], material }: { isOpen: boolean; onClose: () => void; suppliers?: { id: string; name: string }[]; material?: MaterialValue }) {
  const router = useRouter(); const [supplierId, setSupplierId] = useState(material?.supplierId || ''); const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  return <AdminDialog open={isOpen} onClose={onClose} busy={busy} title={material ? 'Edit material details' : 'Add material'}>
    <form style={{ display: 'grid', gap: 16 }} onSubmit={async event => { event.preventDefault(); const formData = new FormData(event.currentTarget); setBusy(true); setError(''); try { const result = await saveMaterial(formData); if (result.error) setError(result.error); else { onClose(); router.refresh(); } } catch { setError('Could not save the material. Your entries are preserved.'); } finally { setBusy(false); } }}>
      {material && <><input type="hidden" name="id" value={material.id} /><input type="hidden" name="expectedQuantity" value={material.quantity} /></>}
      <input type="hidden" name="quantity" value={material?.quantity || 0} />
      <label>Name<input className={styles.input} name="name" maxLength={150} required defaultValue={material?.name || ''} disabled={busy} /></label>
      <p>Recorded stock: {material?.quantity || 0}. Record purchases or reasoned count corrections separately.</p>
      <label>Default unit cost (MAD)<input className={styles.input} type="number" min="0" step="0.01" name="cost" defaultValue={material?.cost === null || material?.cost === undefined ? '' : (Math.round(material.cost * 100) / 100)} required disabled={busy} /></label>
      <label>Supplier<CustomSelect label="Material supplier" name="supplierId" value={supplierId} onChange={setSupplierId} disabled={busy} searchable options={[{ value: '', label: 'No supplier' }, ...suppliers.map(value => ({ value: value.id, label: value.name }))]} /></label>
      <label>Low stock threshold<input className={styles.input} type="number" min="0" step="1" name="lowStockThreshold" defaultValue={material?.lowStockThreshold ?? ''} disabled={busy} /></label>
      {error && <p role="alert">{error}</p>}<button className={styles.submitBtn} type="submit" disabled={busy}>{busy ? 'Saving…' : 'Save material details'}</button>
    </form>
  </AdminDialog>;
}
