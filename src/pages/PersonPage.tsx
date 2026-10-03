import { cleanNotes, getFlights, withFlights } from '../lib/flights'
import { useData } from '../lib/data'
import { useBreakdown } from '../components/PersonCalc'
import { Avatar, Money, yen } from '../components/ui'
import { CheckCard } from './Checklist'
import { AGE_LABEL, TIER_LABEL, type AgeGroup, type Person, type Tier } from '../lib/types'

export default function PersonPage({ id }: { id: string }) {
  const { people } = useData()
  const p = people.find(x => x.id === id)
  if (!p) return <div className="page"><div className="empty">Person not found. <a href="#/people">Back to everyone</a></div></div>
  return <PersonInner key={p.id} p={p} />
}

function PersonInner({ p }: { p: Person }) {
  const { households, updatePerson, deletePerson, householdOf, setPickDay, setMe, me, membersOf } = useData()
    const b = useBreakdown(p)
    const days = new Map<number | null, typeof b.activities>()
    b.activities.forEach(a => { const k = a.day; days.set(k, [...(days.get(k) || []), a]) })
    const order = [...days.keys()].sort((x, y) => (x === null ? 1 : y === null ? -1 : x - y))
    const hh = householdOf(p)
    return (
      <div className="page">
        <a href="#/people" className="back">← Everyone</a>
        <div className="phead">
          <Avatar name={p.name} size={56} />
          <div>
            <input className="inline h1" defaultValue={p.name} onBlur={e => e.target.value.trim() && updatePerson(p.id, { name: e.target.value.trim() })} />
            <div className="muted">{AGE_LABEL[p.age_group]} · {hh ? hh.name : 'No household'} · {b.nights} nights</div>
          </div>
          {p.id !== me?.id && <button className="btn btn-primary" onClick={() => setMe(p.id)}>Act as {p.name}</button>}
          <Money y={b.total} big />
        </div>

        <div className="cols2">
          <section className="card pad">
            <h3>Details</h3>
            <div className="form">
              <label>Age group <select value={p.age_group} onChange={e => updatePerson(p.id, { age_group: e.target.value as AgeGroup })}>{(Object.keys(AGE_LABEL) as AgeGroup[]).map(a => <option key={a} value={a}>{AGE_LABEL[a]}</option>)}</select></label>
              <label>Household <select value={p.household_id || ''} onChange={e => updatePerson(p.id, { household_id: e.target.value || null })}><option value="">None</option>{households.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}</select></label>
              <label>Arrive <input type="date" value={p.arrive || ''} onChange={e => updatePerson(p.id, { arrive: e.target.value || null })} /></label>
              <label>Depart <input type="date" value={p.depart || ''} onChange={e => updatePerson(p.id, { depart: e.target.value || null })} /></label>
              <label>Eating style <select value={p.tier} onChange={e => updatePerson(p.id, { tier: e.target.value as Tier })}>{(Object.keys(TIER_LABEL) as Tier[]).map(t => <option key={t} value={t}>{TIER_LABEL[t]}</option>)}</select></label>
            </div>
            <textarea placeholder="Notes (dietary needs, mobility, anything the group should know)" defaultValue={cleanNotes(p.notes)} onBlur={e => updatePerson(p.id, { notes: withFlights(e.target.value, getFlights(p.notes)) })} />
            <p className="small muted">Open <a href="#/calc">the calculator</a> to change accommodation and activities for {p.name}.</p>
            <button className="linklike danger" onClick={() => confirm(`Remove ${p.name} from the trip? Their picks and votes are deleted.`) && (deletePerson(p.id), (location.hash = '#/people'))}>Remove {p.name}</button>
            {membersOf(p.household_id).length > 1 && <p className="muted small">Household: {membersOf(p.household_id).map(m => m.name).join(', ')}</p>}
          </section>
          <CheckCard p={p} />
        </div>

        <section className="card pad">
          <h3>Itinerary</h3>
          {b.stays.length > 0 && <p className="small"><b>Staying:</b> {b.stays.map(s => `${s.stay.name} (${s.stay.area}, ${s.choice.nights}n)`).join(' → ')}</p>}
          {order.length === 0 ? <p className="muted">No activities picked yet.</p> : order.map(d => (
            <div key={String(d)} className="day">
              <h4>{d === null ? 'Unscheduled' : `Day ${d}`}</h4>
              {days.get(d)!.map(a => (
                <div key={a.item.id} className="dayrow">
                  <span>{a.item.name} <span className="muted small">· {a.item.town || a.item.area}</span></span>
                  <span className="small">{yen(a.price)}</span>
                  <select value={a.day ?? ''} onChange={e => setPickDay(p.id, a.item.id, e.target.value ? Number(e.target.value) : null)}>
                    <option value="">Unscheduled</option>
                    {Array.from({ length: 30 }, (_, i) => i + 1).map(n => <option key={n} value={n}>Day {n}</option>)}
                  </select>
                </div>
              ))}
            </div>
          ))}
        </section>
      </div>
    )
}
