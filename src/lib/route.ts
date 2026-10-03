import { coordsFor, fmtMins, haversine, nodeOf, travelBetween, type LatLng, type Travel } from '../data/geo'
import type { Item, Pick } from './types'

export interface Stop {
  n: number
  day: number
  item: Item
  at: LatLng
  node: string
  travel?: Travel
  transit: Item[] // transit items picked for this day (shown on the first stop of the day)
}
export interface Route { stops: Stop[]; warnings: string[]; km: number; unscheduled: number; unmapped: number }

/** Order a day's points as a short open path starting near `from` (nearest-neighbour). */
function orderDay<T extends { at: LatLng }>(pts: T[], from: LatLng | null): T[] {
  if (pts.length < 2) return pts
  const left = [...pts]
  const out: T[] = []
  let cur = from
  if (!cur) {
    // start from the most peripheral point, i.e. one end of the day's path
    left.sort((a, b) => far(b, pts) - far(a, pts))
    out.push(left.shift()!)
    cur = out[0].at
  }
  while (left.length) {
    let bi = 0, bd = Infinity
    left.forEach((p, i) => { const d = haversine(cur!, p.at); if (d < bd) { bd = d; bi = i } })
    const [nx] = left.splice(bi, 1)
    out.push(nx); cur = nx.at
  }
  return out
}
const far = (p: { at: LatLng }, all: { at: LatLng }[]) => all.reduce((n, q) => n + haversine(p.at, q.at), 0)

export function buildRoute(personId: string, picks: Pick[], getItem: (id: string) => Item | undefined): Route {
  const mine = picks.filter(k => k.person_id === personId)
  const resolved = mine.map(k => ({ day: k.day, item: getItem(k.item_id) })).filter((x): x is { day: number | null; item: Item } => !!x.item)
  const scheduled = resolved.filter(x => x.day !== null)
  const isTransit = (i: Item) => i.kind === 'transit' || i.kind === 'pass'
  const unscheduled = resolved.filter(x => x.day === null && !isTransit(x.item)).length
  const transitByDay = new Map<number, Item[]>()
  scheduled.filter(x => isTransit(x.item)).forEach(x => transitByDay.set(x.day!, [...(transitByDay.get(x.day!) || []), x.item]))

  const mapped = scheduled
    .filter(x => !isTransit(x.item))
    .map(x => ({ day: x.day!, item: x.item, at: coordsFor(x.item) }))
  const unmapped = mapped.filter(x => !x.at).length
  const points = mapped.filter((x): x is { day: number; item: Item; at: LatLng } => !!x.at)

  const days = [...new Set(points.map(p => p.day))].sort((a, b) => a - b)
  const stops: Stop[] = []
  for (const d of days) {
    const prev: Stop | undefined = stops[stops.length - 1]
    const ordered = orderDay(points.filter(p => p.day === d).sort((a, b) => a.item.name.localeCompare(b.item.name)), prev ? prev.at : null)
    for (let i = 0; i < ordered.length; i++) {
      const p = ordered[i]
      const s: Stop = { n: stops.length + 1, day: d, item: p.item, at: p.at, node: nodeOf(p.item), transit: i === 0 ? transitByDay.get(d) || [] : [] }
      const before: Stop | undefined = stops[stops.length - 1]
      if (before) s.travel = travelBetween(before, s)
      stops.push(s)
    }
  }

  // backtracking check on the sequence of bases (day trips of a single day are fine)
  const stints: { node: string; days: number[] }[] = []
  for (const d of days) {
    const ofDay = stops.filter(s => s.day === d)
    const counts = new Map<string, number>()
    ofDay.forEach(s => counts.set(s.node, (counts.get(s.node) || 0) + 1))
    const node = [...counts].sort((a, b) => b[1] - a[1])[0][0]
    const last = stints[stints.length - 1]
    if (last && last.node === node) last.days.push(d); else stints.push({ node, days: [d] })
  }
  const warnings: string[] = []
  const seen = new Set<string>()
  stints.forEach((s, i) => {
    for (let j = i + 2; j < stints.length; j++) {
      if (stints[j].node !== s.node) continue
      const between = stints.slice(i + 1, j)
      if (between.every(b => b.days.length <= 1)) continue // day trip(s) out and back
      const key = `${s.node}${i}${j}`
      if (seen.has(key)) continue
      seen.add(key)
      warnings.push(`You leave ${s.node} after day ${s.days[s.days.length - 1]} and come back on day ${stints[j].days[0]} (via ${between.map(b => b.node).join(' → ')}). A single line or loop avoids the double trip.`)
    }
  })

  const km = stops.reduce((n, s) => n + (s.travel ? s.travel.km : 0), 0)
  return { stops, warnings, km, unscheduled, unmapped }
}

export const travelLabel = (t: Travel) =>
  `${t.mode} · ${t.mins ? fmtMins(t.mins) : ''}${t.yen ? ` · ≈¥${t.yen.toLocaleString('en-AU')}` : ' · free'}${t.approx ? ' (approx)' : ''}`
