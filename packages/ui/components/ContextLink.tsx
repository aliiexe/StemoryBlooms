'use client';
import { Suspense, type ComponentProps } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { contextualHref, safeReturnPath } from '../lib/navigation-context';

type Props = Omit<ComponentProps<typeof Link>, 'href'> & { href: string };
function Inner({ href, ...props }: Props) {
  const pathname = usePathname();
  const params = useSearchParams(); const search=params.toString();
  const parent=safeReturnPath(params.get('returnTo'),'');
  const source=pathname.startsWith('/shop/') && parent.split(/[?#]/)[0]==='/shop' ? parent : pathname + (search ? `?${search}` : '');
  return <Link {...props} href={contextualHref(href, source)} />;
}
export default function ContextLink(props: Props) {
  return <Suspense fallback={<Link {...props} />}><Inner {...props} /></Suspense>;
}
