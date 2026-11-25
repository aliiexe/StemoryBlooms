'use client';
import {useState} from 'react';
import {CalendarDays,Search} from 'lucide-react';
import {CustomSelect} from '@/components/ui/CustomSelect';
import type {ReportPeriod} from '@/lib/commerce/reporting';
import styles from '../workspace.module.css';
export default function PeriodFilters({path,value,allowAll=false,search}:{path:string;value:ReportPeriod;allowAll?:boolean;search?:string}){
 const [period,setPeriod]=useState(value.period);
 return <form method="get" action={path} className={styles.filterToolbar}>
 {search!==undefined&&<label className={`${styles.filterField} ${styles.filterSearch}`}><span><Search size={14}/>Search expenses</span><input name="search" type="search" defaultValue={search} maxLength={150} placeholder="Description or category…"/></label>}
 <label className={`${styles.filterField} ${styles.filterSelect}`}><span><CalendarDays size={14}/>Period</span><CustomSelect name="period" label="Reporting period" value={period} onChange={setPeriod} options={[{value:'MONTH',label:'This month'},{value:'30',label:'Last 30 days'},{value:'90',label:'Last 90 days'},...(allowAll?[{value:'ALL',label:'All recorded history'}]:[]),{value:'CUSTOM',label:'Custom dates'}]}/></label>
 {period==='CUSTOM'&&<><label className={styles.filterField}><span>From</span><input name="from" type="date" defaultValue={value.from} required/></label><label className={styles.filterField}><span>Through</span><input name="to" type="date" defaultValue={value.to} required/></label></>}
 <button type="submit" className={styles.secondary}>Apply</button>{value.error&&<p role="alert" className={styles.sectionHint}>{value.error}</p>}
 </form>;
}
