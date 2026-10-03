import { useMemo, useState } from 'react'
import { useData } from '../lib/data'
import { AREAS, AREA_META, TYPES } from '../data/meta'
import { Dots, Money, PickButtons, Votes, areaMeta, mapsUrl, typeEmoji, yen } from '../components/ui'
import { itemPrice } from '../lib/pricing'
import { ItemPhoto } from '../components/Photo'
import type { Item, Kind } from '../lib/types'

const KINDS: [Kind | 'all', string][] = [
  ['all', 'Everything'], ['sight', 'Sights & activities'], ['package', 'Packages & tours'], ['pass', 'Passes'], ['transit', 'Getting there'],
]
const SORTS = ['Trip order', 'Most liked', 'Price: low → high', 'Price: high → low', 'Shortest first', 'A → Z'] as const

export function ItemCard({ item }: { item: Item }) {
  const { me, getItem, togglePick, picks } = useData()
  const age = me?.age_group || 'adult'
  const meta = areaMeta(item.area)
  const p = item.prices
  const need = item.needs ? getItem(item.needs) : undefined
  const needPicked = need && me ? picks.some(k => k.person_id === me.id && k.item_id === need.id) : true
  return (
    <article className="card item">
      <ItemPhoto item={item} className="adv-photo"><div className="tile-shade" /></ItemPhoto>
      <div className="band" style={{ background: meta.color }}>
        <span>{typeEmoji(item.type)} {item.type}</span>
        <span>{meta.emoji} {item.town || item.area}</span>
      </div>
      <div className="body">
        <h3>{item.name}{item.custom && <span className="tag">added</span>}</h3>
        <div className="meta">
          <Money y={itemPrice(item, age)} />
          {item.hours > 0 && <span className="muted">⏱ {item.hours >= 1 ? `${item.hours}h` : `${item.hours * 60}m`}</span>}
          <Dots n={item.intensity} />
        </div>
        <p className="blurb">{item.blurb}</p>
        <div className="tiers small muted">
          Adult {yen(p.adult ?? 0)}
          {p.teen !== undefined && <> · Teen {yen(p.teen)}</>}
          {p.child !== undefined && <> · Child {yen(p.child)}</>}
          {' · '}Under 6 {yen(p.toddler ?? 0)}
        </div>
        <div className="tags">
          {item.toddlerOk ? <span className="tag ok">🧒 Kid-friendly</span> : <span className="tag no">🚫 Not for young kids</span>}
          {item.adultsOnly && <span className="tag no">🔞 Adults only</span>}
          {item.kind !== 'sight' && <span className="tag">{item.kind === 'package' ? '📦 Package' : item.kind === 'pass' ? '🎟️ Pass' : '🚅 Transit'}</span>}
          {item.verified && <span className="tag ok">✔ Price checked</span>}
        </div>
        {item.book && <p className="book small">📅 {item.book}</p>}
        {need && me && !needPicked && (
          <button className="linklike small" onClick={() => togglePick(me.id, need.id)}>+ also add getting there: {need.name} ({yen(itemPrice(need, age))})</button>
        )}
        <div className="foot">
          <Votes target={item.id} />
          <PickButtons item={item} />
          <div className="links small">
            {item.link && <a href={item.link} target="_blank" rel="noreferrer">Official site ↗</a>}
            <a href={mapsUrl(item)} target="_blank" rel="noreferrer">Map ↗</a>
          </div>
        </div>
      </div>
    </article>
  )
}

export default function Explore() {
  const { items, me, votes } = useData()
  const age = me?.age_group || 'adult'
  const [q, setQ] = useState('')
  const [area, setArea] = useState('')
  const [town, setTown] = useState('')
  const [types, setTypes] = useState<string[]>([])
  const [kind, setKind] = useState<Kind | 'all'>('sight')
  const [maxInt, setMaxInt] = useState(3)
  const [toddler, setToddler] = useState(false)
  const [freeOnly, setFreeOnly] = useState(false)
  const [sort, setSort] = useState<(typeof SORTS)[number]>('Trip order')

  const towns = useMemo(
    () => [...new Set(items.filter(i => !area || i.area === area).map(i => i.town).filter(Boolean))].sort(),
    [items, area],
  )
  const score = (id: string) => votes.filter(v => v.target_id === id).reduce((n, v) => n + v.vote, 0)

  const list = useMemo(() => {
    const ql = q.trim().toLowerCase()
    let r = items.filter(i =>
      (kind === 'all' || i.kind === kind) &&
      (!area || i.area === area) && (!town || i.town === town) &&
      (!types.length || types.includes(i.type)) &&
      i.intensity <= maxInt && (!toddler || i.toddlerOk) && (!freeOnly || itemPrice(i, age) === 0) &&
      (!ql || `${i.name} ${i.town} ${i.blurb} ${i.type}`.toLowerCase().includes(ql)))
    const areaIdx = (a: string) => { const x = (AREAS as readonly string[]).indexOf(a); return x < 0 ? 99 : x }
    const cmp: Record<string, (a: Item, b: Item) => number> = {
      'Trip order': (a, b) => areaIdx(a.area) - areaIdx(b.area) || a.town.localeCompare(b.town) || a.name.localeCompare(b.name),
      'Most liked': (a, b) => score(b.id) - score(a.id) || a.name.localeCompare(b.name),
      'Price: low → high': (a, b) => itemPrice(a, age) - itemPrice(b, age),
      'Price: high → low': (a, b) => itemPrice(b, age) - itemPrice(a, age),
      'Shortest first': (a, b) => a.hours - b.hours,
      'A → Z': (a, b) => a.name.localeCompare(b.name),
    }
    return [...r].sort(cmp[sort])
  }, [items, q, area, town, types, kind, maxInt, toddler, freeOnly, sort, votes, age])

  const toggleType = (t: string) => setTypes(types.includes(t) ? types.filter(x => x !== t) : [...types, t])
  const clear = () => { setQ(''); setArea(''); setTown(''); setTypes([]); setKind('all'); setMaxInt(3); setToddler(false); setFreeOnly(false) }

  return (
    <div className="page">
      <h1>Explore <small>{list.length} of {items.length}</small></h1>
      <p className="muted">Prices shown for you ({me?.name}). Switch person at the top to see someone else's price.</p>

      <div className="filters card">
        <input className="search" placeholder="Search sights, towns, food…" value={q} onChange={e => setQ(e.target.value)} />
        <div className="row">
          <div className="chips">
            {KINDS.map(([k, label]) => <button key={k} className={'chip' + (kind === k ? ' on' : '')} onClick={() => setKind(k)}>{label}</button>)}
          </div>
        </div>
        <div className="row">
          <label>Area <select value={area} onChange={e => { setArea(e.target.value); setTown('') }}>
            <option value="">All areas</option>
            {AREAS.map(a => <option key={a} value={a}>{AREA_META[a].emoji} {a}</option>)}
          </select></label>
          <label>Town <select value={town} onChange={e => setTown(e.target.value)}>
            <option value="">All towns</option>
            {towns.map(t => <option key={t} value={t}>{t}</option>)}
          </select></label>
          <label>Sort <select value={sort} onChange={e => setSort(e.target.value as any)}>{SORTS.map(s => <option key={s}>{s}</option>)}</select></label>
          <label>Effort
            <select value={maxInt} onChange={e => setMaxInt(Number(e.target.value))}>
              <option value={1}>Easy only</option><option value={2}>Up to moderate</option><option value={3}>Anything</option>
            </select></label>
          <label className="check"><input type="checkbox" checked={toddler} onChange={e => setToddler(e.target.checked)} /> Kid-friendly</label>
          <label className="check"><input type="checkbox" checked={freeOnly} onChange={e => setFreeOnly(e.target.checked)} /> Free for me</label>
          <button className="btn btn-ghost small" onClick={clear}>Reset</button>
        </div>
        <div className="chips">
          {TYPES.map(t => <button key={t} className={'chip' + (types.includes(t) ? ' on' : '')} onClick={() => toggleType(t)}>{typeEmoji(t)} {t}</button>)}
        </div>
      </div>

      {list.length === 0 ? <div className="empty">Nothing matches. Try clearing a filter.</div> : (
        <div className="grid">{list.map(i => <ItemCard key={i.id} item={i} />)}</div>
      )}
    </div>
  )
}
