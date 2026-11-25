 'use client';
import {useState} from 'react';
import {useRouter} from 'next/navigation';
import {CheckCircle2, Circle, PackageCheck, SlidersHorizontal} from 'lucide-react';
import {saveInventoryMode} from './actions';
import styles from '../workspace.module.css';
export default function InventoryModeControl({enabled}:{enabled:boolean}){
 const router=useRouter();const [selected,setSelected]=useState(enabled);const [busy,setBusy]=useState(false);const [error,setError]=useState('');const [saved,setSaved]=useState(false);
 return <section className={styles.panel} style={{padding:22}}><div className={styles.sectionTitle}><div><h2>How you manage availability</h2><p className={styles.subtle}>Choose what controls new online orders. Existing stock records and order history stay available.</p></div></div><div className={styles.modeChoices}>
 {[{value:false,title:'Manual availability',body:'You decide what is available. Visible items can be ordered without entering material purchases or stock counts.',Icon:SlidersHorizontal},{value:true,title:'Use stock limits',body:'Only allow online orders when product and bouquet component counts cover the order.',Icon:PackageCheck}].map(({value,title,body,Icon})=><button type="button" key={title} aria-pressed={selected===value} disabled={busy} onClick={()=>{setSelected(value);setSaved(false);}} className={styles.modeChoice}><Icon size={20}/><span><strong>{title}</strong><small>{body}</small></span>{selected===value?<CheckCircle2 size={19}/>:<Circle size={19}/>}</button>)}
 </div><p className={styles.subtle}>This applies to future orders. Saving does not reset counts, change past payments, or rebuild historical purchases. Staff can still choose stock tracking on each assisted order.</p>{error&&<p role="alert">{error}</p>}{saved&&<p role="status">Availability mode saved.</p>}<button className={styles.primary} disabled={busy||selected===enabled} onClick={async()=>{setBusy(true);setError('');try{const result=await saveInventoryMode(selected,enabled);if(result.error)setError(result.error);else {setSaved(true);router.refresh();}}catch{setError('Could not confirm the change. Reload to check the current mode.');}finally{setBusy(false);}}}>{busy?'Saving…':'Save availability mode'}</button></section>;
}
