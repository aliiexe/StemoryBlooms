export { safeReturnPath, contextualHref } from '@stemory/ui/lib/navigation-context';

import {safeReturnPath, currentReturnPath as explicitReturnPath} from '@stemory/ui/lib/navigation-context';
export function lastListPath(fallback:string) {
  if(typeof window==='undefined')return fallback;
  try {const value=safeReturnPath(sessionStorage.getItem(`stemory:last-list:${fallback}`),fallback);return value.split(/[?#]/)[0]===fallback?value:fallback;} catch{return fallback;}
}

export function currentReturnPath(fallback:string) { return explicitReturnPath(lastListPath(fallback)); }
