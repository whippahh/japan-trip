import { useData } from '../lib/data'
import { CHECKLIST } from '../data/checklist'
import { Avatar } from '../components/ui'
import { useState } from 'react'
import type { Person } from '../lib/types'

export function applicable(p: Person) { return CHECKLIST.filter(c => !c.who || c.who.includes(p.age_group)) }

export function CheckCard({ p }: { p: Person }) {
  const { checks, toggleCheck } = useData()
  const items = applicable(p)
  const done = items.filter(c => checks.some(x => x.person_id === p.id && x.key === c.key && x.done)).length
  return (
    <div className="card pad checkcard">
      <div className="chead"><Avatar name={p.name} /> <b>{p.name}</b> <span className="muted small">{done}/{items.length}</span></div>
      <div className="bar"><i style={{ width: `${items.length ? (done / items.length) * 100 : 0}%` }} /></div>
      {items.map(c => {
        const on = checks.some(x => x.person_id === p.id && x.key === c.key && x.done)
        return (
          <label key={c.key} className={'tick' + (on ? ' done' : '')} title={c.note}>
            <input type="checkbox" checked={on} onChange={() => toggleCheck(p.id, c.key)} /> <span>{c.label}</span>
          </label>
        )
      })}
    </div>
  )
}

export default function Checklist() {
  const { people, households, checks } = useData()
  const [onlyOpen, setOnlyOpen] = useState(false)
  const passportReady = people.filter(p => checks.some(c => c.person_id === p.id && c.key === 'passport' && c.done)).length
  const groups = [
    ...households.map(h => ({ name: h.name, members: people.filter(p => p.household_id === h.id) })),
    { name: 'No household', members: people.filter(p => !p.household_id) },
  ].filter(g => g.members.length)
  const isOpen = (p: Person) => applicable(p).some(c => !checks.some(x => x.person_id === p.id && x.key === c.key && x.done))
  return (
    <div className="page">
      <h1>Ready to go?</h1>
      <div className="stats">
        <div className="stat"><b>{passportReady}/{people.length}</b><span>passports ready</span></div>
      </div>
      <p className="muted">Tick things off for yourself, or switch person at the top (or tick here) for someone in your household. These are just yes/no ticks. Never type passport numbers.</p>
      <label className="check"><input type="checkbox" checked={onlyOpen} onChange={e => setOnlyOpen(e.target.checked)} /> Only show people with things left to do</label>
      {groups.map(g => (
        <section key={g.name}>
          <h2>{g.name}</h2>
          <div className="grid">{g.members.filter(p => !onlyOpen || isOpen(p)).map(p => <CheckCard key={p.id} p={p} />)}</div>
        </section>
      ))}
    </div>
  )
}
