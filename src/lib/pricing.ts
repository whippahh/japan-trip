import type { AgeGroup, Item, Person, Pick, Stay, StayChoice, Suggestion, Tier } from './types'

/** Daily food allowance per adult by eating style (¥). */
export const TIER_FOOD: Record<Tier, number> = { budget: 4000, mid: 7500, splurge: 14000 }
export const FOOD_AGE: Record<AgeGroup, number> = { adult: 1, teen: 1, child: 0.6, toddler: 0.2 }
/** Local trains/buses per day (¥, adult). */
export const LOCAL_TRANSPORT_DAY = 1000
export const TRANSPORT_AGE: Record<AgeGroup, number> = { adult: 1, teen: 1, child: 0.5, toddler: 0 }
/** Ryokan / hostel style per-person stays: share of adult price by age. */
export const STAY_AGE: Record<AgeGroup, number> = { adult: 1, teen: 1, child: 0.7, toddler: 0 }

export function itemPrice(item: Item, age: AgeGroup): number {
  const p = item.prices
  switch (age) {
    case 'adult': return p.adult ?? 0
    case 'teen': return p.teen ?? p.adult ?? 0
    case 'child': return p.child ?? p.adult ?? 0
    case 'toddler': return p.toddler ?? 0
  }
}

export function suggestionToItem(s: Suggestion): Item {
  return {
    id: s.id,
    name: s.title,
    area: s.area || 'Anywhere / Nationwide',
    town: '',
    type: s.type || 'Culture experience',
    intensity: 1,
    hours: 0,
    prices: { adult: s.price_adult || 0, child: s.price_child ?? s.price_adult ?? 0 },
    toddlerOk: true,
    tier: 'mid',
    kind: 'sight',
    blurb: s.note || '',
    link: s.url || undefined,
    custom: true,
  }
}

export function nightsBetween(a?: string | null, b?: string | null): number {
  if (!a || !b) return 0
  const [ya, ma, da] = a.split('-').map(Number)
  const [yb, mb, db] = b.split('-').map(Number)
  const n = Math.round((Date.UTC(yb, mb - 1, db) - Date.UTC(ya, ma - 1, da)) / 86400000)
  return n > 0 ? n : 0
}

export function stayNightsTotal(stays: StayChoice[]): number {
  return stays.reduce((n, s) => n + (s.nights || 0), 0)
}

/** Trip length: from dates if both set, otherwise from the nights allocated to stays. */
export function tripNights(p: Pick | Person | { arrive: string | null; depart: string | null; stays: StayChoice[] }): number {
  const x = p as { arrive: string | null; depart: string | null; stays: StayChoice[] }
  const fromDates = nightsBetween(x.arrive, x.depart)
  return fromDates > 0 ? fromDates : stayNightsTotal(x.stays || [])
}

export function stayCost(stay: Stay, choice: StayChoice, age: AgeGroup): number {
  const nights = Math.max(0, choice.nights || 0)
  if (stay.perPerson) return stay.yen * nights * STAY_AGE[age]
  if (age === 'toddler') return 0 // sleeps in with parents; set "sharing" to the paying people
  return (stay.yen * nights) / Math.max(1, choice.sharing || stay.capacity)
}

export interface Breakdown {
  nights: number
  days: number
  activities: { item: Item; price: number; day: number | null }[]
  stays: { stay: Stay; choice: StayChoice; cost: number }[]
  sights: number
  accommodation: number
  food: number
  transport: number
  total: number
  warnings: string[]
}

export function personBreakdown(
  p: Person,
  picks: Pick[],
  getItem: (id: string) => Item | undefined,
  getStay: (id: string) => Stay | undefined,
): Breakdown {
  const nights = tripNights(p)
  const days = nights > 0 ? nights + 1 : 0
  const activities = picks
    .filter(k => k.person_id === p.id)
    .map(k => ({ item: getItem(k.item_id), day: k.day }))
    .filter((x): x is { item: Item; day: number | null } => !!x.item)
    .map(x => ({ ...x, price: itemPrice(x.item, p.age_group) }))
  const stays = (p.stays || [])
    .map(choice => ({ choice, stay: getStay(choice.stayId) }))
    .filter((x): x is { choice: StayChoice; stay: Stay } => !!x.stay)
    .map(x => ({ ...x, cost: stayCost(x.stay, x.choice, p.age_group) }))
  const sights = activities.reduce((n, a) => n + a.price, 0)
  const accommodation = stays.reduce((n, s) => n + s.cost, 0)
  const food = days * TIER_FOOD[p.tier] * FOOD_AGE[p.age_group]
  const transport = days * LOCAL_TRANSPORT_DAY * TRANSPORT_AGE[p.age_group]
  const warnings: string[] = []
  const alloc = stayNightsTotal(p.stays || [])
  const dated = nightsBetween(p.arrive, p.depart)
  if (dated > 0 && alloc !== dated) warnings.push(`Accommodation covers ${alloc} night(s) but your dates are ${dated} night(s).`)
  if (p.age_group === 'toddler') {
    activities.filter(a => a.item.adultsOnly).forEach(a => warnings.push(`${a.item.name} is adults-only.`))
  }
  return {
    nights, days, activities, stays, sights, accommodation, food, transport,
    total: sights + accommodation + food + transport,
    warnings,
  }
}
