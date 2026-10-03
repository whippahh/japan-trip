import { useMemo, useState } from 'react'
import { useData } from '../lib/data'
import { Avatar } from '../components/ui'
import { findMatches } from '../lib/match'
import { AGE_LABEL, TIER_LABEL, type AgeGroup, type Person, type Tier } from '../lib/types'
import { TYPES } from '../data/meta'
import { TYPE_EMOJI } from '../data/meta'
import { daysBetween, parseDate, todayDate } from '../lib/dates'
import { nightsBetween } from '../lib/pricing'
import { lput, lget } from '../lib/mode'
import { AgePills } from './Sheets'
import { TourSlides } from './Tour'

type Step = 'name' | 'confirm' | 'household' | 'family' | 'dates' | 'style' | 'tour'
interface Extra { id: string; name: string; age: AgeGroup }
const TIER_INFO: Record<Tier, [string, string]> = {
  budget: ['🍙', 'Konbini breakfasts, ramen and kaiten-sushi. About ¥4,000 a day.'],
  mid: ['🍱', 'Set lunches, izakaya dinners, the odd treat. About ¥7,500 a day.'],
  splurge: ['🍣', 'Omakase, kaiseki and rooftop bars. About ¥14,000 a day.'],
}
const first = (n: string) => n.trim().split(/\s+/)[0]
let xid = 0

export default function Onboarding() {
  const { people, households, setMe, addHousehold, addPerson } = useData()
  const [step, setStep] = useState<Step>('name')
  const [name, setName] = useState('')
  const [found, setFound] = useState<Person | null>(null)
  const [hid, setHid] = useState<string>('new')
  const [hhName, setHhName] = useState('')
  const [age, setAge] = useState<AgeGroup>('adult')
  const [extras, setExtras] = useState<Extra[]>([])
  const [xn, setXn] = useState('')
  const [xa, setXa] = useState<AgeGroup>('adult')
  const [arrive, setArrive] = useState('')
  const [depart, setDepart] = useState('')
  const [tier, setTier] = useState<Tier>('mid')
  const [likes, setLikes] = useState<string[]>([])
  const [busy, setBusy] = useState(false)

  const m = useMemo(() => findMatches(people, name), [people, name])
  const byHousehold = useMemo(() => [
    ...households.map(h => ({ id: h.id, name: h.name, members: people.filter(p => p.household_id === h.id) })),
    { id: '', name: 'No household', members: people.filter(p => !p.household_id) },
  ].filter(g => g.members.length), [households, people])
  const hhOf = (p: Person) => households.find(h => h.id === p.household_id)?.name
  const toured = lget('jt_toured') === '1'

  const signIn = (p: Person) => { lput('jt_toured', '1'); setMe(p.id) }
  const chooseExisting = (p: Person) => { setFound(p); setStep('confirm') }

  const joined = hid !== 'new' ? households.find(h => h.id === hid) : undefined
  const prefill = () => {
    if (arrive || depart || !joined) return
    const mate = people.find(p => p.household_id === joined.id && p.arrive)
    if (mate) { setArrive(mate.arrive || ''); setDepart(mate.depart || '') }
  }

  const addExtra = () => {
    if (!xn.trim()) return
    setExtras([...extras, { id: String(++xid), name: xn.trim(), age: xa }])
    setXn('')
  }

  const finish = async () => {
    setBusy(true)
    try {
      let household = hid
      if (hid === 'new') household = (await addHousehold(hhName.trim() || `${name.trim()}'s household`)).id
      const dates = { arrive: arrive || null, depart: depart || null }
      const meRow = await addPerson({ name, household_id: household, age_group: age, tier, ...dates })
      for (const x of extras) await addPerson({ name: x.name, household_id: household, age_group: x.age, tier, ...dates })
      lput('jt_interests', JSON.stringify(likes))
      lput('jt_toured', '1')
      setMe(meRow.id)
    } finally { setBusy(false) }
  }

  const nights = arrive && depart ? nightsBetween(arrive, depart) : 0
  const toGo = arrive ? daysBetween(todayDate(), parseDate(arrive)) : null

  const newSteps: Step[] = ['name', 'household', 'family', 'dates', 'style', 'tour']
  const idx = newSteps.indexOf(step)
  const prev: Partial<Record<Step, Step>> = { household: 'name', family: 'household', dates: 'family', style: 'dates', tour: 'style', confirm: 'name' }

  const dots = step !== 'name' && step !== 'confirm' && (
    <div className="ob-dots">{newSteps.slice(1).map((s, i) => <i key={s} className={i < idx ? 'done' : i === idx - 1 ? 'on' : ''} />)}</div>
  )

  return (
    <div className="ob">
      <div className="ob-sky" />
      <div className="ob-card" key={step}>
        {step !== 'name' && <button className="ob-back" onClick={() => setStep(step === 'tour' && found ? 'confirm' : (prev[step] || 'name'))}>‹ Back</button>}
        {dots}

        {step === 'name' && (
          <>
            <div className="sun-logo"><i /></div>
            <h1>Japan Family Trip</h1>
            <p className="ob-lead">Plan it together: pick places, see the cost, vote, and tick everything off. First, who are you?</p>
            <input className="ob-input" autoFocus placeholder="Your name" value={name} autoComplete="off"
              onChange={e => setName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && name.trim()) { m.exact.length === 1 ? chooseExisting(m.exact[0]) : m.exact.length === 0 && setStep('household') } }} />

            {name.trim() && m.exact.length > 0 && (
              <div className="ob-matches">
                <p className="muted small">{m.exact.length === 1 ? 'Already on the trip. Is this you?' : 'More than one person has this name. Which is you?'}</p>
                {m.exact.map(p => (
                  <button key={p.id} className="match" onClick={() => chooseExisting(p)}>
                    <Avatar name={p.name} size={36} /><span><b>{p.name}</b><small>{hhOf(p) || 'No household'} · {AGE_LABEL[p.age_group]}</small></span><em>That's me</em>
                  </button>
                ))}
              </div>
            )}
            {name.trim() && m.similar.length > 0 && (
              <div className="ob-matches">
                <p className="muted small">Or did you mean…</p>
                {m.similar.slice(0, 4).map(p => (
                  <button key={p.id} className="match" onClick={() => chooseExisting(p)}>
                    <Avatar name={p.name} size={36} /><span><b>{p.name}</b><small>{hhOf(p) || 'No household'}</small></span><em>That's me</em>
                  </button>
                ))}
              </div>
            )}
            <button className="btn-big" disabled={!name.trim()} onClick={() => setStep('household')}>
              {m.exact.length ? "No, I'm someone new →" : 'Continue →'}
            </button>

            {!name.trim() && byHousehold.length > 0 && (
              <div className="ob-people">
                <div className="divider"><span>already added? tap your name</span></div>
                {byHousehold.map(g => (
                  <div key={g.id || 'none'} className="ob-hh">
                    <small>{g.name}</small>
                    <div className="chips-flow">
                      {g.members.map(p => <button key={p.id} className="chip2" onClick={() => chooseExisting(p)}><Avatar name={p.name} size={22} /> {p.name}</button>)}
                    </div>
                  </div>
                ))}
              </div>
            )}
            <p className="tiny">No passwords. Anyone with this link can see and edit, so keep it in the family.</p>
          </>
        )}

        {step === 'confirm' && found && (
          <>
            <Avatar name={found.name} size={84} />
            <h1>Welcome back, {first(found.name)} 👋</h1>
            <p className="ob-lead">
              You're in <b>{hhOf(found) || 'no household yet'}</b>
              {(() => { const mates = people.filter(p => p.household_id === found.household_id && p.id !== found.id && found.household_id); return mates.length ? <> with {mates.map(p => first(p.name)).join(', ')}</> : null })()}.
              {' '}Someone in your household may have added you already, so your details are set up.
            </p>
            <button className="btn-big" onClick={() => toured ? signIn(found) : setStep('tour')}>That's me, continue</button>
            <button className="btn-soft" onClick={() => setStep('name')}>Not me</button>
          </>
        )}

        {step === 'household' && (
          <>
            <h1>Who are you travelling with?</h1>
            <p className="ob-lead">Households group the people who share costs and rooms. Join one that's already set up, or start yours.</p>
            <div className="hh-list">
              {households.map(h => {
                const mem = people.filter(p => p.household_id === h.id)
                return (
                  <button key={h.id} className={'hh-card' + (hid === h.id ? ' on' : '')} onClick={() => setHid(h.id)}>
                    <div className="avs">{mem.slice(0, 4).map(p => <Avatar key={p.id} name={p.name} size={30} />)}</div>
                    <span><b>{h.name}</b><small>{mem.map(p => first(p.name)).join(', ') || 'No one yet'}</small></span>
                    <i className="radio" />
                  </button>
                )
              })}
              <button className={'hh-card' + (hid === 'new' ? ' on' : '')} onClick={() => setHid('new')}>
                <div className="avs"><span className="plus-av">＋</span></div>
                <span><b>Start a new household</b><small>For you and the people you share a room with</small></span>
                <i className="radio" />
              </button>
            </div>
            {hid === 'new' && <input className="ob-input" placeholder={`${name.trim()}'s household`} value={hhName} onChange={e => setHhName(e.target.value)} />}
            <button className="btn-big" onClick={() => { prefill(); setStep('family') }}>Next</button>
          </>
        )}

        {step === 'family' && (
          <>
            <h1>Who's in your household?</h1>
            <p className="ob-lead">Add everyone you're travelling with, including kids and anyone who won't use the site. You can plan for them later.</p>
            <div className="fld left">You are<AgePills value={age} onChange={setAge} /></div>
            {joined && people.filter(p => p.household_id === joined.id).length > 0 && (
              <div className="ob-members">
                {people.filter(p => p.household_id === joined.id).map(p => (
                  <div key={p.id} className="mem"><Avatar name={p.name} size={32} /><span><b>{p.name}</b><small>{AGE_LABEL[p.age_group]} · already added</small></span></div>
                ))}
              </div>
            )}
            <div className="ob-members">
              {extras.map(x => (
                <div key={x.id} className="mem"><Avatar name={x.name} size={32} /><span><b>{x.name}</b><small>{AGE_LABEL[x.age]}</small></span>
                  <button className="x" onClick={() => setExtras(extras.filter(e => e.id !== x.id))} aria-label="Remove">✕</button></div>
              ))}
            </div>
            <div className="add-box">
              <input className="ob-input" placeholder="Partner, kids, parents…" value={xn} onChange={e => setXn(e.target.value)} onKeyDown={e => e.key === 'Enter' && addExtra()} />
              <AgePills value={xa} onChange={setXa} />
              <button className="btn-soft" disabled={!xn.trim()} onClick={addExtra}>＋ Add to my household</button>
            </div>
            <p className="note-box">💡 If your partner added themselves here, they can just type their own name when they open the site and they'll be signed in as that person. No duplicates.</p>
            <button className="btn-big" onClick={() => setStep('dates')}>{extras.length ? 'Next' : "It's just me, next"}</button>
          </>
        )}

        {step === 'dates' && (
          <>
            <h1>When are you in Japan?</h1>
            <p className="ob-lead">Roughly is fine, you can change it later. It powers the countdown and the cost calculator{extras.length ? `, and applies to everyone you added` : ''}.</p>
            <div className="two">
              <label className="fld left">Arrive<input type="date" value={arrive} onChange={e => { setArrive(e.target.value); if (depart && e.target.value > depart) setDepart('') }} /></label>
              <label className="fld left">Leave<input type="date" min={arrive || undefined} value={depart} onChange={e => setDepart(e.target.value)} /></label>
            </div>
            {toGo !== null && toGo >= 0 && (
              <div className="count-prev"><b>{toGo}</b><span>days to go{nights > 0 ? ` · ${nights} nights in Japan` : ''}</span></div>
            )}
            <button className="btn-big" onClick={() => setStep('style')}>{arrive ? 'Next' : 'Not sure yet, skip'}</button>
          </>
        )}

        {step === 'style' && (
          <>
            <h1>What's your style?</h1>
            <p className="ob-lead">This tunes food costs and what we show you first. Nothing is locked in.</p>
            <div className="tier-list">
              {(Object.keys(TIER_LABEL) as Tier[]).map(t => (
                <button key={t} className={'tier-card' + (tier === t ? ' on' : '')} onClick={() => setTier(t)}>
                  <span>{TIER_INFO[t][0]}</span><b>{TIER_LABEL[t]}</b><small>{TIER_INFO[t][1]}</small>
                </button>
              ))}
            </div>
            <div className="fld left">What do you love? <small className="muted">(pick a few)</small></div>
            <div className="chips-flow">
              {TYPES.filter(t => t !== 'Pass & package' && t !== 'Transport').map(t => (
                <button key={t} className={'chip2' + (likes.includes(t) ? ' on' : '')} onClick={() => setLikes(likes.includes(t) ? likes.filter(x => x !== t) : [...likes, t])}>{TYPE_EMOJI[t]} {t}</button>
              ))}
            </div>
            <button className="btn-big" onClick={() => setStep('tour')}>Next</button>
          </>
        )}

        {step === 'tour' && (
          <TourSlides doneLabel={busy ? 'Setting up…' : "Let's go"} onDone={() => { if (busy) return; found ? signIn(found) : finish() }} />
        )}
      </div>
    </div>
  )
}
