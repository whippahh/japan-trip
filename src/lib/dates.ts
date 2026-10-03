import type { Person } from './types'

export const parseDate = (s: string) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d) }
export const todayDate = () => { const n = new Date(); return new Date(n.getFullYear(), n.getMonth(), n.getDate()) }
export const isoDate = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
export const daysBetween = (a: Date, b: Date) => Math.round((b.getTime() - a.getTime()) / 86400000)
export const fmtDate = (s: string, long = false) =>
  parseDate(s).toLocaleDateString('en-AU', long ? { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' } : { day: 'numeric', month: 'short' })
export const addDays = (s: string, n: number) => { const d = parseDate(s); d.setDate(d.getDate() + n); return isoDate(d) }

export type Phase =
  | { kind: 'none' }
  | { kind: 'before'; days: number; start: string; end: string | null }
  | { kind: 'during'; day: number; start: string; end: string | null; left: number | null }
  | { kind: 'after' }

/** The group's trip window = earliest arrival of anyone still to travel (or travelling now). */
export function tripPhase(people: Pick<Person, 'arrive' | 'depart'>[]): Phase {
  const today = isoDate(todayDate())
  const ranges = people.filter(p => p.arrive).map(p => ({ a: p.arrive as string, d: (p.depart || p.arrive) as string }))
  if (!ranges.length) return { kind: 'none' }
  const upcoming = ranges.filter(r => r.d >= today)
  if (!upcoming.length) return { kind: 'after' }
  const start = upcoming.map(r => r.a).sort()[0]
  const end = upcoming.map(r => r.d).sort().slice(-1)[0] || null
  if (start <= today) {
    const day = daysBetween(parseDate(start), todayDate()) + 1
    return { kind: 'during', day, start, end, left: end ? daysBetween(todayDate(), parseDate(end)) : null }
  }
  return { kind: 'before', days: daysBetween(todayDate(), parseDate(start)), start, end }
}
