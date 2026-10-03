import React, { useEffect } from 'react'

export function Icon({ n, size = 24 }: { n: string; size?: number }) {
  const p: Record<string, React.ReactNode> = {
    home: <><path d="M3 11.5 12 4l9 7.5" /><path d="M5.5 10v9.5h13V10" /><path d="M10 19.5v-5h4v5" /></>,
    compass: <><circle cx="12" cy="12" r="9" /><path d="m15.5 8.5-2 5-5 2 2-5z" /></>,
    trip: <><path d="M4 18c3-9 6 0 9-8s5-3 7-5" /><circle cx="4" cy="18" r="1.6" /><circle cx="20" cy="5" r="1.6" /></>,
    group: <><circle cx="9" cy="8.5" r="3.2" /><path d="M3 19c.5-3.4 3-5 6-5s5.5 1.6 6 5" /><circle cx="17" cy="9.5" r="2.4" /><path d="M16.5 14.2c2.6-.2 4.3 1.2 4.5 4" /></>,
    check: <><circle cx="12" cy="12" r="9" /><path d="m8 12.3 2.8 2.8L16.2 9.5" /></>,
    heart: <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.600-7 10-7 10z" />,
    sliders: <><path d="M4 7h10M18 7h2M4 17h2M10 17h10" /><circle cx="16" cy="7" r="2" /><circle cx="8" cy="17" r="2" /></>,
    search: <><circle cx="11" cy="11" r="6.5" /><path d="m16 16 4 4" /></>,
    plus: <path d="M12 5v14M5 12h14" />,
    chevron: <path d="m9 5 7 7-7 7" />,
    close: <path d="m6 6 12 12M18 6 6 18" />,
    link: <><path d="M10 14a4 4 0 0 0 5.700 0l3-3a4 4 0 0 0-5.700-5.700l-1 1" /><path d="M14 10a4 4 0 0 0-5.700 0l-3 3a4 4 0 0 0 5.700 5.700l1-1" /></>,
    pin: <><path d="M12 21s-6.500-5.600-6.500-11a6.500 6.500 0 0 1 13 0c0 5.400-6.500 11-6.500 11z" /><circle cx="12" cy="10" r="2.300" /></>,
  }
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {p[n]}
    </svg>
  )
}

export function Sheet({ open, onClose, title, children, footer, tall }: {
  open: boolean; onClose: () => void; title?: React.ReactNode; children: React.ReactNode; footer?: React.ReactNode; tall?: boolean
}) {
  useEffect(() => {
    if (!open) return
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', k)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { window.removeEventListener('keydown', k); document.body.style.overflow = prev }
  }, [open, onClose])
  if (!open) return null
  return (
    <div className="sheet-wrap" role="dialog" aria-modal="true">
      <div className="sheet-back" onClick={onClose} />
      <div className={'sheet' + (tall ? ' tall' : '')}>
        <div className="sheet-grab" onClick={onClose} />
        {title && (
          <div className="sheet-head">
            <h2>{title}</h2>
            <button className="round-btn" onClick={onClose} aria-label="Close"><Icon n="close" size={18} /></button>
          </div>
        )}
        <div className="sheet-body">{children}</div>
        {footer && <div className="sheet-foot">{footer}</div>}
      </div>
    </div>
  )
}

export function Segmented<T extends string>({ value, onChange, options }: { value: T; onChange: (v: T) => void; options: [T, string][] }) {
  const i = Math.max(0, options.findIndex(o => o[0] === value))
  return (
    <div className="seg" role="tablist" style={{ ['--n' as any]: options.length, ['--i' as any]: i }}>
      <span className="seg-thumb" />
      {options.map(([v, label]) => (
        <button key={v} role="tab" aria-selected={v === value} className={v === value ? 'on' : ''} onClick={() => onChange(v)}>{label}</button>
      ))}
    </div>
  )
}

export function Toggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label?: string }) {
  return <button role="switch" aria-checked={on} aria-label={label} className={'toggle' + (on ? ' on' : '')} onClick={() => onChange(!on)}><i /></button>
}

export function Stepper({ value, onChange, min = 0, max = 99, label }: { value: number; onChange: (n: number) => void; min?: number; max?: number; label?: string }) {
  return (
    <span className="stepper" aria-label={label}>
      <button onClick={() => onChange(Math.max(min, value - 1))} disabled={value <= min} aria-label="Less">−</button>
      <b>{value}</b>
      <button onClick={() => onChange(Math.min(max, value + 1))} disabled={value >= max} aria-label="More">+</button>
    </span>
  )
}

export function Ring({ pct, size = 64, label, sub, color = 'var(--accent)' }: { pct: number; size?: number; label: React.ReactNode; sub?: string; color?: string }) {
  const r = (size - 10) / 2, c = 2 * Math.PI * r, p = Math.max(0, Math.min(1, pct))
  return (
    <div className="ring" style={{ width: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--fill)" strokeWidth="7" />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth="7" strokeLinecap="round"
          strokeDasharray={`${c * p} ${c}`} transform={`rotate(-90 ${size / 2} ${size / 2})`} style={{ transition: 'stroke-dasharray .6s ease' }} />
      </svg>
      <b>{label}</b>
      {sub && <small>{sub}</small>}
    </div>
  )
}

export function Row({ icon, title, sub, right, onClick, chevron }: { icon?: React.ReactNode; title: React.ReactNode; sub?: React.ReactNode; right?: React.ReactNode; onClick?: () => void; chevron?: boolean }) {
  const inner = (
    <>
      {icon && <span className="row-icon">{icon}</span>}
      <span className="row-main"><b>{title}</b>{sub && <small>{sub}</small>}</span>
      {right && <span className="row-right">{right}</span>}
      {chevron && <span className="row-chev"><Icon n="chevron" size={16} /></span>}
    </>
  )
  return onClick ? <button className="lrow" onClick={onClick}>{inner}</button> : <div className="lrow">{inner}</div>
}
