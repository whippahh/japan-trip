import { useEffect, useRef, useState } from 'react'
import { photoFor } from '../lib/photos'
import { areaMeta, typeEmoji } from './ui'
import type { Item } from '../lib/types'

export const photoName = (i: Item) => i.name.replace(/\(.*?\)/g, '').replace(/[–—-].*$/, '').trim()
export const photoQuery = (i: Item) => {
  const name = photoName(i)
  const where = i.town && i.town !== name ? i.town : (i.area === 'Anywhere / Nationwide' ? '' : i.area)
  return `${name} ${where} Japan`.replace(/\s+/g, ' ').trim()
}

/** A photo that fades in over a gradient + emoji. `query` is looked up on Wikipedia when scrolled into view. */
export function Photo({ query, name, emoji = '🗾', color = '#d9432f', className = '', children, style }: {
  query: string; name?: string; emoji?: string; color?: string; className?: string; children?: React.ReactNode; style?: React.CSSProperties
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [src, setSrc] = useState<string | null>(null)
  const [ok, setOk] = useState(false)
  useEffect(() => {
    setSrc(null); setOk(false)
    const el = ref.current
    if (!el) return
    let dead = false
    const go = () => { photoFor(query, name || query).then(u => { if (!dead && u) setSrc(u) }) }
    if (typeof IntersectionObserver === 'undefined') { go(); return () => { dead = true } }
    const io = new IntersectionObserver(es => { if (es.some(e => e.isIntersecting)) { io.disconnect(); go() } }, { rootMargin: '200px' })
    io.observe(el)
    return () => { dead = true; io.disconnect() }
  }, [query, name])
  return (
    <div ref={ref} className={'photo ' + className} style={{ ['--pc' as any]: color, ...style }}>
      <span className="photo-emoji" aria-hidden>{emoji}</span>
      {src && <img src={src} alt="" draggable={false} loading="lazy" referrerPolicy="no-referrer" className={ok ? 'in' : ''} onLoad={() => setOk(true)} onError={() => setSrc(null)} />}
      {children}
    </div>
  )
}

export function ItemPhoto({ item, className, children }: { item: Item; className?: string; children?: React.ReactNode }) {
  return <Photo query={photoQuery(item)} name={photoName(item)} emoji={typeEmoji(item.type)} color={areaMeta(item.area).color} className={className}>{children}</Photo>
}
export function AreaPhoto({ area, className, children }: { area: string; className?: string; children?: React.ReactNode }) {
  const m = areaMeta(area)
  return <Photo query={area === 'Anywhere / Nationwide' ? 'Japan' : area.split(' & ')[0] + ' Japan'} name={area === 'Anywhere / Nationwide' ? 'Japan' : area.split(' & ')[0]} emoji={m.emoji} color={m.color} className={className}>{children}</Photo>
}
