// Free photos from Wikipedia/Wikimedia Commons, looked up on demand and cached on this device.
// If anything fails the UI simply keeps its colourful gradient + emoji, so nothing ever breaks.
const mem = new Map<string, string | null>()
const inflight = new Map<string, Promise<string | null>>()
const queue: (() => void)[] = []
let active = 0
const MAX = 4
const PFX = 'jt_ph3:'

const getLs = (k: string) => { try { return localStorage.getItem(PFX + k) } catch { return null } }
const setLs = (k: string, v: string) => { try { localStorage.setItem(PFX + k, v) } catch { /* quota */ } }

function pump() {
  while (active < MAX && queue.length) { active++; queue.shift()!() }
}

async function lookup(q: string): Promise<string | null> {
  const url = 'https://en.wikipedia.org/w/api.php?action=query&format=json&origin=*&redirects=1&generator=search&gsrnamespace=0&gsrlimit=3' +
    '&prop=pageimages&piprop=thumbnail&pithumbsize=720&gsrsearch=' + encodeURIComponent(q)
  const ctl = new AbortController()
  const t = setTimeout(() => ctl.abort(), 9000)
  try {
    const r = await fetch(url, { signal: ctl.signal })
    if (!r.ok) throw new Error(String(r.status))
    const j = await r.json()
    const pages: any[] = Object.values(j?.query?.pages || {})
    pages.sort((a, b) => (a.index ?? 9) - (b.index ?? 9))
    const hit = pages.find(p => p?.thumbnail?.source)
    return hit ? (hit.thumbnail.source as string) : ''
  } finally { clearTimeout(t) }
}

export function photoFor(q: string): Promise<string | null> {
  if (mem.has(q)) return Promise.resolve(mem.get(q) ?? null)
  const cached = getLs(q)
  if (cached !== null) { const v = cached || null; mem.set(q, v); return Promise.resolve(v) }
  const going = inflight.get(q)
  if (going) return going
  const p = new Promise<string | null>(resolve => {
    queue.push(async () => {
      try {
        const v = await lookup(q)
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
