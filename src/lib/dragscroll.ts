// Mouse drag-to-scroll for horizontal rails (touch screens already swipe natively).
const SEL = '.rail-scroll, .rail-chips, .scroll-x, .tour-track'
let on = false

export function installDragScroll() {
  if (on || typeof document === 'undefined') return
  on = true
  let el: HTMLElement | null = null, x0 = 0, s0 = 0, moved = false, id = -1
  document.addEventListener('pointerdown', e => {
    if (e.pointerType !== 'mouse' || e.button !== 0) return
    const t = (e.target as HTMLElement | null)?.closest?.(SEL) as HTMLElement | null
    if (!t || t.scrollWidth <= t.clientWidth) return
    el = t; x0 = e.clientX; s0 = t.scrollLeft; moved = false; id = e.pointerId
  })
  document.addEventListener('pointermove', e => {
    if (!el || e.pointerId !== id) return
    const dx = e.clientX - x0
    if (!moved && Math.abs(dx) > 5) { moved = true; el.classList.add('dragging') }
    if (moved) { el.scrollLeft = s0 - dx; e.preventDefault() }
  })
  const end = (e: PointerEvent) => {
    if (!el || e.pointerId !== id) return
    const t = el
    el = null
    if (!moved) return
    if (t.classList.contains('tour-track')) {
      const n = Math.round(t.scrollLeft / t.clientWidth)
      t.classList.remove('dragging')
      t.scrollTo({ left: n * t.clientWidth, behavior: 'smooth' })
    } else t.classList.remove('dragging')
    // swallow the click that would otherwise open the card we dragged from
    const stop = (c: MouseEvent) => { c.stopPropagation(); c.preventDefault() }
    document.addEventListener('click', stop, { capture: true, once: true })
    setTimeout(() => document.removeEventListener('click', stop, true), 50)
  }
  document.addEventListener('pointerup', end)
  document.addEventListener('pointercancel', end)
  document.addEventListener('dragstart', e => { if ((e.target as HTMLElement)?.closest?.(SEL)) e.preventDefault() })
}
