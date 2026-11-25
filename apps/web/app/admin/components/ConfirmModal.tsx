'use client';
import {lockModalScroll} from '@stemory/ui';

import { useEffect, useId, useRef } from 'react';
import { AlertTriangle, Info, X } from 'lucide-react';
import styles from './ConfirmModal.module.css';

interface ConfirmModalProps {
  isOpen: boolean; title: string; message: string; confirmText?: string; cancelText?: string;
  onConfirm: () => void; onCancel: () => void; isDestructive?: boolean;busy?:boolean;
}
export default function ConfirmModal({ isOpen, title, message, confirmText = 'Confirm', cancelText = 'Cancel', onConfirm, onCancel, isDestructive = true,busy=false }: ConfirmModalProps) {
  const dialog = useRef<HTMLDialogElement>(null);
  const cancel = useRef<HTMLButtonElement>(null);
  const id = useId();
  useEffect(() => {
    const node = dialog.current;
    if (!node || !isOpen) return;
    node.showModal();cancel.current?.focus();const release=lockModalScroll();
    return () => { node.close(); release(); };
  }, [isOpen]);
  return <dialog ref={dialog} className={styles.dialog} aria-labelledby={`${id}-title`} aria-describedby={`${id}-message`}
    onCancel={event => { event.preventDefault();if(!busy)onCancel(); }} onClick={event => { if (!busy&&event.target === event.currentTarget) onCancel(); }}>
    <div className={styles.body}>
      <div className={styles.header}>{isDestructive?<AlertTriangle size={22} aria-hidden="true" />:<Info size={22} aria-hidden="true" />}<button type="button" disabled={busy} aria-label="Close confirmation" onClick={onCancel}><X size={20} /></button></div>
      <h2 id={`${id}-title`}>{title}</h2><p id={`${id}-message`}>{message}</p>
      <div className={styles.actions}><button ref={cancel} type="button" disabled={busy} onClick={onCancel}>{cancelText}</button>
        <button type="button" disabled={busy} className={isDestructive ? styles.destructive : styles.confirm} onClick={onConfirm}>{confirmText}</button></div>
    </div>
  </dialog>;
}
