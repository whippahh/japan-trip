import { useMemo, useState } from 'react'
import { useData } from '../lib/data'
import { PLANS, defaultSelection, expandPlan, virtualPerson, type Plan } from '../data/plans'
import { Money, typeEmoji, yen } from '../components/ui'
import { personBreakdown } from '../lib/pricing'
import { TIER_LABEL, type Tier } from '../lib/types'

const STYLE: Record<Tier, string> = { budget: 'Budget (hostels / business hotels)', mid: 'Mid-range (family apartments / 3-star)', splurge: 'Splurge (luxury / private onsen ryokan)' }

export function planEstimate(plan: Plan, getItem: any, getStay: any) {
  const ex = expandPlan(plan, { tier: plan.tier, nights: {}, selected: defaultSelection(plan), sharing: () => 2 })
  const { person, picks } = virtualPerson(plan, ex, plan.tier)
  return personBreakdown({ ...person, arrive: '2027-01-01', depart: `2027-01-${String(1 + ex.nights).padStart(2, '0')}` }, picks, getItem, getStay).total
}

function PlanCard({ plan, onOpen }: { plan: Plan; onOpen: () => void }) {
  const { getItem, getStay } = useData()
  const est = useMemo(() => {
    const ex = expandPlan(plan, { tier: plan.tier, nights: {}, selected: defaultSelection(plan), sharing: () => 2 })
    const { person, picks } = virtualPerson(plan, ex, plan.tier)
    return personBreakdown({ ...person, arrive: '2027-01-01', depart: `2027-01-${String(1 + ex.nights).padStart(2, '0')}` }, picks, getItem, getStay).total
  }, [plan, getItem, getStay])
  const total = plan.stops.reduce((n, s) => n + s.nights, 0)
  return (
    <article className="card plan">
      <div className="band" style={{ background: 'var(--ink)' }}><span>{total} nights</span><span>{TIER_LABEL[plan.tier]}</span></div>
      <div className="body">
        <h3>{plan.name}</h3>
        <div className="route">{plan.stops.map((s, i) => <span key={s.id}>{i > 0 && <i>→</i>}<b>{s.label}</b> <small>{s.nights}n</small></span>)}</div>
        <p className="blurb">{plan.tagline}</p>
        <p className="small muted">Suits: {plan.suits}</p>
        <div className="meta"><Money y={est} /><span className="muted small">per adult, excl. flights, sharing a room</span></div>
        <button className="btn btn-primary" onClick={onOpen}>Customise & use this plan</button>
      </div>
    </article>
  )
}

export function Customise({ plan, onClose, onApplied }: { plan: Plan; onClose: () => void; onApplied?: () => void }) {
  const { me, people, membersOf, getItem, getStay, setPlan, picks } = useData()
  const [tier, setTier] = useState<Tier>(plan.tier)
  const [nights, setNights] = useState<Record<string, number>>(() => Object.fromEntries(plan.stops.map(s => [s.id, s.nights])))
  const [sel, setSel] = useState<Set<string>>(() => defaultSelection(plan))
  const [who, setWho] = useState<'me' | 'household' | 'all'>('me')
  const [replace, setReplace] = useState(true)
  const [start, setStart] = useState('')
  const [busy, setBusy] = useState(false)

  const targets = who === 'me' ? [me!] : who === 'household' ? membersOf(me!.household_id) : people
  const paying = (hid: string | null) => Math.max(1, (hid ? people.filter(p => p.household_id === hid) : [me!]).filter(p => p.age_group !== 'toddler').length)
  const ex = expandPlan(plan, { tier, nights, selected: sel, sharing: () => paying(me!.household_id) })
  const est = (() => {
    const e2 = expandPlan(plan, { tier, nights, selected: sel, sharing: () => 2 })
    const { person, picks: pk } = virtualPerson(plan, e2, tier)
    const end = new Date(Date.UTC(2027, 0, 1 + e2.nights)).toISOString().slice(0, 10)
    return personBreakdown({ ...person, arrive: '2027-01-01', depart: end }, pk, getItem, getStay).total
  })()
  const toggle = (k: string) => { const n = new Set(sel); n.has(k) ? n.delete(k) : n.add(k); setSel(n) }

  const apply = async () => {
    setBusy(true)
    for (const p of targets) {
      const e = expandPlan(plan, { tier, nights, selected: sel, sharing: () => paying(p.household_id) })
      const keepAdults = e.picks.filter(x => !(p.age_group === 'toddler' && getItem(x.item_id)?.adultsOnly))
      const existing = picks.filter(k => k.person_id === p.id).length
      const patch: Record<string, unknown> = { tier }
      if (start) {
        patch.arrive = start
        patch.depart = new Date(Date.UTC(+start.slice(0, 4), +start.slice(5, 7) - 1, +start.slice(8, 10) + e.nights)).toISOString().slice(0, 10)
      }
      await setPlan(p.id, { picks: keepAdults, stays: replace || !existing ? e.stays : [...p.stays, ...e.stays], replace, patch })
    }
    setBusy(false)
    if (onApplied) onApplied(); else location.hash = '#/map'
  }

  return (
    <section className="card pad customise">
      <div className="row between"><h2>{plan.name}</h2><button className="btn btn-ghost small" onClick={onClose}>Close</button></div>
      <p className="muted">{plan.tagline}. Change nights, accommodation style and attractions, then apply it. Everything stays editable afterwards.</p>
      <div className="form">
        <label>Accommodation style
          <select value={tier} onChange={e => setTier(e.target.value as Tier)}>{(Object.keys(STYLE) as Tier[]).map(t => <option key={t} value={t}>{STYLE[t]}</option>)}</select>
        </label>
        <label>First night (optional)<input type="date" value={start} onChange={e => setStart(e.target.value)} /></label>
        <label>Apply to
          <select value={who} onChange={e => setWho(e.target.value as any)}>
            <option value="me">Just {me!.name}</option>
            <option value="household">My household ({membersOf(me!.household_id).length})</option>
            <option value="all">Everyone ({people.length})</option>
          </select>
        </label>
        <label className="check"><input type="checkbox" checked={replace} onChange={e => setReplace(e.target.checked)} /> Replace existing picks and accommodation</label>
      </div>
      <div className="stops">
        {plan.stops.map((s, idx) => {
          const span = ex.spans[idx]
          return (
            <div key={s.id} className="stop">
              <div className="stophead">
                <span className="pill">{idx + 1}</span> <b>{s.label}</b>
                <label className="mini">Nights <input type="number" min={0} max={14} value={nights[s.id]} onChange={e => setNights({ ...nights, [s.id]: Math.max(0, Number(e.target.value)) })} /></label>
                <span className="muted small">days {span.from}–{span.to}</span>
              </div>
              <p className="muted small">{s.note}</p>
              <div className="picklist">
                {s.items.map(i => {
                  const item = getItem(i.id)!
                  const k = `${s.id}:${i.id}`
                  return (
                    <label key={k} className={'check opt' + (sel.has(k) ? ' on' : '')}>
                      <input type="checkbox" checked={sel.has(k)} onChange={() => toggle(k)} />
                      <span>{typeEmoji(item.type)} {item.name}</span>
                      <small className="muted">day {span.from + Math.min(i.d, span.to - span.from)}{i.opt ? ' · optional' : ''}{item.prices.adult ? ` · ${yen(item.prices.adult)}` : ''}</small>
                    </label>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
      <div className="applybar">
        <div><b>{ex.nights} nights</b> · {ex.picks.length} activities · <Money y={est} /> <span className="muted small">per adult (excl. flights)</span></div>
        <button className="btn btn-primary" disabled={busy} onClick={apply}>{busy ? 'Applying…' : `Apply to ${targets.length === 1 ? targets[0].name : targets.length + ' people'}`}</button>
      </div>
    </section>
  )
}

export default function Plans() {
  const [open, setOpen] = useState<string | null>(null)
  const plan = PLANS.find(p => p.id === open)
  return (
    <div className="page">
      <h1>Ready-made routes</h1>
      <p className="muted">Each plan is a single clean line (fly into Tokyo, out of Osaka) with set nights per town, so nobody zig-zags. Pick one, tweak the attractions, and it becomes your own editable itinerary and shows on the <a href="#/map">route map</a>.</p>
      {plan && <Customise key={plan.id} plan={plan} onClose={() => setOpen(null)} />}
      <div className="grid">{PLANS.map(p => <PlanCard key={p.id} plan={p} onOpen={() => { setOpen(p.id); window.scrollTo(0, 0) }} />)}</div>
      <div className="card pad">
        <h3>Why a single line?</h3>
        <ul className="plain">
          <li>Shinkansen legs are about ¥13,000–14,700 each way. Doubling back costs money and a day.</li>
          <li>Flying into one city and out of another (open-jaw) is usually the same price as a return.</li>
          <li>Day trips (Nara, Kamakura, Nikko) hang off a base town, so they don't count as backtracking.</li>
          <li>Different people can still choose different <i>attractions</i> within each town, as long as the towns and nights match.</li>
        </ul>
      </div>
    </div>
  )
}
