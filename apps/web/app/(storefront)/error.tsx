'use client';
import Link from 'next/link';
export default function StorefrontError({ reset }: { reset:()=>void }) {
  return <section style={{maxWidth:560,margin:'60px auto',padding:28,color:'#3c5132'}}><p style={{fontSize:12,letterSpacing:'.1em'}}>STEMORY BLOOMS</p><h1 style={{fontSize:32,fontWeight:400,margin:'16px 0'}}>We couldn’t load this page.</h1><p style={{fontSize:14,lineHeight:1.7,color:'#77866b'}}>Please try again. If an order confirmation was interrupted, check your order history before placing another order.</p><div style={{display:'flex',gap:18,alignItems:'center',marginTop:24,flexWrap:'wrap'}}><button type="button" onClick={reset} style={{background:'#3f5734',color:'#fff',padding:'14px 22px',border:0,borderRadius:4,cursor:'pointer'}}>Try again</button><Link href="/account">My orders</Link><Link href="/contact">Contact us</Link></div></section>;
}
