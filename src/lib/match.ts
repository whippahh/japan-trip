import type { Person } from './types'

export const norm = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9぀-ヿ一-鿿 ]/g, ' ').replace(/\s+/g, ' ').trim()

export interface Matches { exact: Person[]; similar: Person[] }

/**
 * Sign-in matching. Typing the same name (ignoring case, accents and spacing) signs you in as that person,
 * so a spouse who was added to a household can simply type their own name later.
 * "Similar" = typed first name matches, or one name starts with the other (Sam / Samantha).
 */
export function findMatches(people: Person[], typed: string): Matches {
  const t = norm(typed)
  if (!t) return { exact: [], similar: [] }
  const exact = people.filter(p => norm(p.name) === t)
  const ids = new Set(exact.map(p => p.id))
  const first = t.split(' ')[0]
  const similar = people.filter(p => {
    if (ids.has(p.id)) return false
    const n = norm(p.name)
    return n.startsWith(t) || t.startsWith(n) || (first.length >= 2 && n.split(' ')[0] === first)
  })
  return { exact, similar }
}
