'use client';
import { useState } from 'react';
import { CustomSelect } from '@/components/ui/CustomSelect';
import { ORDER_STATUS_LABELS } from '@/lib/commerce/order-status';
import styles from '../dashboard.module.css';

export default function OrdersFilters({ search, status, from, to, archived }: { search: string; status: string; from: string; to: string; archived: boolean }) {
  const [selected, setSelected] = useState(status);
  return <form method="get" className={styles.filterBar}>
    <label>Search orders<input name="search" defaultValue={search} maxLength={150} placeholder="Reference, name, phone, email" /></label>
    <label style={{ minWidth: 170 }}>Fulfillment<CustomSelect name="status" label="Filter fulfillment status" value={selected} onChange={setSelected} options={[{ value: '', label: 'All statuses' }, ...Object.entries(ORDER_STATUS_LABELS).map(([value,label]) => ({ value,label }))]} /></label>
    <label>From<input name="from" type="date" defaultValue={from} /></label><label>Through<input name="to" type="date" defaultValue={to} /></label>
    {archived && <input type="hidden" name="archived" value="1" />}
    <button type="submit" className={styles.submitBtn} style={{ width: 'auto', margin: 0, minHeight: 44 }}>Apply filters</button>
  </form>;
}
