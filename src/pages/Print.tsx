import { useMemo } from 'react'
import { useData } from '../lib/data'
import { buildRoute, travelLabel } from '../lib/route'
import { personBreakdown, tripNights } from '../lib/pricing'
import { stintsFor, transferTip } from '../lib/stayplan'
import { seasonTips } from '../lib/season'
import { getFlights, cleanNotes } from '../lib/flights'
import { addDays, fmtDate } from '../lib/dates'
import { fmtMins } from '../data/geo'
import { STAYS } from '../data/stays'
import { yen } from '../components/ui'
import './print.css'

/** Printable itinerary, one page per person. #/print = my household, #/print/all = everyone, #/print/<id> = one person. */
export default function Print({ which }: { which?: string }) {
  const { me, people, picks, getItem, getStay, membersOf } = useData()
  const list = useMemo(() => {
    if (!me) return []
    if (which === 'all') return people
    const one = which && people.find(p => p.id === which)
    if (one) return [one]
    const m = membersOf(me.household_id)
    return m.length ? m : [me]
  }, [me, people, which, membersOf])
  if (!me) return null
  return (
    <div className="print-root">
      <div className="no-print print-bar">
        <a href="#/trip/plan">‹ Back</a>
        <span>{list.length} itinerary page{list.length === 1 ? '' : 's'}</span>
        <button onClick={() => window.print()}>Print or save as PDF</button>
      </div>
      {list.map(p => <Sheet key={p.id} id={p.id} />)}
    </div>
  )
}

function Sheet({ id }: { id: string }) {
  const { people, picks, getItem, getStay } = useData()
  const p = people.find(x => x.id === id)!
  const route = buildRoute(p.id, picks, getItem)
  const b = personBreakdown(p, picks, getItem, getStay)
  const stints = stintsFor(p, picks, getItem)
  const tips = seasonTips(p.arrive, p.depart)
  const days = [...new Set(route.stops.map(s => s.day))].sort((a, c) => a - c)
  const flights = getFlights(p.notes)
  const note = cleanNotes(p.notes)
  return (
    <article className="print-page">
      <header>
        <h1>🗾 {p.name}'s Japan trip</h1>
        <p>{p.arrive ? `${fmtDate(p.arrive, true)}${p.depart ? ' to ' + fmtDate(p.depart, true) : ''} · ${tripNights(p)} nights` : 'Dates not set yet'}</p>
      </header>
      {tips.length > 0 && <section><h2>Season notes</h2><ul>{tips.map(t => <li key={t.title}><b>{t.emoji} {t.title}.</b> {t.text}</li>)}</ul></section>}
      {stints.length > 0 && (
        <section><h2>Where you sleep</h2>
          <table><tbody>
            {stints.map((s, i) => (
              <tr key={s.from}>
                <td><b>{s.base}</b></td><td>Day{s.days > 1 ? `s ${s.from}–${s.to}` : ` ${s.from}`}</td>
                <td>{s.nights ? `${s.nights} night${s.nights > 1 ? 's' : ''}` : 'last day'}</td>
                <td>{s.arriveBy ? `${s.arriveBy.from} → ${s.base}: ${s.arriveBy.travel.mode}, ${fmtMins(s.arriveBy.travel.mins)}, ~${yen(s.arriveBy.travel.yen)}` : (i === 0 ? 'Arrive' : '')}</td>
              </tr>
            ))}
          </tbody></table>
          {p.stays.length > 0 && <ul>{p.stays.map((c, i) => <li key={i}>{STAYS.find(x => x.id === c.stayId)?.name} ({STAYS.find(x => x.id === c.stayId)?.area}) · {c.nights} night{c.nights > 1 ? 's' : ''}</li>)}</ul>}
        </section>
      )}
      <section><h2>Day by day</h2>
        {days.length === 0 && <p className="muted">No days planned yet.</p>}
        {days.map(d => (
          <div key={d} className="pday">
            <h3>Day {d}{p.arrive ? ` · ${fmtDate(addDays(p.arrive, d - 1))}` : ''}</h3>
            <ol>
              {route.stops.filter(s => s.day === d).map(s => (
                <li key={s.n}>
                  {s.travel && s.travel.mode !== 'Walk' && <i>{travelLabel(s.travel)}</i>}
                  {s.transit.map(t => <i key={t.id}>{t.name}</i>)}
                  <b>{s.item.name}</b> <span className="muted">{s.item.town || s.item.area}{s.item.hours ? ` · ~${s.item.hours}h` : ''}</span>
                </li>
              ))}
            </ol>
          </div>
        ))}
      </section>
      <section><h2>Budget estimate</h2>
        <table><tbody>
          <tr><td>Sights</td><td>{yen(b.sights)}</td></tr><tr><td>Stays</td><td>{yen(b.accommodation)}</td></tr>
          <tr><td>Food</td><td>{yen(b.food)}</td></tr><tr><td>Local transport</td><td>{yen(b.transport)}</td></tr>
          {flights > 0 && <tr><td>Flights</td><td>{yen(flights)}</td></tr>}
          <tr className="tot"><td>Total</td><td>{yen(b.total + flights)}</td></tr>
        </tbody></table>
        <p className="muted">Approximate. Between-town trains are shown above and are not in the total unless covered by a pass you picked.</p>
      </section>
      {note && <section><h2>Notes</h2><p>{note}</p></section>}
    </article>
  )
}
