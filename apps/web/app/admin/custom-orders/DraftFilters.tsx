'use client';
import { CustomSelect } from '@/components/ui/CustomSelect';
import { useState } from 'react';
import styles from '../dashboard.module.css';
export default function DraftFilters({ search, status }: { search: string; status: string }) {
  const [selected, setSelected] = useState(status);
  return <form method="get" action="/admin/custom-orders" className={styles.filterBar}>
    <label>Search drafts<input name="search" type="search" defaultValue={search} placeholder="Title, buyer, phone, or order" maxLength={150} /></label>
    <label style={{ minWidth: 190 }}>Draft status<CustomSelect name="status" label="Filter draft status" value={selected} onChange={setSelected} options={[{ value: 'DRAFT', label: 'Active drafts' }, { value: 'CONVERTED', label: 'Order created' }, { value: 'ARCHIVED', label: 'Archived' }, { value: 'ALL', label: 'All drafts' }]} /></label>
    <button type="submit" className={styles.secondaryAction}>Apply filters</button>
  </form>;
}
