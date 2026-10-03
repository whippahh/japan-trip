import { STAY_BY_KEY } from '../data/plans'
import { STAYS } from '../data/stays'
import { nodeOf } from '../data/geo'
import type { Item, Person, Pick, StayChoice } from './types'

/** West-bound "clean line" order of bases, so an auto-arranged trip never zig-zags. */
const ORDER = ['Tokyo', 'Nikko', 'Yokohama & Kamakura', 'Hakone', 'Fuji', 'Nagano & Kiso', 'Kyoto', 'Nara', 'Osaka', 'Kobe & Himeji', 'Koyasan', 'Kumano', 'Hiroshima & Miyajima']
/** Areas that are normally day trips from a base (only used as such if that base is on the trip). */
const HOSTS: Record<string, string[]> = {
  'Yokohama & Kamakura': ['Tokyo'], Nikko: ['Tokyo'], Nara: ['Kyoto', 'Osaka'], 'Kobe & Himeji': ['Osaka'], Fuji: ['Hakone'],
}
/** Where you sleep for a given node: its host base if that base is on the trip, else itself. */
export function baseFor(node: string, nodes: Set<string>): string {
  if (node === 'Fuji' && !nodes.has('Hakone')) return node
  return (HOSTS[node] || []).find(h => nodes.has(h)) || node
}
export const stayKeyFor = (base: string) => STAY_KEY[base]
const STAY_KEY: Record<string, keyof typeof STAY_BY_KEY> = { Tokyo: 'tokyo', Hakone: 'hakone', Fuji: 'hakone', Kyoto: 'kyoto', Osaka: 'osaka', Koyasan: 'koyasan', Kumano: 'kumano' }
const DAY_HOURS = 7

export interface Arranged {
  days: { item_id: string; day: number }[]
  stays: StayChoice[]
  bases: { name: string; days: number; nights: number }[]
  totalDays: number
}

export function autoArrange(
  person: Person, picks: Pick[], getItem: (id: string) => Item | undefined, paying: number,
): Arranged | null {
  const mine = picks.filter(k => k.person_id === person.id)
  const startDay = Math.max(0, ...mine.map(k => k.day || 0)) + 1
  const loose = mine.filter(k => k.day == null).map(k => getItem(k.item_id)).filter((i): i is Item => !!i)
  const sights = loose.filter(i => i.kind === 'sight' || i.kind === 'package')
  if (!sights.length) return null

  const areas = new Set(sights.map(nodeOf))
  const hostOf = (a: string): string | null => {
    if (a === 'Fuji' && !areas.has('Hakone')) return null
    return (HOSTS[a] || []).find(h => areas.has(h)) || null
  }
  // clusters: key = own area/node; baseKey = where you sleep
  const clusters = new Map<string, Item[]>()
  for (const i of sights) { const k = nodeOf(i); clusters.set(k, [...(clusters.get(k) || []), i]) }
  const rank = (k: string) => { const x = ORDER.indexOf(k); return x < 0 ? 50 : x }
  const baseOf = (k: string) => hostOf(k) || k
  const baseKeys = [...new Set([...clusters.keys()].map(baseOf))].filter(k => k !== 'Anywhere / Nationwide').sort((a, b) => rank(a) - rank(b))

  const out: { item_id: string; day: number }[] = []
  const dayOfItem = new Map<string, number>()
  const bases: Arranged['bases'] = []
  let day = startDay
  for (const base of baseKeys) {
    const from = day
    const members = [...clusters.keys()].filter(k => baseOf(k) === base).sort((a, b) => (a === base ? -1 : b === base ? 1 : rank(a) - rank(b)))
    for (const k of members) {
      const items = [...(clusters.get(k) || [])].sort((a, b) => a.town.localeCompare(b.town) || a.name.localeCompare(b.name))
      let used = 0, open = false
      for (const it of items) {
        const h = it.hours > 0 ? it.hours : 1
        if (h >= 6) { if (open) day++; out.push({ item_id: it.id, day }); dayOfItem.set(it.id, day); day++; used = 0; open = false; continue }
        if (open && used + h > DAY_HOURS) { day++; used = 0 }
        out.push({ item_id: it.id, day }); dayOfItem.set(it.id, day); used += h; open = true
      }
      if (open) day++
    }
    bases.push({ name: base, days: day - from, nights: 0 })
  }
  // transit / pass items ride along with the item that needs them, or the first day of their area
  for (const it of loose.filter(i => i.kind === 'transit' || i.kind === 'pass')) {
    const parent = sights.find(s => s.needs === it.id)
    const d = parent ? dayOfItem.get(parent.id) : [...dayOfItem].find(([id]) => getItem(id)?.area === it.area)?.[1]
    if (d) out.push({ item_id: it.id, day: d })
  }
  bases.forEach((b, i) => { b.nights = i === bases.length - 1 ? Math.max(1, b.days - 1) : b.days })

  let stays: StayChoice[] = person.stays
  if (!person.stays.length) {
    stays = []
    for (const b of bases) {
      const key = STAY_KEY[b.name]
      const id = key ? STAY_BY_KEY[key][person.tier] : (STAYS.find(s => s.area === b.name && s.tier === person.tier) || STAYS.find(s => s.area === b.name))?.id
      const st = STAYS.find(s => s.id === id)
      if (st) stays.push({ stayId: st.id, nights: b.nights, sharing: st.perPerson ? 1 : Math.max(1, Math.min(st.capacity, paying)) })
    }
  }
  return { days: out, stays, bases, totalDays: day - startDay }
}
