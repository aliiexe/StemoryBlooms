'use client';
import Link from 'next/link';
export default function ShopError({reset}:{reset:()=>void}) {return <main style={{maxWidth:700,margin:'4rem auto',padding:24}}><h1>The collection could not be loaded</h1><p>Please retry in a moment. Your cart has been kept.</p><button onClick={reset} style={{padding:16,borderRadius:10,background:'#3e5539',color:'white',border:0}}>Try again</button> <Link href="/contact">Contact us</Link></main>;}
