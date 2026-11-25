import {dailyOrderSeries,reportPeriod} from '@/lib/commerce/reporting';
import {assertAdmin} from '@/lib/user-sync';
import {db,order,sql,and} from '@stemory/database';
import Link from 'next/link';
import {ArrowUpRight} from 'lucide-react';
import {ReportsClient} from './ReportsClient';
import PeriodFilters from '../components/PeriodFilters';
import {formatPaymentMoney} from '@/lib/commerce/payment-state';
import styles from '../dashboard.module.css';
import ui from '../workspace.module.css';
export default async function ReportsPage({searchParams}:{searchParams:Promise<{period?:string;from?:string;to?:string}>}){
 await assertAdmin();const range=reportPeriod(await searchParams);
 const recentOrders=await db.query.order.findMany({where:and(sql`${order.createdAt} >= (${range.from}::date::timestamp AT TIME ZONE 'Africa/Casablanca')`,sql`${order.createdAt} < ((${range.to}::date + 1)::timestamp AT TIME ZONE 'Africa/Casablanca')`),orderBy:(table,{asc})=>[asc(table.createdAt)]});
 const series=dailyOrderSeries(recentOrders,range.from,range.to);const booked=series.reduce((sum,row)=>sum+row.revenue,0);const cancelled=recentOrders.filter(row=>row.status==='CANCELLED').length;
 const statuses=Object.entries(recentOrders.reduce<Record<string,number>>((counts,row)=>({...counts,[row.status]:(counts[row.status]||0)+1}),{})).map(([name,value])=>({name,value}));
 return <div className={styles.dashboard}><header className={styles.pageHeader}><div><h1 className={styles.pageTitle}>Reports</h1><p>Order performance, with delivery charges and cancellations excluded from booked value.</p></div><Link href="/admin/finances" className={ui.secondary}>Money & expenses<ArrowUpRight size={14}/></Link></header><PeriodFilters path="/admin/reports" value={range}/>
 <div className={ui.cards}>{[['Booked order value',formatPaymentMoney(booked*100)],['Orders placed',String(recentOrders.length)],['Cancelled orders',String(cancelled)]].map(([label,value])=><div className={ui.stat} key={label}><span>{label}</span><strong>{value}</strong><small>{range.label} · {range.from} – {range.to}</small></div>)}</div>
 <ReportsClient lineData={series} pieData={statuses}/><p className={ui.subtle}>Booked value measures orders placed. View Money & expenses for recorded payments and settlements.</p></div>;
}
