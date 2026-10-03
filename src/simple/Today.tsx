import { useData } from '../lib/data'
import { Photo } from '../components/Photo'
import { Avatar, Money } from '../components/ui'
import { personBreakdown } from '../lib/pricing'
import { fmtDate, tripPhase } from '../lib/dates'
import { applicable } from '../pages/Checklist'
import { Icon, Ring, Row } from './kit'
import { ItemTile, Rail, useScore } from './Tiles'
import { useUI } from './ctx'

export default function Today() {
  const { me, people, households, picks, votes, items, checks, tickets, getItem, getStay, updatePerson, membersOf } = useData()
  const ui = useUI()
  const score = useScore()
  if (!me) return null
  const phase = tripPhase(people)
  const mine = picks.filter(k => k.person_id === me.id)
  const todo = applicable(me)
  const done = todo.filter(c => checks.some(x => x.person_id === me.id && x.key === c.key && x.done)).length
  const b = personBreakdown(me, picks, getItem, getStay)
  const house = membersOf(me.household_id)
  const houseTotal = house.reduce((n, p) => n + personBreakdown(p, picks, getItem, getStay).total, 0)
  const loved = items.filter(i => i.kind === 'sight' && score(i.id) > 0).sort((a, b) => score(b.id) - score(a.id)).slice(0, 10)
  const voted = votes.some(v => v.person_id === me.id)
  const bought = tickets.filter(t => t.status === 'bought').length

  const steps: { icon: string; title: string; sub: string; go: () => void }[] = []
  if (!me.arrive) steps.push({ icon: '🗓️', title: 'Set your dates', sub: 'Starts the countdown and the cost calculator', go: () => ui.openPerson(me.id) })
  if (house.length < 2 && !people.some(p => p.household_id === me.household_id && p.id !== me.id)) steps.push({ icon: '👨‍👩‍👧', title: 'Add your household', sub: 'Partner, kids, parents: plan for everyone', go: () => ui.go('#/group') })
  if (mine.length === 0) steps.push({ icon: '🧭', title: 'Pick your first places', sub: 'Tap the ♡ on anything you like', go: () => ui.go('#/discover') })
  if (mine.length === 0) steps.push({ icon: '🗺️', title: 'Or start from a ready-made route', sub: 'A clean line through Japan you can tweak', go: ui.openRoutes })
  if (me.stays.length === 0) steps.push({ icon: '🛏️', title: 'Add where you\'re staying', sub: 'Hotels, ryokan and apartments with prices', go: () => ui.go('#/trip/stays') })
  if (done < todo.length) steps.push({ icon: '✅', title: `${todo.length - done} things to get ready`, sub: 'Passport, flights, Visit Japan Web…', go: () => ui.go('#/ready') })
  if (!voted) steps.push({ icon: '🗳️', title: 'Vote on ideas', sub: 'Swipe cards to tell the group what you want', go: () => ui.go('#/group/vote') })

  const hero = (() => {
    if (phase.kind === 'before') {
      return (
        <>
          <div className="count"><b>{phase.days}</b><span>{phase.days === 1 ? 'day' : 'days'} until Japan</span></div>
          <small>The group lands {fmtDate(phase.start, true)}</small>
        </>
      )
    }
    if (phase.kind === 'during') {
      return (<><div className="count"><b>Day {phase.day}</b><span>You're in Japan! 🎌</span></div><small>{phase.left !== null ? `${phase.left} more ${phase.left === 1 ? 'day' : 'days'} to go` : ''}</small></>)
    }
    if (phase.kind === 'after') return (<><div className="count"><b>おかえり</b><span>Welcome home 🏡</span></div><small>Hope it was incredible.</small></>)
    return (
      <>
        <div className="count"><b>🗓️</b><span>When are you off?</span></div>
        <div className="hero-dates">
          <label>Arrive<input type="date" value={me.arrive || ''} onChange={e => updatePerson(me.id, { arrive: e.target.value || null })} /></label>
          <label>Leave<input type="date" min={me.arrive || undefined} value={me.depart || ''} onChange={e => updatePerson(me.id, { depart: e.target.value || null })} /></label>
        </div>
      </>
    )
  })()

  return (
    <div className="s-page">
      <Photo query={phase.kind === 'during' ? 'Tokyo skyline' : 'Mount Fuji'} emoji="🗻" color="#3a2f5c" className="today-hero">
        <div className="hero-shade deep" />
        <div className="today-hero-in">
          <span className="badge">👋 Hi {me.name.split(' ')[0]}</span>
          {hero}
        </div>
      </Photo>

      {steps.length > 0 && (
        <>
          <h3 className="s-h">Next up</h3>
          <div className="group">
            {steps.slice(0, 3).map(s => <Row key={s.title} icon={s.icon} title={s.title} sub={s.sub} chevron onClick={s.go} />)}
          </div>
        </>
      )}

      <h3 className="s-h">Your progress</h3>
      <div className="ring-card">
        <button onClick={() => ui.go('#/trip')}><Ring pct={Math.min(1, mine.length / 8)} label={mine.length} sub="in your trip" color="var(--c1)" /></button>
        <button onClick={() => ui.go('#/ready')}><Ring pct={todo.length ? done / todo.length : 0} label={`${done}/${todo.length}`} sub="ready" color="var(--c2)" /></button>
        <button onClick={() => ui.go('#/group/tickets')}><Ring pct={Math.min(1, bought / 6)} label={bought} sub="tickets bought" color="var(--c3)" /></button>
      </div>

      <div className="cost-card" onClick={() => ui.go('#/trip/costs')} role="button" tabIndex={0}>
        <div><small>{house.length > 1 ? `${me.household_id ? households.find(h => h.id === me.household_id)?.name : 'Household'} estimate` : 'Your estimate'}</small><Money y={house.length > 1 ? houseTotal : b.total} big /></div>
        <span>Excludes flights <Icon n="chevron" size={14} /></span>
      </div>

      {loved.length > 0 ? (
        <Rail title="🏆 Group favourites" sub="Voted by the family" onMore={() => ui.go('#/group/vote')}>{loved.map(i => <ItemTile key={i.id} item={i} rail />)}</Rail>
      ) : (
        <>
          <h3 className="s-h">Group favourites</h3>
          <div className="empty-s"><span>🗳️</span><b>No votes yet</b><small>Be the first to tell the family what you're excited about.</small><button className="btn-soft" onClick={() => ui.go('#/group/vote')}>Start voting</button></div>
        </>
      )}

      <h3 className="s-h">Who's coming</h3>
      <button className="people-strip" onClick={() => ui.go('#/group')}>
        <div className="avs">{people.slice(0, 8).map(p => <Avatar key={p.id} name={p.name} size={36} />)}{people.length > 8 && <span className="more">+{people.length - 8}</span>}</div>
        <span><b>{people.length} {people.length === 1 ? 'person' : 'people'}</b><small>{households.length} {households.length === 1 ? 'household' : 'households'}</small></span>
        <Icon n="chevron" size={16} />
      </button>
    </div>
  )
}
