'use client';
import {lockModalScroll} from '../lib/modal-scroll';
import {useEffect,useRef,type ReactNode} from 'react';
import styles from './Header.module.css';
export default function StoreModal({open,label,onClose,children}:{open:boolean;label:string;onClose:()=>void;children:ReactNode}){
  const ref=useRef<HTMLDialogElement>(null);
  useEffect(()=>{const dialog=ref.current;if(!dialog||!open)return;dialog.showModal();const release=lockModalScroll();dialog.querySelector<HTMLInputElement>('input')?.focus();return()=>{dialog.close();release();};},[open]);
  return <dialog ref={ref} className={styles.modalDialog} aria-label={label} onCancel={event=>{event.preventDefault();onClose();}} onClick={event=>{if(event.target===event.currentTarget)onClose();}}>{children}</dialog>;
}
