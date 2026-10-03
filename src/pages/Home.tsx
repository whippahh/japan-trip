import { useData } from '../lib/data'
import { personBreakdown } from '../lib/pricing'
import { Money } from '../components/ui'
import { applicable } from './Checklist'

export default function Home() {
  const { me, people, households, picks, votes, items, getItem, getStay, checks, tickets } = useData()
  const grand = people.reduce((n, p) => n + personBreakdown(p, picks, getItem, getStay).total, 0)
  const score = (id: string) => votes.filter(v => v.target_id === id).reduce((n, v) => n + v.vote, 0)
  const top = items.filter(i => votes.some(v => v.target_id === i.id)).sort((a, b) => score(b.id) - score(a.id)).slice(0, 5)
  const myItems = me ? applicable(me) : []
  const myDone = myItems.filter(c => checks.some(x => x.person_id === me!.id && x.key === c.key && x.done)).length
  const myPicks = picks.filter(k => k.person_id === me?.id).length
  const bought = tickets.filter(t => t.status === 'bought').length

  return (
    <div className="page">
      <section className="hero">
        <div className="sun big" />
        <div>
          <h1>Hi {me?.name} 👋</h1>
          <p>Japan, together. Browse ideas, build your own plan, and see what the whole group is up to.</p>
          <div className="chips">
            <a className="btn btn-primary" href="#/explore">Browse sights</a>
            <a className="btn btn-ghost light" href="#/calc">Price my trip</a>
          </div>
        </div>
      </section>
      <div className="stats">
        <div className="stat"><b>{people.length}</b><span>people · {households.length} households</span></div>
        <div className="stat"><b>{myPicks}</b><span>things in your trip</span></div>
        <div className="stat"><b>{myDone}/{myItems.length}</b><span>your checklist</span></div>
        <div className="stat"><b>{bought}</b><span>tickets bought</span></div>
        <div className="stat wide"><b><Money y={grand} /></b><span>group estimate so far (excl. flights)</span></div>
      </div>
      <div className="cols2">
        <section className="card pad">
          <h3>🏆 Group favourites</h3>
          {top.length === 0 ? <p className="muted">No votes yet. <a href="#/explore">Start voting</a>.</p> : <ol className="plain">{top.map(i => <li key={i.id}>{i.name} <b className="amt">{score(i.id) >= 0 ? '+' : ''}{score(i.id)}</b></li>)}</ol>}
        </section>
        <section className="card pad">
          <h3>How this works</h3>
          <ol className="plain steps">
            <li><b>Explore</b> sights, passes, tours and stays. Filter by area, town or type.</li>
            <li>Tap <b>+ My trip</b> and vote 👍🤔👎 so we can see what the group wants.</li>
            <li>The <b>Calculator</b> adds up sights, rooms, food and transport for you.</li>
            <li>Log what's been bought in <b>Tickets & payments</b> so nobody pays twice.</li>
            <li>Tick off the <b>Ready?</b> list. Parents can switch to a kid's profile in the top bar.</li>
          </ol>
        </section>
      </div>
    </div>
  )
}
