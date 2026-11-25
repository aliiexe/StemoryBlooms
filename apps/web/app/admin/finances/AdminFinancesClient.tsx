'use client';
import {useState} from 'react';
import {useRouter} from 'next/navigation';
import {Plus,ArrowUpRight,ReceiptText} from 'lucide-react';
import {formatPaymentMoney} from '@/lib/commerce/payment-state';
import AdminDialog from '../components/AdminDialog';
import {ExpenseForm,type ExpenseValue} from './ExpenseForm';
import styles from '../workspace.module.css';
export function AdminFinancesClient({initialExpenses}:{initialExpenses:ExpenseValue[]}){
 const [busy,setBusy]=useState(false);const router=useRouter();const [editing,setEditing]=useState<ExpenseValue|'new'|null>(null);
 return <section className={styles.tableSurface}><div className={styles.tableToolbar}><div><strong>Paid expenses</strong><p className={styles.sectionHint}>Operating costs and recorded purchases</p></div><button className={styles.primary} type="button" onClick={()=>setEditing('new')}><Plus size={15}/>Record expense</button></div>
 {initialExpenses.length?<div className={styles.tableWrap} role="region" aria-label="Paid expenses" tabIndex={0}><table className={styles.table}><thead><tr><th>Date</th><th>Description</th><th>Category</th><th style={{textAlign:'right'}}>Paid</th><th style={{textAlign:'right'}}> </th></tr></thead><tbody>{initialExpenses.map(value=><tr key={value.id}><td style={{whiteSpace:'nowrap'}}>{new Date(value.date).toLocaleDateString('en-GB',{timeZone:'Africa/Casablanca',day:'numeric',month:'short',year:'numeric'})}</td><td style={{minWidth:200,maxWidth:440}}>{value.description}</td><td><span className={styles.status}>{value.category.toLowerCase().replaceAll('_',' ')}</span></td><td className={styles.money} style={{textAlign:'right'}}>{formatPaymentMoney(value.amount*100)}</td><td style={{textAlign:'right'}}><button className={styles.rowAction} type="button" onClick={()=>setEditing(value)}>View<ArrowUpRight size={13}/></button></td></tr>)}</tbody></table></div>:<div className={styles.emptyState}><ReceiptText size={30} strokeWidth={1.25}/><h2>No expenses in this view</h2><p>Choose All recorded history to see earlier purchases, or record a new paid expense.</p></div>}
 <AdminDialog open={Boolean(editing)} title={editing==='new'?'Record paid expense':'Expense details'} busy={busy} onClose={()=>{if(!busy)setEditing(null);}}>{editing&&<ExpenseForm onBusyChange={setBusy} key={editing==='new'?'new':editing.id} expense={editing==='new'?undefined:editing} onSaved={()=>{setEditing(null);router.refresh();}}/>}</AdminDialog></section>;
}
