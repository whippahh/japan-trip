import { useEffect, useMemo, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useData } from '../lib/data'
import { buildRoute, travelLabel } from '../lib/route'
import { Avatar } from '../components/ui'
import { yen } from '../components/ui'

const COLORS = ['#d9432f', '#2f7fb0', '#5f8a4d', '#8a5a9a', '#e08a1e', '#3b8a8a', '#a8324a', '#6b6b8a']
const esc = (s: string) => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] as string))

export default function MapPage() {
  const { me, people, picks, getItem } = useData()
  const [sel, setSel] = useState<string[]>([me!.id])
  const box = useRef<HTMLDivElement>(null)
  const map = useRef<L.Map | null>(null)
  const layer = useRef<L.LayerGroup | null>(null)

  const routes = useMemo(
    () => sel.map(id => people.find(p => p.id === id)).filter(Boolean).map((p, k) => ({ p: p!, color: COLORS[k % COLORS.length], k, r: buildRoute(p!.id, picks, getItem) })),
    [sel, people, picks, getItem],
  )

  useEffect(() => {
    if (!box.current || map.current) return
    const m = L.map(box.current, { scrollWheelZoom: false }).setView([35.4, 136.5], 6)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18, attribution: '© OpenStreetMap contributors' }).addTo(m)
    layer.current = L.layerGroup().addTo(m)
    map.current = m
    return () => { m.remove(); map.current = null; layer.current = null }
  }, [])

  useEffect(() => {
    const m = map.current, g = layer.current
    if (!m || !g) return
    g.clearLayers()
    const bounds: [number, number][] = []
    routes.forEach(({ p, color, k, r }) => {
      const off = k * 0.0006
      const pts = r.stops.map(s => [s.at[0] + off, s.at[1] + off] as [number, number])
      if (pts.length > 1) L.polyline(pts, { color, weight: 4, opacity: 0.8 }).addTo(g)
      // little direction arrows at the middle of each leg
      for (let i = 1; i < pts.length; i++) {
        const a = pts[i - 1], b = pts[i]
        if (Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) < 0.01) continue
        const ang = (Math.atan2(b[1] - a[1], b[0] - a[0]) * 180) / Math.PI // 0 = north
        const bearing = 90 - (Math.atan2(b[0] - a[0], b[1] - a[1]) * 180) / Math.PI
        void ang
        L.marker([(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], {
          interactive: false,
          icon: L.divIcon({ className: 'arrow', html: `<span style="color:${color};transform:rotate(${bearing - 90}deg)">➤</span>`, iconSize: [16, 16], iconAnchor: [8, 8] }),
        }).addTo(g)
      }
      r.stops.forEach((s, i) => {
        const travel = s.travel ? `<div class="pop-travel">From stop ${i}: ${esc(travelLabel(s.travel))}</div>` : '<div class="pop-travel">Start of route</div>'
        const trans = s.transit.length ? `<div class="pop-travel">Picked today: ${s.transit.map(t => esc(t.name)).join('; ')}</div>` : ''
        L.marker(pts[i], {
          icon: L.divIcon({ className: 'pin', html: `<span style="background:${color}">${s.n}</span>`, iconSize: [26, 26], iconAnchor: [13, 13] }),
        }).addTo(g).bindPopup(
          `<b>${esc(p.name)} · Day ${s.day}</b><br>Stop ${s.n}: ${esc(s.item.name)}<br><small>${esc(s.item.town || s.item.area)}${s.item.hours ? ' · ~' + s.item.hours + 'h' : ''}</small>${travel}${trans}`,
        )
        bounds.push(pts[i])
      })
    })
    if (bounds.length) m.fitBounds(bounds, { padding: [40, 40], maxZoom: 12 })
    else m.setView([35.4, 136.5], 6)
  }, [routes])

  const toggle = (id: string) => setSel(sel.includes(id) ? sel.filter(x => x !== id) : [...sel, id])

  return (
    <div className="page">
      <h1>Route map</h1>
      <p className="muted">Picks that have a <b>day</b> appear here as a path in day order. Set days in the <a href="#/calc">calculator</a> or start from a <a href="#/plans">ready-made plan</a>. Within a day, stops are ordered to keep the path short.</p>
      <div className="chips">
        {people.map(p => {
          const idx = sel.indexOf(p.id)
          return (
            <button key={p.id} className={'chip' + (idx >= 0 ? ' on' : '')} style={idx >= 0 ? { background: COLORS[idx % COLORS.length], borderColor: COLORS[idx % COLORS.length] } : undefined} onClick={() => toggle(p.id)}>
              <Avatar name={p.name} size={18} /> {p.name}
            </button>
          )
        })}
        <button className="btn btn-ghost small" onClick={() => setSel(people.map(p => p.id))}>Everyone</button>
        <button className="btn btn-ghost small" onClick={() => setSel([me!.id])}>Just me</button>
      </div>
      <div className="mapbox" ref={box} />
      <div className="cols2 routes">
        {routes.map(({ p, color, r }) => (
          <section key={p.id} className="card pad">
            <h3><span className="dot" style={{ background: color }} /> {p.name} <small className="muted">{r.stops.length} stops · ~{Math.round(r.km)} km</small></h3>
            {r.warnings.map(w => <p key={w} className="warn-line">⚠ {w}</p>)}
            {r.unscheduled > 0 && <p className="small muted">{r.unscheduled} pick(s) have no day yet, so they're not on the map. <a href="#/calc">Assign days</a>.</p>}
            {r.unmapped > 0 && <p className="small muted">{r.unmapped} pick(s) have no fixed place (e.g. nationwide chains).</p>}
            {r.stops.length === 0 ? <p className="muted">No scheduled stops yet. <a href="#/plans">Pick a ready-made plan</a>.</p> : (
              <ol className="stops-list">
                {r.stops.map(s => (
                  <li key={s.n}>
                    {s.travel && s.travel.mode !== 'Walk' && <div className="leg">↳ {travelLabel(s.travel)}</div>}
                    {s.travel && s.travel.mode === 'Walk' && <div className="leg">↳ Walk · {s.travel.mins} min</div>}
                    {s.transit.map(t => <div key={t.id} className="leg">{t.kind === 'pass' ? '🎟️' : '🚅'} {t.name} ({yen(t.prices.adult ?? 0)})</div>)}
                    <span className="pill" style={{ background: color }}>{s.n}</span> <span className="muted small">Day {s.day}</span> <b>{s.item.name}</b> <span className="muted small">· {s.item.town || s.item.area}</span>
                  </li>
                ))}
              </ol>
            )}
          </section>
        ))}
      </div>
    </div>
  )
}
