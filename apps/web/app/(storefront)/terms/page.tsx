import Link from 'next/link';
import {publicSiteCopy} from '@/lib/site-content';
export default async function PolicyPage(){const copy=await publicSiteCopy('terms');return <main style={{maxWidth:860,margin:'0 auto',padding:'4rem 1.25rem',overflowWrap:'anywhere'}}><h1>{copy.title}</h1><p style={{fontSize:'1.15rem',lineHeight:1.7}}>{copy.subtitle}</p>{copy.body.split(/\n\s*\n/).map((paragraph,index)=><p key={index} style={{whiteSpace:'pre-line',lineHeight:1.8,margin:'1.5rem 0'}}>{paragraph}</p>)}<Link href={copy.ctaHref}>{copy.ctaLabel}</Link></main>;}
