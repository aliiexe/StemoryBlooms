import Link from 'next/link';
import { db, draftOrder, user, eq, sql, and, desc } from '@stemory/database';
import { assertAdmin } from '@/lib/user-sync';
import { readDraftPayload } from '@/lib/commerce/drafts';
import DraftStatusActions from './DraftStatusActions';
import DraftFilters from './DraftFilters';
import styles from '../dashboard.module.css';

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
    <header className={styles.pageHeader}><div><h1 className={styles.pageTitle}>Order drafts</h1><p>Save custom requests and assisted orders here. Stock and sales change only when a draft becomes an order.</p></div><Link className={styles.secondaryAction} href="/admin/orders/new">New order or draft</Link></header>
    <DraftFilters key={`${search}:${status}`} search={search} status={status} />
    <p role="status">{count} matching {count === 1 ? 'draft' : 'drafts'}</p>
    <div className={styles.tableScroller} role="region" aria-label="Order drafts" tabIndex={0}>
      <table className={styles.table}><thead><tr><th>Draft and buyer</th><th>Channel / items</th><th>Status</th><th>Created by</th><th>Updated</th><th>Actions</th></tr></thead>
        <tbody>{rows.map(({ draft: row, actorName, actorEmail }) => {
          const draft = readDraftPayload(row.payload);
          return <tr key={row.id}><td><Link href={`/admin/custom-orders/${row.id}`}>{draft?.title || 'Earlier draft needs review'}</Link>{draft?.data.customerName && <p>{draft.data.customerName}</p>}{draft?.data.phoneNumber && <p>{draft.data.phoneNumber}</p>}</td>
            <td>{draft?.data.source.replaceAll('_', ' ') || 'Unknown'}<p>{draft?.data.items.length || 0} item selections</p></td>
            <td>{draft?.status === 'CONVERTED' ? 'Order created' : draft?.status === 'ARCHIVED' ? 'Archived' : draft ? 'Draft' : 'Needs review'}</td>
            <td>{actorName || actorEmail || 'Earlier record'}</td><td>{row.updatedAt.toLocaleString('en-GB', { timeZone: 'Africa/Casablanca', dateStyle: 'medium', timeStyle: 'short' })}</td>
            <td><div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>{draft?.status === 'CONVERTED' && draft.convertedOrderId ? <Link href={`/admin/orders/${draft.convertedOrderId}`}>Open {draft.convertedOrderNumber}</Link> : <Link href={`/admin/custom-orders/${row.id}`}>{draft?.status === 'ARCHIVED' ? 'View saved draft' : 'Resume draft'}</Link>}
              {draft && draft.status !== 'CONVERTED' && <DraftStatusActions id={row.id} revision={draft.revision} archived={draft.status === 'ARCHIVED'} />}</div></td></tr>;
        })}{rows.length === 0 && <tr><td colSpan={6} style={{ padding: '2rem', textAlign: 'center' }}>No drafts match these filters. <Link href="/admin/orders/new">Start a new order</Link></td></tr>}</tbody>
      </table>
    </div>
    <nav aria-label="Draft list pages" className={styles.filterBar}>{page > 1 && <Link href={pageUrl(page - 1)}>Previous</Link>}<span>Page {page} of {pages}</span>{page < pages && <Link href={pageUrl(page + 1)}>Next</Link>}</nav>
  </div>;
}
