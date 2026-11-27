'use client';
import { Suspense, useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

const currentKey = () => location.pathname + (new URLSearchParams(location.search).size ? `?${new URLSearchParams(location.search)}` : '') + location.hash;
function Memory() {
  const pathname = usePathname(); const search = useSearchParams().toString();
  useEffect(() => {
    const remember = () => {
      if (/^\/(receipt|subscriptions|checkout)(\/|$)/.test(location.pathname)) return;
      const key = currentKey();
      const position = { window: window.scrollY, main: document.getElementById('workspace-main')?.scrollTop || 0 };
      try {
        const saved = JSON.parse(sessionStorage.getItem('stemory:scroll-positions') || '{}');
        saved[key] = position;
        const entries = Object.entries(saved).slice(-80);
        sessionStorage.setItem('stemory:scroll-positions', JSON.stringify(Object.fromEntries(entries)));
      } catch { /* Optional view memory. */ }
    };
    const click = (event: MouseEvent) => { if ((event.target as Element)?.closest?.('a[href]')) remember(); };
    const pop = () => { try { sessionStorage.setItem('stemory:return-scroll', currentKey()); } catch { /* Optional. */ } };
    document.addEventListener('click', click, true);
    window.addEventListener('pagehide', remember); window.addEventListener('popstate', pop);
    return () => { document.removeEventListener('click', click, true); window.removeEventListener('pagehide', remember); window.removeEventListener('popstate', pop); };
  }, []);
  useEffect(() => {
    const lists = ['/admin/orders','/admin/custom-orders','/admin/products','/admin/customers','/admin/deliveries','/admin/deliveries/zones','/admin/announcements','/admin/messages','/admin/reviews','/admin/waitlist','/admin/notifications','/admin/users','/admin/finances','/admin/reports','/admin/settings','/admin/content','/admin/builder','/admin/inventory','/admin/production','/admin/inventory/movements','/admin/suppliers','/shop'];
    if (lists.includes(pathname)) try { sessionStorage.setItem(`stemory:last-list:${pathname}`, currentKey()); window.dispatchEvent(new Event('stemory:route-views')); } catch { /* Optional view memory. */ }
    const key = currentKey();
    let position: { window: number; main: number } | undefined;
    try {
      if (sessionStorage.getItem('stemory:return-scroll') !== key) return;
      sessionStorage.removeItem('stemory:return-scroll');
      position = JSON.parse(sessionStorage.getItem('stemory:scroll-positions') || '{}')[key];
    } catch { return; }
    if (!position) { window.scrollTo(0,0); const main=document.getElementById('workspace-main'); if(main)main.scrollTop=0; return; }
    if (!Number.isFinite(position.window) || !Number.isFinite(position.main)) return;
    let frame = 0; let attempts = 0;
    const restore = () => {
      const main = document.getElementById('workspace-main');
      window.scrollTo(0, position!.window); if (main) main.scrollTop = position!.main;
      if (++attempts < 90 && (Math.abs(window.scrollY-position!.window)>1 || (main && Math.abs(main.scrollTop-position!.main)>1))) frame = requestAnimationFrame(restore);
    };
    frame = requestAnimationFrame(restore);
    return () => cancelAnimationFrame(frame);
  }, [pathname, search]);
  return null;
}
export default function NavigationMemory() { return <Suspense fallback={null}><Memory /></Suspense>; }
