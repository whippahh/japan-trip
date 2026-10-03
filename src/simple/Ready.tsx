import { useState } from 'react'
import { useData } from '../lib/data'
import { CHECKLIST, USEFUL_LINKS, type CheckItem } from '../data/checklist'
import { Avatar } from '../components/ui'
import { applicable } from '../pages/Checklist'
import { Icon, Ring } from './kit'

export default function Ready() {
  const { me, people, checks, toggleCheck, membersOf, setMe } = useData()
  const [open, setOpen] = useState<string | null>(null)
  const [who, setWho] = useState<string>(me?.id || '')
  if (!me) return null
  const house = membersOf(me.household_id).length ? membersOf(me.household_id) : [me]
  const p = people.find(x => x.id === who) || me
  const items = applicable(p)
  const isOn = (pid: string, key: string) => checks.some(c => c.person_id === pid && c.key === key && c.done)
  const done = items.filter(c => isOn(p.id, c.key)).length
  const all = done === items.length && items.length > 0
  const doneFor = (pp: typeof p) => applicable(pp).filter(c => isOn(pp.id, c.key)).length
  const passports = people.filter(x => isOn(x.id, 'passport')).length
  const ordered = [...items].sort((a, b) => Number(isOn(p.id, a.key)) - Number(isOn(p.id, b.key)) || CHECKLIST.indexOf(a) - CHECKLIST.indexOf(b))

  const row = (c: CheckItem) => {
    const on = isOn(p.id, c.key)
    const o = open === c.key
    return (
      <div key={c.key} className={'check-row' + (on ? ' done' : '') + (o ? ' open' : '')}>
        <div className="check-top">
          <button className={'circle' + (on ? ' on' : '')} onClick={() => toggleCheck(p.id, c.key)} aria-label={on ? 'Mark not done' : 'Mark done'} aria-pressed={on}><Icon n="check" size={18} /></button>
          <button className="check-title" onClick={() => setOpen(o ? null : c.key)}>
            <span className="ce">{c.emoji}</span>
            <span><b>{c.label}</b>{!o && c.why && <small>{c.why}</small>}</span>
            <span className="row-chev" style={{ transform: o ? 'rotate(90deg)' : undefined }}><Icon n="chevron" size={16} /></span>
          </button>
        </div>
        {o && (
          <div className="check-more">
            {c.why && <p>{c.why}</p>}
            {c.tips && <ul>{c.tips.map(t => <li key={t}>{t}</li>)}</ul>}
            {c.links && <div className="link-row">{c.links.map(l => <a key={l.url} className="btn-soft" href={l.url} target="_blank" rel="noreferrer"><Icon n="link" size={15} /> {l.label}</a>)}</div>}
            {c.note && <p className="muted small">{c.note}</p>}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="s-page">
      <div className="ready-top">
        <Ring size={92} pct={items.length ? done / items.length : 0} label={`${done}/${items.length}`} sub="done" color="var(--c2)" />
        <div>
          <h2>{all ? 'All set! 🎉' : p.id === me.id ? 'Get ready' : `Getting ${p.name.split(' ')[0]} ready`}</h2>
          <p className="muted">{all ? 'Everything is ticked. Have an amazing trip.' : 'Tap a row for tips and links. Tap the circle to tick it off.'}</p>
          <small className="muted">🛂 {passports}/{people.length} passports ready in the group</small>
        </div>
      </div>
      {all && <div className="confetti" aria-hidden>{Array.from({ length: 18 }, (_, i) => <i key={i} style={{ ['--i' as any]: i }} />)}</div>}

      {house.length > 1 && (
        <div className="who-row scroll-x">
          {house.map(h => (
            <button key={h.id} className={'who-chip' + (h.id === p.id ? ' on' : '')} onClick={() => setWho(h.id)}>
              <Avatar name={h.name} size={30} /><span>{h.name.split(' ')[0]}</span><small>{doneFor(h)}/{applicable(h).length}</small>
            </button>
          ))}
        </div>
      )}
      <div className="group checks">{ordered.map(row)}</div>

      <h3 className="s-h">Handy links</h3>
      <div className="group">
        {USEFUL_LINKS.map(l => (
          <a key={l.url} className="lrow" href={l.url} target="_blank" rel="noreferrer">
            <span className="row-icon">{l.emoji}</span><span className="row-main"><b>{l.label}</b><small>{l.note}</small></span><span className="row-chev"><Icon n="chevron" size={16} /></span>
          </a>
        ))}
      </div>
      <p className="muted small center">Just yes/no ticks. Never type passport numbers or card details here.</p>
      {me.id !== p.id && <button className="btn-soft wide" onClick={() => setMe(p.id)}>Switch to {p.name.split(' ')[0]}</button>}
    </div>
  )
}
