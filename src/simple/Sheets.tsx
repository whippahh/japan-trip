import { useState } from 'react'
import { useData } from '../lib/data'
import { Avatar, Dots, Money, mapsUrl, yen } from '../components/ui'
import { ItemPhoto } from '../components/Photo'
import { areaMeta, typeEmoji } from '../components/ui'
import { itemPrice, personBreakdown } from '../lib/pricing'
import { AGE_LABEL, TIER_LABEL, type AgeGroup, type Person, type Tier } from '../lib/types'
import { applicable } from '../pages/Checklist'
import { buildRoute } from '../lib/route'
import { fmtDate } from '../lib/dates'
import { setMode } from '../lib/mode'
import { Icon, Row, Sheet, Toggle } from './kit'
import { useUI } from './ctx'

export const AGE_SHORT: Record<AgeGroup, string> = { adult: 'Adult', teen: 'Teen', child: 'Child', toddler: 'Under 6' }

export function AgePills({ value, onChange }: { value: AgeGroup; onChange: (a: AgeGroup) => void }) {
  return (
    <div className="pills">
      {(Object.keys(AGE_SHORT) as AgeGroup[]).map(a => (
        <button key={a} className={value === a ? 'on' : ''} onClick={() => onChange(a)} title={AGE_LABEL[a]}>{AGE_SHORT[a]}</button>
      ))}
    </div>
  )
}

/* ───────── Item details ───────── */
export function ItemSheet({ id, onClose }: { id: string | null; onClose: () => void }) {
  const { getItem, me, picks, togglePick, addPicks, setPickDay, membersOf, votes, setVote, personName, people } = useData()
  const item = id ? getItem(id) : undefined
  if (!item || !me) return <Sheet open={false} onClose={onClose}>{null}</Sheet>
  const meta = areaMeta(item.area)
  const mine = picks.find(k => k.person_id === me.id && k.item_id === item.id)
  const house = membersOf(me.household_id).length ? membersOf(me.household_id) : [me]
  const going = picks.filter(k => k.item_id === item.id).map(k => k.person_id)
  const others = going.filter(g => !house.some(h => h.id === g))
  const myVote = votes.find(v => v.target_id === item.id && v.person_id === me.id)?.vote
  const vs = votes.filter(v => v.target_id === item.id)
  const names = (n: number) => vs.filter(v => v.vote === n).map(v => personName(v.person_id)).join(', ')
  const maxDay = Math.max(14, ...picks.filter(k => k.person_id === me.id).map(k => k.day || 0)) + 1
  const need = item.needs ? getItem(item.needs) : undefined
  const needPicked = need ? picks.some(k => k.person_id === me.id && k.item_id === need.id) : true
  const p = item.prices
  const vbtn = (n: number, emoji: string, label: string) => (
    <button key={n} className={'vbtn' + (myVote === n ? ' on' : '')} onClick={() => setVote(item.id, me.id, myVote === n ? null : n)}>
      <span>{emoji}</span><b>{label}</b><small>{vs.filter(v => v.vote === n).length}</small>
    </button>
  )
  return (
    <Sheet open onClose={onClose} tall
      footer={
        <div className="foot-actions">
          <button className={'btn-big' + (mine ? ' done' : '')} onClick={() => togglePick(me.id, item.id)}>
            {mine ? '✓ In my trip' : '＋ Add to my trip'}
          </button>
          {house.length > 1 && house.some(h => !going.includes(h.id)) && (
            <button className="btn-soft" onClick={() => addPicks(house.map(h => h.id), item.id)}>Add whole household</button>
          )}
        </div>
      }>
      <ItemPhoto item={item} className="hero-photo">
        <div className="hero-shade" />
        <button className="round-btn floating" onClick={onClose} aria-label="Close"><Icon n="close" size={18} /></button>
        <div className="hero-text">
          <span className="badge">{meta.emoji} {item.town || item.area}</span>
          <h2>{item.name}</h2>
          <small>{typeEmoji(item.type)} {item.type}</small>
        </div>
      </ItemPhoto>
      <div className="facts">
        <div><small>Price for {me.name.split(' ')[0]}</small><Money y={itemPrice(item, me.age_group)} /></div>
        <div><small>Time</small><b>{item.hours > 0 ? (item.hours >= 1 ? `${item.hours} h` : `${item.hours * 60} min`) : '—'}</b></div>
        <div><small>Effort</small><b>{['', 'Easy', 'Moderate', 'Full-on'][item.intensity]}</b><Dots n={item.intensity} /></div>
      </div>
      <p className="lead-text">{item.blurb}</p>
      <div className="tags">
        {item.toddlerOk ? <span className="tag ok">🧒 Kid-friendly</span> : <span className="tag no">🚫 Not for young kids</span>}
        {item.adultsOnly && <span className="tag no">🔞 Adults only</span>}
        {item.verified && <span className="tag ok">✔ Price checked</span>}
        {item.kind !== 'sight' && <span className="tag">{item.kind === 'package' ? '📦 Package' : item.kind === 'pass' ? '🎟️ Pass' : '🚅 Getting there'}</span>}
      </div>
      {item.book && <div className="note-box">📅 {item.book}</div>}
      {need && !needPicked && <button className="note-box link" onClick={() => togglePick(me.id, need.id)}>＋ Also add getting there: <b>{need.name}</b> ({yen(itemPrice(need, me.age_group))})</button>}

      <h4 className="sec">Who's doing this?</h4>
      <div className="who-row">
        {house.map(h => {
          const on = going.includes(h.id)
          return (
            <button key={h.id} className={'who-chip' + (on ? ' on' : '')} onClick={() => togglePick(h.id, item.id)} title={on ? 'Tap to remove' : 'Tap to add'}>
              <Avatar name={h.name} size={30} /><span>{h.name.split(' ')[0]}</span>{on && <i>✓</i>}
            </button>
          )
        })}
      </div>
      {others.length > 0 && <p className="muted small">Also going: {others.map(personName).join(', ')}</p>}
      {others.length === 0 && people.length > house.length && <p className="muted small">Nobody else has added this yet.</p>}

      {mine && (
        <>
          <h4 className="sec">Which day?</h4>
          <div className="rail-chips">
            <button className={mine.day == null ? 'on' : ''} onClick={() => setPickDay(me.id, item.id, null)}>Not yet</button>
            {Array.from({ length: Math.min(30, maxDay) }, (_, i) => i + 1).map(d => (
              <button key={d} className={mine.day === d ? 'on' : ''} onClick={() => setPickDay(me.id, item.id, d)}>Day {d}</button>
            ))}
          </div>
        </>
      )}

      <h4 className="sec">What does the group think?</h4>
      <div className="vrow">{vbtn(1, '👍', "I'm in")}{vbtn(0, '🤔', 'Maybe')}{vbtn(-1, '👎', 'Pass')}</div>
      {(names(1) || names(-1)) && <p className="muted small">{names(1) && <>👍 {names(1)} </>}{names(0) && <>· 🤔 {names(0)} </>}{names(-1) && <>· 👎 {names(-1)}</>}</p>}

      <h4 className="sec">Prices</h4>
      <div className="plist">
        <span>Adult</span><b>{yen(p.adult ?? 0)}</b>
        {p.teen !== undefined && <><span>Teen (12–17)</span><b>{yen(p.teen)}</b></>}
        {p.child !== undefined && <><span>Child (6–11)</span><b>{yen(p.child)}</b></>}
        <span>Under 6</span><b>{yen(p.toddler ?? 0)}</b>
      </div>
      <div className="link-row">
        {item.link && <a className="btn-soft" href={item.link} target="_blank" rel="noreferrer"><Icon n="link" size={16} /> Official site</a>}
        <a className="btn-soft" href={mapsUrl(item)} target="_blank" rel="noreferrer"><Icon n="pin" size={16} /> Open in Maps</a>
      </div>
    </Sheet>
  )
}

/* ───────── Person (view + edit) ───────── */
export function PersonEditor({ p, onDone }: { p: Person; onDone: () => void }) {
  const { updatePerson, deletePerson, households, addHousehold } = useData()
  const [name, setName] = useState(p.name)
  return (
    <div className="stack">
      <label className="fld">Name<input value={name} onChange={e => setName(e.target.value)} onBlur={() => name.trim() && name !== p.name && updatePerson(p.id, { name: name.trim() })} /></label>
      <div className="fld">Age group<AgePills value={p.age_group} onChange={a => updatePerson(p.id, { age_group: a })} /></div>
      <label className="fld">Household
        <select value={p.household_id || ''} onChange={async e => {
          if (e.target.value === '__new') { const n = prompt('Name for the new household?', `${p.name}'s household`); if (n) { const h = await addHousehold(n); updatePerson(p.id, { household_id: h.id }) } return }
          updatePerson(p.id, { household_id: e.target.value || null })
        }}>
          <option value="">No household</option>
          {households.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
          <option value="__new">＋ New household…</option>
        </select>
      </label>
      <div className="two">
        <label className="fld">Arrives<input type="date" value={p.arrive || ''} onChange={e => updatePerson(p.id, { arrive: e.target.value || null })} /></label>
        <label className="fld">Leaves<input type="date" value={p.depart || ''} onChange={e => updatePerson(p.id, { depart: e.target.value || null })} /></label>
      </div>
      <div className="fld">Eating style
        <div className="pills">{(Object.keys(TIER_LABEL) as Tier[]).map(t => <button key={t} className={p.tier === t ? 'on' : ''} onClick={() => updatePerson(p.id, { tier: t })}>{TIER_LABEL[t]}</button>)}</div>
      </div>
      <button className="btn-danger" onClick={async () => { if (confirm(`Remove ${p.name} from the trip? Their picks and ticks go too.`)) { await deletePerson(p.id); onDone() } }}>Remove {p.name.split(' ')[0]}</button>
    </div>
  )
}

export function PersonSheet({ id, onClose }: { id: string | null; onClose: () => void }) {
  const { people, me, setMe, picks, checks, getItem, getStay, householdOf } = useData()
  const [edit, setEdit] = useState(false)
  const ui = useUI()
  const p = people.find(x => x.id === id)
  if (!p) return <Sheet open={false} onClose={onClose}>{null}</Sheet>
  const b = personBreakdown(p, picks, getItem, getStay)
  const r = buildRoute(p.id, picks, getItem)
  const todo = applicable(p)
  const done = todo.filter(c => checks.some(x => x.person_id === p.id && x.key === c.key && x.done)).length
  const days = [...new Set(r.stops.map(s => s.day))]
  const unsched = picks.filter(k => k.person_id === p.id && k.day == null).map(k => getItem(k.item_id)).filter(Boolean)
  return (
    <Sheet open onClose={() => { setEdit(false); onClose() }} title={p.name} tall>
      <div className="person-head">
        <Avatar name={p.name} size={64} />
        <div>
          <b>{householdOf(p)?.name || 'No household'}</b>
          <small>{AGE_LABEL[p.age_group]}{p.arrive ? ` · ${fmtDate(p.arrive)}${p.depart ? ' → ' + fmtDate(p.depart) : ''}` : ''}</small>
        </div>
      </div>
      <div className="facts">
        <div><small>Estimate</small><Money y={b.total} /></div>
        <div><small>Ready</small><b>{done}/{todo.length}</b></div>
        <div><small>Picks</small><b>{picks.filter(k => k.person_id === p.id).length}</b></div>
      </div>
      <div className="link-row">
        {me?.id !== p.id && <button className="btn-soft" onClick={() => { setMe(p.id); onClose() }}>Plan as {p.name.split(' ')[0]}</button>}
        <button className="btn-soft" onClick={() => setEdit(!edit)}>{edit ? 'Done editing' : 'Edit details'}</button>
      </div>
      {edit ? <PersonEditor p={p} onDone={() => { setEdit(false); onClose() }} /> : (
        <>
          <h4 className="sec">Itinerary</h4>
          {days.length === 0 && unsched.length === 0 && <p className="muted">Nothing planned yet.</p>}
          {days.map(d => (
            <div key={d} className="mini-day">
              <b>Day {d}</b>
              {r.stops.filter(s => s.day === d).map(s => <button key={s.n} className="mini-stop" onClick={() => ui.openItem(s.item.id)}>{s.n}. {s.item.name}<small>{s.item.town}</small></button>)}
            </div>
          ))}
          {unsched.length > 0 && (
            <div className="mini-day"><b>Not scheduled</b>
              {unsched.map(i => <button key={i!.id} className="mini-stop" onClick={() => ui.openItem(i!.id)}>{i!.name}<small>{i!.town}</small></button>)}
            </div>
          )}
        </>
      )}
    </Sheet>
  )
}

/* ───────── Me / settings ───────── */
export function ProfileSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { me, setMe, people, households, rate, setRate, shared } = useData()
  const ui = useUI()
  if (!me) return null
  const mine = people.filter(p => p.household_id === me.household_id && me.household_id)
  const hh = households.find(h => h.id === me.household_id)
  return (
    <Sheet open={open} onClose={onClose} title="You" tall>
      <div className="person-head">
        <Avatar name={me.name} size={64} />
        <div><b>{me.name}</b><small>{hh?.name || 'No household'} · {AGE_LABEL[me.age_group]}</small></div>
      </div>
      {mine.length > 1 && (
        <>
          <h4 className="sec">Planning as</h4>
          <p className="muted small">Parents can switch to a kid's profile to plan for them.</p>
          <div className="who-row">
            {mine.map(p => (
              <button key={p.id} className={'who-chip' + (p.id === me.id ? ' on' : '')} onClick={() => setMe(p.id)}><Avatar name={p.name} size={30} /><span>{p.name.split(' ')[0]}</span></button>
            ))}
          </div>
        </>
      )}
      <div className="group">
        <Row icon="👨‍👩‍👧" title="My household" sub="Add or edit who's with you" chevron onClick={() => { onClose(); ui.go('#/group') }} />
        <Row icon="✏️" title="Edit my details" sub="Dates, eating style, age group" chevron onClick={() => { onClose(); ui.openPerson(me.id) }} />
        <Row icon="🎬" title="Replay the walkthrough" chevron onClick={() => { onClose(); ui.openTour() }} />
      </div>
      <div className="group">
        <Row icon="⚙️" title="Advanced mode" sub="The full dense version: tables, calculator, every filter" right={<Toggle on={false} onChange={() => setMode('advanced')} label="Advanced mode" />} />
        <Row icon="💴" title="Yen per A$1" right={<input className="rate-in" type="number" min={50} max={300} value={rate} onChange={e => setRate(Number(e.target.value))} />} />
      </div>
      <button className="btn-soft wide" onClick={() => { setMe(null); onClose() }}>Not {me.name.split(' ')[0]}? Switch person</button>
      <p className="muted small center">{shared ? 'Shared with everyone who has the link.' : 'Demo mode: saved only in this browser.'} Please never put passport numbers or card details here. Photos from Wikipedia/Wikimedia Commons. Map tiles © Esri, HERE, Garmin, OpenStreetMap contributors.</p>
    </Sheet>
  )
}
