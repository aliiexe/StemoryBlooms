import { db, eq, draftOrder } from '@stemory/database';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { assertAdmin } from '@/lib/user-sync';
import { readDraftPayload, draftEditor } from '@/lib/commerce/drafts';
import { loadAssistedCatalog } from '@/lib/commerce/assisted-catalog';
import NewAssistedOrderForm from '../../orders/new/NewAssistedOrderForm';
import styles from '../../dashboard.module.css';
import DraftStatusActions from '../DraftStatusActions';

export default async function CustomOrderDraftPage({ params }: { params: Promise<{ id: string }> }) {
  await assertAdmin();
  const { id } = await params;
  const row = await db.query.draftOrder.findFirst({ where: eq(draftOrder.id, id) });
  if (!row) notFound();
  const draft = readDraftPayload(row.payload);
  if (!draft) return <div className={styles.dashboard}><Link href="/admin/custom-orders">← Order drafts</Link><h1>Earlier draft needs review</h1><p>This draft uses an unsupported format. Its original data has been preserved; ask an administrator to review it before recreating the order.</p></div>;
  if (draft.status !== 'DRAFT') return <div className={styles.dashboard}>
    <Link href="/admin/custom-orders">← Order drafts</Link><h1>{draft.title}</h1>
    <section className={styles.card} style={{ padding: '1.25rem' }}><h2>{draft.status === 'CONVERTED' ? 'Order already created' : 'Archived draft'}</h2>
      <p>{draft.status === 'CONVERTED' ? `This draft became order ${draft.convertedOrderNumber}. It cannot create another order.` : 'Restore this draft to resume editing. No stock is reserved.'}</p>
      {draft.convertedOrderId && <Link href={`/admin/orders/${draft.convertedOrderId}`}>Open order {draft.convertedOrderNumber}</Link>}
      {draft.status === 'ARCHIVED' && <DraftStatusActions id={id} revision={draft.revision} archived />}
    </section></div>;
  const catalog = await loadAssistedCatalog();
  return <div className={styles.dashboard}>
    <header className={styles.pageHeader}><div><Link href="/admin/custom-orders">← Order drafts</Link><h1 className={styles.pageTitle}>Resume order draft</h1><p>Drafts do not reserve stock. Review a fresh quote before creating the order.</p></div></header>
    <NewAssistedOrderForm catalog={catalog} draftId={id} initialDraft={draftEditor(id, draft)} />
  </div>;
}
