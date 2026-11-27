'use client';
import { useCallback, useSyncExternalStore, type Dispatch, type SetStateAction } from 'react';
import { usePathname } from 'next/navigation';

const memory = new Map<string, string>();
const subscribe = (callback: () => void) => {
  window.addEventListener('stemory:view-state', callback);
  return () => window.removeEventListener('stemory:view-state', callback);
};
// Keep only view controls, never edit forms or unsaved business transactions.
export function useRememberedState(name: string, initial: string): [string, Dispatch<SetStateAction<string>>];
export function useRememberedState(name: string, initial: number): [number, Dispatch<SetStateAction<number>>];
export function useRememberedState(name: string, initial: boolean): [boolean, Dispatch<SetStateAction<boolean>>];
export function useRememberedState<T extends string | number | boolean>(name: string, initial: T): [T, Dispatch<SetStateAction<T>>];
export function useRememberedState<T extends string | number | boolean>(name: string, initial: T): [T, Dispatch<SetStateAction<T>>] {
  const key = `stemory:view:${usePathname()}:${name}`;
  const fallback = JSON.stringify(initial);
  const read = useCallback(() => {
    let saved = memory.get(key);
    try { saved = sessionStorage.getItem(key) || saved; } catch { /* In-memory fallback. */ }
    try {
      const value: unknown = JSON.parse(saved || fallback);
      return typeof value === typeof initial && (typeof value !== 'number' || Number.isFinite(value)) && (typeof value !== 'string' || value.length <= 2000) ? JSON.stringify(value) : fallback;
    } catch { return fallback; }
  }, [key, fallback, initial]);
  const serialized = useSyncExternalStore(subscribe, read, () => fallback);
  const setValue = useCallback<Dispatch<SetStateAction<T>>>(next => {
    const current = JSON.parse(read()) as T;
    const value = typeof next === 'function' ? next(current) : next;
    const saved = JSON.stringify(value);
    memory.set(key, saved);
    try { sessionStorage.setItem(key, saved); } catch { /* In-memory fallback. */ }
    window.dispatchEvent(new Event('stemory:view-state'));
  }, [key, read]);
  return [JSON.parse(serialized) as T, setValue];
}
