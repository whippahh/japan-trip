import type { AgeGroup } from '../lib/types'

export interface CheckLink { label: string; url: string }
export interface CheckItem {
  key: string
  label: string
  note?: string
  who?: AgeGroup[]
  emoji?: string
  /** One line on why it matters. */
  why?: string
  /** Short, practical tips shown when the row is opened. */
  tips?: string[]
  links?: CheckLink[]
}

const SMART = 'https://www.smartraveller.gov.au/destinations/asia/japan'

export const CHECKLIST: CheckItem[] = [
  {
    key: 'passport', emoji: '🛂', label: 'Passport ready (valid for the whole trip)',
    note: 'Just a tick — never type passport details on this site.',
    why: 'Japan wants a passport valid for your whole stay. Many airlines and countries like 6 months to spare.',
    tips: ['Check the expiry date now. Renewals can take weeks.', 'Kids need their own passport.', 'Take a photo of the photo page and keep it somewhere safe (not on this site).'],
    links: [{ label: 'Australian passports', url: 'https://www.passports.gov.au/' }, { label: 'Entry rules (Smartraveller)', url: SMART }],
  },
  {
    key: 'flights', emoji: '✈️', label: 'Flights booked',
    why: 'Fly into one city and out of another (e.g. Tokyo in, Osaka out) to avoid doubling back.',
    tips: ['Look at multi-city / open-jaw fares: they are often the same price as a return.', 'Tokyo Haneda is closer to the city than Narita; Osaka Kansai is the usual way out.', 'Sit together: book seats early if you have little ones.'],
    links: [{ label: 'Google Flights', url: 'https://www.google.com/travel/flights' }],
  },
  {
    key: 'insurance', emoji: '🩺', label: 'Travel insurance sorted',
    why: 'Healthcare is excellent in Japan but not free for visitors, and cancellations are expensive.',
    tips: ['Check cover for kids and for any activities (hiking, skiing).', 'Keep the policy number and emergency phone on your phone.'],
    links: [{ label: 'Insurance basics (Smartraveller)', url: 'https://www.smartraveller.gov.au/before-you-go/insurance' }],
  },
  {
    key: 'vjw', emoji: '📱', label: 'Visit Japan Web registered (immigration + customs)',
    who: ['adult', 'teen', 'child', 'toddler'],
    why: 'Do immigration and customs on your phone before you land and show the QR codes: much quicker queues.',
    tips: ['Each traveller needs a profile; a parent can register children.', 'Fill it in 1 to 2 weeks before you fly (you need flight and first-night hotel details).', 'Screenshot the QR codes in case Wi-Fi is slow at the airport.'],
    links: [{ label: 'Visit Japan Web (official)', url: 'https://services.digital.go.jp/visit-japan-web/' }],
  },
  {
    key: 'accom', emoji: '🛏️', label: 'Accommodation booked',
    why: 'Cherry blossom, autumn leaves and holidays sell out months ahead, and family rooms are limited.',
    tips: ['Look for free cancellation so you can lock rooms in early.', 'Family rooms and apartments with a washer save money and effort.', 'Check the walk from the station with luggage.'],
    links: [{ label: 'Booking.com', url: 'https://www.booking.com' }],
  },
  {
    key: 'tickets', emoji: '🎟️', label: 'Must-do tickets booked (Ghibli, teamLab, Disney/USJ, Shibuya Sky…)',
    who: ['adult', 'teen'],
    why: 'The big ones sell out weeks or months ahead and are often date-specific.',
    tips: ['Ghibli Museum tickets are released monthly and go fast.', 'Log what you buy in Group → Tickets so nobody pays twice.'],
    links: [
      { label: 'Ghibli Museum', url: 'https://www.ghibli-museum.jp/en/' },
      { label: 'teamLab', url: 'https://www.teamlab.art/' },
      { label: 'Tokyo Disney Resort', url: 'https://www.tokyodisneyresort.jp/en/' },
      { label: 'Universal Studios Japan', url: 'https://www.usj.co.jp/web/en/us' },
      { label: 'Shibuya Sky', url: 'https://www.shibuya-scramble-square.com/sky/' },
    ],
  },
  {
    key: 'esim', emoji: '📶', label: 'eSIM / pocket Wi-Fi arranged',
    who: ['adult', 'teen'],
    why: 'Maps and translation are a lifesaver, and free Wi-Fi is patchy.',
    tips: ['An eSIM is the easiest: install it before you fly, switch it on when you land.', 'Check your phone is unlocked and eSIM-capable.', 'Pocket Wi-Fi suits groups: one device, many phones.'],
    links: [{ label: 'Airalo Japan eSIM', url: 'https://www.airalo.com/japan-esim' }, { label: 'Ubigi', url: 'https://www.ubigi.com' }],
  },
  {
    key: 'cards', emoji: '💴', label: 'Cards and some yen cash sorted',
    who: ['adult', 'teen'],
    why: 'Cards are widely accepted now, but small shops, temples and rural spots still want cash.',
    tips: ['Use a card with no foreign transaction fee.', '7-Eleven and post-office ATMs take foreign cards.', 'Let your bank know you are travelling.'],
    links: [{ label: 'Money tips (JNTO)', url: 'https://www.japan.travel/en/plan/' }],
  },
  {
    key: 'meds', emoji: '💊', label: "Medicines checked against Japan's import rules",
    note: 'Some common medicines are restricted or need a permit — check before packing.',
    who: ['adult', 'teen', 'child', 'toddler'],
    why: 'Some everyday medicines (certain ADHD, strong painkiller and cold/flu products) are restricted in Japan.',
    tips: ['Keep medicines in the original packaging with a doctor’s letter.', 'Larger quantities or restricted drugs need a permit applied for in advance.', 'Check each medicine by its active ingredient, not the brand.'],
    links: [{ label: 'Bringing medications (Japan Embassy)', url: 'https://www.us.emb-japan.go.jp/itpr_en/bringing-medications-to-japan.html' }, { label: 'Smartraveller: medicines', url: SMART }],
  },
  {
    key: 'ic', emoji: '💳', label: 'IC card (Suica / PASMO) ready',
    who: ['adult', 'teen', 'child'],
    why: 'Tap on trains, buses, vending machines and convenience stores. No need to buy a ticket each ride.',
    tips: ['Add a card to Apple Wallet before you go (iPhone) so you can top up from home.', 'Kids 6 to 11 need a child IC card at the airport/station counter.', 'Cards work nationwide, not just in Tokyo.'],
    links: [{ label: 'Suica (JR East)', url: 'https://www.jreast.co.jp/e/pass/suica.html' }],
  },
  {
    key: 'power', emoji: '🔌', label: 'Plug adapter and power bank packed',
    who: ['adult', 'teen'],
    why: 'Japan uses flat two-pin plugs (Type A) at 100V. Australian plugs do not fit.',
    tips: ['Most phone chargers handle 100V fine; check the label says 100–240V.', 'A power bank covers long days of maps and photos.', 'Airlines need power banks in carry-on, not checked bags.'],
    links: [{ label: 'Planning basics (JNTO)', url: 'https://www.japan.travel/en/plan/' }],
  },
  {
    key: 'shoes', emoji: '👟', label: 'Comfy walking shoes broken in',
    who: ['adult', 'teen', 'child'],
    why: 'Expect 15,000+ steps a day, plus lots of stairs and shoes on/off at temples and restaurants.',
    tips: ['Slip-on shoes make life easier.', 'Pack spare socks without holes: you will take your shoes off a lot.'],
  },
  {
    key: 'kidgear', emoji: '🍼', label: 'Baby carrier / compact stroller and snacks sorted',
    who: ['toddler'],
    why: 'Stairs are everywhere and lifts can be a detour. A carrier or very compact stroller is the easiest.',
    tips: ['Convenience stores sell nappies, snacks and baby food.', 'Most big stations and department stores have nursing rooms.'],
    links: [{ label: 'Travelling with kids (JNTO)', url: 'https://www.japan.travel/en/plan/' }],
  },
]

export const USEFUL_LINKS: { emoji: string; label: string; url: string; note: string }[] = [
  { emoji: '📖', label: 'Japan Guide', url: 'https://www.japan-guide.com/', note: 'The best all-round English guide to places and planning.' },
  { emoji: '🛡️', label: 'Smartraveller: Japan', url: SMART, note: 'Official Australian advice, entry rules and safety.' },
  { emoji: '🗾', label: 'Japan National Tourism Org.', url: 'https://www.japan.travel/en/', note: 'Official visitor info, maps and events.' },
  { emoji: '🚆', label: 'Google Maps transit', url: 'https://www.google.com/maps', note: 'Train times, platforms and fares all work in English.' },
  { emoji: '🍜', label: 'Tabelog', url: 'https://tabelog.com/en/', note: 'Where locals find good restaurants.' },
  { emoji: '🈂️', label: 'Google Translate', url: 'https://translate.google.com/', note: 'Camera mode reads menus and signs.' },
]
