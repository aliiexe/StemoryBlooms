import {redirect} from 'next/navigation';
import Link from 'next/link';
export default async function CheckoutSuccessPage({searchParams}:{searchParams:Promise<{order?:string;token?:string}>}){
  const query=await searchParams;
  if(query.order&&/^[A-Z0-9-]{3,128}$/.test(query.order))redirect(`/receipt/${encodeURIComponent(query.order)}${query.token?`?token=${encodeURIComponent(query.token)}`:''}`);
  return <main style={{maxWidth:650,margin:'4rem auto',padding:24}}><h1>Find your order</h1><p>Use your private receipt link, or sign in to see orders placed with your account.</p><Link href="/account">My orders</Link> · <Link href="/contact">Contact support</Link></main>;
}
