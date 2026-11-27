const base = 'https://navigation.invalid';

export function safeReturnPath(value: string | null | undefined, fallback: string) {
  if (!value || value.length > 12000 || !value.startsWith('/') || value.startsWith('//') || /[\\\u0000-\u001f\u007f]/.test(value)) return fallback;
  try {
    const url = new URL(value, base);
    if (url.origin !== base || url.pathname.startsWith('/api/') || url.pathname === '/api') return fallback;
    return url.pathname + url.search + url.hash;
  } catch { return fallback; }
}

export function contextualHref(href: string, source: string) {
  const target = safeReturnPath(href, '');
  if (!target || !safeReturnPath(source, '')) return href;
  const url = new URL(target, base);
  const origin = new URL(source, base);
  if (url.pathname === origin.pathname) {
    const previous = safeReturnPath(origin.searchParams.get('returnTo'), '');
    if (previous) url.searchParams.set('returnTo', previous);
    return url.pathname + url.search + url.hash;
  }
  url.searchParams.set('returnTo', source);
  return url.pathname + url.search + url.hash;
}

export function currentReturnPath(fallback: string) {
  if (typeof window === 'undefined') return fallback;
  return safeReturnPath(new URLSearchParams(window.location.search).get('returnTo'), fallback);
}
