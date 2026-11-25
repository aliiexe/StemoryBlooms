'use client';
import { useState } from 'react';
import { confirmSubscriptionChange } from './actions';
export default function SubscriptionForm({token,action}:{token:string;action:string}) {
  const [busy,setBusy]=useState(false);const [error,setError]=useState('');const [done,setDone]=useState(false);
  async function submit(){setBusy(true);setError('');try{const result=await confirmSubscriptionChange({token,action});if(result.error)setError(result.error);else setDone(true);}catch{setError('The request failed. Please try again.');}finally{setBusy(false);}}
  return done?<p role="status">{action==='verify'?'Your email is confirmed. You are on the launch list.':'You are unsubscribed from the launch list.'}</p>:<form onSubmit={event=>{event.preventDefault();void submit();}}><p>{action==='verify'?'Confirm that you requested our launch update.':'Confirm that you want to stop receiving our launch update.'}</p><button disabled={busy} style={{padding:'0.85rem 1.25rem',borderRadius:12,background:'#5a3656',color:'white',border:0}}>{busy?'Saving…':action==='verify'?'Confirm my email':'Unsubscribe'}</button>{error&&<p role="alert">{error}</p>}</form>;
}
