import { useMemo, useState } from 'react'
import { useData } from '../lib/data'
import { Avatar, Money, yen } from '../components/ui'
import { AreaPhoto, ItemPhoto } from '../components/Photo'
import { personBreakdown, tripNights, TIER_FOOD } from '../lib/pricing'
import { buildRoute, travelLabel } from '../lib/route'
import { RouteMap } from '../pages/MapPage'
import { PLANS, defaultSelection, expandPlan, virtualPerson, type Plan } from '../data/plans'
import { planEstimate } from '../pages/Plans'
import { STAYS } from '../data/stays'
import { AREAS, AREA_META } from '../data/meta'
import { addDays, fmtDate } from '../lib/dates'
import { TIER_LABEL, type Tier } from '../lib/types'
import { Icon, Segmented, Sheet, Stepper, Toggle } from './kit'
import { useUI } from './ctx'
import { hrs } from './Tiles'
import { autoArrange } from '../lib/autoplan'
import { stintsFor, suggestStay, transferTip } from '../lib/stayplan'
import { fmtMins } from '../data/geo'
import { getFlights, withFlights } from '../lib/flights'
import { seasonTips } from '../lib/season'

type Seg = 'plan' | 'costs' | 'map' | 'stays'

const STYLE_LABEL: Record<Tier, string> = { budget: 'Budget', mid: 'Mid-range', splurge: 'Splurge' }
const STYLE_HINT: Record<Tier, string> = { budget: 'Hostels and business hotels', mid: 'Family apartments and 3-star hotels', splurge: 'Luxury hotels and private-onsen ryokan' }

function CustomiseSheet({ plan, onBack, onClose }: { plan: Plan; onBack: () => void; onClose: () => void }) {
  const { me, people, membersOf, getItem, getStay, setPlan, picks } = useData()
  const ui = useUI()
  const [tier, setTier] = useState<Tier>(plan.tier)
  const [nights, setNights] = useState<Record<string, number>>(() => Object.fromEntries(plan.stops.map(s => [s.id, s.nights])))
  const [sel, setSel] = useState<Set<string>>(() => defaultSelection(plan))
  const [who, setWho] = useState<'me' | 'household' | 'all'>('me')
  const [replace, setReplace] = useState(true)
  const [start, setStart] = useState(me?.arrive || '')
  const [busy, setBusy] = useState(false)
  if (!me) return null
  const house = membersOf(me.household_id).length ? membersOf(me.household_id) : [me]
  const targets = who === 'me' ? [me] : who === 'household' ? house : people
  const paying = (hid: string | null) => Math.max(1, (hid ? people.filter(p => p.household_id === hid) : [me]).filter(p => p.age_group !== 'toddler').length)
  const ex = expandPlan(plan, { tier, nights, selected: sel, sharing: () => paying(me.household_id) })
  const est = (() => {
    const e2 = expandPlan(plan, { tier, nights, selected: sel, sharing: () => 2 })
    const { person, picks: pk } = virtualPerson(plan, e2, tier)
    const end = new Date(Date.UTC(2027, 0, 1 + e2.nights)).toISOString().slice(0, 10)
    return personBreakdown({ ...person, arrive: '2027-01-01', depart: end }, pk, getItem, getStay).total
  })()
  const toggle = (k: string) => { const n = new Set(sel); n.has(k) ? n.delete(k) : n.add(k); setSel(n) }

  const apply = async () => {
    setBusy(true)
    try {
      for (const p of targets) {
        const e = expandPlan(plan, { tier, nights, selected: sel, sharing: () => paying(p.household_id) })
        const keep = e.picks.filter(x => !(p.age_group === 'toddler' && getItem(x.item_id)?.adultsOnly))
        const existing = picks.filter(k => k.person_id === p.id).length
        const patch: Record<string, unknown> = { tier }
        if (start) { patch.arrive = start; patch.depart = addDays(start, e.nights) }
        await setPlan(p.id, { picks: keep, stays: replace || !existing ? e.stays : [...p.stays, ...e.stays], replace, patch })
      }
      onClose()
      ui.go('#/trip/plan')
    } finally { setBusy(false) }
  }

  return (
    <Sheet open onClose={onClose} tall title={plan.name}
      footer={
        <div className="foot-actions">
          <div className="apply-sum"><span><b>{ex.nights} nights</b> · {ex.picks.length} activities</span><span className="muted small">per adult, excl. flights</span><Money y={est} /></div>
          <button className="btn-big" disabled={busy} onClick={apply}>{busy ? 'Applying…' : `Use this route for ${who === 'me' ? 'me' : who === 'household' ? 'my household' : 'everyone'}`}</button>
        </div>
      }>
      <button className="linkbtn back" onClick={onBack}>‹ All routes</button>
      <p className="muted" style={{ margin: 0 }}>{plan.tagline}. Change anything below, then apply. It stays fully editable afterwards.</p>

      <h4 className="sec">Where you sleep</h4>
      <Segmented value={tier} onChange={setTier} options={(Object.keys(STYLE_LABEL) as Tier[]).map(t => [t, STYLE_LABEL[t]] as [Tier, string])} />
      <p className="muted small" style={{ margin: 0 }}>{STYLE_HINT[tier]}</p>

      <h4 className="sec">Apply to</h4>
      <Segmented value={who} onChange={setWho} options={[['me', 'Just me'], ['household', `Household (${house.length})`], ['all', `Everyone (${people.length})`]]} />
      <label className="fld">First night in Japan (optional)<input type="date" value={start} onChange={e => setStart(e.target.value)} /></label>
      <div className="group"><div className="lrow"><span className="row-main"><b>Replace my current picks and stays</b></span><Toggle on={replace} onChange={setReplace} label="Replace" /></div></div>

      <h4 className="sec">Your route</h4>
      {plan.stops.map((st, idx) => {
        const span = ex.spans[idx]
        return (
          <section key={st.id} className="day-card cust">
            <header><span className="pill">{idx + 1}</span><b>{st.label}</b><small>days {span.from}–{span.to}</small>
              <span className="stepper-wrap"><Stepper value={nights[st.id]} min={0} max={14} onChange={n => setNights({ ...nights, [st.id]: n })} /> <small>nights</small></span></header>
            <p className="muted small cust-note">{st.note}</p>
            {st.items.map(i => {
              const item = getItem(i.id)
              if (!item) return null
              const k = `${st.id}:${i.id}`
              const on = sel.has(k)
              return (
                <button key={k} className={'cust-row' + (on ? ' on' : '')} onClick={() => toggle(k)} aria-pressed={on}>
                  <span className={'circle sm' + (on ? ' on' : '')}><Icon n="check" size={14} /></span>
                  <span className="stop-main"><b>{item.name}</b><small>Day {span.from + Math.min(i.d, span.to - span.from)}{i.opt ? ' · optional' : ''}{item.prices.adult ? ` · ${yen(item.prices.adult)}` : ' · Free'}</small></span>
                </button>
              )
            })}
          </section>
        )
      })}
    </Sheet>
  )
}

export function RoutesSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { getItem, getStay } = useData()
  const [id, setId] = useState<string | null>(null)
  const plan = PLANS.find(p => p.id === id)
  const close = () => { setId(null); onClose() }
  if (open && plan) return <CustomiseSheet key={plan.id} plan={plan} onBack={() => setId(null)} onClose={close} />
  return (
    <Sheet open={open} onClose={close} tall title="Ready-made routes">
      <p className="muted" style={{ margin: 0 }}>Each route is a clean line (fly into Tokyo, out of Osaka) with set nights per town, so nobody zig-zags. Pick one, tweak it, and it becomes your own.</p>
      <div className="stack">
        {PLANS.map(p => {
          const nights = p.stops.reduce((n, s) => n + s.nights, 0)
          return (
            <button key={p.id} className="route-card" onClick={() => setId(p.id)}>
              <AreaPhoto area={getItem(p.stops[0]?.items[0]?.id)?.area || 'Tokyo'} className="route-photo"><div className="tile-shade" /><span className="badge">{nights} nights · {TIER_LABEL[p.tier]}</span></AreaPhoto>
              <div className="route-body">
                <b>{p.name}</b>
                <div className="route-line">{p.stops.map((s, i) => <span key={s.id}>{i > 0 && <i>→</i>}{s.label}</span>)}</div>
                <small>{p.tagline}</small>
                <small className="muted">From <b>{yen(planEstimate(p, getItem, getStay))}</b> per adult, excl. flights</small>
              </div>
            </button>
          )
        })}
      </div>
    </Sheet>
  )
}

function StaysSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { me, setStays } = useData()
  const [tier, setTier] = useState<Tier | 'all'>('all')
  const [area, setArea] = useState('')
  if (!me) return null
  const add = (id: string) => {
    const s = STAYS.find(x => x.id === id)
    if (!s) return
    setStays(me.id, [...me.stays, { stayId: id, nights: 3, sharing: s.capacity }])
    onClose()
  }
  const areas = AREAS.filter(a => STAYS.some(s => s.area === a))
  return (
    <Sheet open={open} onClose={onClose} tall title="Add a place to stay">
      <div className="rail-chips"><button className={!area ? 'on' : ''} onClick={() => setArea('')}>All areas</button>{areas.map(a => <button key={a} className={area === a ? 'on' : ''} onClick={() => setArea(a)}>{AREA_META[a].emoji} {a}</button>)}</div>
      <Segmented value={tier} onChange={setTier} options={[['all', 'Any'], ['budget', 'Budget'], ['mid', 'Mid'], ['splurge', 'Splurge']]} />
      <div className="stack">
        {STAYS.filter(s => (!area || s.area === area) && (tier === 'all' || s.tier === tier)).map(s => (
          <button key={s.id} className="stay-pick" onClick={() => add(s.id)}>
            <AreaPhoto area={s.area} className="stay-photo" />
            <span><b>{s.name}</b><small>{AREA_META[s.area]?.emoji} {s.area} · {s.style}</small><small className="muted">{s.blurb}</small></span>
            <em>{yen(s.yen)}<small>{s.perPerson ? '/person' : '/room'} night</small></em>
          </button>
        ))}
      </div>
    </Sheet>
  )
}

export default function Trip({ seg: segParam }: { seg?: string }) {
  const { me, people, picks, getItem, getStay, updatePerson, setStays, setPickDay, membersOf, setMe, setPlan } = useData()
  const ui = useUI()
  const [stays, setStaySheet] = useState(false)
  const [mapIds, setMapIds] = useState<string[] | null>(null)
  const [undo, setUndo] = useState<{ picks: { item_id: string; day: number | null }[]; stays: any; note: string } | null>(null)
  const seg: Seg = (['plan', 'costs', 'map', 'stays'] as string[]).includes(segParam || '') ? (segParam as Seg) : 'plan'
  const route = useMemo(() => me ? buildRoute(me.id, picks, getItem) : null, [me, picks, getItem])
  if (!me || !route) return null
  const b = personBreakdown(me, picks, getItem, getStay)
  const house = membersOf(me.household_id).length ? membersOf(me.household_id) : [me]
  const days = [...new Set(route.stops.map(s => s.day))].sort((a, c) => a - c)
  const unsched = picks.filter(k => k.person_id === me.id && k.day == null).map(k => getItem(k.item_id)).filter(Boolean)
  const nothing = route.stops.length === 0 && unsched.length === 0
  const go = (s: Seg) => { location.hash = '#/trip/' + s }
  const dayDate = (d: number) => me.arrive ? fmtDate(addDays(me.arrive, d - 1)) : null
  const ids = mapIds || [me.id]
  const tips = seasonTips(me.arrive, me.depart)
  const stints = stintsFor(me, picks, getItem)
  const payingN = Math.max(1, house.filter(p => p.age_group !== 'toddler').length)
  const needs = stints.map(st => ({ st, add: st.nights > 0 && st.have < st.nights ? suggestStay(st, me.tier, payingN) : null }))
  const betweenYen = stints.reduce((n, st) => n + (st.arriveBy?.travel.yen || 0), 0)
  const addStays = (list: { stayId: string; nights: number; sharing: number }[]) => setStays(me.id, [...me.stays, ...list])
  const looseSights = unsched.filter(i => i && (i.kind === 'sight' || i.kind === 'package')).length
  const arrangeAll = async () => {
    const a = autoArrange(me, picks, getItem, payingN)
    if (!a) return
    const mineNow = picks.filter(k => k.person_id === me.id)
    const all = mineNow.map(k => ({ item_id: k.item_id, day: a.days.find(d => d.item_id === k.item_id)?.day ?? k.day }))
    await setPlan(me.id, { picks: all, stays: a.stays, replace: false })
    for (const h of house.filter(x => x.id !== me.id)) {
      const keep = all.filter(x => !(h.age_group === 'toddler' && getItem(x.item_id)?.adultsOnly))
      await setPlan(h.id, { picks: keep, stays: a.stays, replace: true })
    }
    setUndo(null)
  }
  const arrange = async () => {
    const paying = Math.max(1, house.filter(p => p.age_group !== 'toddler').length)
    const a = autoArrange(me, picks, getItem, paying)
    if (!a) return
    const mineNow = picks.filter(k => k.person_id === me.id)
    const all = mineNow.map(k => ({ item_id: k.item_id, day: a.days.find(d => d.item_id === k.item_id)?.day ?? k.day }))
    await setPlan(me.id, { picks: all, stays: a.stays, replace: false })
    setUndo({ picks: mineNow.map(k => ({ item_id: k.item_id, day: k.day })), stays: me.stays, note: `Arranged ${a.totalDays} days across ${a.bases.map(b => b.name).join(' → ')}${me.stays.length ? '' : ', with suggested places to stay'}.` })
  }
  const bars: [string, number, string][] = [['Sights', b.sights, 'var(--c1)'], ['Stays', b.accommodation, 'var(--c2)'], ['Food', b.food, 'var(--c3)'], ['Transport', b.transport, 'var(--c4)']]
  const sum = Math.max(1, bars.reduce((n, x) => n + x[1], 0))

  return (
    <div className="s-page">
      {house.length > 1 && (
        <div className="who-row scroll-x">
          {house.map(h => <button key={h.id} className={'who-chip' + (h.id === me.id ? ' on' : '')} onClick={() => setMe(h.id)}><Avatar name={h.name} size={28} /><span>{h.name.split(' ')[0]}</span></button>)}
        </div>
      )}
      <Segmented value={seg} onChange={go} options={[['plan', 'Plan'], ['costs', 'Costs'], ['map', 'Map'], ['stays', 'Stays']]} />

      {seg === 'plan' && (
        <>
          {nothing ? (
            <div className="empty-s big">
              <span>🗺️</span><b>Your trip is empty</b><small>Heart a few places in Discover and we'll arrange them into a trip for you. Or start with a ready-made route.</small>
              <button className="btn-big" onClick={ui.openRoutes}>Choose a ready-made route</button>
              <button className="btn-soft" onClick={() => ui.go('#/discover')}>Browse places</button>
            </div>
          ) : (
            <>
              {undo && (
                <div className="note-box ok">✅ {undo.note} It's a starting point: tap any place to change its day.{' '}
                  <button className="linkbtn" onClick={async () => { await setPlan(me.id, { picks: undo.picks, stays: undo.stays, replace: false }); setUndo(null) }}>Undo</button></div>
              )}
              {looseSights > 0 && (
                <div className="arrange-card">
                  <div><b>✨ Turn your {looseSights} picks into a trip</b><small>We'll put the towns in a clean line (no zig-zags), group places into sensible days, and suggest somewhere to stay. You can change anything.</small></div>
                  <button className="btn-big" onClick={arrange}>Arrange my trip</button>
                  {house.length > 1 && <button className="btn-soft" onClick={() => confirm(`Copy this arrangement to ${house.filter(x => x.id !== me.id).map(x => x.name.split(' ')[0]).join(', ')}? It replaces their current picks and stays.`) && arrangeAll()}>Arrange for my whole household</button>}
                </div>
              )}
              <div className="trip-sum"><div><b>{days.length}</b><small>days planned</small></div><div><b>{route.stops.length + unsched.length}</b><small>places</small></div><div><b>~{Math.round(route.km)}</b><small>km travelled</small></div></div>
              {route.warnings.map(w => <div key={w} className="note-box warn">⚠ {w}</div>)}
              {tips.map(t => <div key={t.title} className={'note-box' + (t.tone === 'busy' ? ' warn' : '')}><b>{t.emoji} {t.title}.</b> {t.text}</div>)}
              {days.map(d => {
                const stops = route.stops.filter(s => s.day === d)
                const towns = [...new Set(stops.map(s => s.item.town || s.item.area))]
                return (
                  <section key={d} className="day-card">
                    <header><b>Day {d}</b>{dayDate(d) && <span>{dayDate(d)}</span>}<small>{towns.join(' · ')}</small></header>
                    {stops.map(s => (
                      <div key={s.n}>
                        {s.transit.map(t => <div key={t.id} className="leg">{t.kind === 'pass' ? '🎟️' : '🚅'} {t.name}</div>)}
                        {s.travel && <div className="leg">{s.travel.mode === 'Walk' ? `🚶 Walk · ${s.travel.mins} min` : `🚆 ${travelLabel(s.travel)}`}</div>}
                        <button className="stop" onClick={() => ui.openItem(s.item.id)}>
                          <ItemPhoto item={s.item} className="stop-photo" />
                          <span className="stop-n">{s.n}</span>
                          <span className="stop-main"><b>{s.item.name}</b><small>{s.item.town || s.item.area}{s.item.hours ? ` · ~${hrs(s.item.hours)}` : ''}</small></span>
                          <Icon n="chevron" size={16} />
                        </button>
                      </div>
                    ))}
                  </section>
                )
              })}
              {unsched.length > 0 && (
                <section className="day-card loose">
                  <header><b>Not scheduled yet</b><small>Pick a day so it appears on the map</small></header>
                  {unsched.map(i => (
                    <div key={i!.id} className="stop">
                      <button className="stop-open" onClick={() => ui.openItem(i!.id)}>
                        <ItemPhoto item={i!} className="stop-photo" />
                        <span className="stop-main"><b>{i!.name}</b><small>{i!.town || i!.area}</small></span>
                      </button>
                      <select aria-label="Choose day" value="" onChange={e => e.target.value && setPickDay(me.id, i!.id, Number(e.target.value))}>
                        <option value="">Day…</option>
                        {Array.from({ length: Math.max(14, ...days) + 1 }, (_, k) => k + 1).map(d => <option key={d} value={d}>Day {d}</option>)}
                      </select>
                    </div>
                  ))}
                </section>
              )}
              <div className="stack"><button className="btn-soft wide" onClick={ui.openRoutes}>🗺️ Use a ready-made route</button><button className="btn-soft wide" onClick={() => ui.go('#/discover')}>＋ Add more places</button><button className="btn-soft wide" onClick={() => ui.go('#/print')}>🖨️ Print or save itinerary (PDF)</button></div>
            </>
          )}
        </>
      )}

      {seg === 'costs' && (
        <>
          <div className="big-total"><small>Estimated total for {me.name.split(' ')[0]}</small><Money y={b.total + getFlights(me.notes)} big /><small>{b.days} days · {getFlights(me.notes) ? 'includes your flights' : 'excludes flights'}</small></div>
          <div className="stack-bar">{bars.map(([k, v, c]) => <i key={k} style={{ width: `${(v / sum) * 100}%`, background: c }} title={k} />)}</div>
          <div className="group">
            {bars.map(([k, v, c]) => <div key={k} className="lrow"><span className="dot" style={{ background: c }} /><span className="row-main"><b>{k}</b></span><span className="row-right">{yen(v)}</span></div>)}
            {getFlights(me.notes) > 0 && <div className="lrow"><span className="dot" style={{ background: 'var(--c5, #888)' }} /><span className="row-main"><b>Flights</b></span><span className="row-right">{yen(getFlights(me.notes))}</span></div>}
          </div>
          {b.warnings.map(w => <div key={w} className="note-box warn">⚠ {w}</div>)}
          <h3 className="s-h">Your dates</h3>
          <div className="group pad-in">
            <div className="two">
              <label className="fld">Arrive<input type="date" value={me.arrive || ''} onChange={e => updatePerson(me.id, { arrive: e.target.value || null })} /></label>
              <label className="fld">Leave<input type="date" min={me.arrive || undefined} value={me.depart || ''} onChange={e => updatePerson(me.id, { depart: e.target.value || null })} /></label>
            </div>
            <label className="fld">Flights (your cost, ¥)
              <input type="number" min={0} inputMode="numeric" placeholder="e.g. 120000" value={getFlights(me.notes) || ''} onChange={e => updatePerson(me.id, { notes: withFlights(me.notes, Math.max(0, Number(e.target.value) || 0)) })} />
              <small className="muted">Return flights for you. Check the Money tab rate to convert from your own currency.</small>
            </label>
            <small className="muted">{tripNights(me)} nights. No dates yet? We use the nights you add under Stays.</small>
            <div className="fld">Eating style
              <div className="pills">{(Object.keys(TIER_LABEL) as Tier[]).map(t => <button key={t} className={me.tier === t ? 'on' : ''} onClick={() => updatePerson(me.id, { tier: t })}>{TIER_LABEL[t]}</button>)}</div>
              <small className="muted">About {yen(TIER_FOOD[me.tier])} a day for an adult.</small>
            </div>
          </div>
          {house.length > 1 && (
            <>
              <h3 className="s-h">Household</h3>
              <div className="group">
                {house.map(h => <button key={h.id} className="lrow" onClick={() => ui.openPerson(h.id)}><Avatar name={h.name} size={30} /><span className="row-main"><b>{h.name}</b></span><span className="row-right">{yen(personBreakdown(h, picks, getItem, getStay).total + getFlights(h.notes))}</span></button>)}
                <div className="lrow total"><span className="row-main"><b>Household total</b></span><span className="row-right"><b>{yen(house.reduce((n, h) => n + personBreakdown(h, picks, getItem, getStay).total + getFlights(h.notes), 0))}</b></span></div>
              </div>
            </>
          )}
          {betweenYen > 0 && <div className="note-box">🚄 Add roughly <b>{yen(betweenYen)}</b> per adult for getting between towns (see Stays), unless a rail pass covers it.</div>}
          <p className="muted small center">Prices are approximate (2025–26). Check the official site before booking. Shopping and insurance not included.</p>
        </>
      )}

      {seg === 'map' && (
        <>
          <div className="who-row scroll-x">
            {people.map(p => {
              const on = ids.includes(p.id)
              return <button key={p.id} className={'who-chip' + (on ? ' on' : '')} onClick={() => setMapIds(on ? ids.filter(x => x !== p.id) : [...ids, p.id])}><Avatar name={p.name} size={28} /><span>{p.name.split(' ')[0]}</span></button>
            })}
          </div>
          <div className="map-wrap"><RouteMap ids={ids} height={420} /></div>
          {route.stops.length === 0 && <div className="note-box">Give your places a day and they appear here as a path. <button className="linkbtn" onClick={ui.openRoutes}>Use a ready-made route</button></div>}
          {route.unscheduled > 0 && <div className="note-box">{route.unscheduled} place{route.unscheduled === 1 ? ' has' : 's have'} no day yet. <button className="linkbtn" onClick={() => go('plan')}>Set days</button></div>}
          <p className="muted small center">Tap a numbered pin for notes and how you get there.</p>
        </>
      )}

      {seg === 'stays' && (
        <>
          {stints.length > 0 && (
            <>
              <h3 className="s-h">Where to sleep, based on your days</h3>
              {needs.map(({ st, add }, i) => (
                <div key={st.from}>
                  {st.arriveBy && (
                    <div className="xfer">
                      <b>{st.arriveBy.travel.mode.match(/shinkansen/i) ? '🚄' : st.arriveBy.travel.mode.match(/bus/i) ? '🚌' : '🚆'} {st.arriveBy.from} → {st.base}</b>
                      <span>{st.arriveBy.travel.mode} · {fmtMins(st.arriveBy.travel.mins)} · about {yen(st.arriveBy.travel.yen)} each</span>
                      <small>{transferTip(st.arriveBy.travel)} Travel on day {st.from}.</small>
                    </div>
                  )}
                  <section className="stint">
                    <header><b>{st.base}</b><span>Day{st.days > 1 ? `s ${st.from}–${st.to}` : ` ${st.from}`}</span></header>
                    <small>{st.towns.join(' · ')}</small>
                    {st.nights === 0 ? <small className="muted">Your last day. No bed needed.</small>
                      : st.have === st.nights ? <small className="ok">✓ {st.nights} night{st.nights > 1 ? 's' : ''} booked</small>
                      : st.have > st.nights ? <small className="warnt">You have {st.have} nights here but your plan only needs {st.nights}.</small>
                      : <div className="stint-add">
                          <small className="warnt">{st.have ? `${st.have} of ${st.nights}` : `Need ${st.nights}`} night{st.nights > 1 ? 's' : ''} {st.have ? 'covered' : 'here'}</small>
                          {add && <button className="btn-soft" onClick={() => addStays([add])}>＋ Add {add.nights} night{add.nights > 1 ? 's' : ''}: {STAYS.find(x => x.id === add.stayId)?.name}</button>}
                        </div>}
                  </section>
                </div>
              ))}
              {needs.filter(n => n.add).length > 1 && <button className="btn-big" onClick={() => addStays(needs.flatMap(n => n.add ? [n.add] : []))}>Add all suggested stays</button>}
              <h3 className="s-h">Your stays</h3>
            </>
          )}
          {me.stays.length === 0 && <div className="empty-s big"><span>🛏️</span><b>No places to stay yet</b><small>Add hotels, ryokan or apartments to see the cost.</small></div>}
          {me.stays.map((c, i) => {
            const st = STAYS.find(s => s.id === c.stayId)
            if (!st) return null
            const cost = b.stays.find(x => x.choice === c)?.cost || 0
            const upd = (patch: Partial<typeof c>) => setStays(me.id, me.stays.map((s, j) => j === i ? { ...s, ...patch } : s))
            return (
              <section key={i} className="stay-card">
                <AreaPhoto area={st.area} className="stay-hero"><div className="tile-shade" /><span className="badge">{AREA_META[st.area]?.emoji} {st.area}</span></AreaPhoto>
                <div className="stay-body">
                  <b>{st.name}</b><small>{st.style} · {yen(st.yen)}{st.perPerson ? ' per person' : ' per room'} a night</small>
                  <div className="step-row"><span>Nights</span><Stepper value={c.nights} onChange={n => upd({ nights: n })} /></div>
                  {!st.perPerson && <div className="step-row"><span>People splitting the room</span><Stepper value={c.sharing} min={1} max={12} onChange={n => upd({ sharing: n })} /></div>}
                  <div className="step-row"><span>Your share</span><Money y={cost} /></div>
                  <button className="linkbtn danger" onClick={() => setStays(me.id, me.stays.filter((_, j) => j !== i))}>Remove</button>
                </div>
              </section>
            )
          })}
          <button className="btn-big" onClick={() => setStaySheet(true)}>＋ Add a place to stay</button>
        </>
      )}
      <StaysSheet open={stays} onClose={() => setStaySheet(false)} />
    </div>
  )
}
