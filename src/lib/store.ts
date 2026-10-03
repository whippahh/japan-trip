// Tiny data layer: talks to Supabase when env keys exist, otherwise localStorage "demo mode".
import { createClient } from '@supabase/supabase-js'

export type TableName =
  | 'jt_households' | 'jt_people' | 'jt_picks' | 'jt_suggestions'
  | 'jt_votes' | 'jt_tickets' | 'jt_checklist'
export type Row = Record<string, any>

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined
export const isShared = Boolean(url && key)
const sb: any = isShared ? createClient(url!, key!, { auth: { persistSession: false } }) : null

const lk = (t: TableName) => `jt_demo:${t}`
function lread(t: TableName): Row[] {
  try { return JSON.parse(localStorage.getItem(lk(t)) || '[]') } catch { return [] }
}
function lwrite(t: TableName, rows: Row[]) {
  try { localStorage.setItem(lk(t), JSON.stringify(rows)) } catch { /* ignore */ }
}
const same = (r: Row, m: Row) => Object.keys(m).every(k => r[k] === m[k])

export const uid = (): string =>
  (globalThis.crypto && 'randomUUID' in globalThis.crypto)
    ? globalThis.crypto.randomUUID()
    : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
        const r = (Math.random() * 16) | 0
        return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16)
      })

export async function list(t: TableName): Promise<Row[]> {
  if (sb) {
    const { data, error } = await sb.from(t).select('*')
    if (error) throw new Error(error.message)
    return data as Row[]
  }
  return lread(t)
}

export async function insert(t: TableName, row: Row): Promise<void> {
  if (sb) {
    const { error } = await sb.from(t).insert(row)
    if (error) throw new Error(error.message)
    return
  }
  lwrite(t, [...lread(t), row])
}

export async function upsert(t: TableName, row: Row, keys: string[]): Promise<void> {
  if (sb) {
    const { error } = await sb.from(t).upsert(row, { onConflict: keys.join(',') })
    if (error) throw new Error(error.message)
    return
  }
  const rows = lread(t)
  const i = rows.findIndex(r => keys.every(k => r[k] === row[k]))
  if (i >= 0) rows[i] = { ...rows[i], ...row }
  else rows.push(row)
  lwrite(t, rows)
}

export async function patch(t: TableName, match: Row, p: Row): Promise<void> {
  if (sb) {
    let q: any = sb.from(t).update(p)
    for (const k of Object.keys(match)) q = q.eq(k, match[k])
    const { error } = await q
    if (error) throw new Error(error.message)
    return
  }
  lwrite(t, lread(t).map(r => (same(r, match) ? { ...r, ...p } : r)))
}

export async function remove(t: TableName, match: Row): Promise<void> {
  if (sb) {
    let q: any = sb.from(t).delete()
    for (const k of Object.keys(match)) q = q.eq(k, match[k])
    const { error } = await q
    if (error) throw new Error(error.message)
    return
  }
  lwrite(t, lread(t).filter(r => !same(r, match)))
}

export async function upsertMany(t: TableName, rows: Row[], keys: string[]): Promise<void> {
  if (!rows.length) return
  if (sb) {
    const { error } = await sb.from(t).upsert(rows, { onConflict: keys.join(',') })
    if (error) throw new Error(error.message)
    return
  }
  for (const r of rows) await upsert(t, r, keys)
}
