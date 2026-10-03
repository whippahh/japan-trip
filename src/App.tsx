import { useEffect, useState } from 'react'
import { useData } from './lib/data'
import { Avatar } from './components/ui'
import Onboarding from './simple/Onboarding'
import SimpleApp from './simple/SimpleApp'
import { setMode, useMode } from './lib/mode'
import Home from './pages/Home'
import Explore from './pages/Explore'
import Calculator from './pages/Calculator'
import Ideas from './pages/Ideas'
import Tickets from './pages/Tickets'
import Checklist from './pages/Checklist'
import People from './pages/People'
import PersonPage from './pages/PersonPage'
import Plans from './pages/Plans'
import MapPage from './pages/MapPage'

const NAV: [string, string, string][] = [
  ['#/', 'Home', '🏠'], ['#/explore', 'Explore', '🧭'], ['#/plans', 'Plans', '🗺️'], ['#/map', 'Route map', '📍'], ['#/calc', 'Calculator', '🧮'],
  ['#/ideas', 'Ideas & votes', '💡'], ['#/tickets', 'Tickets & payments', '🎟️'],
  ['#/checklist', 'Ready?', '✅'], ['#/people', 'Who\'s coming', '👨‍👩‍👧'],
]

function useHash() {
  const [h, setH] = useState(location.hash || '#/')
  useEffect(() => {
    const f = () => { setH(location.hash || '#/'); window.scrollTo(0, 0) }
    window.addEventListener('hashchange', f)
    return () => window.removeEventListener('hashchange', f)
  }, [])
  return h
}

export default function App() {
  const { me, setMe, people, households, loading, error, shared, rate, setRate } = useData()
  const hash = useHash()
  const mode = useMode()
  const [menu, setMenu] = useState(false)
  if (loading) return <div className="splash">🗾 Loading…</div>
  if (!me) return <Onboarding />
  if (mode === 'simple') return <SimpleApp />

  const path = hash.replace(/^#/, '') || '/'
  let page
  if (path.startsWith('/person/')) page = <PersonPage id={path.split('/')[2]} />
  else if (path === '/explore') page = <Explore />
  else if (path === '/plans') page = <Plans />
  else if (path === '/map') page = <MapPage />
  else if (path === '/calc') page = <Calculator />
  else if (path === '/ideas') page = <Ideas />
  else if (path === '/tickets') page = <Tickets />
  else if (path === '/checklist') page = <Checklist />
  else if (path === '/people') page = <People />
  else page = <Home />

  const hh = (p: typeof me) => households.find(h => h.id === p?.household_id)?.name

  return (
    <div className="app">
      <header className="top">
        <a className="brand" href="#/"><span className="sun" /> <span>Japan Family Trip</span></a>
        <button className="burger" onClick={() => setMenu(!menu)} aria-label="Menu">☰</button>
        <nav className={menu ? 'open' : ''} onClick={() => setMenu(false)}>
          {NAV.map(([href, label, emoji]) => (
            <a key={href} href={href} className={path === href.slice(1) || (href !== '#/' && path.startsWith(href.slice(1))) ? 'active' : ''}>
              <span>{emoji}</span> {label}
            </a>
          ))}
        </nav>
        <div className="who">
          <Avatar name={me.name} />
          <select
            value={me.id}
            title="Who are you acting as? Parents can switch to manage little ones."
            onChange={e => setMe(e.target.value)}
          >
            {households.map(h => (
              <optgroup key={h.id} label={h.name}>
                {people.filter(p => p.household_id === h.id).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </optgroup>
            ))}
            {people.some(p => !p.household_id) && (
              <optgroup label="No household">
                {people.filter(p => !p.household_id).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </optgroup>
            )}
          </select>
          <button className="btn btn-primary small" onClick={() => setMode('simple')} title="Back to the simple, app-style view">✨ Simple mode</button>
          <button className="btn btn-ghost small" onClick={() => setMe(null)} title={hh(me) || ''}>Not me</button>
        </div>
      </header>
      {!shared && (
        <div className="banner warn">
          Demo mode: data is saved only in this browser. Add your Supabase keys (see README) to share it with the family.
        </div>
      )}
      {error && <div className="banner err">Couldn't sync: {error}</div>}
      <main>{page}</main>
      <footer>
        Prices are approximate (2025–26) — check the official site before booking. Yen→A$ at ¥
        <input className="rate" type="number" min={50} max={300} value={rate} onChange={e => setRate(Number(e.target.value))} /> per A$1.
        <br />Private family site. Please never put passport numbers or card details here.
      </footer>
    </div>
  )
}
