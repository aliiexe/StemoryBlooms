'use client';
import {lockModalScroll} from '@stemory/ui';
import { useEffect, useId, useRef, type ReactNode } from 'react';
import styles from './ConfirmModal.module.css';
export default function AdminDialog({ open, title, busy = false, onClose, children }: { open: boolean; title: string; busy?: boolean; onClose: () => void; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null); const titleId = useId();
  useEffect(() => { const node = ref.current; if (!node || !open) return; node.showModal();const release=lockModalScroll(); return () => { node.close(); release(); }; }, [open]);
  return <dialog ref={ref} className={styles.dialog} style={{ width: 'min(580px, calc(100vw - 32px))' }} aria-labelledby={titleId} onCancel={event => { event.preventDefault(); if (!busy) onClose(); }} onClick={event => { if (!busy && event.currentTarget === event.target) onClose(); }}>
    <div className={styles.body}><div className={styles.header}><h2 id={titleId}>{title}</h2><button type="button" disabled={busy} onClick={onClose} aria-label={`Close ${title}`}>×</button></div>{children}</div>
  </dialog>;
}
