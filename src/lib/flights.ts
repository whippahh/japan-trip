// Flight cost per person is kept inside the existing `notes` field as a tag, so no database change is needed.
const RE = /\[flights:(\d+)\]/
export const getFlights = (notes?: string | null): number => { const m = (notes || '').match(RE); return m ? Number(m[1]) : 0 }
export const cleanNotes = (notes?: string | null): string => (notes || '').replace(RE, '').trim()
export const withFlights = (notes: string | null | undefined, yen: number): string | null => {
  const clean = cleanNotes(notes)
  const tag = yen > 0 ? `[flights:${Math.round(yen)}]` : ''
  return [clean, tag].filter(Boolean).join('\n') || null
}
