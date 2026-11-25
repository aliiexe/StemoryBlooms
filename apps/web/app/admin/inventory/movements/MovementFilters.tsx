'use client';
import { useState } from 'react';
import { CustomSelect } from '@/components/ui/CustomSelect';
import styles from '../../dashboard.module.css';
export default function MovementFilters({ search, kind, type }: { search: string; kind: string; type: string }) {
  const [subject, setSubject] = useState(kind); const [operation, setOperation] = useState(type);
  return <form method="get" action="/admin/inventory/movements" className={styles.filterBar}><label>Search movements<input name="search" type="search" defaultValue={search} placeholder="Item name or reason" maxLength={150} /></label>
    <label>Item type<CustomSelect name="kind" label="Movement item type" value={subject} onChange={setSubject} options={['ALL', 'MATERIAL', 'COMPONENT', 'PRODUCT'].map(value => ({ value, label: value === 'ALL' ? 'All items' : value.toLowerCase() }))} /></label>
    <label>Operation<CustomSelect name="type" label="Movement operation" value={operation} onChange={setOperation} options={['ALL', 'PRODUCTION', 'PURCHASE', 'CORRECTION', 'ORDER_RESERVATION', 'CANCELLATION', 'REOPEN', 'INSPECTED_RETURN', 'LEGACY'].map(value => ({ value, label: value === 'ALL' ? 'All operations' : value.toLowerCase().replaceAll('_', ' ') }))} /></label><button className={styles.secondaryAction} type="submit">Apply filters</button></form>;
}
