import { useMemo, useState } from 'react'
import { useData } from '../lib/data'
import { PersonSelect, yen } from '../components/ui'
import { itemPrice } from '../lib/pricing'
import type { Ticket } from '../lib/types'

export function balances(tickets: Ticket[]) {
  const net = new Map<string, number>()
  const add = (id: string, n: number) => net.set(id, (net.get(id) || 0) + n)
  for (const t of tickets) {
    if (t.status !== 'bought' || t.settled || !t.paid_by || t.amount_yen <= 0) continue
    const covers = t.covers.length ? t.covers : [t.paid_by]
    const share = t.amount_yen / covers.length
    add(t.paid_by, t.amount_yen)
    for (const c of covers) add(c, -share)
  }
  const pos = [...net].filter(([, v]) => v > 1).map(([id, v]) => ({ id, v })).sort((a, b) => b.v - a.v)
  const neg = [...net].filter(([, v]) => v < -1).map(([id, v]) => ({ id, v: -v })).sort((a, b) => b.v - a.v)
  const moves: { from: string; to: string; amount: number }[] = []
  let i = 0, j = 0
  while (i < pos.length && j < neg.length) {
    const amt = Math.min(pos[i].v, neg[j].v)
    moves.push({ from: neg[j].id, to: pos[i].id, amount: amt })
    pos[i].v -= amt; neg[j].v -= amt
    if (pos[i].v < 1) i++
    if (neg[j].v < 1) j++
  }
  return moves
}

export default function Tickets() {
  const { me, people, households, tickets, picks, items, getItem, addTicket, updateTicket, deleteTicket, personName } = useData()
  const [itemId, setItemId] = useState('')
  const [label, setLabel] = useState('')
  const [amount, setAmount] = useState('')
  const [status, setStatus] = useState<'planned' | 'bought'>('bought')
  const [paidBy, setPaidBy] = useState(me!.id)
  const [covers, setCovers] = useState<string[]>([])
  const [note, setNote] = useState('')

  const pickedItems = useMemo(
    () => items.filter(i => picks.some(k => k.item_id === i.id)).sort((a, b) => a.name.localeCompare(b.name)),
    [items, picks],
  )

  const chooseItem = (id: string) => {
    setItemId(id)
    const it = getItem(id)
    if (!it) return
    const who = picks.filter(k => k.item_id === id).map(k => k.person_id)
    setLabel(it.name); setCovers(who)
    setAmount(String(Math.round(who.reduce((n, pid) => n + itemPrice(it, people.find(p => p.id === pid)?.age_group || 'adult'), 0))))
  }
  const toggleCover = (id: string) => setCovers(covers.includes(id) ? covers.filter(c => c !== id) : [...covers, id])

  const save = async () => {
    if (!label.trim()) return
    await addTicket({
      label: label.trim(), item_id: itemId || null, amount_yen: Math.max(0, Number(amount) || 0), status,
      paid_by: status === 'bought' ? paidBy : null, covers, settled: false, note: note.trim() || null,
    })
    setItemId(''); setLabel(''); setAmount(''); setCovers([]); setNote('')
  }

  const moves = balances(tickets)

  // coverage: for each picked item, who is going vs who is covered by a bought ticket
  const coverage = pickedItems.map(it => {
    const going = picks.filter(k => k.item_id === it.id).map(k => k.person_id)
    const covered = new Set(tickets.filter(t => t.item_id === it.id && t.status === 'bought').flatMap(t => t.covers))
    return { it, going, missing: going.filter(g => !covered.has(g)) }
  }).filter(c => c.it.kind !== 'transit')

  return (
    <div className="page">
      <h1>Tickets & payments</h1>
      <div className="banner info">This is a ledger only. No money moves through this site, so settle up using your own bank or payment app.</div>

      <section className="card pad">
        <h3>Log a ticket or booking</h3>
        <div className="form">
          <select value={itemId} onChange={e => chooseItem(e.target.value)}>
            <option value="">Something else (type below)…</option>
            {pickedItems.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
          </select>
          <input placeholder="What was booked?" value={label} onChange={e => setLabel(e.target.value)} />
          <input type="number" min={0} placeholder="Total ¥" value={amount} onChange={e => setAmount(e.target.value)} />
          <select value={status} onChange={e => setStatus(e.target.value as any)}>
            <option value="bought">Bought / booked</option><option value="planned">Planned — still to buy</option>
          </select>
          {status === 'bought' && <label>Paid by <PersonSelect value={paidBy} onChange={setPaidBy} /></label>}
          <input placeholder="Note (booking time, where to collect…)" value={note} onChange={e => setNote(e.target.value)} />
        </div>
        <label>Who is it for?</label>
        <div className="chips">
          <button className="chip" onClick={() => setCovers(people.map(p => p.id))}>Everyone</button>
          {households.map(h => <button key={h.id} className="chip" onClick={() => setCovers(people.filter(p => p.household_id === h.id).map(p => p.id))}>{h.name}</button>)}
          <button className="chip" onClick={() => setCovers([])}>Clear</button>
        </div>
        <div className="chips">
          {people.map(p => <button key={p.id} className={'chip' + (covers.includes(p.id) ? ' on' : '')} onClick={() => toggleCover(p.id)}>{p.name}</button>)}
        </div>
        <button className="btn btn-primary" disabled={!label.trim()} onClick={save}>Add to ledger</button>
      </section>

      <div className="cols2">
        <section className="card pad">
          <h3>Who owes who</h3>
          {moves.length === 0 ? <p className="muted">All square, or nothing logged yet.</p> : (
            <ul className="plain">{moves.map((m, i) => <li key={i}><b>{personName(m.from)}</b> owes <b>{personName(m.to)}</b> <b className="amt">{yen(m.amount)}</b></li>)}</ul>
          )}
          <p className="muted small">Counts purchases marked "bought" and not yet settled; split evenly between the people they cover.</p>
        </section>
        <section className="card pad">
          <h3>Still needs a ticket</h3>
          {coverage.filter(c => c.missing.length).length === 0 ? <p className="muted">Everyone who picked something has a ticket logged.</p> : (
            <ul className="plain">
              {coverage.filter(c => c.missing.length).map(c => (
                <li key={c.it.id}><b>{c.it.name}</b><div className="muted small">Missing: {c.missing.map(personName).join(', ')}</div></li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="card pad">
        <h3>Ledger</h3>
        {tickets.length === 0 ? <p className="muted">Nothing logged yet.</p> : (
          <div className="scroll"><table className="tbl">
            <thead><tr><th>What</th><th>Status</th><th>Paid by</th><th>For</th><th className="r">Amount</th><th>Paid back?</th><th /></tr></thead>
            <tbody>
              {[...tickets].sort((a, b) => (b.created_at || '').localeCompare(a.created_at || '')).map(t => (
                <tr key={t.id} className={t.settled ? 'settled' : ''}>
                  <td>{t.label}{t.note && <div className="muted small">{t.note}</div>}</td>
                  <td>
                    <select value={t.status} onChange={e => updateTicket(t.id, { status: e.target.value as any, paid_by: e.target.value === 'bought' ? (t.paid_by || me!.id) : t.paid_by })}>
                      <option value="planned">Planned</option><option value="bought">Bought</option>
                    </select>
                  </td>
                  <td>{t.status === 'bought' ? <PersonSelect value={t.paid_by || me!.id} onChange={id => updateTicket(t.id, { paid_by: id })} /> : '—'}</td>
                  <td className="small">{t.covers.length ? t.covers.map(personName).join(', ') : '—'}</td>
                  <td className="r">{yen(t.amount_yen)}</td>
                  <td>{t.status === 'bought' ? <input type="checkbox" checked={t.settled} onChange={e => updateTicket(t.id, { settled: e.target.checked })} /> : '—'}</td>
                  <td><button className="btn btn-ghost small" onClick={() => confirm('Delete this entry?') && deleteTicket(t.id)}>✕</button></td>
                </tr>
              ))}
            </tbody>
          </table></div>
        )}
      </section>
    </div>
  )
}
