'use client';
import { useRememberedState } from '@/components/navigation/useRememberedState';
import {useState} from 'react';
import type {category} from '@stemory/database';
import {Plus,Search,ArrowUpRight,Tags} from 'lucide-react';
import {CategoryForm} from './CategoryForm';
import AdminDialog from '../components/AdminDialog';
import styles from '../workspace.module.css';
export function AdminCategoriesClient({initialCategories}:{initialCategories:(typeof category.$inferSelect)[];categoryIdeas:string[]}){
 const [search,setSearch]=useRememberedState("search", '');const [editing,setEditing]=useState<typeof category.$inferSelect|'NEW'|null>(null);const [busy,setBusy]=useState(false);const matches=initialCategories.filter(row=>row.name.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase()));
 return <><div className={styles.filterToolbar}><label className={`${styles.filterField} ${styles.filterSearch}`}><span><Search size={14}/>Search categories</span><input type="search" value={search} onChange={event=>setSearch(event.target.value)} placeholder="Category name…" maxLength={100}/></label><button type="button" className={styles.primary} onClick={()=>setEditing('NEW')}><Plus size={16}/>Add category</button></div><section className={styles.tableSurface}><div className={styles.tableToolbar}><strong>Product categories</strong><span>{matches.length} categories</span></div>{matches.length?<div className={styles.tableWrap}><table className={styles.table}><thead><tr><th>Name</th><th style={{textAlign:'right'}}> </th></tr></thead><tbody>{matches.map(row=><tr key={row.id}><td>{row.name}</td><td style={{textAlign:'right'}}><button type="button" className={styles.rowAction} onClick={()=>setEditing(row)}>Edit<ArrowUpRight size={13}/></button></td></tr>)}</tbody></table></div>:<div className={styles.emptyState}><Tags size={30}/><h2>No categories in this view</h2><p>Use short, useful names to help customers browse your products.</p></div>}</section><AdminDialog open={Boolean(editing)} title={editing==='NEW'?'Add category':'Edit category'} busy={busy} onClose={()=>setEditing(null)}>{editing&&<CategoryForm key={editing==='NEW'?'NEW':editing.id} category={editing==='NEW'?undefined:editing} onBusyChange={setBusy} onSaved={()=>setEditing(null)}/>}</AdminDialog></>;
}
