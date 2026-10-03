import { useMemo, useState } from 'react'
import { useData } from '../lib/data'
import { AREAS, AREA_META, TYPES, TYPE_EMOJI } from '../data/meta'
import { itemPrice } from '../lib/pricing'
import { lgetJson } from '../lib/mode'
import type { Item, Kind } from '../lib/types'
import { Icon, Sheet, Segmented } from './kit'
import { ItemTile, Rail, useScore } from './Tiles'

const SORTS = ['Trip order', 'Most liked', 'Price: low → high', 'Shortest first', 'A → Z'] as const
type Sort = (typeof SORTS)[number]
const KINDS: [Kind | 'all', string][] = [['sight', 'Sights'], ['package', 'Tours'], ['pass', 'Passes'], ['all', 'All']]

export default function Discover() {
  const { items, me, picks, votes } = useData()
  const age = me?.age_group || 'adult'
  const score = useScore()
  const [q, setQ] = useState('')
  const [area, setArea] = useState('')
  const [town, setTown] = useState('')
  const [types, setTypes] = useState<string[]>([])
  const [kind, setKind] = useState<Kind | 'all'>('sight')
  const [maxInt, setMaxInt] = useState(3)
  const [toddler, setToddler] = useState(false)
  const [free, setFree] = useState(false)
  const [sort, setSort] = useState<Sort>('Trip order')
  const [sheet, setSheet] = useState(false)
  const likes = useMemo(() => lgetJson<string[]>('jt_interests', []), [])

  const towns = useMemo(() => [...new Set(items.filter(i => !area || i.area === area).map(i => i.town).filter(Boolean))].sort(), [items, area])
  const areaIdx = (a: string) => { const x = (AREAS as readonly string[]).indexOf(a); return x < 0 ? 99 : x }

  const filtersActive = !!(q.trim() || area || town || types.length || kind !== 'sight' || maxInt < 3 || toddler || free || sort !== 'Trip order')
  const activeCount = [kind !== 'sight', maxInt < 3, toddler, free, sort !== 'Trip order'].filter(Boolean).length

  const list = useMemo(() => {
    const ql = q.trim().toLowerCase()
    const r = items.filter(i =>
      (kind === 'all' || i.kind === kind) && (!area || i.area === area) && (!town || i.town === town) &&
      (!types.length || types.includes(i.type)) && i.intensity <= maxInt && (!toddler || i.toddlerOk) &&
      (!free || itemPrice(i, age) === 0) && (!ql || `${i.name} ${i.town} ${i.area} ${i.blurb} ${i.type}`.toLowerCase().includes(ql)))
    const cmp: Record<Sort, (a: Item, b: Item) => number> = {
      'Trip order': (a, b) => areaIdx(a.area) - areaIdx(b.area) || a.town.localeCompare(b.town) || a.name.localeCompare(b.name),
      'Most liked': (a, b) => score(b.id) - score(a.id) || a.name.localeCompare(b.name),
      'Price: low → high': (a, b) => itemPrice(a, age) - itemPrice(b, age),
      'Shortest first': (a, b) => a.hours - b.hours,
      'A → Z': (a, b) => a.name.localeCompare(b.name),
    }
    return [...r].sort(cmp[sort])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, q, area, town, types, kind, maxInt, toddler, free, sort, votes, age])

  const sights = useMemo(() => items.filter(i => i.kind === 'sight'), [items])
  const forYou = useMemo(() => likes.length ? sights.filter(i => likes.includes(i.type) && !picks.some(k => k.person_id === me?.id && k.item_id === i.id)).slice(0, 10) : [], [sights, likes, picks, me])
  const loved = useMemo(() => sights.filter(i => score(i.id) > 0).sort((a, b) => score(b.id) - score(a.id)).slice(0, 10), [sights, votes]) // eslint-disable-line
  const kids = useMemo(() => sights.filter(i => i.toddlerOk && i.intensity === 1 && /theme|animal|nature|museum|park/i.test(i.type + i.name)).slice(0, 10), [sights])
  const cheap = useMemo(() => sights.filter(i => itemPrice(i, age) === 0).slice(0, 10), [sights, age])
  const packages = useMemo(() => items.filter(i => i.kind === 'package').slice(0, 10), [items])

  const toggleType = (t: string) => setTypes(types.includes(t) ? types.filter(x => x !== t) : [...types, t])
  const reset = () => { setQ(''); setArea(''); setTown(''); setTypes([]); setKind('sight'); setMaxInt(3); setToddler(false); setFree(false); setSort('Trip order') }
  const pickArea = (a: string) => { setArea(a === area ? '' : a); setTown('') }

  return (
    <div className="s-page">
      <div className="search-row">
        <label className="searchbox"><Icon n="search" size={18} /><input placeholder="Search places, food, towns…" value={q} onChange={e => setQ(e.target.value)} />
          {q && <button onClick={() => setQ('')} aria-label="Clear"><Icon n="close" size={14} /></button>}</label>
        <button className={'round-btn big' + (activeCount ? ' badged' : '')} onClick={() => setSheet(true)} aria-label="Filters and sort"><Icon n="sliders" size={20} />{activeCount > 0 && <i>{activeCount}</i>}</button>
      </div>

      <div className="rail-chips lg">
        <button className={!area ? 'on' : ''} onClick={() => pickArea('')}>🇯🇵 Everywhere</button>
        {AREAS.map(a => <button key={a} className={area === a ? 'on' : ''} onClick={() => pickArea(a)}>{AREA_META[a].emoji} {a}</button>)}
      </div>
      {area && towns.length > 1 && (
        <div className="rail-chips">
          <button className={!town ? 'on' : ''} onClick={() => setTown('')}>All of {area.split(' & ')[0]}</button>
          {towns.map(t => <button key={t} className={town === t ? 'on' : ''} onClick={() => setTown(t === town ? '' : t)}>{t}</button>)}
        </div>
      )}
      <div className="rail-chips">
        {TYPES.map(t => <button key={t} className={types.includes(t) ? 'on' : ''} onClick={() => toggleType(t)}>{TYPE_EMOJI[t]} {t}</button>)}
      </div>

      {!filtersActive ? (
        <>
          <div className="hint-card">👆 Tap any card to see photos and prices. Tap the <b>♡</b> to add it to your trip.</div>
          {loved.length > 0 && <Rail title="🏆 Group favourites" sub="What the family has voted for" onMore={() => setSort('Most liked')}>{loved.map(i => <ItemTile key={i.id} item={i} rail />)}</Rail>}
          {forYou.length > 0 && <Rail title="✨ Picked for you" sub="Based on what you love">{forYou.map(i => <ItemTile key={i.id} item={i} rail />)}</Rail>}
          {AREAS.filter(a => a !== 'Anywhere / Nationwide').map(a => {
            const xs = sights.filter(i => i.area === a).slice(0, 10)
            return xs.length ? <Rail key={a} title={`${AREA_META[a].emoji} ${a}`} sub={`${sights.filter(i => i.area === a).length} things to do`} onMore={() => pickArea(a)}>{xs.map(i => <ItemTile key={i.id} item={i} rail />)}</Rail> : null
          })}
          {kids.length > 0 && <Rail title="👶 Easy with little ones" onMore={() => { setToddler(true); setMaxInt(1) }}>{kids.map(i => <ItemTile key={i.id} item={i} rail />)}</Rail>}
          {cheap.length > 0 && <Rail title="🆓 Free for you" onMore={() => setFree(true)}>{cheap.map(i => <ItemTile key={i.id} item={i} rail />)}</Rail>}
          {packages.length > 0 && <Rail title="📦 Tours & packages" onMore={() => setKind('package')}>{packages.map(i => <ItemTile key={i.id} item={i} rail />)}</Rail>}
        </>
      ) : (
        <>
          <div className="result-head"><b>{list.length}</b> {list.length === 1 ? 'result' : 'results'}<button className="linkbtn" onClick={reset}>Clear all</button></div>
          {list.length === 0 ? <div className="empty-s"><span>🔎</span><b>Nothing here</b><small>Try removing a filter.</small><button className="btn-soft" onClick={reset}>Clear filters</button></div>
            : <div className="tile-grid">{list.map(i => <ItemTile key={i.id} item={i} />)}</div>}
        </>
      )}

      <Sheet open={sheet} onClose={() => setSheet(false)} title="Filter & sort"
        footer={<div className="foot-actions"><button className="btn-big" onClick={() => setSheet(false)}>Show {list.length} results</button><button className="btn-soft" onClick={reset}>Reset</button></div>}>
        <h4 className="sec">Show</h4>
        <Segmented value={kind} onChange={setKind} options={KINDS} />
        <h4 className="sec">Sort by</h4>
        <div className="radio-list">{SORTS.map(s => <button key={s} className={sort === s ? 'on' : ''} onClick={() => setSort(s)}>{s}<i /></button>)}</div>
        <h4 className="sec">Effort</h4>
        <Segmented value={String(maxInt) as '1' | '2' | '3'} onChange={v => setMaxInt(Number(v))} options={[['1', 'Easy only'], ['2', 'Up to moderate'], ['3', 'Anything']]} />
        <h4 className="sec">Good to know</h4>
        <div className="group">
          <button className="lrow" onClick={() => setToddler(!toddler)}><span className="row-main"><b>👶 Little-one friendly</b></span><span className={'toggle' + (toddler ? ' on' : '')}><i /></span></button>
          <button className="lrow" onClick={() => setFree(!free)}><span className="row-main"><b>🆓 Free for me</b></span><span className={'toggle' + (free ? ' on' : '')}><i /></span></button>
        </div>
      </Sheet>
    </div>
  )
}
