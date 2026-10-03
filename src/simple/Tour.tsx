import { useRef, useState } from 'react'

const SLIDES: { emoji: string; title: string; text: string; art: React.ReactNode }[] = [
  {
    emoji: '🧭', title: 'Discover places',
    text: 'Swipe through sights, food, day trips and passes. Tap any card for photos, prices and what to know, then tap the ♡ to add it to your trip.',
    art: (
      <div className="art-card">
        <div className="art-photo" style={{ ['--pc' as any]: '#a8324a' }}><span>⛩️</span><i className="art-heart">♡</i></div>
        <b>Fushimi Inari</b><small>Kyoto · Free · 2h</small>
      </div>
    ),
  },
  {
    emoji: '🗺️', title: 'Build your trip',
    text: 'Start from a ready-made route (a clean line, no zig-zagging) or build your own. Every day shows how you get between stops, and it all appears on an English map.',
    art: (
      <div className="art-stack">
        <div className="art-day"><b>Day 1</b><span>🗼 Tokyo Skytree</span></div>
        <div className="art-leg">🚄 Shinkansen · 2h 15m</div>
        <div className="art-day"><b>Day 4</b><span>🦌 Nara Park</span></div>
      </div>
    ),
  },
  {
    emoji: '🗳️', title: 'Vote together',
    text: 'Swipe a card right to say "I\'m in" or left to pass. Add your own ideas too. The group favourites float to the top.',
    art: (
      <div className="art-deck">
        <div className="art-card tilt"><div className="art-photo" style={{ ['--pc' as any]: '#2f7fb0' }}><span>🎢</span></div><b>Universal Studios</b></div>
        <div className="art-votes"><span>👎</span><span>🤔</span><span>👍</span></div>
      </div>
    ),
  },
  {
    emoji: '✅', title: 'Get ready',
    text: 'Tick off passports, tickets, eSIMs and more for everyone in your household. Each item has quick links and tips so you are never stuck.',
    art: (
      <div className="art-list">
        <div><i className="on">✓</i> Passport ready</div>
        <div><i className="on">✓</i> Flights booked</div>
        <div><i>&nbsp;</i> Visit Japan Web <u>Open guide ›</u></div>
      </div>
    ),
  },
  {
    emoji: '📲', title: 'Keep it handy',
    text: 'On iPhone: tap the Share button in Safari, then "Add to Home Screen". It opens like an app, and everyone stays in sync.',
    art: (
      <div className="art-share"><span className="sq">⬆️</span><b>Add to Home Screen</b></div>
    ),
  },
]

export function TourSlides({ onDone, doneLabel = "Let's go" }: { onDone: () => void; doneLabel?: string }) {
  const [i, setI] = useState(0)
  const ref = useRef<HTMLDivElement>(null)
  const go = (n: number) => {
    setI(n)
    const el = ref.current
    if (el) el.scrollTo({ left: n * el.clientWidth, behavior: 'smooth' })
  }
  const last = i === SLIDES.length - 1
  return (
    <div className="tour">
      <div className="tour-track" ref={ref} onScroll={e => { const el = e.currentTarget; const n = Math.round(el.scrollLeft / el.clientWidth); if (n !== i) setI(n) }}>
        {SLIDES.map(s => (
          <section key={s.title} className="tour-slide">
            <div className="tour-art">{s.art}</div>
            <h2>{s.emoji} {s.title}</h2>
            <p>{s.text}</p>
          </section>
        ))}
      </div>
      <div className="dots-nav">{SLIDES.map((_, n) => <button key={n} className={n === i ? 'on' : ''} onClick={() => go(n)} aria-label={`Slide ${n + 1}`} />)}</div>
      <div className="tour-actions">
        {!last && <button className="btn-soft" onClick={onDone}>Skip</button>}
        <button className="btn-big" onClick={() => last ? onDone() : go(i + 1)}>{last ? doneLabel : 'Next'}</button>
      </div>
    </div>
  )
}
