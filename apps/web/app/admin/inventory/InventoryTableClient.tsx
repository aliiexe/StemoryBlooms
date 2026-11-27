'use client';
import {useRememberedState} from '@/components/navigation/useRememberedState';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CustomSelect } from '@/components/ui/CustomSelect';
import { deleteMaterial } from '../materials/actions';
import StockCountButton from '../components/StockCountButton';
import PurchaseButton from './PurchaseButton';
import { MaterialModal } from './MaterialModal';
import { usePagination } from '../components/usePagination';
import { TablePagination } from '../components/TablePagination';
import ConfirmModal from '../components/ConfirmModal';
import styles from '../dashboard.module.css';
type Material = { id: string; name: string; quantity: number; cost: number | null; lowStockThreshold: number | null; supplierId?: string | null; supplier?: { id: string; name: string } | null; productMaterials?: { productId: string }[] };
export function InventoryTableClient({ initialMaterials, suppliers = [], storageReady = true }: { initialMaterials: Material[]; suppliers?: { id: string; name: string }[]; storageReady?: boolean }) {
  const router = useRouter(); const [search, setSearch] = useRememberedState('search', ''); const [filter, setFilter] = useRememberedState('filter', 'ALL'); const [supplierId, setSupplierId] = useRememberedState('supplier', ''); const [editing, setEditing] = useState<Material | 'new' | null>(null); const [remove, setRemove] = useState<Material | null>(null); const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  const filtered = initialMaterials.filter(value => (!supplierId || value.supplierId === supplierId) && `${value.name} ${value.supplier?.name || ''}`.toLowerCase().includes(search.toLowerCase()) && (filter === 'ALL' || filter === 'NEGATIVE' && value.quantity < 0 || filter === 'LOW' && value.lowStockThreshold !== null && value.quantity <= value.lowStockThreshold));
  const { page, setPage, rowsPerPage, setRowsPerPage, totalPages, paginatedItems, totalItems } = usePagination(filtered, 10);
  return <>
    {!storageReady && <p role="status">The inventory migration is required before recording purchases, count corrections, or production. Existing stock is shown below.</p>}
    {error && <p role="alert">{error}</p>}
    <div className={styles.filterBar}><label>Search materials<input type="search" value={search} onChange={event => { setSearch(event.target.value); setPage(1); }} placeholder="Material or supplier" /></label>
      <label>Stock condition<CustomSelect label="Stock condition" value={filter} onChange={value => { setFilter(value); setPage(1); }} options={[{ value: 'ALL', label: 'All materials' }, { value: 'LOW', label: 'Low stock' }, { value: 'NEGATIVE', label: 'Needs recount' }]} /></label>
      <label>Supplier<CustomSelect label="Filter material supplier" value={supplierId} onChange={value => { setSupplierId(value); setPage(1); }} options={[{ value: '', label: 'All suppliers' }, ...suppliers.map(value => ({ value: value.id, label: value.name }))]} searchable /></label>
      <button className={styles.secondaryAction} type="button" onClick={() => setEditing('new')}>Add material</button><Link href="/admin/production">Production</Link><Link href="/admin/inventory/movements">Stock movement history</Link>
    </div>
    <p role="status">{filtered.length} matching materials</p>
    <div className={styles.tableScroller} role="region" aria-label="Material inventory" tabIndex={0}>
      <table className={styles.table}><thead><tr><th>Material</th><th>Supplier</th><th>Recorded units</th><th>Alert threshold</th><th>Unit cost (MAD)</th><th>Stock value (MAD)</th><th>Used in recipes</th><th>Stock condition</th><th>Actions</th></tr></thead><tbody>
        {paginatedItems.map(value => <tr key={value.id}><td><strong>{value.name}</strong></td><td>{value.supplier?.name || '—'}</td><td>{value.quantity}</td><td>{value.lowStockThreshold ?? '—'}</td><td>{value.cost === null ? 'Not set' : value.cost.toFixed(2)}</td><td>{value.quantity < 0 ? 'Needs recount' : (value.quantity * (value.cost || 0)).toFixed(2)}</td><td>{value.productMaterials?.length || 0}</td><td>{value.quantity < 0 ? 'Needs recount' : value.lowStockThreshold !== null && value.quantity <= value.lowStockThreshold ? 'Low stock' : 'In stock'}</td>
          <td><div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}><button type="button" className={styles.secondaryAction} onClick={() => setEditing(value)}>Edit details</button>
            <fieldset disabled={!storageReady} style={{ display: 'flex', flexWrap: 'wrap', gap: 8, border: 0, padding: 0 }}><StockCountButton kind="MATERIAL" id={value.id} name={value.name} quantity={value.quantity} /><PurchaseButton id={value.id} name={value.name} cost={value.cost} /></fieldset>
            <button type="button" className={styles.secondaryAction} disabled={value.quantity !== 0 || Boolean(value.productMaterials?.length)} onClick={() => setRemove(value)}>Remove unused material</button></div></td></tr>)}
        {!filtered.length && <tr><td colSpan={9} style={{ padding: '2rem', textAlign: 'center' }}>No materials match these filters.</td></tr>}
      </tbody></table>
    </div>
    <TablePagination page={page} totalPages={totalPages} totalItems={totalItems} rowsPerPage={rowsPerPage} onPageChange={setPage} onRowsPerPageChange={setRowsPerPage} />
    {editing && <MaterialModal key={editing === 'new' ? 'new' : editing.id} isOpen material={editing === 'new' ? undefined : editing} onClose={() => setEditing(null)} suppliers={suppliers} />}
    <ConfirmModal isOpen={Boolean(remove)} title="Remove unused material?" message="Only materials with no recipe or movement history can be removed. Historical materials must be retained." confirmText={busy ? 'Removing…' : 'Remove material'} onCancel={() => { if (!busy) setRemove(null); }} onConfirm={async () => { if (!remove || busy) return; setBusy(true); setError(''); try { const result = await deleteMaterial(remove.id); if (result.error) setError(result.error); else router.refresh(); } catch { setError('Could not remove this material.'); } finally { setBusy(false); setRemove(null); } }} />
  </>;
}
