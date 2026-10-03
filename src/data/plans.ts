import type { Item, Person, Pick, StayChoice, Tier } from '../lib/types'
import { STAYS } from './stays'

/** One leg of a template: a base town with a set number of nights and suggested attractions. */
export interface PlanItem { id: string; d: number; opt?: boolean }  // d = day within the stop (0 = arrival day)
export interface PlanStop {
  id: string
  label: string
  stayKey?: 'tokyo' | 'hakone' | 'kyoto' | 'osaka' | 'koyasan' | 'kumano'
  nights: number
  items: PlanItem[]
  note: string
}
export interface Plan {
  id: string
  name: string
  tagline: string
  suits: string
  tier: Tier
  stops: PlanStop[]
  tips: string[]
}

export const STAY_BY_KEY: Record<NonNullable<PlanStop['stayKey']>, Record<Tier, string>> = {
  tokyo: { budget: 'tk-business', mid: 'tk-mimaru', splurge: 'tk-luxury' },
  hakone: { budget: 'hk-ryokan-mid', mid: 'hk-ryokan-mid', splurge: 'hk-ryokan-private' },
  kyoto: { budget: 'ky-business', mid: 'ky-mimaru', splurge: 'ky-ryokan' },
  osaka: { budget: 'os-business', mid: 'os-mimaru', splurge: 'os-luxury' },
  koyasan: { budget: 'koya-shukubo', mid: 'koya-shukubo', splurge: 'koya-shukubo' },
  kumano: { budget: 'kn-minshuku', mid: 'kn-minshuku', splurge: 'kn-minshuku' },
}

const it = (id: string, d: number, opt = false): PlanItem => ({ id, d, ...(opt ? { opt: true } : {}) })

export const PLANS: Plan[] = [
  {
    id: 'classic', name: 'Classic Golden Route', tagline: 'Tokyo → Hakone → Kyoto (+ Nara) → Osaka, 14 nights, one clean line',
    suits: 'First-timers, mixed ages, the whole family together', tier: 'mid',
    stops: [
      { id: 'tokyo', label: 'Tokyo', stayKey: 'tokyo', nights: 5, note: 'Land at Narita, a gentle first day, then the big hitters.', items: [
        it('skyliner', 0), it('senso-ji', 0), it('tokyo-subway-72', 0),
        it('meiji-jingu', 1), it('takeshita', 1), it('shibuya-crossing', 1), it('nintendo-pokemon', 1), it('shibuya-sky', 1),
        it('tokyo-disneyland', 2), it('tokyo-disneysea', 3, true),
        it('tsukiji-outer', 3), it('teamlab-planets', 3), it('miraikan-odaiba', 3, true),
        it('ueno-park', 4), it('akihabara', 4), it('omoide-golden-gai', 4, true), it('ghibli-museum', 4, true),
      ] },
      { id: 'hakone', label: 'Hakone', stayKey: 'hakone', nights: 1, note: 'One night in a ryokan with an onsen. The Freepass includes a Shinjuku return, so it is slightly overpriced for a one-way trip.', items: [
        it('hakone-freepass', 0), it('owakudani', 0), it('ashi-cruise', 0), it('hakone-openair', 0, true),
      ] },
      { id: 'kyoto', label: 'Kyoto', stayKey: 'kyoto', nights: 4, note: 'Shinkansen from Odawara (about 1h30). Nara is an easy day trip from here, then on to Osaka.', items: [
        it('t-shinkansen-tk', 0), it('fushimi-inari', 0), it('gion-evening', 0),
        it('kiyomizu', 1), it('nishiki-market', 1), it('ginkakuji', 1, true),
        it('arashiyama-bamboo', 2), it('tenryuji', 2), it('sagano-train', 2, true), it('monkey-park', 2, true),
        it('t-nara', 3), it('nara-deer', 3), it('todaiji', 3),
      ] },
      { id: 'osaka', label: 'Osaka', stayKey: 'osaka', nights: 4, note: 'Fly out of Kansai Airport on the last day. Keep USJ for a midweek day.', items: [
        it('t-kyoto-osaka', 0), it('dotonbori', 0),
        it('usj', 1),
        it('osaka-castle', 2), it('kuromon', 2), it('shinsekai', 2, true),
        it('kaiyukan', 3), it('tempozan-wheel', 3, true), it('umeda-sky', 3, true),
        it('t-kix', 4),
      ] },
    ],
    tips: ['Fly into Tokyo and out of Osaka (open-jaw) so you never backtrack.', 'Book USJ, Disney and Ghibli tickets first, then fit everything else around them.'],
  },
  {
    id: 'family-parks', name: 'Family & Theme Parks', tagline: 'Tokyo → Kyoto → Osaka, 10 nights with Disney and USJ',
    suits: 'Families with young kids and teens', tier: 'mid',
    stops: [
      { id: 'tokyo', label: 'Tokyo', stayKey: 'tokyo', nights: 4, note: 'A slow first day, a full Disney day, then indoor and easy-going options.', items: [
        it('skyliner', 0), it('senso-ji', 0), it('ueno-zoo', 0, true),
        it('tokyo-disneyland', 1), it('disney-premier', 1, true),
        it('teamlab-planets', 2), it('tsukiji-outer', 2),
        it('ghibli-museum', 3, true), it('puroland', 3, true), it('shinjuku-gyoen', 3),
      ] },
      { id: 'kyoto', label: 'Kyoto', stayKey: 'kyoto', nights: 3, note: 'Short on temples, big on trains, rivers and bamboo.', items: [
        it('t-shinkansen-tk', 0), it('fushimi-inari', 0),
        it('arashiyama-bamboo', 1), it('sagano-train', 1), it('monkey-park', 1, true),
        it('kyoto-railway-museum', 2), it('kyoto-aquarium', 2),
      ] },
      { id: 'osaka', label: 'Osaka', stayKey: 'osaka', nights: 3, note: 'USJ and the aquarium, with Dotonbori at night.', items: [
        it('t-kyoto-osaka', 0), it('dotonbori', 0),
        it('usj', 1), it('usj-express', 1, true),
        it('kaiyukan', 2), it('tempozan-wheel', 2),
        it('t-kix', 3),
      ] },
    ],
    tips: ['Under-3s are free at Disney; check USJ height limits for older toddlers.', 'Put the two park days midweek to avoid weekend crowds.'],
  },
  {
    id: 'budget-loop', name: 'Budget Loop', tagline: 'Tokyo (+ Kamakura) → Kyoto (+ Nara) → Osaka, 12 nights, mostly free sights',
    suits: 'Anyone watching the budget', tier: 'budget',
    stops: [
      { id: 'tokyo', label: 'Tokyo', stayKey: 'tokyo', nights: 5, note: 'Free shrines and parks, with a Kamakura day trip.', items: [
        it('skyliner', 0), it('senso-ji', 0), it('tokyo-subway-72', 0),
        it('meiji-jingu', 1), it('takeshita', 1), it('shibuya-crossing', 1), it('nintendo-pokemon', 1),
        it('t-kamakura', 2), it('kamakura-buddha', 2), it('kamakura-hike', 2, true), it('enoshima', 2, true),
        it('ueno-park', 3), it('akihabara', 3), it('ueno-zoo', 3, true),
        it('shinjuku-gyoen', 4), it('imperial-palace', 4), it('tsukiji-outer', 4), it('omoide-golden-gai', 4, true),
      ] },
      { id: 'kyoto', label: 'Kyoto', stayKey: 'kyoto', nights: 4, note: 'Most Kyoto highlights are cheap or free. A bus pass covers the rest.', items: [
        it('t-shinkansen-tk', 0), it('fushimi-inari', 0), it('gion-evening', 0),
        it('kiyomizu', 1), it('nishiki-market', 1), it('kyoto-bus-1day', 1),
        it('arashiyama-bamboo', 2), it('kinkakuji', 2),
        it('t-nara', 3), it('nara-deer', 3), it('todaiji', 3, true),
      ] },
      { id: 'osaka', label: 'Osaka', stayKey: 'osaka', nights: 3, note: 'Street food capital — eat your way through it.', items: [
        it('t-kyoto-osaka', 0), it('dotonbori', 0),
        it('osaka-castle', 1), it('kuromon', 1),
        it('shinsekai', 2), it('nintendo-osaka', 2, true), it('den-den-town', 2, true),
        it('t-kix', 3),
      ] },
    ],
    tips: ['Business hotels with twin rooms are the cheapest per person for couples.', 'Eat at conveyor-belt sushi, ramen shops and konbini for big savings.'],
  },
  {
    id: 'temples-trails', name: 'Temples & Trails', tagline: 'Tokyo → Kyoto → Koyasan → Kumano → Osaka, 14 nights on foot and by train',
    suits: 'Fit adults and older teens who like walking', tier: 'mid',
    stops: [
      { id: 'tokyo', label: 'Tokyo', stayKey: 'tokyo', nights: 4, note: 'Keep Tokyo short; one easy mountain day to warm up.', items: [
        it('skyliner', 0), it('senso-ji', 0),
        it('meiji-jingu', 1), it('shibuya-crossing', 1),
        it('mt-takao', 2),
        it('tsukiji-outer', 3), it('ueno-park', 3, true),
      ] },
      { id: 'kyoto', label: 'Kyoto', stayKey: 'kyoto', nights: 5, note: 'The most temple-dense city in Japan; include one mountain hike.', items: [
        it('t-shinkansen-tk', 0), it('fushimi-inari', 0),
        it('kiyomizu', 1), it('ginkakuji', 1), it('gion-evening', 1),
        it('kurama-kibune', 2),
        it('arashiyama-bamboo', 3), it('tenryuji', 3), it('nijo-castle', 3, true),
        it('fushimi-hike-tour', 4, true), it('uji-byodoin', 4, true),
      ] },
      { id: 'koyasan', label: 'Koyasan', stayKey: 'koyasan', nights: 1, note: 'Sleep in a temple lodging with evening and morning prayers.', items: [
        it('t-koyasan', 0), it('koyasan-day', 0),
      ] },
      { id: 'kumano', label: 'Kumano', stayKey: 'kumano', nights: 2, note: 'Walk a stage of the ancient pilgrim route; sleep in a family-run inn.', items: [
        it('t-kumano', 0), it('kumano-guided-day', 0),
      ] },
      { id: 'osaka', label: 'Osaka', stayKey: 'osaka', nights: 2, note: 'A food-heavy finish before flying out of Kansai.', items: [
        it('dotonbori', 0), it('osaka-castle', 0, true),
        it('kuromon', 1), it('minoo-park', 1, true),
        it('t-kix', 2),
      ] },
    ],
    tips: ['Not toddler-friendly: stairs, steep paths and quiet temple lodgings.', 'Book Koyasan lodging early, as it fills a month or two ahead.'],
  },
  {
    id: 'splurge', name: 'Splurge & Slow', tagline: 'Tokyo → Hakone onsen → Kyoto, 10 nights with private guides and ryokan',
    suits: 'Couples and grandparents who want comfort', tier: 'splurge',
    stops: [
      { id: 'tokyo', label: 'Tokyo', stayKey: 'tokyo', nights: 4, note: 'Private van for the highlights, then food and a good bar.', items: [
        it('tokyo-private-van', 0),
        it('tsukiji-tour', 1), it('sushi-class', 1),
        it('teamlab-borderless', 2), it('shibuya-sky', 2), it('roppongi-cocktails', 2, true),
        it('ninja-experience', 3, true), it('sumo-tournament', 3, true),
      ] },
      { id: 'hakone', label: 'Hakone', stayKey: 'hakone', nights: 2, note: 'Two nights in a ryokan with a private open-air bath.', items: [
        it('hakone-openair', 0), it('owakudani', 0),
        it('ashi-cruise', 1), it('yunessun', 1, true),
      ] },
      { id: 'kyoto', label: 'Kyoto', stayKey: 'kyoto', nights: 4, note: 'Culture days, with a maiko dinner and tea ceremony.', items: [
        it('t-shinkansen-tk', 0), it('gion-evening', 0), it('maiko-dinner', 0),
        it('kiyomizu', 1), it('tea-ceremony', 1), it('kimono-rental', 1, true),
        it('kyoto-cooking', 2), it('arashiyama-bamboo', 2), it('hozugawa', 2, true),
        it('fushimi-hike-tour', 3), it('nijo-castle', 3),
      ] },
    ],
    tips: ['Ryokan rates are per person and include dinner and breakfast.', 'Book the maiko dinner and ryokan at least 3 months ahead.'],
  },
  {
    id: 'taster', name: 'One-Week Taster', tagline: 'Tokyo → Kyoto → Osaka, 7 nights for shorter stays',
    suits: 'Anyone who can only come for a week', tier: 'mid',
    stops: [
      { id: 'tokyo', label: 'Tokyo', stayKey: 'tokyo', nights: 3, note: 'The essentials in three days.', items: [
        it('skyliner', 0), it('senso-ji', 0),
        it('meiji-jingu', 1), it('shibuya-crossing', 1), it('shibuya-sky', 1), it('nintendo-pokemon', 1),
        it('teamlab-planets', 2), it('tsukiji-outer', 2), it('akihabara', 2, true),
      ] },
      { id: 'kyoto', label: 'Kyoto', stayKey: 'kyoto', nights: 2, note: 'The two best days: Fushimi Inari and Gion, then Arashiyama.', items: [
        it('t-shinkansen-tk', 0), it('fushimi-inari', 0), it('gion-evening', 0),
        it('kiyomizu', 1), it('arashiyama-bamboo', 1),
      ] },
      { id: 'osaka', label: 'Osaka', stayKey: 'osaka', nights: 2, note: 'Fly home from Kansai Airport on the last day.', items: [
        it('t-kyoto-osaka', 0), it('dotonbori', 0),
        it('osaka-castle', 1), it('kuromon', 1), it('usj', 1, true),
        it('t-kix', 2),
      ] },
    ],
    tips: ['This is a lighter version of the Classic route — same order, fewer nights.'],
  },
]

export interface PlanConfig {
  tier: Tier
  nights: Record<string, number>        // stop id → nights (override)
  selected: Set<string>                 // `${stopId}:${itemId}`
  sharing?: (stayId: string) => number  // how many people split a room
}
export interface Expanded {
  picks: { item_id: string; day: number }[]
  stays: StayChoice[]
  nights: number
  spans: { stopId: string; label: string; from: number; to: number }[]
}

export const defaultSelection = (plan: Plan) =>
  new Set(plan.stops.flatMap(s => s.items.filter(i => !i.opt).map(i => `${s.id}:${i.id}`)))

export function expandPlan(plan: Plan, cfg: PlanConfig): Expanded {
  const picks: Expanded['picks'] = []
  const stays: StayChoice[] = []
  const spans: Expanded['spans'] = []
  let cursor = 1
  const seen = new Set<string>()
  plan.stops.forEach((stop, idx) => {
    const nights = Math.max(0, cfg.nights[stop.id] ?? stop.nights)
    const last = idx === plan.stops.length - 1
    const days = Math.max(1, nights + (last ? 1 : 0))
    spans.push({ stopId: stop.id, label: stop.label, from: cursor, to: cursor + days - 1 })
    for (const i of stop.items) {
      if (!cfg.selected.has(`${stop.id}:${i.id}`) || seen.has(i.id)) continue
      seen.add(i.id)
      picks.push({ item_id: i.id, day: cursor + Math.min(i.d, days - 1) })
    }
    if (stop.stayKey && nights > 0) {
      const stayId = STAY_BY_KEY[stop.stayKey][cfg.tier]
      const stay = STAYS.find(s => s.id === stayId)!
      stays.push({ stayId, nights, sharing: stay.perPerson ? 1 : Math.max(1, Math.min(stay.capacity, cfg.sharing ? cfg.sharing(stayId) : stay.capacity)) })
    }
    cursor += days
  })
  const nights = plan.stops.reduce((n, s) => n + Math.max(0, cfg.nights[s.id] ?? s.nights), 0)
  return { picks, stays, nights, spans }
}

/** Rough per-adult cost used on the plan cards (couple sharing a room). */
export function virtualPerson(plan: Plan, ex: Expanded, tier: Tier): { person: Person; picks: Pick[] } {
  const person: Person = { id: 'virtual', name: 'x', household_id: null, age_group: 'adult', arrive: null, depart: null, tier, stays: ex.stays }
  return { person, picks: ex.picks.map(p => ({ person_id: 'virtual', item_id: p.item_id, day: p.day })) }
}
export type { Item }
