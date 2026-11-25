import { assertAdmin } from '@/lib/user-sync';
import { db, review, product, sql, and, desc, eq } from '@stemory/database';
import styles from '../dashboard.module.css';
import ui from '../workspace.module.css';
import {Star,MessageSquare} from 'lucide-react';
import { ReviewActions } from './ReviewActions';
import QueueFilters from '../components/QueueFilters';
import QueuePagination from '../components/QueuePagination';
export default async function AdminReviewsPage({ searchParams }: { searchParams: Promise<{ search?: string; status?: string; page?: string }> }) {
  await assertAdmin();
  const filters = await searchParams; const search = (filters.search || '').trim().slice(0,150); const status = ['PENDING','APPROVED','REJECTED','ALL'].includes(filters.status || '') ? filters.status! : 'PENDING';
  const page = Math.max(1,Math.min(10000,Number.parseInt(filters.page || '1',10) || 1)); const pattern = `%${search.replace(/[\\%_]/g,value => `\\${value}`)}%`;
  const where = and(status !== 'ALL' ? eq(review.status,status) : undefined,search ? sql`(${review.authorName} ILIKE ${pattern} OR ${review.content} ILIKE ${pattern} OR ${product.name} ILIKE ${pattern})` : undefined);
  const [rows,totals] = await Promise.all([db.select({ review, productName: product.name }).from(review).innerJoin(product,eq(product.id,review.productId)).where(where).orderBy(desc(review.createdAt),desc(review.id)).limit(25).offset((page-1)*25),db.select({ count: sql<number>`count(*)::integer` }).from(review).innerJoin(product,eq(product.id,review.productId)).where(where)]);
  return <div className={styles.dashboard}><header className={styles.pageHeader}><div><h1 className={styles.pageTitle}>Customer reviews</h1><p>Review customer feedback before it appears on your website.</p></div></header>
    <QueueFilters action="/admin/reviews" search={search} status={status} placeholder="Author, product, or review" options={['PENDING','APPROVED','REJECTED','ALL'].map(value=>({value,label:value==='ALL'?'All reviews':value.toLowerCase().replace(/^./,letter=>letter.toUpperCase())}))}/>
    <div style={{display:'grid',gap:16,gridTemplateColumns:'repeat(auto-fit,minmax(min(100%,420px),1fr))'}}>{rows.map(({review:row,productName})=><article key={row.id} className={ui.panel}><div className={ui.sectionTitle}><div><h2>{productName}</h2><p className={ui.rowMeta}>{row.authorName} · {row.createdAt.toLocaleDateString('en-GB',{timeZone:'Africa/Casablanca',dateStyle:'medium'})}</p></div><span className={ui.status}>{row.status.toLowerCase()}</span></div><p style={{display:'flex',gap:6,alignItems:'center',fontSize:12,color:'#8c955e'}}><Star size={14}/>{row.rating>=1&&row.rating<=5?`${row.rating} / 5`:'Rating needs review'}</p>{row.title&&<h3>{row.title}</h3>}<p style={{whiteSpace:'pre-wrap',fontSize:14,lineHeight:1.75,color:'#647655',overflowWrap:'anywhere'}}>{row.content}</p><div style={{paddingTop:18,borderTop:'1px solid #e7edde'}}><ReviewActions id={row.id} status={row.status}/></div></article>)}</div>
    {rows.length===0&&<div className={ui.tableSurface}><div className={ui.emptyState}><MessageSquare size={30} strokeWidth={1.25}/><h2>No reviews in this view</h2><p>Choose another status to review earlier feedback.</p></div></div>}<QueuePagination path="/admin/reviews" page={page} search={search} status={status} count={totals[0].count}/></div>;
}
