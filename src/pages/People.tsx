import { useState } from 'react'
import { useData } from '../lib/data'
import { Avatar, Money, PersonSelect } from '../components/ui'
import { personBreakdown } from '../lib/pricing'
import { AGE_LABEL, type AgeGroup } from '../lib/types'

export default function People() {
  const { people, households, picks, getItem, getStay, addPerson, addHousehold, renameHousehold, setMe, me } = useData()
  const [name, setName] = useState('')
  const [age, setAge] = useState<AgeGroup>('adult')
  const [hid, setHid] = useState(me?.household_id || '')
  const [hhName, setHhName] = useState('')
  const total = (id: string) => personBreakdown(people.find(p => p.id === id)!, picks, getItem, getStay).total
  const loose = people.filter(p => !p.household_id)

  const add = async () => {
    if (!name.trim()) return
    await addPerson({ name, household_id: hid || null, age_group: age })
    setName('')
  }
  const addHh = async () => { if (!hhName.trim()) return; const h = await addHousehold(hhName); setHid(h.id); setHhName('') }

  return (
    <div className="page">
      <h1>Who's coming <small>{people.length} people · {households.length} households</small></h1>
      <section className="card pad">
        <h3>Add a person</h3>
        <p className="muted small">Add family members who won't use the site (kids, grandparents) so they're counted. You can then act as them from the top bar.</p>
        <div className="form">
          <input placeholder="Name" value={name} onChange={e => setName(e.target.value)} />
          <select value={age} onChange={e => setAge(e.target.value as AgeGroup)}>{(Object.keys(AGE_LABEL) as AgeGroup[]).map(a => <option key={a} value={a}>{AGE_LABEL[a]}</option>)}</select>
          <select value={hid} onChange={e => setHid(e.target.value)}><option value="">No household</option>{households.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}</select>
          <button className="btn btn-primary" disabled={!name.trim()} onClick={add}>Add</button>
        </div>
        <div className="form"><input placeholder="…or create a new household" value={hhName} onChange={e => setHhName(e.target.value)} /><button className="btn btn-ghost" disabled={!hhName.trim()} onClick={addHh}>Create household</button></div>
      </section>

      <div className="grid">
        {[...households.map(h => ({ h, members: people.filter(p => p.household_id === h.id) })), ...(loose.length ? [{ h: null, members: loose }] : [])].map(({ h, members }) => (
          <section key={h?.id || 'none'} className="card pad hh">
            <div className="hhname">
              {h ? <input className="inline" defaultValue={h.name} onBlur={e => e.target.value.trim() && e.target.value !== h.name && renameHousehold(h.id, e.target.value.trim())} /> : 'No household'}
              <Money y={members.reduce((n, p) => n + total(p.id), 0)} />
            </div>
            {members.length === 0 && <p className="muted small">Empty household.</p>}
            {members.map(p => (
              <div key={p.id} className="person">
                <Avatar name={p.name} />
                <a href={`#/person/${p.id}`}><b>{p.name}</b></a>
                <span className="muted small">{AGE_LABEL[p.age_group]}</span>
                <span className="small muted">{picks.filter(k => k.person_id === p.id).length} picks</span>
                {p.id !== me?.id && <button className="linklike small" onClick={() => setMe(p.id)}>Act as</button>}
              </div>
            ))}
          </section>
        ))}
      </div>
      <p className="muted small">Not seeing someone? <PersonSelect value={me!.id} onChange={setMe as any} /> is who you're acting as now.</p>
    </div>
  )
}
