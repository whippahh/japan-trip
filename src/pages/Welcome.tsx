import { useState } from 'react'
import { useData } from '../lib/data'
import { Avatar } from '../components/ui'
import { AGE_LABEL, type AgeGroup } from '../lib/types'

export default function Welcome() {
  const { people, households, setMe, addHousehold, addPerson } = useData()
  const [name, setName] = useState('')
  const [hid, setHid] = useState<string>('') // '' = new household
  const [newHh, setNewHh] = useState('')
  const [age, setAge] = useState<AgeGroup>('adult')

  const existing = people.find(p => p.name.trim().toLowerCase() === name.trim().toLowerCase())

  const go = async () => {
    if (!name.trim()) return
    if (existing) { setMe(existing.id); return }
    let household = hid
    if (!household) household = (await addHousehold(newHh.trim() || `${name.trim()}'s household`)).id
    const p = await addPerson({ name, household_id: household, age_group: age })
    setMe(p.id)
  }

  return (
    <div className="welcome">
      <div className="welcome-card">
        <div className="sun big" />
        <h1>Japan Family Trip</h1>
        <p className="lead">Plan it together: pick sights, see the cost, vote on ideas and track who has booked what.</p>
        <label>What's your name?</label>
        <input autoFocus value={name} onChange={e => setName(e.target.value)} onKeyDown={e => e.key === 'Enter' && go()} placeholder="Type your name" />
        {existing ? (
          <p className="hint ok">Welcome back, {existing.name}. We'll sign you straight in.</p>
        ) : name.trim() ? (
          <div className="newbox">
            <label>Which household are you in?</label>
            <select value={hid} onChange={e => setHid(e.target.value)}>
              <option value="">New household…</option>
              {households.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
            </select>
            {!hid && <input value={newHh} onChange={e => setNewHh(e.target.value)} placeholder={`${name.trim()}'s household`} />}
            <label>You are</label>
            <select value={age} onChange={e => setAge(e.target.value as AgeGroup)}>
              {(Object.keys(AGE_LABEL) as AgeGroup[]).map(a => <option key={a} value={a}>{AGE_LABEL[a]}</option>)}
            </select>
          </div>
        ) : null}
        <button className="btn btn-primary wide" disabled={!name.trim()} onClick={go}>{existing ? 'Continue' : "Let's go →"}</button>
        {people.length > 0 && (
          <>
            <div className="divider"><span>or tap your name</span></div>
            <div className="chips">
              {people.map(p => (
                <button key={p.id} className="chip" onClick={() => setMe(p.id)}><Avatar name={p.name} size={20} /> {p.name}</button>
              ))}
            </div>
          </>
        )}
        <p className="tiny">No passwords. Anyone with this link can edit, so keep it within the family.</p>
      </div>
    </div>
  )
}
