import { useSyncExternalStore } from 'react'

export type Mode = 'simple' | 'advanced'
const K = 'jt_mode'
const subs = new Set<() => void>()
const read = (): Mode => { try { return localStorage.getItem(K) === 'advanced' ? 'advanced' : 'simple' } catch { return 'simple' } }

export function setMode(m: Mode) {
  try { localStorage.setItem(K, m) } catch { /* ignore */ }
  subs.forEach(f => f())
  window.scrollTo(0, 0)
}
export function useMode(): Mode {
  return useSyncExternalStore(cb => { subs.add(cb); return () => { subs.delete(cb) } }, read)
}

/** Tiny per-device flags / preferences (never shared). */
export function lget(k: string): string | null { try { return localStorage.getItem(k) } catch { return null } }
export function lput(k: string, v: string | null) { try { v === null ? localStorage.removeItem(k) : localStorage.setItem(k, v) } catch { /* ignore */ } }
export function lgetJson<T>(k: string, d: T): T { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) as T : d } catch { return d } }
