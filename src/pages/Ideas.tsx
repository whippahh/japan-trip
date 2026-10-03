import { useState } from 'react'
import { useData } from '../lib/data'
import { AREAS, TYPES } from '../data/meta'
import { ItemCard } from './Explore'
import { Avatar } from '../components/ui'
import { suggestionToItem } from '../lib/pricing'

export default function Ideas() {
  const { me, suggestions, addSuggestion, deleteSuggestion, personName, votes, items } = useData()
  const [f, setF] = useState({ title: '', url: '', area: '', type: '', adult: '', child: '', note: '' })
  const [tab, setTab] = useState<'ideas' | 'board'>('ideas')
  const score = (id: string) => votes.filter(v => v.target_id === id).reduce((n, v) => n + v.vote, 0)

  const submit = async () => {
    if (!f.title.trim() || !me) return
    const adult = Math.max(0, Number(f.adult) || 0)
    await addSuggestion({
      title: f.title.trim(), url: f.url.trim() || null, area: f.area || null, type: f.type || null,
      price_adult: adult, price_child: f.child === '' ? null : Math.max(0, Number(f.child) || 0),
      note: f.note.trim() || null, added_by: me.id,
    })
    setF({ title: '', url: '', area: '', type: '', adult: '', child: '', note: '' })
  }

  const ranked = [...items].filter(i => votes.some(v => v.target_id === i.id))
    .sort((a, b) => score(b.id) - score(a.id)).slice(0, 25)
  const sorted = [...suggestions].sort((a, b) => score(b.id) - score(a.id) || (b.created_at || '').localeCompare(a.created_at || ''))

  return (
    <div className="page">
      <h1>Ideas & votes</h1>
      <div className="chips">
        <button className={'chip' + (tab === 'ideas' ? ' on' : '')} onClick={() => setTab('ideas')}>💡 Family ideas ({suggestions.length})</button>
        <button className={'chip' + (tab === 'board' ? ' on' : '')} onClick={() => setTab('board')}>🏆 Leaderboard</button>
      </div>

      {tab === 'ideas' && (
        <>
          <section className="card pad">
            <h3>Suggest something</h3>
            <p className="muted small">Found a place, tour or restaurant that isn't in the catalogue? Add it, then everyone can vote and add it to their trip.</p>
            <div className="form">
              <input placeholder="What is it? (e.g. Kurashiki canal day trip)" value={f.title} onChange={e => setF({ ...f, title: e.target.value })} />
              <input placeholder="Link (optional)" value={f.url} onChange={e => setF({ ...f, url: e.target.value })} />
              <select value={f.area} onChange={e => setF({ ...f, area: e.target.value })}><option value="">Area…</option>{AREAS.map(a => <option key={a}>{a}</option>)}</select>
              <select value={f.type} onChange={e => setF({ ...f, type: e.target.value })}><option value="">Type…</option>{TYPES.map(a => <option key={a}>{a}</option>)}</select>
              <input type="number" min={0} placeholder="Adult price ¥" value={f.adult} onChange={e => setF({ ...f, adult: e.target.value })} />
              <input type="number" min={0} placeholder="Child price ¥" value={f.child} onChange={e => setF({ ...f, child: e.target.value })} />
              <textarea placeholder="Why is it good? Anything we should know?" value={f.note} onChange={e => setF({ ...f, note: e.target.value })} />
              <button className="btn btn-primary" disabled={!f.title.trim()} onClick={submit}>Add suggestion</button>
            </div>
          </section>
          {sorted.length === 0 ? <div className="empty">No suggestions yet. Be the first!</div> : (
            <div className="grid">
              {sorted.map(s => (
                <div key={s.id} className="suggest">
                  <ItemCard item={suggestionToItem(s)} />
                  <div className="addedby small muted">
                    <Avatar name={personName(s.added_by)} size={18} /> Suggested by {personName(s.added_by)}
                    <button className="linklike" onClick={() => confirm('Delete this suggestion?') && deleteSuggestion(s.id)}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {tab === 'board' && (
        ranked.length === 0 ? <div className="empty">No votes yet. Vote on things in <a href="#/explore">Explore</a>.</div> : (
          <ol className="board">
            {ranked.map(i => (
              <li key={i.id} className="card pad">
                <b>{i.name}</b> <span className="muted small">{i.area}</span>
                <span className="score">{score(i.id) >= 0 ? '+' : ''}{score(i.id)}</span>
                <div className="small muted">
                  👍 {votes.filter(v => v.target_id === i.id && v.vote === 1).map(v => personName(v.person_id)).join(', ') || '—'}
                  {votes.some(v => v.target_id === i.id && v.vote === -1) && <> · 👎 {votes.filter(v => v.target_id === i.id && v.vote === -1).map(v => personName(v.person_id)).join(', ')}</>}
                </div>
              </li>
            ))}
          </ol>
        )
      )}
    </div>
  )
}
