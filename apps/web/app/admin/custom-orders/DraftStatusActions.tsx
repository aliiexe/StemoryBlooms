'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import ConfirmModal from '../components/ConfirmModal';
import { archiveCustomOrderDraft } from './actions';
import styles from '../dashboard.module.css';

export default function DraftStatusActions({ id, revision, archived = false }: { id: string; revision: number; archived?: boolean }) {
  const router = useRouter();
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  return <div><button type="button" className={styles.secondaryAction} disabled={busy} onClick={() => setConfirm(true)}>{busy ? 'Saving…' : archived ? 'Restore draft' : 'Archive draft'}</button>
    {error && <p role="alert">{error}</p>}
    <ConfirmModal isOpen={confirm} title={archived ? 'Restore draft' : 'Archive draft'} isDestructive={false}
      message={archived ? 'Restore this saved work to active drafts? Prices and availability will be checked again.' : 'Move this draft out of the active list? You can restore it later. This does not change stock or sales.'}
      confirmText={archived ? 'Restore' : 'Archive'} onCancel={() => setConfirm(false)} onConfirm={async () => {
        setConfirm(false); setBusy(true); setError('');
        try { const result = await archiveCustomOrderDraft(id, revision, !archived); if (!result.success) setError(result.message); else router.refresh(); }
        catch { setError('Could not save the draft status. Retry after checking the list.'); } finally { setBusy(false); }
      }} />
  </div>;
}
