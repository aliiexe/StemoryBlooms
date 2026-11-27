import ContextLink from '@/components/navigation/ContextLink';
import Link from 'next/link';
import { db, draftOrder, user, eq, sql, and, desc } from '@stemory/database';
import { assertAdmin } from '@/lib/user-sync';
import { readDraftPayload } from '@/lib/commerce/drafts';
import DraftStatusActions from './DraftStatusActions';
import DraftFilters from './DraftFilters';
import styles from '../dashboard.module.css';
import workspace from '../workspace.module.css';
import { Plus, FileText, ArrowUpRight } from 'lucide-react';

type Filters = { search?: string; status?: string; page?: string };
export default async function AdminCustomOrdersPage({ searchParams }: { searchParams: Promise<Filters> }) {
  await assertAdmin();
  const filters = await searchParams;
  const search = (filters.search || '').trim().slice(0, 150);
  const status = ['DRAFT', 'ARCHIVED', 'CONVERTED', 'ALL'].includes(filters.status || '') ? filters.status! : 'DRAFT';
  const page = Math.max(1, Math.min(10000, Number.parseInt(filters.page || '1', 10) || 1));
  const limit = 20;
  const pattern = `%${search.replace(/[\\%_]/g, value => `\\${value}`)}%`;
  const state = sql`COALESCE(${draftOrder.payload}->>'status', 'DRAFT')`;
  const where = and(status !== 'ALL' ? sql`${state} = ${status}` : undefined, search ? sql`(
    ${draftOrder.payload}->>'title' ILIKE ${pattern} OR COALESCE(${draftOrder.payload}->'data'->>'customerName', ${draftOrder.payload}->>'customerName') ILIKE ${pattern}
    OR COALESCE(${draftOrder.payload}->'data'->>'phoneNumber', ${draftOrder.payload}->>'phoneNumber') ILIKE ${pattern}
    OR ${draftOrder.payload}->>'convertedOrderNumber' ILIKE ${pattern} OR ${draftOrder.id} ILIKE ${pattern})` : undefined);
  const [rows, totals] = await Promise.all([
    db.select({ draft: draftOrder, actorName: user.firstName, actorEmail: user.email }).from(draftOrder).leftJoin(user, eq(draftOrder.actorId, user.id))
      .where(where).orderBy(desc(draftOrder.updatedAt), desc(draftOrder.id)).limit(limit).offset((page - 1) * limit),
    db.select({ count: sql<number>`count(*)::int` }).from(draftOrder).where(where),
  ]);
  const count = totals[0].count;
  const pages = Math.max(1, Math.ceil(count / limit));
  const pageUrl = (next: number) => `/admin/custom-orders?${new URLSearchParams({ search, status, page: String(next) })}`;
  return <div className={styles.dashboard}>
    <header className={styles.pageHeader}><div><h1 className={styles.pageTitle}>Order drafts</h1><p>A place for the orders you’re still working on. Resume when you’re ready.</p></div><ContextLink className={workspace.primary} href="/admin/orders/new"><Plus size={16} />Create order</ContextLink></header>
    <nav className={workspace.tabs} aria-label="Draft views">{[{value:'DRAFT',label:'In progress'},{value:'CONVERTED',label:'Orders created'},{value:'ARCHIVED',label:'Archived'},{value:'ALL',label:'All drafts'}].map(tab=><Link key={tab.value} className={workspace.tab} aria-current={status===tab.value?'page':undefined} href={`/admin/custom-orders?${new URLSearchParams({status:tab.value,search})}`}>{tab.label}</Link>)}</nav>
    <DraftFilters key={`${search}:${status}`} search={search} status={status} />
    <section className={workspace.tableSurface} aria-label="Saved drafts">
      <div className={workspace.tableToolbar}><strong>Saved work</strong><span role="status">{count} {count===1?'draft':'drafts'}</span></div>
      {rows.length ? <div className={styles.tableScroller} style={{border:0,borderRadius:0}} role="region" aria-label="Order drafts" tabIndex={0}>
      <table className={styles.table}><thead><tr><th>Draft / customer</th><th>Order details</th><th>Status</th><th>Last saved</th><th style={{textAlign:'right'}}> </th></tr></thead>
        <tbody>{rows.map(({ draft: row }) => {
          const draft = readDraftPayload(row.payload);
          return <tr key={row.id}><td><ContextLink className={workspace.rowTitle} title={draft?.title} href={`/admin/custom-orders/${row.id}`}>{draft?.title || 'Draft to review'}</ContextLink><span className={workspace.rowMeta}>{draft?.data.customerName || 'Customer not added yet'}</span></td>
            <td>{draft?.data.items.reduce((sum,item)=>sum+item.quantity,0) || 0} items<span className={workspace.rowMeta}>{draft?.data.source.replaceAll('_', ' ').toLowerCase() || 'No channel'}</span></td>
            <td><span className={workspace.status} data-tone={draft?.status==='CONVERTED'?'paid':'draft'}>{draft?.status === 'CONVERTED' ? 'Order created' : draft?.status === 'ARCHIVED' ? 'Archived' : draft ? 'In progress' : 'Needs review'}</span></td>
            <td><span style={{whiteSpace:'nowrap'}}>{row.updatedAt.toLocaleDateString('en-GB', { timeZone:'Africa/Casablanca',day:'numeric',month:'short' })}</span><span className={workspace.rowMeta}>{row.updatedAt.toLocaleTimeString('en-GB',{timeZone:'Africa/Casablanca',hour:'2-digit',minute:'2-digit'})}</span></td>
            <td><div className={workspace.rowActions}>{draft?.status === 'CONVERTED' && draft.convertedOrderId ? <ContextLink className={workspace.rowAction} href={`/admin/orders/${draft.convertedOrderId}`}>View order<ArrowUpRight size={14}/></ContextLink> : <ContextLink className={workspace.rowAction} href={`/admin/custom-orders/${row.id}`}>{draft?.status === 'ARCHIVED' ? 'View' : 'Resume'}<ArrowUpRight size={14}/></ContextLink>}
              {draft && draft.status !== 'CONVERTED' && <DraftStatusActions id={row.id} revision={draft.revision} archived={draft.status === 'ARCHIVED'} />}</div></td></tr>;
        })}</tbody>
      </table></div> : <div className={workspace.emptyState}><FileText size={32} strokeWidth={1.25}/><h2>{search?'No matching drafts':'A little room to work things out'}</h2><p>{search?'Try another customer name or clear your search.':'Save an unfinished order here. You can return to the customer, bouquet, price, and payment details later.'}</p><Link className={workspace.primary} href={search?`/admin/custom-orders?status=${status}`:'/admin/orders/new'}>{search?'Clear search':'Start an order'}</Link></div>}
    {count>0 && <nav aria-label="Draft list pages" className={workspace.pagination}><span>Showing {(page-1)*limit+1}–{Math.min(page*limit,count)} of {count}</span><div className={workspace.actions}>{page > 1 && <Link href={pageUrl(page - 1)}>Previous</Link>}<span>{page} / {pages}</span>{page < pages && <Link href={pageUrl(page + 1)}>Next</Link>}</div></nav>}
    </section>
  </div>;
}
