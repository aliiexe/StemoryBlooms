export function publicAnalyticsUrl(raw: string): string | null {
  try {
    const url=new URL(raw);
    if(/^\/(admin|account|receipt|subscriptions|checkout|api)(\/|$)/.test(url.pathname))return null;
    url.search='';url.hash='';return url.toString();
  }catch{return null;}
}
