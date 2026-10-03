import { useData } from '../lib/data'
import { Avatar, Money, areaMeta, yen } from '../components/ui'
import { ItemPhoto } from '../components/Photo'
import { itemPrice } from '../lib/pricing'
import { Icon } from './kit'
import { useUI } from './ctx'
import type { Item } from '../lib/types'

export const hrs = (h: number) => h <= 0 ? '' : h >= 1 ? `${h}h` : `${Math.round(h * 60)}m`
export const EFFORT = ['', 'Easy', 'Moderate', 'Full-on']

export function useScore() {
  const { votes } = useData()
  return (id: string) => votes.filter(v => v.target_id === id).reduce((n, v) => n + v.vote, 0)
}

export function Heart({ item }: { item: Item }) {
  const { me, picks, togglePick } = useData()
  const on = !!me && picks.some(k => k.person_id === me.id && k.item_id === item.id)
  return (
    <button className={'heart' + (on ? ' on' : '')} aria-label={on ? 'Remove from my trip' : 'Add to my trip'} aria-pressed={on}
      onClick={e => { e.stopPropagation(); me && togglePick(me.id, item.id) }}>
      <Icon n="heart" size={20} />
    </button>
  )
}

/** Photo card. `rail` = fixed width for horizontal scrolling, `grid` = fills its column. */
export function ItemTile({ item, rail }: { item: Item; rail?: boolean }) {
  const { me, picks, people } = useData()
  const ui = useUI()
  const meta = areaMeta(item.area)
  const going = picks.filter(k => k.item_id === item.id).map(k => people.find(p => p.id === k.person_id)).filter(Boolean)
  const price = itemPrice(item, me?.age_group || 'adult')
  return (
    <article className={'tile' + (rail ? ' rail' : '')} onClick={() => ui.openItem(item.id)} role="button" tabIndex={0}
      onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && ui.openItem(item.id)}>
      <ItemPhoto item={item} className="tile-photo">
        <div className="tile-shade" />
        <span className="badge">{meta.emoji} {item.town || item.area}</span>
        <Heart item={item} />
        {going.length > 0 && (
          <div className="tile-going">{going.slice(0, 3).map(p => <Avatar key={p!.id} name={p!.name} size={22} />)}{going.length > 3 && <small>+{going.length - 3}</small>}</div>
        )}
      </ItemPhoto>
      <div className="tile-body">
        <b>{item.name}</b>
        <small>{price === 0 ? 'Free' : yen(price)}{item.hours > 0 ? ` · ${hrs(item.hours)}` : ''} · {EFFORT[item.intensity]}</small>
      </div>
    </article>
  )
}

export function Rail({ title, sub, onMore, children }: { title: string; sub?: string; onMore?: () => void; children: React.ReactNode }) {
  return (
    <section className="rail-sec">
      <div className="rail-head">
        <div><h3>{title}</h3>{sub && <small>{sub}</small>}</div>
        {onMore && <button className="linkbtn" onClick={onMore}>See all</button>}
      </div>
      <div className="rail-scroll">{children}</div>
    </section>
  )
}
export { Money }
