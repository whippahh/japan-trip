export type AgeGroup = 'adult' | 'teen' | 'child' | 'toddler'
export type Tier = 'budget' | 'mid' | 'splurge'

export const AGE_LABEL: Record<AgeGroup, string> = {
  adult: 'Adult (18+)',
  teen: 'Teen (12–17)',
  child: 'Child (6–11)',
  toddler: 'Under 6',
}
export const TIER_LABEL: Record<Tier, string> = {
  budget: 'Budget eater',
  mid: 'Mid-range',
  splurge: 'Splurge',
}

export interface Household { id: string; name: string; created_at?: string }
export interface StayChoice { stayId: string; nights: number; sharing: number }
export interface Person {
  id: string
  name: string
  household_id: string | null
  age_group: AgeGroup
  arrive: string | null
  depart: string | null
  tier: Tier
  stays: StayChoice[]
  notes?: string | null
  created_at?: string
}
export interface Pick { person_id: string; item_id: string; day: number | null; created_at?: string }
export interface Suggestion {
  id: string
  title: string
  url: string | null
  area: string | null
  type: string | null
  price_adult: number
  price_child: number | null
  note: string | null
  added_by: string | null
  created_at?: string
}
export interface Vote { target_id: string; person_id: string; vote: number }
export interface Ticket {
  id: string
  label: string
  item_id: string | null
  amount_yen: number
  status: 'planned' | 'bought'
  paid_by: string | null
  covers: string[]
  settled: boolean
  note: string | null
  created_at?: string
}
export interface CheckRow { person_id: string; key: string; done: boolean }

export type Prices = Partial<Record<AgeGroup, number>>
export type Kind = 'sight' | 'package' | 'pass' | 'transit'

export interface Item {
  id: string
  name: string
  area: string
  town: string
  type: string
  intensity: 1 | 2 | 3
  hours: number
  prices: Prices
  toddlerOk: boolean
  adultsOnly?: boolean
  tier: Tier
  kind: Kind
  blurb: string
  link?: string
  book?: string
  needs?: string
  verified?: boolean
  custom?: boolean
}

export interface Stay {
  id: string
  name: string
  area: string
  style: string
  yen: number          // per room per night, or per person per night if perPerson
  perPerson: boolean
  capacity: number
  tier: Tier
  blurb: string
}
