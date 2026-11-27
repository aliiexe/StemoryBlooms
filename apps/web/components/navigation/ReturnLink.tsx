'use client';
import { Suspense, useCallback, useSyncExternalStore, type ComponentProps } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { safeReturnPath, currentReturnPath, lastListPath } from '@/lib/navigation-context';

type Props = Omit<ComponentProps<typeof Link>, 'href'> & { href: string };
export function requestScrollRestore(path: string) {
  try { const url=new URL(path,window.location.origin);const query=url.searchParams.toString();sessionStorage.setItem('stemory:return-scroll',url.pathname+(query?`?${query}`:'')+url.hash); } catch { /* Optional browser storage. */ }
}
export function navigateReturn(router: { push: (href: string, options?: {scroll?: boolean}) => void }, fallback: string) {
  const path = currentReturnPath(fallback); requestScrollRestore(path); router.push(path, {scroll:false});
}
function Inner({ href, onNavigate, ...props }: Props) {
  const read=useCallback(()=>lastListPath(href),[href]);
  const subscribe=useCallback((callback:()=>void)=>{window.addEventListener('stemory:route-views',callback);return()=>window.removeEventListener('stemory:route-views',callback);},[]);
  const previous=useSyncExternalStore(subscribe,read,()=>href);
  const destination = safeReturnPath(useSearchParams().get('returnTo'), previous);
  return <Link {...props} href={destination} scroll={false} onNavigate={event => { requestScrollRestore(destination); onNavigate?.(event); }} />;
}
export default function ReturnLink(props: Props) {
  return <Suspense fallback={<Link {...props} />}><Inner {...props} /></Suspense>;
}
