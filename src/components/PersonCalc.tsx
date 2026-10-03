import { useData } from '../lib/data'
import { personBreakdown, tripNights, TIER_FOOD } from '../lib/pricing'
import { Money, yen } from './ui'
import { STAYS } from '../data/stays'
import { AREAS } from '../data/meta'
import { TIER_LABEL, type Person, type Tier } from '../lib/types'

export function useBreakdown(p: Person) {
  const { picks, getItem, getStay } = useData()
  return personBreakdown(p, picks, getItem, getStay)
}

export default function PersonCalc({ person }: { person: Person }) {
  const { updatePerson, setStays, togglePick, setPickDay } = useData()
  const b = useBreakdown(person)
  const nights = tripNights(person)

  const addStay = (id: string) => {
    const s = STAYS.find(x => x.id === id)
    if (!s) return
    setStays(person.id, [...person.stays, { stayId: id, nights: 3, sharing: s.capacity }])
  }
  const editStay = (i: number, patch: Partial<{ nights: number; sharing: number }>) =>
    setStays(person.id, person.stays.map((s, j) => j === i ? { ...s, ...patch } : s))
  const delStay = (i: number) => setStays(person.id, person.stays.filter((_, j) => j !== i))

  return (
    <div className="calc">
      <section className="card pad">
        <h3>1 · Your trip dates</h3>
        <div className="row">
          <label>Arrive <input type="date" value={person.arrive || ''} onChange={e => updatePerson(person.id, { arrive: e.target.value || null })} /></label>
          <label>Depart <input type="date" value={person.depart || ''} onChange={e => updatePerson(person.id, { depart: e.target.value || null })} /></label>
          <div className="nights"><b>{nights}</b> night{nights === 1 ? '' : 's'}</div>
        </div>
        <p className="muted small">Not sure of dates yet? Skip them and we'll use the nights you add under Accommodation.</p>
        <label>Eating style
          <select value={person.tier} onChange={e => updatePerson(person.id, { tier: e.target.value as Tier })}>
            {(Object.keys(TIER_LABEL) as Tier[]).map(t => <option key={t} value={t}>{TIER_LABEL[t]} (~{yen(TIER_FOOD[t])}/day adult)</option>)}
          </select>
        </label>
      </section>

      <section className="card pad">
        <h3>2 · Accommodation</h3>
        {person.stays.length === 0 && <p className="muted">Nothing added yet.</p>}
        {person.stays.map((c, i) => {
          const row = b.stays.find(x => x.choice === c)
          const stay = STAYS.find(s => s.id === c.stayId)
          if (!stay) return null
          return (
            <div className="stayrow" key={i}>
              <div>
                <b>{stay.name}</b> <span className="muted small">· {stay.area} · {stay.perPerson ? `${yen(stay.yen)}/person/night` : `${yen(stay.yen)}/room/night`}</span>
                <div className="muted small">{stay.blurb}</div>
              </div>
              <label className="mini">Nights <input type="number" min={0} value={c.nights} onChange={e => editStay(i, { nights: Math.max(0, Number(e.target.value)) })} /></label>
              {!stay.perPerson && <label className="mini" title="How many people split this room's cost">Sharing <input type="number" min={1} max={12} value={c.sharing} onChange={e => editStay(i, { sharing: Math.max(1, Number(e.target.value)) })} /></label>}
              <Money y={row?.cost || 0} />
              <button className="btn btn-ghost small" onClick={() => delStay(i)}>✕</button>
            </div>
          )
        })}
        <select value="" onChange={e => addStay(e.target.value)}>
          <option value="">+ Add accommodation…</option>
          {[...AREAS].filter(a => STAYS.some(s => s.area === a)).map(a => (
            <optgroup key={a} label={a}>
              {STAYS.filter(s => s.area === a).map(s => <option key={s.id} value={s.id}>{s.name} — {yen(s.yen)}{s.perPerson ? '/pp' : '/room'}</option>)}
            </optgroup>
          ))}
        </select>
      </section>

      <section className="card pad">
        <h3>3 · Activities <small>{b.activities.length}</small></h3>
        {b.activities.length === 0 ? <p className="muted">Pick things on the <a href="#/explore">Explore</a> page and they appear here.</p> : (
          <table className="tbl">
            <thead><tr><th>Activity</th><th>Day</th><th className="r">Cost</th><th /></tr></thead>
            <tbody>
              {b.activities.map(a => (
                <tr key={a.item.id}>
                  <td>{a.item.name}<div className="muted small">{a.item.area}{a.item.town ? ' · ' + a.item.town : ''}</div></td>
                  <td>
                    <select value={a.day ?? ''} onChange={e => setPickDay(person.id, a.item.id, e.target.value ? Number(e.target.value) : null)}>
                      <option value="">Unscheduled</option>
                      {Array.from({ length: 30 }, (_, i) => i + 1).map(d => <option key={d} value={d}>Day {d}</option>)}
                    </select>
                  </td>
                  <td className="r">{yen(a.price)}</td>
                  <td><button className="btn btn-ghost small" onClick={() => togglePick(person.id, a.item.id)}>✕</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="card pad total">
        <h3>Estimated total for {person.name}</h3>
        <table className="tbl">
          <tbody>
            <tr><td>Sights & activities</td><td className="r">{yen(b.sights)}</td></tr>
            <tr><td>Accommodation</td><td className="r">{yen(b.accommodation)}</td></tr>
            <tr><td>Food ({b.days} days)</td><td className="r">{yen(b.food)}</td></tr>
            <tr><td>Local transport ({b.days} days)</td><td className="r">{yen(b.transport)}</td></tr>
          </tbody>
          <tfoot><tr><td><b>Total (excl. flights)</b></td><td className="r"><Money y={b.total} big /></td></tr></tfoot>
        </table>
        {b.warnings.map(w => <p key={w} className="warn-line">⚠ {w}</p>)}
        <p className="muted small">Little ones: room share is free; set "Sharing" to the number of paying people. Flights, shopping, souvenirs and insurance are not included.</p>
      </section>
    </div>
  )
}
