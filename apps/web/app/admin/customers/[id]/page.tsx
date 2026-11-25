import { db, customer, eq, order, desc, sql } from '@stemory/database';
import { assertAdmin } from '@/lib/user-sync';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import CustomerEditor from './CustomerEditor';
import styles from '../../dashboard.module.css';
export default async function CustomerPage({params,searchParams}:{params:Promise<{id:string}>;searchParams:Promise<{page?:string}>}) {
  await assertAdmin();
  const {id}=await params;const filters=await searchParams;const page=Math.max(1,Math.min(10000,Number.parseInt(filters.page||'1',10)||1));
  const profile=await db.query.customer.findFirst({where:eq(customer.id,id)});if(!profile)notFound();
  const [orders,totals]=await Promise.all([
    db.select({id:order.id,number:order.orderNumber,status:order.status,total:order.total,createdAt:order.createdAt}).from(order).where(eq(order.customerId,id)).orderBy(desc(order.createdAt),desc(order.id)).limit(25).offset((page-1)*25),
    db.select({count:sql<number>`count(*)::integer`}).from(order).where(eq(order.customerId,id)),
  ]);
  const pages=Math.max(1,Math.ceil(totals[0].count/25));
  return <div className={styles.dashboard}><Link href="/admin/customers">← Customers</Link><h1 className={styles.pageTitle}>{profile.firstName} {profile.lastName}</h1>
    <section className={styles.card} style={{padding:'1.25rem'}}><CustomerEditor key={profile.updatedAt.toISOString()} profile={profile}/></section>
    <h2>Order history</h2><p>{totals[0].count} orders across sales channels.</p><div className={styles.tableScroller} role="region" aria-label="Customer order history" tabIndex={0}><table className={styles.table}><thead><tr><th>Order</th><th>Date</th><th>Status</th><th>Amount</th></tr></thead><tbody>{orders.map(row=><tr key={row.id}><td><Link href={`/admin/orders/${row.id}`}>{row.number}</Link></td><td>{row.createdAt.toLocaleDateString('en-GB',{timeZone:'Africa/Casablanca'})}</td><td>{row.status}</td><td>{row.total} MAD</td></tr>)}</tbody></table></div>
    <nav aria-label="Customer order pages" className={styles.filterBar}>{page>1&&<Link href={`/admin/customers/${id}?page=${page-1}`}>Previous</Link>}<span>Page {page} of {pages}</span>{page<pages&&<Link href={`/admin/customers/${id}?page=${page+1}`}>Next</Link>}</nav>
  </div>;
}
