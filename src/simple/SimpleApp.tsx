import { useEffect, useMemo, useState } from 'react'
import { useData } from '../lib/data'
import { Avatar } from '../components/ui'
import { lget, lput } from '../lib/mode'
import { Icon } from './kit'
import { UICtx, type UI } from './ctx'
import { ItemSheet, PersonSheet, ProfileSheet } from './Sheets'
import { RoutesSheet } from './Trip'
import { TourSlides } from './Tour'
import Today from './Today'
import Discover from './Discover'
import Trip from './Trip'
import Group from './Group'
import Ready from './Ready'

const TABS: [string, string, string][] = [
  ['', 'Today', 'home'], ['discover', 'Discover', 'compass'], ['trip', 'My trip', 'trip'], ['group', 'Group', 'group'], ['ready', 'Ready', 'check'],
]

function useHashParts() {
  const read = () => (location.hash || '#/').replace(/^#\/?/, '').split('/').filter(Boolean)
  const [parts, setParts] = useState<string[]>(read)
  useEffect(() => {
    const f = () => { setParts(read()); window.scrollTo(0, 0) }
    window.addEventListener('hashchange', f)
    return () => window.removeEventListener('hashchange', f)
  }, [])
  return parts
}

export default function SimpleApp() {
  const { me, error, shared } = useData()
  const parts = useHashParts()
  const [itemId, setItemId] = useState<string | null>(null)
  const [personId, setPersonId] = useState<string | null>(null)
  const [profile, setProfile] = useState(false)
  const [routes, setRoutes] = useState(false)
  const [tour, setTour] = useState(() => lget('jt_toured') !== '1')

  const tab = TABS.some(t => t[0] === parts[0]) ? parts[0] : ''
  const ui: UI = useMemo(() => ({
    openItem: setItemId, openPerson: setPersonId, openProfile: () => setProfile(true), openRoutes: () => setRoutes(true), openTour: () => setTour(true),
    go: (path: string) => { setItemId(null); setPersonId(null); location.hash = path },
  }), [])
  if (!me) return null
  const first = me.name.trim().split(/\s+/)[0]
  const title = tab === '' ? `Hi, ${first}` : TABS.find(t => t[0] === tab)![1]

  return (
    <UICtx.Provider value={ui}>
      <div className="s-app">
        <header className="s-top">
          <h1>{title}</h1>
          <button className="me-btn" onClick={() => setProfile(true)} aria-label="You and settings"><Avatar name={me.name} size={36} /></button>
        </header>
        {!shared && <div className="s-banner warn">Demo mode: saved only in this browser. Add the Supabase keys to share with the family.</div>}
        {error && <div className="s-banner err">Couldn't sync: {error}</div>}
        <main key={me.id + tab} className="s-main">
          {tab === '' && <Today />}
          {tab === 'discover' && <Discover />}
          {tab === 'trip' && <Trip seg={parts[1]} />}
          {tab === 'group' && <Group seg={parts[1]} />}
          {tab === 'ready' && <Ready />}
        </main>
        <div className="s-tabs" role="navigation" aria-label="Main">
          {TABS.map(([p, label, icon]) => (
            <a key={p} href={'#/' + p} className={tab === p ? 'on' : ''} aria-current={tab === p ? 'page' : undefined}>
              <Icon n={icon} size={25} /><span>{label}</span>
            </a>
          ))}
        </div>
        <ItemSheet id={itemId} onClose={() => setItemId(null)} />
        <PersonSheet id={personId} onClose={() => setPersonId(null)} />
        <ProfileSheet open={profile} onClose={() => setProfile(false)} />
        <RoutesSheet open={routes} onClose={() => setRoutes(false)} />
        {tour && (
          <div className="tour-overlay">
            <TourSlides onDone={() => { lput('jt_toured', '1'); setTour(false) }} />
          </div>
        )}
      </div>
    </UICtx.Provider>
  )
}
