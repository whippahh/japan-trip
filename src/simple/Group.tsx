import { useEffect, useMemo, useRef, useState } from 'react'
import { useData } from '../lib/data'
import { Avatar, yen } from '../components/ui'
import { ItemPhoto } from '../components/Photo'
import { AREAS, AREA_META, TYPES } from '../data/meta'
import { itemPrice, suggestionToItem } from '../lib/pricing'
import { applicable } from '../pages/Checklist'
import { balances } from '../pages/Tickets'
import { lgetJson } from '../lib/mode'
import { AGE_LABEL, type AgeGroup, type Item } from '../lib/types'
import { Icon, Segmented, Sheet, Toggle } from './kit'
import { AgePills, AGE_SHORT } from './Sheets'
import { EFFORT, hrs, ItemTile, useScore } from './Tiles'
import { useUI } from './ctx'

type Seg = 'family' | 'vote' | 'ideas' | 'tickets'

/* ───────── Family ───────── */
function AddMember({ hid, onDone }: { hid: string | null; onDone?: () => void }) {
  const { addPerson, me } = useData()
  const [name, setName] = useState('')
  const [age, setAge] = useState<AgeGroup>('adult')
  const add = async () => {
    if (!name.trim()) return
    await addPerson({ name, household_id: hid, age_group: age, tier: me?.tier, arrive: me?.arrive, depart: me?.depart })
    setName(''); onDone?.()
  }
  return (
    <div className="add-box">
      <input className="ob-input" autoFocus placeholder="Name (partner, child, parent…)" value={name} onChange={e => setName(e.target.value)} onKeyDown={e => e.key === 'Enter' && add()} />
      <AgePills value={age} onChange={setAge} />
      <button className="btn-big" disabled={!name.trim()} onClick={add}>Add to household</button>
      <p className="muted small">They get your dates and eating style to start with (editable). If they use the site themselves, they just type this name to sign in as themselves.</p>
    </div>
  )
}

function Family() {
  const { me, people, households, checks, renameHousehold, addHousehold, updatePerson } = useData()
  const ui = useUI()
  const [adding, setAdding] = useState(false)
  if (!me) return null
  const mine = households.find(h => h.id === me.household_id)
  const rest = households.filter(h => h.id !== me.household_id)
  const prog = (p: typeof me) => { const t = applicable(p); const d = t.filter(c => checks.some(x => x.person_id === p.id && x.key === c.key && x.done)).length; return `${d}/${t.length} ready` }
  const person = (p: typeof me) => (
    <button key={p.id} className="lrow" onClick={() => ui.openPerson(p.id)}>
      <Avatar name={p.name} size={38} />
      <span className="row-main"><b>{p.name}{p.id === me.id && <em className="you">You</em>}</b><small>{AGE_LABEL[p.age_group]} · {prog(p)}</small></span>
      <span className="row-chev"><Icon n="chevron" size={16} /></span>
    </button>
  )
  const mates = people.filter(p => p.household_id === me.household_id)
  return (
    <>
      {mine ? (
        <>
          <div className="hh-title">
            <input className="inline-title" value={mine.name} onChange={e => renameHousehold(mine.id, e.target.value)} aria-label="Household name" />
            <small>Your household · tap the name to rename</small>
          </div>
          <div className="group">{mates.map(person)}</div>
          <button className="btn-big" onClick={() => setAdding(true)}>＋ Add someone to my household</button>
        </>
      ) : (
        <div className="note-box">You're not in a household yet. <button className="linkbtn" onClick={async () => { const h = await addHousehold(`${me.name}'s household`); updatePerson(me.id, { household_id: h.id }) }}>Create one</button></div>
      )}
      {rest.map(h => (
        <section key={h.id}>
          <h3 className="s-h">{h.name}</h3>
          <div className="group">{people.filter(p => p.household_id === h.id).map(person)}</div>
        </section>
      ))}
      {people.some(p => !p.household_id) && (<><h3 className="s-h">No household</h3><div className="group">{people.filter(p => !p.household_id).map(person)}</div></>)}
      <Sheet open={adding} onClose={() => setAdding(false)} title="Add to your household"><AddMember hid={me.household_id} onDone={() => setAdding(false)} /></Sheet>
    </>
  )
}

/* ───────── Vote deck ───────── */
function VoteDeck() {
  const { items, me, votes, setVote, personName } = useData()
  const ui = useUI()
  const score = useScore()
  const [area, setArea] = useState('')
  const [skipped, setSkipped] = useState<string[]>([])
  const [dx, setDx] = useState(0)
  const [dy, setDy] = useState(0)
  const [fly, setFly] = useState<number | null>(null)
  const [last, setLast] = useState<string | null>(null)
  const start = useRef<{ x: number; y: number } | null>(null)
  const likes = useMemo(() => lgetJson<string[]>('jt_interests', []), [])
  const areaIdx = (a: string) => { const x = (AREAS as readonly string[]).indexOf(a); return x < 0 ? 99 : x }

  const queue = useMemo(() => items
    .filter(i => i.kind === 'sight' && (!area || i.area === area) && !votes.some(v => v.target_id === i.id && v.person_id === me?.id) && !skipped.includes(i.id))
    .sort((a, b) => Number(likes.includes(b.type)) - Number(likes.includes(a.type)) || score(b.id) - score(a.id) || areaIdx(a.area) - areaIdx(b.area)),
  // eslint-disable-next-line react-hooks/exhaustive-deps
  [items, votes, area, skipped, me, likes])
  const top = queue[0], next = queue[1]
  useEffect(() => { setDx(0); setDy(0) }, [top?.id])
  if (!me) return null

  const commit = (v: number) => {
    if (!top || fly !== null) return
    setFly(v)
    const id = top.id
    setTimeout(() => { setVote(id, me.id, v); setLast(id); setFly(null); setDx(0); setDy(0) }, 220)
  }
  const down = (e: React.PointerEvent) => { start.current = { x: e.clientX, y: e.clientY }; (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId) }
  const move = (e: React.PointerEvent) => { if (!start.current) return; setDx(e.clientX - start.current.x); setDy(Math.min(0, e.clientY - start.current.y)) }
  const up = () => {
    if (!start.current) return
    start.current = null
    if (dx > 90) commit(1); else if (dx < -90) commit(-1); else if (dy < -110) commit(0)
    else { if (Math.abs(dx) < 6 && Math.abs(dy) < 6 && top) ui.openItem(top.id); setDx(0); setDy(0) }
  }
  const x = fly === 1 ? 520 : fly === -1 ? -520 : fly === 0 ? 0 : dx
  const y = fly === 0 ? -520 : dy
  const style = { transform: `translate(${x}px, ${y}px) rotate(${x / 24}deg)`, transition: start.current ? 'none' : 'transform .22s ease' }

  const ranked = items.filter(i => votes.some(v => v.target_id === i.id)).sort((a, b) => score(b.id) - score(a.id) || a.name.localeCompare(b.name)).slice(0, 10)
  const card = (i: Item, front: boolean) => (
    <div className={'deck-card' + (front ? ' front' : ' back')} style={front ? style : undefined}
      {...(front ? { onPointerDown: down, onPointerMove: move, onPointerUp: up, onPointerCancel: up } : {})}>
      <ItemPhoto item={i} className="deck-photo">
        <div className="tile-shade deep" />
        {front && <>
          <span className="stamp yes" style={{ opacity: Math.max(0, Math.min(1, dx / 90)) }}>I'M IN</span>
          <span className="stamp no" style={{ opacity: Math.max(0, Math.min(1, -dx / 90)) }}>PASS</span>
          <span className="stamp maybe" style={{ opacity: Math.max(0, Math.min(1, -dy / 100)) }}>MAYBE</span>
        </>}
        <div className="deck-text"><span className="badge">{AREA_META[i.area]?.emoji} {i.town || i.area}</span><h3>{i.name}</h3>
          <small>{itemPrice(i, me.age_group) === 0 ? 'Free' : yen(itemPrice(i, me.age_group))}{i.hours ? ` · ${hrs(i.hours)}` : ''} · {EFFORT[i.intensity]}</small></div>
      </ItemPhoto>
      <p>{i.blurb}</p>
    </div>
  )
  return (
    <>
      <div className="rail-chips">
        <button className={!area ? 'on' : ''} onClick={() => setArea('')}>Everywhere</button>
        {AREAS.map(a => <button key={a} className={area === a ? 'on' : ''} onClick={() => setArea(area === a ? '' : a)}>{AREA_META[a].emoji} {a}</button>)}
      </div>
      {top ? (
        <>
          <p className="muted small center">Swipe right = I'm in · left = pass · up = maybe · tap for details · {queue.length} left</p>
          <div className="deck">{next && card(next, false)}{card(top, true)}</div>
          <div className="vote-bar">
            <button className="vb no" onClick={() => commit(-1)} aria-label="Pass">👎</button>
            <button className="vb maybe" onClick={() => commit(0)} aria-label="Maybe">🤔</button>
            <button className="vb yes" onClick={() => commit(1)} aria-label="I'm in">👍</button>
          </div>
          <div className="link-row center">
            <button className="linkbtn" onClick={() => setSkipped([...skipped, top.id])}>Skip for now</button>
            {last && <button className="linkbtn" onClick={() => { setVote(last, me.id, null); setLast(null) }}>Undo last vote</button>}
          </div>
        </>
      ) : (
        <div className="empty-s big"><span>🎉</span><b>You've voted on everything{area ? ' here' : ''}</b><small>New ideas from the family will show up here.</small>
          {last && <button className="btn-soft" onClick={() => { setVote(last, me.id, null); setLast(null) }}>Undo last vote</button>}
          {skipped.length > 0 && <button className="btn-soft" onClick={() => setSkipped([])}>Show skipped ({skipped.length})</button>}</div>
      )}
      <h3 className="s-h">🏆 Group favourites</h3>
      {ranked.length === 0 ? <p className="muted">No votes yet.</p> : (
        <div className="group">
          {ranked.map((i, n) => {
            const yes = votes.filter(v => v.target_id === i.id && v.vote === 1).map(v => personName(v.person_id))
            return (
              <button key={i.id} className="lrow" onClick={() => ui.openItem(i.id)}>
                <span className="rank">{n + 1}</span>
                <span className="row-main"><b>{i.name}</b><small>{yes.length ? `👍 ${yes.join(', ')}` : i.town || i.area}</small></span>
                <span className="row-right score-pill">{score(i.id) >= 0 ? '+' : ''}{score(i.id)}</span>
              </button>
            )
          })}
        </div>
      )}
    </>
  )
}

/* ───────── Ideas ───────── */
function Ideas() {
  const { me, suggestions, addSuggestion, deleteSuggestion, personName, votes } = useData()
  const score = useScore()
  const [open, setOpen] = useState(false)
  const [f, setF] = useState({ title: '', url: '', area: '', type: '', adult: '', child: '', note: '' })
  const sorted = useMemo(() => [...suggestions].sort((a, b) => score(b.id) - score(a.id) || (b.created_at || '').localeCompare(a.created_at || '')), [suggestions, votes]) // eslint-disable-line
  if (!me) return null
  const submit = async () => {
    if (!f.title.trim()) return
    await addSuggestion({
      title: f.title.trim(), url: f.url.trim() || null, area: f.area || null, type: f.type || null,
      price_adult: Math.max(0, Number(f.adult) || 0), price_child: f.child === '' ? null : Math.max(0, Number(f.child) || 0),
      note: f.note.trim() || null, added_by: me.id,
    })
    setF({ title: '', url: '', area: '', type: '', adult: '', child: '', note: '' }); setOpen(false)
  }
  return (
    <>
      <button className="btn-big" onClick={() => setOpen(true)}>💡 Suggest something</button>
      <p className="muted small center">Found a place, tour or restaurant that isn't in the app? Add it and the family can vote and add it to their trips.</p>
      {sorted.length === 0 ? <div className="empty-s"><span>💡</span><b>No ideas yet</b><small>Be the first.</small></div> : (
        <div className="tile-grid">
          {sorted.map(s => (
            <div key={s.id} className="idea">
              <ItemTile item={suggestionToItem(s)} />
              <div className="idea-by"><Avatar name={personName(s.added_by)} size={20} /> {personName(s.added_by)}
                <button className="linkbtn danger" onClick={() => confirm('Delete this suggestion?') && deleteSuggestion(s.id)}>Delete</button></div>
            </div>
          ))}
        </div>
      )}
      <Sheet open={open} onClose={() => setOpen(false)} title="Suggest something" tall footer={<button className="btn-big" disabled={!f.title.trim()} onClick={submit}>Add suggestion</button>}>
        <div className="stack">
          <label className="fld">What is it?<input placeholder="e.g. Kurashiki canal day trip" value={f.title} onChange={e => setF({ ...f, title: e.target.value })} /></label>
          <label className="fld">Link (optional)<input placeholder="https://…" value={f.url} onChange={e => setF({ ...f, url: e.target.value })} /></label>
          <div className="two">
            <label className="fld">Area<select value={f.area} onChange={e => setF({ ...f, area: e.target.value })}><option value="">Pick…</option>{AREAS.map(a => <option key={a}>{a}</option>)}</select></label>
            <label className="fld">Type<select value={f.type} onChange={e => setF({ ...f, type: e.target.value })}><option value="">Pick…</option>{TYPES.map(a => <option key={a}>{a}</option>)}</select></label>
          </div>
          <div className="two">
            <label className="fld">Adult price ¥<input type="number" min={0} inputMode="numeric" value={f.adult} onChange={e => setF({ ...f, adult: e.target.value })} /></label>
            <label className="fld">Child price ¥<input type="number" min={0} inputMode="numeric" value={f.child} onChange={e => setF({ ...f, child: e.target.value })} /></label>
          </div>
          <label className="fld">Why is it good?<textarea value={f.note} onChange={e => setF({ ...f, note: e.target.value })} placeholder="Anything we should know?" /></label>
        </div>
      </Sheet>
    </>
  )
}

/* ───────── Tickets ───────── */
function Tickets() {
  const { me, people, households, tickets, picks, items, getItem, addTicket, updateTicket, deleteTicket, personName } = useData()
  const [open, setOpen] = useState(false)
  const [itemId, setItemId] = useState('')
  const [label, setLabel] = useState('')
  const [amount, setAmount] = useState('')
  const [bought, setBought] = useState(true)
  const [covers, setCovers] = useState<string[]>([])
  const picked = useMemo(() => items.filter(i => picks.some(k => k.item_id === i.id)).sort((a, b) => a.name.localeCompare(b.name)), [items, picks])
  if (!me) return null
  const moves = balances(tickets)
  const mineMoves = moves.filter(m => m.from === me.id || m.to === me.id)
  const missing = picked.map(it => {
    const going = picks.filter(k => k.item_id === it.id).map(k => k.person_id)
    const have = new Set(tickets.filter(t => t.item_id === it.id && t.status === 'bought').flatMap(t => t.covers))
    return { it, miss: going.filter(g => !have.has(g)) }
  }).filter(c => c.it.kind !== 'transit' && c.it.kind !== 'pass' && c.miss.length)

  const choose = (id: string) => {
    setItemId(id)
    const it = getItem(id); if (!it) return
    const who = picks.filter(k => k.item_id === id).map(k => k.person_id)
    setLabel(it.name); setCovers(who)
    setAmount(String(Math.round(who.reduce((n, pid) => n + itemPrice(it, people.find(p => p.id === pid)?.age_group || 'adult'), 0))))
  }
  const save = async () => {
    if (!label.trim()) return
    await addTicket({ label: label.trim(), item_id: itemId || null, amount_yen: Math.max(0, Number(amount) || 0), status: bought ? 'bought' : 'planned', paid_by: bought ? me.id : null, covers, settled: false, note: null })
    setItemId(''); setLabel(''); setAmount(''); setCovers([]); setOpen(false)
  }
  return (
    <>
      <div className="note-box">This is a ledger only. No money moves through the app. Settle up with your own bank or payment app.</div>
      <button className="btn-big" onClick={() => setOpen(true)}>🎟️ Log a ticket or booking</button>

      <h3 className="s-h">Who owes who</h3>
      {moves.length === 0 ? <p className="muted">All square, or nothing logged yet.</p> : (
        <div className="group">{(mineMoves.length ? mineMoves : moves).map((m, i) => (
          <div key={i} className="lrow"><span className="row-main"><b>{personName(m.from)}</b> owes <b>{personName(m.to)}</b></span><span className="row-right pay">{yen(m.amount)}</span></div>
        ))}</div>
      )}
      {mineMoves.length > 0 && moves.length > mineMoves.length && <p className="muted small">Showing yours. Others are settled between them.</p>}

      {missing.length > 0 && (
        <>
          <h3 className="s-h">Still needs a ticket</h3>
          <div className="group">{missing.slice(0, 6).map(c => <div key={c.it.id} className="lrow"><span className="row-main"><b>{c.it.name}</b><small>Missing: {c.miss.map(personName).join(', ')}</small></span></div>)}</div>
          {missing.length > 6 && <p className="muted small">+ {missing.length - 6} more once you book things.</p>}
        </>
      )}

      <h3 className="s-h">Ledger</h3>
      {tickets.length === 0 ? <p className="muted">Nothing logged yet.</p> : (
        <div className="stack">
          {[...tickets].sort((a, b) => (b.created_at || '').localeCompare(a.created_at || '')).map(t => (
            <div key={t.id} className={'ticket' + (t.settled ? ' settled' : '')}>
              <div className="ticket-top"><b>{t.label}</b><span>{yen(t.amount_yen)}</span></div>
              <small className="muted">{t.status === 'bought' ? `Paid by ${personName(t.paid_by)}` : 'Still to buy'}{t.covers.length ? ` · for ${t.covers.map(personName).join(', ')}` : ''}</small>
              <div className="ticket-actions">
                <button className={'chip2' + (t.status === 'bought' ? ' on' : '')} onClick={() => updateTicket(t.id, { status: t.status === 'bought' ? 'planned' : 'bought', paid_by: t.status === 'bought' ? t.paid_by : (t.paid_by || me.id) })}>{t.status === 'bought' ? '✓ Bought' : 'Mark bought'}</button>
                {t.status === 'bought' && <label className="check-inline"><Toggle on={t.settled} onChange={v => updateTicket(t.id, { settled: v })} label="Paid back" /> Paid back</label>}
                <button className="linkbtn danger" onClick={() => confirm('Delete this entry?') && deleteTicket(t.id)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Sheet open={open} onClose={() => setOpen(false)} title="Log a ticket" tall footer={<button className="btn-big" disabled={!label.trim()} onClick={save}>Add to ledger</button>}>
        <div className="stack">
          <label className="fld">From your picks<select value={itemId} onChange={e => choose(e.target.value)}><option value="">Something else…</option>{picked.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}</select></label>
          <label className="fld">What was booked?<input value={label} onChange={e => setLabel(e.target.value)} /></label>
          <label className="fld">Total ¥<input type="number" min={0} inputMode="numeric" value={amount} onChange={e => setAmount(e.target.value)} /></label>
          <div className="group"><div className="lrow"><span className="row-main"><b>Already bought (I paid)</b></span><Toggle on={bought} onChange={setBought} label="Already bought" /></div></div>
          <div className="fld">Who is it for?
            <div className="chips-flow">
              <button className="chip2" onClick={() => setCovers(people.map(p => p.id))}>Everyone</button>
              {households.map(h => <button key={h.id} className="chip2" onClick={() => setCovers(people.filter(p => p.household_id === h.id).map(p => p.id))}>{h.name}</button>)}
              <button className="chip2" onClick={() => setCovers([])}>Clear</button>
            </div>
            <div className="chips-flow">{people.map(p => <button key={p.id} className={'chip2' + (covers.includes(p.id) ? ' on' : '')} onClick={() => setCovers(covers.includes(p.id) ? covers.filter(c => c !== p.id) : [...covers, p.id])}><Avatar name={p.name} size={20} /> {p.name.split(' ')[0]} <small>{AGE_SHORT[p.age_group]}</small></button>)}</div>
          </div>
        </div>
      </Sheet>
    </>
  )
}

export default function Group({ seg: segParam }: { seg?: string }) {
  const seg: Seg = (['family', 'vote', 'ideas', 'tickets'] as string[]).includes(segParam || '') ? (segParam as Seg) : 'family'
  return (
    <div className="s-page">
      <Segmented value={seg} onChange={s => { location.hash = '#/group/' + s }} options={[['family', 'Family'], ['vote', 'Vote'], ['ideas', 'Ideas'], ['tickets', 'Tickets']]} />
      {seg === 'family' && <Family />}
      {seg === 'vote' && <VoteDeck />}
      {seg === 'ideas' && <Ideas />}
      {seg === 'tickets' && <Tickets />}
    </div>
  )
}
