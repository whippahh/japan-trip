import React from 'react'
import { useData } from '../lib/data'
import { AREA_META, TYPE_EMOJI } from '../data/meta'
import type { Item, Person } from '../lib/types'

export const yen = (n: number) => '¥' + Math.round(n).toLocaleString('en-AU')

export function Money({ y, big }: { y: number; big?: boolean }) {
  const { rate } = useData()
  return (
    <span className={'money' + (big ? ' big' : '')}>
      <b>{yen(y)}</b>
      <small>≈ A${Math.round(y / rate).toLocaleString('en-AU')}</small>
    </span>
  )
}

const hue = (s: string) => { let h = 0; for (const c of s) h = (h * 31 + c.charCodeAt(0)) % 360; return h }
export function Avatar({ name, size = 28 }: { name: string; size?: number }) {
  return (
    <span className="avatar" style={{ width: size, height: size, fontSize: size * 0.45, background: `hsl(${hue(name)} 45% 42%)` }}>
      {(name.trim()[0] || '?').toUpperCase()}
    </span>
  )
}

export function Dots({ n }: { n: number }) {
  const label = ['', 'Easy', 'Moderate', 'Full-on'][n]
  return <span className="dots" title={label}>{[1, 2, 3].map(i => <i key={i} className={i <= n ? 'on' : ''} />)}</span>
}

export function mapsUrl(i: Item) {
  return 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(`${i.name} ${i.town} ${i.area} Japan`)
}

export function typeEmoji(t: string) { return TYPE_EMOJI[t] || '📍' }
export function areaMeta(a: string) { return AREA_META[a] || AREA_META['Anywhere / Nationwide'] }

export function Votes({ target }: { target: string }) {
  const { votes, me, setVote, personName } = useData()
  const mine = votes.find(v => v.target_id === target && v.person_id === me?.id)?.vote
  const all = votes.filter(v => v.target_id === target)
  const names = (n: number) => all.filter(v => v.vote === n).map(v => personName(v.person_id)).join(', ')
  const btn = (n: number, emoji: string, label: string) => (
    <button
      key={n}
      className={'vote' + (mine === n ? ' on' : '')}
      title={`${label}${names(n) ? ': ' + names(n) : ''}`}
      onClick={() => me && setVote(target, me.id, mine === n ? null : n)}
    >
      {emoji} <span>{all.filter(v => v.vote === n).length}</span>
    </button>
  )
  return <div className="votes">{btn(1, '👍', "I'm in")}{btn(0, '🤔', 'Maybe')}{btn(-1, '👎', 'Pass')}</div>
}

export function PickButtons({ item }: { item: Item }) {
  const { me, picks, togglePick, addPicks, membersOf, personName } = useData()
  if (!me) return null
  const mine = picks.some(k => k.person_id === me.id && k.item_id === item.id)
  const household = membersOf(me.household_id)
  const who = picks.filter(k => k.item_id === item.id).map(k => personName(k.person_id))
  return (
    <div className="pickrow">
      <button className={'btn ' + (mine ? 'btn-on' : 'btn-primary')} onClick={() => togglePick(me.id, item.id)}>
        {mine ? '✓ In my trip' : '+ My trip'}
      </button>
      {household.length > 1 && (
        <button className="btn btn-ghost" title="Add for everyone in your household" onClick={() => addPicks(household.map(p => p.id), item.id)}>+ Household</button>
      )}
      {who.length > 0 && <span className="muted small" title={who.join(', ')}>{who.length} going</span>}
    </div>
  )
}

export function Empty({ children }: { children: React.ReactNode }) {
  return <div className="empty">{children}</div>
}

export function PersonSelect({ value, onChange, includeAll }: { value: string; onChange: (id: string) => void; includeAll?: boolean }) {
  const { people, households } = useData()
  const groups: { name: string; people: Person[] }[] = [
    ...households.map(h => ({ name: h.name, people: people.filter(p => p.household_id === h.id) })),
    { name: 'No household', people: people.filter(p => !p.household_id) },
  ].filter(g => g.people.length)
  return (
    <select value={value} onChange={e => onChange(e.target.value)}>
      {includeAll && <option value="">Everyone</option>}
      {groups.map(g => (
        <optgroup key={g.name} label={g.name}>
          {g.people.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </optgroup>
      ))}
    </select>
  )
}
