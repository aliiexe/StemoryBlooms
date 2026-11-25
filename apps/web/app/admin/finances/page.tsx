import {db,expense,sql,and,desc} from '@stemory/database';
import {assertAdmin} from '@/lib/user-sync';
import Link from 'next/link';
import {ArrowUpRight} from 'lucide-react';
import {reportPeriod} from '@/lib/commerce/reporting';
import PeriodFilters from '../components/PeriodFilters';
import FinanceSummary from './FinanceSummary';
import {AdminFinancesClient} from './AdminFinancesClient';
import styles from '../dashboard.module.css';
import ui from '../workspace.module.css';
export default async function AdminFinancesPage({searchParams}:{searchParams:Promise<{search?:string;page?:string;period?:string;from?:string;to?:string}>}){
 await assertAdmin();const filters=await searchParams;const range=reportPeriod(filters,new Date(),'MONTH',true);const search=(filters.search||'').trim().slice(0,150);const page=Math.max(1,Math.min(10000,Number.parseInt(filters.page||'1',10)||1));const pattern=`%${search.replace(/[\\%_]/g,value=>`\\${value}`)}%`;
 const where=and(search?sql`(${expense.description} ILIKE ${pattern} OR ${expense.category} ILIKE ${pattern})`:undefined,range.from?sql`(${expense.date} AT TIME ZONE 'UTC' AT TIME ZONE 'Africa/Casablanca')::date>=${range.from}::date`:undefined,range.to?sql`(${expense.date} AT TIME ZONE 'UTC' AT TIME ZONE 'Africa/Casablanca')::date<=${range.to}::date`:undefined);
 const [rows,totals]=await Promise.all([db.select().from(expense).where(where).orderBy(desc(expense.date),desc(expense.id)).limit(25).offset((page-1)*25),db.select({count:sql<number>`count(*)::integer`}).from(expense).where(where)]);const pages=Math.max(1,Math.ceil(totals[0].count/25));const url=(next:number)=>`/admin/finances?${new URLSearchParams({search,period:range.period,from:range.from,to:range.to,page:String(next)})}`;
 return <div className={styles.dashboard}><header className={styles.pageHeader}><div><h1 className={styles.pageTitle}>Money & expenses</h1><p>Received payments, carrier settlements, and paid expenses.</p></div><Link className={ui.secondary} href="/admin/orders?view=ALL">Review order payments<ArrowUpRight size={14}/></Link></header><PeriodFilters path="/admin/finances" value={range} allowAll/><FinanceSummary range={range}/><form method="get" action="/admin/finances" className={ui.filterToolbar}><input type="hidden" name="period" value={range.period}/><input type="hidden" name="from" value={range.from}/><input type="hidden" name="to" value={range.to}/><label className={`${ui.filterField} ${ui.filterSearch}`}><span>Search expenses</span><input type="search" name="search" maxLength={150} defaultValue={search} placeholder="Description or category…"/></label><button type="submit" className={ui.secondary}>Search</button></form><AdminFinancesClient initialExpenses={rows}/><nav className={ui.pagination} aria-label="Expense pages"><span>{range.label} · {totals[0].count} expenses</span><div className={ui.actions}>{page>1&&<Link href={url(page-1)}>Previous</Link>}<span>{page} / {pages}</span>{page<pages&&<Link href={url(page+1)}>Next</Link>}</div></nav></div>;
}
