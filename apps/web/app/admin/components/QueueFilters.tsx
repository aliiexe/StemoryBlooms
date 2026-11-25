'use client';
import {useState} from 'react';
import {Search} from 'lucide-react';
import {CustomSelect} from '@/components/ui/CustomSelect';
import styles from '../workspace.module.css';
export default function QueueFilters({action,search,status,options,placeholder}:{action:string;search:string;status:string;options:{value:string;label:string}[];placeholder:string}){
 const [current,setCurrent]=useState(status);
 return <form method="get" action={action} className={styles.filterToolbar}><label className={`${styles.filterField} ${styles.filterSearch}`}><span><Search size={14}/>Search</span><input type="search" name="search" defaultValue={search} placeholder={placeholder} maxLength={150}/></label><label className={`${styles.filterField} ${styles.filterSelect}`}><span>Status</span><CustomSelect name="status" label="Queue status" value={current} onChange={setCurrent} options={options}/></label><button className={styles.secondary} type="submit">Apply</button></form>;
}
