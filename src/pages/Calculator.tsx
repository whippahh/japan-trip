import { useState } from 'react'
import { useData } from '../lib/data'
import PersonCalc from '../components/PersonCalc'
import { PersonSelect, Money, Avatar } from '../components/ui'
import { personBreakdown } from '../lib/pricing'

export default function Calculator() {
  const { me, people, households, picks, getItem, getStay } = useData()
  const [pid, setPid] = useState(me!.id)
  const person = people.find(p => p.id === pid) || me!
  const total = (id: string) => { const p = people.find(x => x.id === id)!; return personBreakdown(p, picks, getItem, getStay).total }
  const groups = households.map(h => ({ h, members: people.filter(p => p.household_id === h.id) })).filter(g => g.members.length)
  const loose = people.filter(p => !p.household_id)
  const grand = people.reduce((n, p) => n + total(p.id), 0)

  return (
    <div className="page">
      <h1>Trip calculator</h1>
      <div className="row"><label>Planning for <PersonSelect value={person.id} onChange={setPid} /></label></div>
      <div className="cols">
        <PersonCalc person={person} />
        <aside className="card pad sticky">
          <h3>Household totals</h3>
          {groups.map(({ h, members }) => (
            <div key={h.id} className="hh">
              <div className="hhname">{h.name} <Money y={members.reduce((n, p) => n + total(p.id), 0)} /></div>
              {members.map(p => (
                <button key={p.id} className={'prow' + (p.id === person.id ? ' on' : '')} onClick={() => setPid(p.id)}>
                  <Avatar name={p.name} size={20} /> <span>{p.name}</span> <b>¥{Math.round(total(p.id)).toLocaleString()}</b>
                </button>
              ))}
            </div>
          ))}
          {loose.map(p => (
            <button key={p.id} className="prow" onClick={() => setPid(p.id)}><Avatar name={p.name} size={20} /> <span>{p.name}</span> <b>¥{Math.round(total(p.id)).toLocaleString()}</b></button>
          ))}
          <div className="grand">Whole group <Money y={grand} big /></div>
        </aside>
      </div>
    </div>
  )
}
