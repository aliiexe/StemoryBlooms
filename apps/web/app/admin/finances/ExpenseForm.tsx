'use client';
import {clientOperationId} from '@/lib/client-operation-id';
import { useRef, useState } from 'react';
import type { expense as expenseTable } from '@stemory/database';
import { CustomSelect } from '@/components/ui/CustomSelect';
import { saveExpense, deleteExpense } from './actions';
import styles from '../orders/new/assisted-order.module.css';
export type ExpenseValue = typeof expenseTable.$inferSelect;
export function ExpenseForm({ expense, onSaved, onBusyChange }: { expense?: ExpenseValue; onSaved?: () => void; onBusyChange?:(value:boolean)=>void }) {
  const [category, setCategory] = useState(expense?.category || 'OTHER'); const [busy, setBusy] = useState(false); const [error, setError] = useState(''); const [voidReason, setVoidReason] = useState(''); const newId = useRef('');
  const linked = Boolean(expense?.relatedMaterialId || expense?.relatedOrderId || expense?.category === 'VOIDED');
  return <div className={styles.workspace}><form onSubmit={async event => { event.preventDefault(); const formData = new FormData(event.currentTarget); setBusy(true);onBusyChange?.(true); setError(''); if (!newId.current) newId.current = clientOperationId(); formData.set('id', expense?.id || newId.current); formData.set('isNew', expense ? 'false' : 'true'); formData.set('expectedUpdatedAt', expense?.updatedAt.toISOString() || ''); try { const result = await saveExpense(formData); if (result.error) setError(result.error); else onSaved?.(); } catch { setError('Save could not be confirmed. Retry with the same values or review expenses first.'); } finally { setBusy(false);onBusyChange?.(false); } }}>
    <fieldset disabled={busy || linked} className={styles.column}><label>Description<input name="description" required minLength={3} maxLength={500} defaultValue={expense?.description || ''} /></label>
      <label>Amount paid (MAD)<input name="amount" type="number" min="0.01" max="10000000" step="0.01" required defaultValue={expense?.amount || ''} /></label>
      <label>Expense date<input name="date" type="date" required defaultValue={expense?.date ? new Date(expense.date).toISOString().slice(0,10) : new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Casablanca' }).format(new Date())} /></label>
      <label>Category<CustomSelect name="category" label="Expense category" value={category} onChange={setCategory} options={['SUPPLIES','PACKAGING','MARKETING','RENT','SOFTWARE','DELIVERY','OTHER'].map(value => ({ value, label: value.toLowerCase() }))} /></label>
      <button type="submit" className={styles.primaryButton}>{busy ? 'Saving…' : 'Save paid expense'}</button>
    </fieldset></form>{linked && <p>This is a linked purchase/order expense or a voided record. Its original transaction history is retained.</p>}
    {expense && !linked && <div><label>Reason to void an erroneous entry<textarea value={voidReason} minLength={3} maxLength={500} onChange={event => setVoidReason(event.target.value)} /></label><button type="button" className={styles.secondaryButton} disabled={busy || voidReason.trim().length < 3} onClick={async () => { setBusy(true);onBusyChange?.(true); setError(''); try { const result = await deleteExpense(expense.id, voidReason, expense.updatedAt.toISOString()); if (result.error) setError(result.error); else onSaved?.(); } catch { setError('Could not confirm the void. Review the expense list.'); } finally { setBusy(false);onBusyChange?.(false); } }}>Void erroneous expense and retain history</button></div>}
    {error && <p role="alert" className={styles.error}>{error}</p>}
  </div>;
}
