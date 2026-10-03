import type { Stay } from '../lib/types'

/*
 * Approximate accommodation costs (yen). For room-based stays, `yen` is per room per night and
 * the cost is split between the people sharing. For per-person stays (hostels, ryokan, temple
 * stays) `yen` is per person per night (children ~70%, little ones free).
 * Verify current rates — peak seasons (cherry blossom, autumn leaves, Golden Week) can double them.
 */
const R = (id: string, name: string, area: string, style: string, yen: number, capacity: number, tier: Stay['tier'], blurb: string): Stay =>
  ({ id, name, area, style, yen, perPerson: false, capacity, tier, blurb })
const PP = (id: string, name: string, area: string, style: string, yen: number, tier: Stay['tier'], blurb: string): Stay =>
  ({ id, name, area, style, yen, perPerson: true, capacity: 1, tier, blurb })

export const STAYS: Stay[] = [
  // Tokyo
  PP('tk-hostel', 'Hostel / capsule (dorm bed)', 'Tokyo', 'Hostel', 4500, 'budget', 'Cheapest bed in the city. Not for little ones.'),
  R('tk-business', 'Business-hotel twin room', 'Tokyo', 'Hotel', 15000, 2, 'budget', 'Toyoko Inn / APA style. Small but clean and well-located. Check the room fits an extra bed.'),
  R('tk-mimaru', 'Family apart-hotel suite (MIMARU style)', 'Tokyo', 'Apartment', 32000, 5, 'mid', 'Kitchenette, washing machine and space for a family of 4–5. Good for a toddler and early bedtimes.'),
  R('tk-3star', '3-star hotel family/connecting room', 'Tokyo', 'Hotel', 35000, 3, 'mid', 'Comfortable and central. Connecting rooms book out early.'),
  R('tk-disney', 'Disney Official / Good-Neighbor hotel room', 'Tokyo', 'Hotel', 50000, 4, 'mid', 'Near Maihama, with some park-entry perks at official hotels.'),
  R('tk-luxury', 'Luxury hotel family suite', 'Tokyo', 'Hotel', 120000, 3, 'splurge', 'Park Hyatt, Aman, Mandarin-class. Mostly about the views and service.'),
  // Kyoto
  PP('ky-hostel', 'Hostel / guesthouse bed', 'Kyoto', 'Hostel', 4000, 'budget', 'Many in old townhouses.'),
  R('ky-business', 'Business-hotel twin room', 'Kyoto', 'Hotel', 16000, 2, 'budget', 'Near Kyoto Station is the most convenient.'),
  R('ky-mimaru', 'Family apart-hotel suite (MIMARU style)', 'Kyoto', 'Apartment', 30000, 5, 'mid', 'Space for a family group, kitchenette, usually near a bus stop.'),
  R('ky-machiya', 'Machiya townhouse rental', 'Kyoto', 'Apartment', 40000, 6, 'mid', 'Traditional wooden house with tatami and a garden. Steep stairs — check toddler safety.'),
  PP('ky-ryokan', 'Ryokan with kaiseki dinner & breakfast', 'Kyoto', 'Ryokan', 35000, 'splurge', 'Futon, tatami, multi-course dinner. Price per person per night.'),
  R('ky-luxury', 'Luxury hotel (Ritz / Four Seasons class)', 'Kyoto', 'Hotel', 100000, 3, 'splurge', 'Gardens, spa, concierge.'),
  // Osaka
  PP('os-hostel', 'Hostel / capsule bed', 'Osaka', 'Hostel', 4000, 'budget', 'Handy near Namba.'),
  R('os-business', 'Business-hotel twin room', 'Osaka', 'Hotel', 12000, 2, 'budget', 'Great value near Namba or Shin-Osaka.'),
  R('os-mimaru', 'Family apart-hotel suite (MIMARU style)', 'Osaka', 'Apartment', 30000, 5, 'mid', 'Family apartments close to Namba.'),
  R('os-usj', 'Universal-area hotel family room', 'Osaka', 'Hotel', 35000, 4, 'mid', 'Hotel Universal Port and Park Front style. Walk to the park gates.'),
  R('os-luxury', 'Luxury hotel (St. Regis class)', 'Osaka', 'Hotel', 80000, 3, 'splurge', 'City views and a very high service level.'),
  // Hakone, Koyasan, other
  PP('hk-ryokan-mid', 'Mid-range Hakone ryokan (2 meals)', 'Hakone & Fuji', 'Ryokan', 22000, 'mid', 'Tatami rooms and shared hot-spring baths. Price per person.'),
  PP('hk-ryokan-private', 'Hakone ryokan with private open-air onsen', 'Hakone & Fuji', 'Ryokan', 50000, 'splurge', 'Private bath on the balcony, kaiseki dinner, Fuji views if lucky. Price per person.'),
  PP('kn-minshuku', 'Minshuku guesthouse near Hongu (2 meals)', 'Koyasan & Kumano', 'Ryokan', 11000, 'budget', 'Family-run lodging on the Kumano Kodo trail. Price per person.'),
  PP('koya-shukubo', 'Koyasan temple lodging (2 meals, morning prayers)', 'Koyasan & Kumano', 'Ryokan', 14000, 'mid', 'Counts as accommodation — do not double-count with the temple-stay package.'),
  R('hiro-business', 'Business-hotel twin room', 'Hiroshima & Miyajima', 'Hotel', 13000, 2, 'budget', 'For a Hiroshima overnight.'),
  R('any-apartment', 'Whole apartment, 2 bedrooms (Airbnb style)', 'Anywhere / Nationwide', 'Apartment', 40000, 6, 'mid', 'Check licences, house rules and noise policies.'),
]
