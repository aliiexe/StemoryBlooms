'use client';
import { useState } from 'react';
import { CustomSelect } from '@/components/ui/CustomSelect';
import { ORDER_STATUS_LABELS } from '@/lib/commerce/order-status';
import styles from '../dashboard.module.css';

export default function OrdersFilters({ search, status, from, to, archived, view }: { search: string; status: string; from: string; to: string; archived: boolean; view: string }) {
  const [selected, setSelected] = useState(status);
  const active=Boolean(status||from||to);
  return <form method="get" className={styles.filterBar}>
    <input type="hidden" name="view" value={view}/>{archived&&<input type="hidden" name="archived" value="1"/>}
    <label style={{flex:'1 1 260px',maxWidth:420}}>Search orders<input name="search" type="search" defaultValue={search} maxLength={150} placeholder="Search by customer, order or phone…"/></label>
    <button type="submit" className={styles.secondaryAction}>Search</button>
    <details open={active||undefined} style={{width:'100%'}}><summary style={{cursor:'pointer',fontSize:12,color:'#7a896c',padding:'6px 0'}}>Filters{active?' · active':''}</summary><div style={{display:'flex',flexWrap:'wrap',alignItems:'end',gap:12,paddingTop:10}}>
    <label style={{width:190,flex:'0 1 190px'}}>Fulfillment<CustomSelect name="status" label="Filter fulfillment status" value={selected} onChange={setSelected} options={[{value:'',label:'All statuses'},...Object.entries(ORDER_STATUS_LABELS).map(([value,label])=>({value,label}))]}/></label>
    <label>From<input name="from" type="date" defaultValue={from}/></label><label>Through<input name="to" type="date" defaultValue={to}/></label><button type="submit" className={styles.secondaryAction}>Apply filters</button>
    </div></details>
  </form>;
}
