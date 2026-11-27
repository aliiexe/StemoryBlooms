'use client';
import {useRememberedState} from '@/components/navigation/useRememberedState';
import {Mail,ArrowUpRight} from 'lucide-react';
import {MessageActions} from './MessageActions';
import styles from './messages.module.css';
import ui from '../workspace.module.css';
type Message={id:string;firstName:string;lastName:string;email:string;subject:string;message:string;status:string;createdAt:Date};
export default function MessagesClient({messages}:{messages:Message[]}){
 const [selected,setSelected]=useRememberedState('message',messages[0]?.id||'');const current=messages.find(row=>row.id===selected)||messages[0];
 if(!current)return <div className={ui.tableSurface}><div className={ui.emptyState}><Mail size={30} strokeWidth={1.25}/><h2>No messages in this view</h2><p>Use the status filter to find read or resolved conversations.</p></div></div>;
 return <div className={styles.inbox}><nav className={styles.list} aria-label="Messages">{messages.map(row=><button type="button" key={row.id} className={styles.item} aria-pressed={current.id===row.id} onClick={()=>setSelected(row.id)}><strong>{row.subject}</strong><p>{row.firstName} {row.lastName}</p><small>{row.createdAt.toLocaleDateString('en-GB',{day:'numeric',month:'short',timeZone:'Africa/Casablanca'})} · {row.status.toLowerCase()}</small></button>)}</nav><article className={styles.reader}><header className={styles.readerHeader}><div><h2>{current.subject}</h2><p>{current.firstName} {current.lastName} · {current.email}</p><p>{current.createdAt.toLocaleString('en-GB',{timeZone:'Africa/Casablanca',dateStyle:'medium',timeStyle:'short'})}</p></div><span className={ui.status}>{current.status.toLowerCase()}</span></header><div className={styles.body}>{current.message}</div><footer className={styles.actions}><MessageActions key={current.id} id={current.id} status={current.status}/><a className={ui.rowAction} href={`mailto:${encodeURIComponent(current.email)}?subject=${encodeURIComponent(`Re: ${current.subject}`)}`}>Reply by email<ArrowUpRight size={13}/></a></footer></article></div>;
}
