import assert from 'node:assert/strict'
import { itemPrice, nightsBetween, personBreakdown, stayCost, tripNights } from '../src/lib/pricing'
import { CATALOGUE } from '../src/data/catalogue'
import { STAYS } from '../src/data/stays'
import type { Person } from '../src/lib/types'

const byId = new Map(CATALOGUE.map(i => [i.id, i]))
const stayById = new Map(STAYS.map(s => [s.id, s]))
assert.equal(byId.size, CATALOGUE.length, 'duplicate catalogue ids')
assert.equal(stayById.size, STAYS.length, 'duplicate stay ids')
for (const i of CATALOGUE) assert.ok(i.prices.adult !== undefined, 'adult price missing: ' + i.id)
for (const i of CATALOGUE) if (i.needs) assert.ok(byId.has(i.needs), `${i.id} needs unknown ${i.needs}`)

assert.equal(nightsBetween('2027-04-01', '2027-04-15'), 14)
assert.equal(nightsBetween('2027-04-15', '2027-04-01'), 0)
assert.equal(nightsBetween(null, '2027-04-01'), 0)

const disney = byId.get('tokyo-disneyland')!
assert.equal(itemPrice(disney, 'toddler'), 0)
assert.ok(itemPrice(disney, 'child') < itemPrice(disney, 'adult'))
assert.equal(itemPrice(disney, 'teen'), disney.prices.teen)

const room = stayById.get('tk-mimaru')!
assert.equal(stayCost(room, { stayId: room.id, nights: 4, sharing: 4 }, 'adult'), room.yen)
assert.equal(stayCost(room, { stayId: room.id, nights: 4, sharing: 4 }, 'toddler'), 0)
const ryo = [...stayById.values()].find(s => s.perPerson && s.style === 'Ryokan')!
assert.equal(stayCost(ryo, { stayId: ryo.id, nights: 1, sharing: 1 }, 'child'), ryo.yen * 0.7)

const me: Person = {
  id: 'p1', name: 'Test', household_id: null, age_group: 'adult',
  arrive: '2027-04-01', depart: '2027-04-08', tier: 'mid',
  stays: [{ stayId: room.id, nights: 7, sharing: 4 }],
}
assert.equal(tripNights(me), 7)
const b = personBreakdown(me, [{ person_id: 'p1', item_id: 'tokyo-disneyland', day: 2 }], id => byId.get(id), id => stayById.get(id))
assert.equal(b.sights, disney.prices.adult)
assert.equal(b.accommodation, (room.yen * 7) / 4)
assert.equal(b.days, 8)
assert.equal(b.food, 8 * 7500)
assert.equal(b.total, b.sights + b.accommodation + b.food + b.transport)
assert.equal(b.warnings.length, 0)
const b2 = personBreakdown({ ...me, stays: [{ stayId: room.id, nights: 3, sharing: 4 }] }, [], id => byId.get(id), id => stayById.get(id))
assert.equal(b2.warnings.length, 1)
console.log(`OK — ${CATALOGUE.length} items, ${STAYS.length} stays; pricing tests passed`)

// ── plans, geo and route tests ──
import { PLANS, defaultSelection, expandPlan, virtualPerson } from '../src/data/plans'
import { coordsFor } from '../src/data/geo'
import { buildRoute } from '../src/lib/route'
for (const i of CATALOGUE) if (i.kind !== 'transit' && i.kind !== 'pass' && i.area !== 'Anywhere / Nationwide') assert.ok(coordsFor(i), 'no coords: ' + i.id)
for (const plan of PLANS) {
  const sel = defaultSelection(plan)
  for (const s of plan.stops) for (const x of s.items) {
    assert.ok(byId.has(x.id), `${plan.id}: unknown item ${x.id}`)
    const days = s.nights + (s === plan.stops[plan.stops.length - 1] ? 1 : 0)
    assert.ok(x.d < days, `${plan.id}/${s.id}: ${x.id} day ${x.d} outside ${days} days`)
  }
  const ex = expandPlan(plan, { tier: plan.tier, nights: {}, selected: sel })
  assert.equal(ex.nights, plan.stops.reduce((n, s) => n + s.nights, 0))
  assert.equal(new Set(ex.picks.map(p => p.item_id)).size, ex.picks.length, 'duplicate picks in ' + plan.id)
  for (const st of ex.stays) assert.ok(stayById.has(st.stayId))
  const { person, picks } = virtualPerson(plan, ex, plan.tier)
  const route = buildRoute('virtual', picks, id => byId.get(id))
  assert.equal(route.warnings.length, 0, `${plan.id} plan has backtracking: ${route.warnings.join(' | ')}`)
  const b = personBreakdown({ ...person, arrive: '2027-04-01', depart: '2027-04-' + String(1 + ex.nights).padStart(2, '0') }, picks, id => byId.get(id), id => stayById.get(id))
  assert.ok(b.total > 0)
  console.log(`  ${plan.id}: ${ex.nights}n, ${ex.picks.length} picks, ${Math.round(route.km)} km, ≈¥${Math.round(b.total).toLocaleString()} per adult`)
}
// back-and-forth detection
const zig = buildRoute('z', [
  { person_id: 'z', item_id: 'senso-ji', day: 1 }, { person_id: 'z', item_id: 'fushimi-inari', day: 2 },
  { person_id: 'z', item_id: 'kiyomizu', day: 3 }, { person_id: 'z', item_id: 'meiji-jingu', day: 4 },
], id => byId.get(id))
assert.equal(zig.warnings.length, 1, 'expected a backtracking warning')
const daytrip = buildRoute('z', [
  { person_id: 'z', item_id: 'senso-ji', day: 1 }, { person_id: 'z', item_id: 'kamakura-buddha', day: 2 },
  { person_id: 'z', item_id: 'meiji-jingu', day: 3 },
], id => byId.get(id))
assert.equal(daytrip.warnings.length, 0, 'single-day trips should not warn')
assert.equal(zig.stops[1].travel?.mode, 'Shinkansen')
console.log('OK — plans, geo and route tests passed')
