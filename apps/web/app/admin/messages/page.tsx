import { assertAdmin } from '@/lib/user-sync';
import { db, contactMessage, sql, and, desc, eq } from '@stemory/database';
import MessagesClient from './MessagesClient';
import QueueFilters from '../components/QueueFilters';
import QueuePagination from '../components/QueuePagination';
import styles from '../dashboard.module.css';
export default async function AdminMessagesPage({ searchParams }: { searchParams: Promise<{ search?: string; status?: string; page?: string }> }) {
  await assertAdmin();
  const filters = await searchParams; const search = (filters.search || '').trim().slice(0,150);
  const status = ['UNREAD','READ','RESOLVED','ALL'].includes(filters.status || '') ? filters.status! : 'UNREAD';
  const page = Math.max(1,Math.min(10000,Number.parseInt(filters.page || '1',10) || 1));
  const pattern = `%${search.replace(/[\\%_]/g, value => `\\${value}`)}%`;
  const where = and(status !== 'ALL' ? eq(contactMessage.status,status) : undefined, search ? sql`(${contactMessage.firstName} ILIKE ${pattern} OR ${contactMessage.lastName} ILIKE ${pattern} OR ${contactMessage.email} ILIKE ${pattern} OR ${contactMessage.subject} ILIKE ${pattern} OR ${contactMessage.message} ILIKE ${pattern})` : undefined);
  const [rows, totals] = await Promise.all([db.select().from(contactMessage).where(where).orderBy(desc(contactMessage.createdAt),desc(contactMessage.id)).limit(25).offset((page - 1)*25),db.select({ count: sql<number>`count(*)::integer` }).from(contactMessage).where(where)]);
  return <div className={styles.dashboard}><header className={styles.pageHeader}><div><h1 className={styles.pageTitle}>Messages</h1><p>Read customer requests, reply by email, and keep track of what’s resolved.</p></div></header>
    <QueueFilters action="/admin/messages" search={search} status={status} placeholder="Sender, subject, or message" options={['UNREAD','READ','RESOLVED','ALL'].map(value => ({ value, label: value === 'ALL' ? 'All messages' : value.toLowerCase() }))} />
    <MessagesClient messages={rows} /><QueuePagination path="/admin/messages" page={page} search={search} status={status} count={totals[0].count} /></div>;
}
