import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import * as db from './store'
import { uid, isShared, type TableName } from './store'
import { CATALOGUE } from '../data/catalogue'
import { STAYS } from '../data/stays'
import { suggestionToItem } from './pricing'
import type {
  AgeGroup, CheckRow, Household, Item, Person, Pick, Stay, StayChoice, Suggestion, Ticket, Tier, Vote,
} from './types'

interface State {
  households: Household[]; people: Person[]; picks: Pick[]; suggestions: Suggestion[]
  votes: Vote[]; tickets: Ticket[]; checks: CheckRow[]
}
const empty: State = { households: [], people: [], picks: [], suggestions: [], votes: [], tickets: [], checks: [] }
const TABLES: TableName[] = ['jt_households', 'jt_people', 'jt_picks', 'jt_suggestions', 'jt_votes', 'jt_tickets', 'jt_checklist']

const ls = (k: string): string | null => { try { return localStorage.getItem(k) } catch { return null } }
const lset = (k: string, v: string | null) => { try { v === null ? localStorage.removeItem(k) : localStorage.setItem(k, v) } catch { /* ignore */ } }

export interface DataCtx extends State {
  loading: boolean
  error: string | null
  shared: boolean
  me: Person | null
  setMe: (id: string | null) => void
  rate: number
  setRate: (n: number) => void
  items: Item[]
  getItem: (id: string) => Item | undefined
  getStay: (id: string) => Stay | undefined
  personName: (id: string | null | undefined) => string
  householdOf: (p: Person) => Household | undefined
  membersOf: (hid: string | null) => Person[]
  addHousehold: (name: string) => Promise<Household>
  renameHousehold: (id: string, name: string) => Promise<void>
  addPerson: (x: { name: string; household_id: string | null; age_group: AgeGroup; tier?: Tier; arrive?: string | null; depart?: string | null }) => Promise<Person>
  updatePerson: (id: string, patch: Partial<Person>) => Promise<void>
  deletePerson: (id: string) => Promise<void>
  togglePick: (person_id: string, item_id: string) => Promise<void>
  addPicks: (person_ids: string[], item_id: string) => Promise<void>
  setPickDay: (person_id: string, item_id: string, day: number | null) => Promise<void>
  addSuggestion: (s: Omit<Suggestion, 'id'>) => Promise<Suggestion>
  deleteSuggestion: (id: string) => Promise<void>
  setVote: (target_id: string, person_id: string, vote: number | null) => Promise<void>
  addTicket: (t: Omit<Ticket, 'id'>) => Promise<void>
  updateTicket: (id: string, patch: Partial<Ticket>) => Promise<void>
  deleteTicket: (id: string) => Promise<void>
  toggleCheck: (person_id: string, key: string) => Promise<void>
  setStays: (person_id: string, stays: StayChoice[]) => Promise<void>
  setPlan: (person_id: string, plan: { picks: { item_id: string; day: number | null }[]; stays: StayChoice[]; replace: boolean; patch?: Partial<Person> }) => Promise<void>
  refresh: () => Promise<void>
}

const Ctx = createContext<DataCtx>(null as unknown as DataCtx)
export const useData = () => useContext(Ctx)

const normPerson = (r: any): Person => ({ ...r, stays: Array.isArray(r.stays) ? r.stays : [], tier: r.tier || 'mid', age_group: r.age_group || 'adult' })
const normTicket = (r: any): Ticket => ({ ...r, covers: Array.isArray(r.covers) ? r.covers : [] })

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [st, setSt] = useState<State>(empty)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [meId, setMeId] = useState<string | null>(() => ls('jt_me'))
  const [rate, setRateState] = useState<number>(() => Number(ls('jt_rate')) || 110)

  const refresh = useCallback(async () => {
    try {
      const [h, p, k, s, v, t, c] = await Promise.all(TABLES.map(db.list))
      setSt({
        households: h as Household[], people: (p as any[]).map(normPerson), picks: k as Pick[],
        suggestions: s as Suggestion[], votes: v as Vote[], tickets: (t as any[]).map(normTicket), checks: c as CheckRow[],
      })
      setError(null)
    } catch (e: any) {
      setError(e?.message || String(e))
    } finally { setLoading(false) }
  }, [])

  useEffect(() => {
    refresh()
    const id = setInterval(() => { if (!document.hidden) refresh() }, 10000)
    const onFocus = () => refresh()
    window.addEventListener('focus', onFocus)
    return () => { clearInterval(id); window.removeEventListener('focus', onFocus) }
  }, [refresh])

  const run = useCallback(async (optimistic: (s: State) => State, op: () => Promise<void>) => {
    setSt(optimistic)
    try { await op() } catch (e: any) { setError(e?.message || String(e)); await refresh() }
  }, [refresh])

  const setMe = (id: string | null) => { setMeId(id); lset('jt_me', id) }
  const setRate = (n: number) => { const v = n > 0 ? n : 110; setRateState(v); lset('jt_rate', String(v)) }

  const me = useMemo(() => st.people.find(p => p.id === meId) || null, [st.people, meId])
  const items = useMemo(() => [...CATALOGUE, ...st.suggestions.map(suggestionToItem)], [st.suggestions])
  const itemMap = useMemo(() => new Map(items.map(i => [i.id, i])), [items])
  const stayMap = useMemo(() => new Map(STAYS.map(s => [s.id, s])), [])

  const value: DataCtx = {
    ...st, loading, error, shared: isShared, me, setMe, rate, setRate, items,
    getItem: id => itemMap.get(id),
    getStay: id => stayMap.get(id),
    personName: id => st.people.find(p => p.id === id)?.name || '—',
    householdOf: p => st.households.find(h => h.id === p.household_id),
    membersOf: hid => st.people.filter(p => p.household_id === hid),
    refresh,

    addHousehold: async name => {
      const row: Household = { id: uid(), name: name.trim() || 'Household', created_at: new Date().toISOString() }
      await run(s => ({ ...s, households: [...s.households, row] }), () => db.insert('jt_households', row))
      return row
    },
    renameHousehold: (id, name) =>
      run(s => ({ ...s, households: s.households.map(h => h.id === id ? { ...h, name } : h) }), () => db.patch('jt_households', { id }, { name })),

    addPerson: async x => {
      const row: Person = {
        id: uid(), name: x.name.trim(), household_id: x.household_id, age_group: x.age_group,
        arrive: x.arrive ?? null, depart: x.depart ?? null, tier: x.tier || 'mid', stays: [], notes: null, created_at: new Date().toISOString(),
      }
      await run(s => ({ ...s, people: [...s.people, row] }), () => db.insert('jt_people', row))
      return row
    },
    updatePerson: (id, patch) =>
      run(s => ({ ...s, people: s.people.map(p => p.id === id ? { ...p, ...patch } : p) }), () => db.patch('jt_people', { id }, patch)),
    deletePerson: async id => {
      if (meId === id) setMe(null)
      await run(s => ({
        ...s, people: s.people.filter(p => p.id !== id), picks: s.picks.filter(k => k.person_id !== id),
        votes: s.votes.filter(v => v.person_id !== id), checks: s.checks.filter(c => c.person_id !== id),
      }), () => db.remove('jt_people', { id }))
    },
    setStays: (person_id, stays) =>
      run(s => ({ ...s, people: s.people.map(p => p.id === person_id ? { ...p, stays } : p) }), () => db.patch('jt_people', { id: person_id }, { stays })),

    setPlan: async (person_id, plan) => {
      const rows: Pick[] = plan.picks.map(x => ({ person_id, item_id: x.item_id, day: x.day }))
      const personPatch = { stays: plan.stays, ...(plan.patch || {}) }
      await run(s => ({
        ...s,
        people: s.people.map(p => p.id === person_id ? { ...p, ...personPatch } : p),
        picks: [
          ...s.picks.filter(k => k.person_id !== person_id || (!plan.replace && !rows.some(r => r.item_id === k.item_id))),
          ...rows,
        ],
      }), async () => {
        if (plan.replace) await db.remove('jt_picks', { person_id })
        await db.patch('jt_people', { id: person_id }, personPatch)
        await db.upsertMany('jt_picks', rows, ['person_id', 'item_id'])
      })
    },

    togglePick: async (person_id, item_id) => {
      const exists = st.picks.some(k => k.person_id === person_id && k.item_id === item_id)
      if (exists) {
        await run(s => ({ ...s, picks: s.picks.filter(k => !(k.person_id === person_id && k.item_id === item_id)) }),
          () => db.remove('jt_picks', { person_id, item_id }))
      } else {
        const row: Pick = { person_id, item_id, day: null }
        await run(s => ({ ...s, picks: [...s.picks, row] }), () => db.upsert('jt_picks', row, ['person_id', 'item_id']))
      }
    },
    addPicks: async (person_ids, item_id) => {
      const rows: Pick[] = person_ids.filter(pid => !st.picks.some(k => k.person_id === pid && k.item_id === item_id))
        .map(pid => ({ person_id: pid, item_id, day: null }))
      if (!rows.length) return
      await run(s => ({ ...s, picks: [...s.picks, ...rows] }),
        async () => { for (const r of rows) await db.upsert('jt_picks', r, ['person_id', 'item_id']) })
    },
    setPickDay: (person_id, item_id, day) =>
      run(s => ({ ...s, picks: s.picks.map(k => k.person_id === person_id && k.item_id === item_id ? { ...k, day } : k) }),
        () => db.patch('jt_picks', { person_id, item_id }, { day })),

    addSuggestion: async x => {
      const row: Suggestion = { ...x, id: uid(), created_at: new Date().toISOString() }
      await run(s => ({ ...s, suggestions: [...s.suggestions, row] }), () => db.insert('jt_suggestions', row))
      return row
    },
    deleteSuggestion: id =>
      run(s => ({ ...s, suggestions: s.suggestions.filter(x => x.id !== id), picks: s.picks.filter(k => k.item_id !== id), votes: s.votes.filter(v => v.target_id !== id) }),
        async () => { await db.remove('jt_picks', { item_id: id }); await db.remove('jt_votes', { target_id: id }); await db.remove('jt_suggestions', { id }) }),

    setVote: async (target_id, person_id, vote) => {
      if (vote === null) {
        await run(s => ({ ...s, votes: s.votes.filter(v => !(v.target_id === target_id && v.person_id === person_id)) }),
          () => db.remove('jt_votes', { target_id, person_id }))
      } else {
        const row: Vote = { target_id, person_id, vote }
        await run(s => ({ ...s, votes: [...s.votes.filter(v => !(v.target_id === target_id && v.person_id === person_id)), row] }),
          () => db.upsert('jt_votes', row, ['target_id', 'person_id']))
      }
    },

    addTicket: async t => {
      const row: Ticket = { ...t, id: uid(), created_at: new Date().toISOString() }
      await run(s => ({ ...s, tickets: [...s.tickets, row] }), () => db.insert('jt_tickets', row))
    },
    updateTicket: (id, patch) =>
      run(s => ({ ...s, tickets: s.tickets.map(t => t.id === id ? { ...t, ...patch } : t) }), () => db.patch('jt_tickets', { id }, patch)),
    deleteTicket: id =>
      run(s => ({ ...s, tickets: s.tickets.filter(t => t.id !== id) }), () => db.remove('jt_tickets', { id })),

    toggleCheck: async (person_id, key) => {
      const cur = st.checks.find(c => c.person_id === person_id && c.key === key)
      const done = !(cur && cur.done)
      const row: CheckRow = { person_id, key, done }
      await run(s => ({ ...s, checks: [...s.checks.filter(c => !(c.person_id === person_id && c.key === key)), row] }),
        () => db.upsert('jt_checklist', row, ['person_id', 'key']))
    },
  }
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}
