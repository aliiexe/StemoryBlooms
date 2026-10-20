'use client';

import { useEffect, useId, useRef } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import styles from './ConfirmModal.module.css';

interface ConfirmModalProps {
  isOpen: boolean; title: string; message: string; confirmText?: string; cancelText?: string;
  onConfirm: () => void; onCancel: () => void; isDestructive?: boolean;
}
export default function ConfirmModal({ isOpen, title, message, confirmText = 'Confirm', cancelText = 'Cancel', onConfirm, onCancel, isDestructive = true }: ConfirmModalProps) {
  const dialog = useRef<HTMLDialogElement>(null);
  const cancel = useRef<HTMLButtonElement>(null);
  const id = useId();
  useEffect(() => {
    const node = dialog.current;
    if (!node || !isOpen) return;
    const previousOverflow = document.body.style.overflow;
    node.showModal(); cancel.current?.focus(); document.body.style.overflow = 'hidden';
    return () => { node.close(); document.body.style.overflow = previousOverflow; };
  }, [isOpen]);
  return <dialog ref={dialog} className={styles.dialog} aria-labelledby={`${id}-title`} aria-describedby={`${id}-message`}
    onCancel={event => { event.preventDefault(); onCancel(); }} onClick={event => { if (event.target === event.currentTarget) onCancel(); }}>
    <div className={styles.body}>
      <div className={styles.header}><AlertTriangle size={24} aria-hidden="true" /><button type="button" aria-label="Close confirmation" onClick={onCancel}><X size={20} /></button></div>
      <h2 id={`${id}-title`}>{title}</h2><p id={`${id}-message`}>{message}</p>
      <div className={styles.actions}><button ref={cancel} type="button" onClick={onCancel}>{cancelText}</button>
        <button type="button" className={isDestructive ? styles.destructive : styles.confirm} onClick={onConfirm}>{confirmText}</button></div>
    </div>
  </dialog>;
}
