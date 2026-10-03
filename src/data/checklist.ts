import type { AgeGroup } from '../lib/types'

export interface CheckItem { key: string; label: string; note?: string; who?: AgeGroup[] }

export const CHECKLIST: CheckItem[] = [
  { key: 'passport', label: 'Passport ready (valid for the whole trip)', note: 'Just a tick — never type passport details on this site.' },
  { key: 'flights', label: 'Flights booked' },
  { key: 'insurance', label: 'Travel insurance sorted' },
  { key: 'vjw', label: 'Visit Japan Web registered (immigration + customs)', who: ['adult', 'teen', 'child', 'toddler'] },
  { key: 'accom', label: 'Accommodation booked' },
  { key: 'tickets', label: 'Must-do tickets booked (Ghibli, teamLab, Disney/USJ, Shibuya Sky…)', who: ['adult', 'teen'] },
  { key: 'esim', label: 'eSIM / pocket Wi-Fi arranged', who: ['adult', 'teen'] },
  { key: 'cards', label: 'Cards and some yen cash sorted', who: ['adult', 'teen'] },
  { key: 'meds', label: 'Medicines checked against Japan\'s import rules', note: 'Some common medicines are restricted or need a permit — check before packing.', who: ['adult', 'teen', 'child', 'toddler'] },
  { key: 'ic', label: 'IC card (Suica / PASMO) ready', who: ['adult', 'teen', 'child'] },
  { key: 'power', label: 'Plug adapter and power bank packed', who: ['adult', 'teen'] },
  { key: 'shoes', label: 'Comfy walking shoes broken in', who: ['adult', 'teen', 'child'] },
  { key: 'kidgear', label: 'Baby carrier / compact stroller and snacks sorted', who: ['toddler'] },
]
