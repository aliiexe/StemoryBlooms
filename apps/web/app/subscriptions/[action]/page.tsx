import { notFound } from 'next/navigation';
import SubscriptionForm from './SubscriptionForm';
export const metadata={title:'Email preferences | Stemory Blooms',robots:{index:false,follow:false},referrer:'no-referrer' as const};
export default async function SubscriptionPage({params,searchParams}:{params:Promise<{action:string}>;searchParams:Promise<{token?:string}>}) {
  const {action}=await params;const {token}=await searchParams;if(!['verify','unsubscribe'].includes(action))notFound();
  return <main style={{maxWidth:600,margin:'10vh auto',padding:24}}><h1>{action==='verify'?'Confirm your email':'Email preferences'}</h1>{token&&/^[A-Za-z0-9_-]{43}$/.test(token)?<SubscriptionForm token={token} action={action}/>:<p>This link is invalid. Request a new confirmation from the waitlist.</p>}</main>;
}
