import { STAYS } from '../data/stays'
import { STAY_BY_KEY } from '../data/plans'
import { AREA_CENTER, TOWN, nodeOf, travelBetween, type LatLng, type Travel } from '../data/geo'
import { baseFor, stayKeyFor } from './autoplan'
import type { Item, Person, Pick, StayChoice, Tier } from './types'

export interface Stint {
  base: string
  area: string          // the Stays-catalogue area for this base
  from: number
  to: number
  days: number
  nights: number        // nights to sleep here (last stint: one fewer, you leave on the final day)
  towns: string[]       // places visited, for the "why"
  have: number          // nights already covered by chosen stays in this area
  arriveBy?: { from: string; travel: Travel }
}

const AREA_OF: Record<string, string> = { Hakone: 'Hakone & Fuji', Fuji: 'Hakone & Fuji', Koyasan: 'Koyasan & Kumano', Kumano: 'Koyasan & Kumano' }
export const stayAreaOf = (base: string) => AREA_OF[base] || base
const at = (b: string): LatLng | null => TOWN[b] || AREA_CENTER[b] || AREA_CENTER[AREA_OF[b] || ''] || null

export function stintsFor(person: Person, picks: Pick[], getItem: (id: string) => Item | undefined): Stint[] {
  const mine = picks.filter(k => k.person_id === person.id && k.day != null)
  const entries = mine.map(k => ({ day: k.day as number, it: getItem(k.item_id) })).filter((e): e is { day: number; it: Item } => !!e.it)
  const placed = entries.filter(e => e.it.area !== 'Anywhere / Nationwide' && e.it.kind !== 'transit' && e.it.kind !== 'pass')
  if (!placed.length) return []
  const nodes = new Set(placed.map(e => nodeOf(e.it)))
  const first = Math.min(...entries.map(e => e.day)), last = Math.max(...entries.map(e => e.day))
  const perDay = new Map<number, Map<string, number>>()
  const townsOf = new Map<string, Set<string>>()
  for (const e of placed) {
    const b = baseFor(nodeOf(e.it), nodes)
    const m = perDay.get(e.day) || new Map<string, number>()
    m.set(b, (m.get(b) || 0) + 1)
    perDay.set(e.day, m)
    ;(townsOf.get(b) || townsOf.set(b, new Set()).get(b)!).add(e.it.town || e.it.area)
  }
  const stints: Stint[] = []
  let prev: string | null = null
  for (let d = first; d <= last; d++) {
    const m = perDay.get(d)
    let b = prev
    if (m) {
      let best = -1
      for (const [k, n] of m) if (n > best || (n === best && k === prev)) { best = n; b = k }
    }
    if (!b) continue
    const s = stints[stints.length - 1]
    if (s && s.base === b) { s.to = d; s.days++ }
    else stints.push({ base: b, area: stayAreaOf(b), from: d, to: d, days: 1, nights: 0, towns: [], have: 0 })
    prev = b
  }
  stints.forEach((s, i) => {
    s.nights = i === stints.length - 1 ? Math.max(0, s.days - 1) : s.days
    s.towns = [...(townsOf.get(s.base) || [])].slice(0, 4)
    s.have = person.stays.filter(c => STAYS.find(x => x.id === c.stayId)?.area === s.area).reduce((n, c) => n + c.nights, 0)
    const p = stints[i - 1], a = p && at(p.base), z = at(s.base)
    if (p && a && z) s.arriveBy = { from: p.base, travel: travelBetween({ at: a, node: p.base }, { at: z, node: s.base }) }
  })
  return stints
}

/** A sensible stay in this stint's area for the person's tier (or the generic apartment when we have no data for the town). */
export function suggestStay(s: Stint, tier: Tier, paying: number): StayChoice | null {
  const key = stayKeyFor(s.base)
  const id = key ? STAY_BY_KEY[key][tier] : (STAYS.find(x => x.area === s.area && x.tier === tier) || STAYS.find(x => x.area === s.area) || STAYS.find(x => x.id === 'any-apartment'))?.id
  const st = STAYS.find(x => x.id === id)
  if (!st) return null
  return { stayId: st.id, nights: Math.max(1, s.nights - s.have), sharing: st.perPerson ? 1 : Math.max(1, Math.min(st.capacity, paying)) }
}

export const transferTip = (t: Travel) =>
  /shinkansen/i.test(t.mode) ? 'Reserve seats, and send big bags ahead with a luggage-forwarding service (about ¥2,500 each) so you travel light.'
  : /bus/i.test(t.mode) ? 'Book the bus ahead in busy seasons; bags go underneath.'
  : /romance|express|limited/i.test(t.mode) ? 'A reserved seat is worth it with luggage.'
  : 'Rush hour on big-city trains is crowded. Aim to travel mid-morning with bags.'
