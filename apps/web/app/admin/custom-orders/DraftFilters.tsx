import { Search } from 'lucide-react';
import styles from '../dashboard.module.css';
export default function DraftFilters({ search, status }: { search: string; status: string }) {
  return <form method="get" action="/admin/custom-orders" className={styles.filterBar}>
    <input type="hidden" name="status" value={status}/>
    <label style={{maxWidth:420,flex:'1 1 280px'}}>Search drafts<div style={{position:'relative'}}><Search size={15} aria-hidden="true" style={{position:'absolute',left:12,top:14,color:'#98a08e'}}/><input style={{paddingLeft:36}} name="search" type="search" defaultValue={search} placeholder="Search by customer, title or phone…" maxLength={150} /></div></label>
    <button type="submit" className={styles.secondaryAction}>Search</button>
  </form>;
}
