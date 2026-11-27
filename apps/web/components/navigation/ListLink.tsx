'use client';
import {useCallback,useSyncExternalStore,type ComponentProps} from 'react';
import Link from 'next/link';
import {safeReturnPath} from '@/lib/navigation-context';
import {requestScrollRestore} from './ReturnLink';
const subscribe=(callback:()=>void)=>{window.addEventListener('stemory:route-views',callback);return()=>window.removeEventListener('stemory:route-views',callback);};
export default function ListLink({href,onNavigate,...props}:Omit<ComponentProps<typeof Link>,'href'>&{href:string}){
 const snapshot=useCallback(()=>{try{const saved=safeReturnPath(sessionStorage.getItem(`stemory:last-list:${href}`),href);return saved.split(/[?#]/)[0]===href?saved:href;}catch{return href;}},[href]);
 const destination=useSyncExternalStore(subscribe,snapshot,()=>href);
 return <Link {...props} href={destination} scroll={false} onNavigate={event=>{requestScrollRestore(destination);onNavigate?.(event);}}/>;
}
