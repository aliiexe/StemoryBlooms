'use client';

import React, {  useState, useTransition  } from 'react';
import { useSearchParams } from 'next/navigation';
import { updateMaterialInline, deleteMaterial, restockMaterial } from '../materials/actions';
import { backfillProductMaterialDeductions } from '../products/actions';
import styles from '../dashboard.module.css';
import { MaterialModal } from './MaterialModal';
import { usePagination } from '../components/usePagination';
import { TablePagination } from '../components/TablePagination';
import ConfirmModal from '../components/ConfirmModal';
import { toast } from 'sonner';

interface Material {
  id: string;
  name: string;
  quantity: number;
  cost: number | null;
  lowStockThreshold: number | null;
  supplierId?: string | null;
  supplier?: { id: string; name: string } | null;
  productMaterials?: any[];
}

interface Props {
  initialMaterials: Material[];
  suppliers?: { id: string; name: string }[];
}

export function InventoryTableClient({ initialMaterials, suppliers }: Props) {

  const [materials, setMaterials] = useState(initialMaterials);
  const [isPending, startTransition] = useTransition();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [backfilling, setBackfilling] = useState(false);
  const [showBackfillConfirm, setShowBackfillConfirm] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [restockingId, setRestockingId] = useState<string | null>(null);
  const [restockQty, setRestockQty] = useState(1);

  const { page, setPage, rowsPerPage, setRowsPerPage, totalPages, paginatedItems, totalItems } = usePagination(materials, 10);

  async function handleRestock(m: Material) {
    if (restockQty <= 0) return;
    const newQty = m.quantity + restockQty;
    setMaterials(current => current.map(x => x.id === m.id ? { ...x, quantity: newQty } : x));
    setRestockingId(null);
    setRestockQty(1);
    const res = await restockMaterial(m.id, restockQty);
    if (res?.error) toast.error(res.error);
    else toast.success(`Restocked ${restockQty}x ${m.name}`);
  }

  async function executeBackfill() {
    setShowBackfillConfirm(false);
    setBackfilling(true);
    const result = await backfillProductMaterialDeductions();
    setBackfilling(false);
    toast.success(`Done. Deducted materials for ${result.deducted} product-material link(s).`);
  }

  const [error, setError] = useState<string | null>(null);

  const handleUpdate = (id: string, updates: Partial<Material>) => {
    // Optimistic UI update
    setMaterials(current =>
      current.map(m => (m.id === id ? { ...m, ...updates } : m))
    );
    startTransition(async () => {
      const res = await updateMaterialInline(id, updates);
      if (res?.error) toast.error(res.error);
      else toast.success('Material updated');
    });
  };

  const confirmDelete = async (id: string) => {
    setItemToDelete(null);
    const res = await deleteMaterial(id);
    if (res?.error) {
      setError(res.error);
      toast.error(res.error);
    } else {
      setMaterials(current => current.filter(m => m.id !== id));
      toast.success('Material deleted');
    }
  };

  return (
    <>
      {error && <div style={{ color: '#C62828', backgroundColor: '#FFEBEE', padding: '1rem', borderRadius: '12px', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between' }}>
        <span>{error}</span>
        <button onClick={() => setError(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#C62828' }}>✕</button>
      </div>}
      
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginBottom: '1rem' }}>
        <button
          onClick={() => setShowBackfillConfirm(true)}
          disabled={backfilling}
          style={{ padding: '0.6rem 1.25rem', borderRadius: '8px', border: 'none', backgroundColor: '#F0F4FF', color: '#3451B2', fontWeight: 600, cursor: backfilling ? 'not-allowed' : 'pointer', fontSize: '0.9rem' }}
        >
          {backfilling ? 'Running...' : '🔄 Run Auto-Deduct (Backfill)'}
        </button>
        <button
          onClick={() => setIsModalOpen(true)}
          style={{ padding: '0.75rem 1.5rem', borderRadius: '8px', border: 'none', backgroundColor: 'var(--brand-primary)', color: '#fff', cursor: 'pointer', fontWeight: 500 }}
        >
          + Add Material
        </button>
      </div>

      <div className={styles.card}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Material</th>
              <th>Supplier</th>
              <th>Quantity in Stock</th>
              <th>Low Stock Threshold</th>
              <th>Cost per Unit (MAD)</th>
              <th>Total Value (MAD)</th>
              <th>Used In</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedItems.map((m) => {
              const totalValue = (m.quantity || 0) * (m.cost || 0);
              return (
                <tr key={m.id}>
                  <td><strong>{m.name}</strong></td>
                  <td>{m.supplier?.name || '-'}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <button
                        onClick={() => handleUpdate(m.id, { quantity: Math.max(0, m.quantity - 1) })}
                        style={{ width: '24px', height: '24px', borderRadius: '4px', border: '1px solid #D6CFE6', background: '#fff', cursor: 'pointer' }}
                      >-</button>
                      <input
                        type="number"
                        className="no-spinners"
                        value={m.quantity}
                        onChange={(e) => handleUpdate(m.id, { quantity: parseInt(e.target.value) || 0 })}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') e.currentTarget.blur();
                        }}
                        style={{ width: '60px', padding: '0.25rem', textAlign: 'center', border: '1px solid #D6CFE6', borderRadius: '4px' }}
                      />
                      {restockingId === m.id ? (
                        <>
                          <input
                            type="number"
                            min={1}
                            className="no-spinners"
                            value={restockQty}
                            onChange={(e) => setRestockQty(parseInt(e.target.value) || 1)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') e.currentTarget.blur();
                            }}
                            style={{ width: '50px', padding: '0.25rem', textAlign: 'center', border: '1px solid #8C9C76', borderRadius: '4px' }}
                            autoFocus
                          />
                          <button
                            onClick={() => handleRestock(m)}
                            style={{ padding: '0.2rem 0.5rem', borderRadius: '4px', border: 'none', background: '#8C9C76', color: '#fff', cursor: 'pointer', fontSize: '0.8rem' }}
                          >✓</button>
                          <button
                            onClick={() => { setRestockingId(null); setRestockQty(1); }}
                            style={{ padding: '0.2rem 0.5rem', borderRadius: '4px', border: '1px solid #D6CFE6', background: '#fff', cursor: 'pointer', fontSize: '0.8rem' }}
                          >✕</button>
                        </>
                      ) : (
                        <button
                          onClick={() => { setRestockingId(m.id); setRestockQty(1); }}
                          style={{ padding: '0.2rem 0.6rem', borderRadius: '4px', border: '1px solid #8C9C76', background: '#F1F5EC', color: '#8C9C76', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}
                          title="Restock (logs expense)"
                        >+ Restock</button>
                      )}
                    </div>
                  </td>
                  <td>
                    <input
                      type="number"
                      value={m.lowStockThreshold === null ? '' : m.lowStockThreshold}
                      onChange={(e) => handleUpdate(m.id, { lowStockThreshold: e.target.value ? parseInt(e.target.value) : null })}
                      style={{ width: '60px', padding: '0.25rem', textAlign: 'center', border: '1px solid #D6CFE6', borderRadius: '4px' }}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      step="0.01"
                      value={m.cost || ''}
                      onChange={(e) => handleUpdate(m.id, { cost: parseFloat(e.target.value) || 0 })}
                      style={{ width: '80px', padding: '0.25rem', border: '1px solid #D6CFE6', borderRadius: '4px' }}
                    />
                  </td>
                  <td style={{ fontWeight: 500, color: 'var(--brand-primary)' }}>
                    {totalValue.toFixed(2)}
                  </td>
                  <td>{m.productMaterials?.length ?? 0}</td>
                  <td>
                    <span className={styles.badge} style={{ backgroundColor: m.lowStockThreshold !== null && m.quantity <= m.lowStockThreshold ? '#FCE4EC' : '#E8F5E9', color: m.lowStockThreshold !== null && m.quantity <= m.lowStockThreshold ? '#880E4F' : '#1B5E20' }}>
                      {m.lowStockThreshold !== null && m.quantity <= m.lowStockThreshold ? 'Low Stock' : 'In Stock'}
                    </span>
                  </td>
                  <td>
                    <button
                      onClick={() => setItemToDelete(m.id)}
                      style={{ color: '#C62828', background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem' }}
                      title="Delete"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              );
            })}
            {materials.length === 0 && (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: '#7A7571' }}>No materials tracked yet.</td>
              </tr>
            )}
          </tbody>
        </table>
        <TablePagination 
          page={page} 
          totalPages={totalPages} 
          totalItems={totalItems} 
          rowsPerPage={rowsPerPage} 
          onPageChange={setPage} 
          onRowsPerPageChange={setRowsPerPage} 
        />
      </div>

      <MaterialModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} suppliers={suppliers} />
      
      <ConfirmModal
        isOpen={!!itemToDelete}
        title="Delete Material"
        message="Are you sure you want to delete this material? This action cannot be undone."
        confirmText="Delete Material"
        cancelText="Cancel"
        onConfirm={() => {
          if (itemToDelete) confirmDelete(itemToDelete);
        }}
        onCancel={() => setItemToDelete(null)}
      />
    </>
  );
}
