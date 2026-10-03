// Free photos from Wikipedia/Wikimedia Commons, looked up on demand and cached on this device.
// If anything fails the UI simply keeps its colourful gradient + emoji, so nothing ever breaks.
const mem = new Map<string, string | null>()
const inflight = new Map<string, Promise<string | null>>()
const queue: (() => void)[] = []
let active = 0
const MAX = 4
const PFX = 'jt_ph5:'

const getLs = (k: string) => { try { return localStorage.getItem(PFX + k) } catch { return null } }
const setLs = (k: string, v: string) => { try { localStorage.setItem(PFX + k, v) } catch { /* quota */ } }

function pump() {
  while (active < MAX && queue.length) { active++; queue.shift()!() }
}

const GENERIC = new Set(['the', 'of', 'and', 'in', 'at', 'to', 'a', 'japan', 'japanese', 'museum', 'park', 'garden', 'gardens', 'temple', 'shrine', 'castle', 'tokyo', 'station', 'city', 'area', 'town', 'tour', 'day', 'trip', 'ticket', 'pass', 'experience', 'visit', 'onsen', 'hot', 'spring', 'springs', 'old', 'new', 'national'])
const toks = (s: string) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter(Boolean).map(w => w.replace(/s$/, ''))
/** How well a page title describes `name`: share of the name's distinctive words it contains (0 = unrelated). */
function titleScore(title: string, name: string) {
  const want = toks(name).filter(w => w.length > 1)
  const sig = want.filter(w => !GENERIC.has(w))
  const have = new Set(toks(title))
  const pool = sig.length ? sig : want
  if (!pool.length) return 0
  return pool.filter(w => have.has(w)).length / pool.length
}

async function search(q: string, name: string): Promise<string | null> {
  const url = 'https://en.wikipedia.org/w/api.php?action=query&format=json&origin=*&redirects=1&generator=search&gsrnamespace=0&gsrlimit=10' +
    '&prop=pageimages&piprop=thumbnail&pithumbsize=720&gsrsearch=' + encodeURIComponent(q)
  const ctl = new AbortController()
  const t = setTimeout(() => ctl.abort(), 9000)
  try {
    const r = await fetch(url, { signal: ctl.signal })
    if (!r.ok) throw new Error(String(r.status))
    const j = await r.json()
    const pages: any[] = Object.values(j?.query?.pages || {})
    let best: any = null, bs = 0
    for (const p of pages.sort((a, b) => (a.index ?? 9) - (b.index ?? 9))) {
      if (!p?.thumbnail?.source) continue
      const sc = titleScore(String(p.title || ''), name)
      if (sc > bs) { bs = sc; best = p }   // ties keep the higher search rank
    }
    return best ? (best.thumbnail.source as string) : ''
  } finally { clearTimeout(t) }
}

async function lookup(q: string, name: string): Promise<string | null> {
  const first = await search(q, name)
  if (first) return first
  const simple = name + ' Japan'
  return simple === q ? '' : search(simple, name)
}

export function photoFor(q: string, name: string = q): Promise<string | null> {
  if (mem.has(q)) return Promise.resolve(mem.get(q) ?? null)
  const cached = getLs(q)
  if (cached !== null) { const v = cached || null; mem.set(q, v); return Promise.resolve(v) }
  const going = inflight.get(q)
  if (going) return going
  const p = new Promise<string | null>(resolve => {
    queue.push(async () => {
      try {
        const v = await lookup(q, name)
        setLs(q, v || '')
        mem.set(q, v || null)
        resolve(v || null)
      } catch { resolve(null) } // network hiccup: don't cache, try again next visit
      finally { active--; inflight.delete(q); pump() }
    })
    pump()
  })
  inflight.set(q, p)
  return p
}
