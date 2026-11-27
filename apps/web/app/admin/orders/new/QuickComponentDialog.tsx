'use client';

import { useRef, useState, type FormEvent } from 'react';
import { CustomSelect } from '@/components/ui/CustomSelect';
import { clientOperationId } from '@/lib/client-operation-id';
import type { AssistedCatalog } from '@/lib/commerce/assisted-catalog';
import AdminDialog from '../../components/AdminDialog';
import { addQuickBuilderComponent } from '../../builder/actions';
import styles from './assisted-order.module.css';

export default function QuickComponentDialog({ onClose, onCreated, trackInventory }: {
  onClose: () => void; onCreated: (component: AssistedCatalog['components'][number]) => void; trackInventory: boolean;
}) {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [type, setType] = useState('FLOWER');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const submitting = useRef(false);
  const attempt = useRef({ id: '', fingerprint: '' });
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current) return;
    submitting.current = true; setBusy(true); setError('');
    try {
      const input = { name: name.trim(), unitPrice: Number(price), type };
      const fingerprint = JSON.stringify(input);
      if (attempt.current.fingerprint !== fingerprint) attempt.current = { id: clientOperationId(), fingerprint };
      const result = await addQuickBuilderComponent({ ...input, id: attempt.current.id });
      if (!result.success) setError(result.error);
      else onCreated(result.component);
    } catch { setError('The save could not be confirmed. Your fields are here; retry with the same details to avoid creating a duplicate.'); }
    finally { submitting.current = false; setBusy(false); }
  }
  return <AdminDialog open title="New flower or item" busy={busy} onClose={onClose}>
    <form className={styles.workspace} onSubmit={submit}>
      <p className={styles.hint}>Save it in your builder library and add it to this bouquet. You can reuse it in later orders and upload its photo when ready.</p>
      <fieldset disabled={busy} className={styles.column}>
        <label>Name<input autoFocus required maxLength={150} value={name} onChange={event => setName(event.target.value)} placeholder="e.g. Lavender rose" /></label>
        <div className={styles.fields}>
          <label>Price per piece (MAD)<input type="number" required min="0" max="1000000" step="1" value={price} onChange={event => setPrice(event.target.value)} placeholder="e.g. 35" /></label>
          <label>Category<CustomSelect label="New item category" value={type} onChange={setType} options={[{ value: 'FLOWER', label: 'Flower' }, { value: 'LEAF', label: 'Greenery' }, { value: 'ANIMAL_BUG', label: 'Decorative item' }]} /></label>
        </div>
        <p className={styles.hint}>Saved immediately, even if you leave the order. Hidden from customers until you choose to show it in Bouquet builder.</p>
        {trackInventory && <p className={styles.hint}>New items start with zero recorded stock. Turn off stock tracking for this order, or record stock before creating it.</p>}
        {error && <p role="alert" className={styles.error}>{error}</p>}
        <div className={styles.quickActions}><button type="button" className={styles.secondaryButton} onClick={onClose}>Cancel</button><button type="submit" className={styles.primaryButton}>{busy ? 'Saving…' : 'Save & add to bouquet'}</button></div>
      </fieldset>
    </form>
  </AdminDialog>;
}
