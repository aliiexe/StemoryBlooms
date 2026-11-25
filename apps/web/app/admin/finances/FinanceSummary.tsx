import {assertAdmin} from '@/lib/user-sync';
import {financeSummary} from '@/lib/commerce/finance';
import {formatPaymentMoney as money} from '@/lib/commerce/payment-state';
import styles from './finance.module.css';
export default async function FinanceSummary({range}:{range?:{from:string;to:string;label:string}}){
 await assertAdmin();const value=await financeSummary(undefined,range);
 return <section aria-label="Recorded money"><div className={styles.metrics}>{[
 {label:'Payments received',amount:value.collected,hint:range?.label||'All recorded history'},
 {label:'Awaiting carrier settlement',amount:value.allTimeCarrierOutstanding,hint:'Across all dates · not yet remitted'},
 {label:'Expenses paid',amount:value.expensesCents,hint:range?.label||'All recorded history'},
 {label:'Net recorded movement',amount:value.cashPosition,hint:'Store receipts + settlements − refunds − expenses'},
 ].map(metric=><div key={metric.label} className={styles.metric}><span>{metric.label}</span><strong>{money(metric.amount)}</strong><small>{metric.hint}</small></div>)}</div>
 <details className={styles.details}><summary>What these figures include{value.unrecordedCompletedCount>0?` · ${value.unrecordedCompletedCount} completed orders have no payment entry`:''}</summary><p>Record received payments from an order. These totals describe recorded transactions; they do not establish a bank balance or profit.</p><p>Refunds: {money(value.cashRefunded)} · Carrier fees: {money(value.fees)} · Gift credit restored: {money(value.giftRestored)}</p>{value.unclassifiedLegacyCents>0&&<p>Earlier orders marked paid without payment details: {money(value.unclassifiedLegacyCents)}.</p>}{!value.ready&&<p>Received payments are available. Advanced refunds and settlements need the finance update before use.</p>}</details></section>;
}
