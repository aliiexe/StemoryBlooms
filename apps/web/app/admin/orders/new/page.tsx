import { randomUUID } from 'node:crypto';
import { assertAdmin } from '@/lib/user-sync';
import { loadAssistedCatalog } from '@/lib/commerce/assisted-catalog';
import styles from '../../dashboard.module.css';
import NewAssistedOrderForm from './NewAssistedOrderForm';

export default async function NewAssistedOrderPage() {
  await assertAdmin();
  const catalog = await loadAssistedCatalog();
  return <div className={styles.dashboard}>
    <header className={styles.pageHeader}><div><h1 className={styles.pageTitle}>Create assisted order</h1><p>Record a phone, social, or in-person order. Save unfinished work as a draft.</p></div></header>
    <NewAssistedOrderForm catalog={catalog} draftId={randomUUID()} />
  </div>;
}
