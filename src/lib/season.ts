// Heads-ups about busy / quirky times of year, shown when a person's dates overlap them. Dates are approximate.
export interface SeasonTip { emoji: string; title: string; text: string; tone: 'busy' | 'info' }

// [startMonth, startDay, endMonth, endDay] (inclusive, same calendar year; New Year handled as two ranges)
const RULES: { r: [number, number, number, number][]; tip: SeasonTip }[] = [
  { r: [[12, 28, 12, 31], [1, 1, 1, 4]], tip: { emoji: '🎍', title: 'New Year holidays', tone: 'busy', text: 'Many restaurants, shops and some attractions close, and shrines are packed. Book trains and stays early, and stock up on food the day before.' } },
  { r: [[3, 22, 4, 10]], tip: { emoji: '🌸', title: 'Cherry blossom season', tone: 'busy', text: 'Beautiful but the busiest time of year. Stays can cost 20–50% more and sell out months ahead. Bloom timing shifts each year, so keep plans flexible.' } },
  { r: [[4, 29, 5, 6]], tip: { emoji: '🎏', title: 'Golden Week', tone: 'busy', text: 'Japan\'s biggest holiday. Shinkansen, attractions and hotels are crowded and pricey. Reserve everything, or consider a different week.' } },
  { r: [[6, 5, 7, 15]], tip: { emoji: '🌧️', title: 'Rainy season', tone: 'info', text: 'Frequent rain and humidity, but fewer crowds and lower prices. Pack a light raincoat and add indoor backups.' } },
  { r: [[7, 16, 8, 31]], tip: { emoji: '🥵', title: 'Peak summer heat', tone: 'info', text: 'Often 35°C with high humidity. Plan outdoor sights for the morning, carry water, and schedule indoor breaks. Great for festivals and fireworks.' } },
  { r: [[8, 11, 8, 16]], tip: { emoji: '🏮', title: 'Obon week', tone: 'busy', text: 'Locals travel home, so trains and highways are packed and some small shops close. Book transport early.' } },
  { r: [[8, 20, 10, 15]], tip: { emoji: '🌀', title: 'Typhoon season', tone: 'info', text: 'Occasional typhoons can cancel trains and flights for a day. Keep a spare day near your departure and check travel insurance.' } },
  { r: [[9, 18, 9, 24]], tip: { emoji: '🍂', title: 'Silver Week (some years)', tone: 'busy', text: 'A cluster of public holidays in many years makes travel busier than usual. Check the calendar for your year.' } },
  { r: [[11, 15, 12, 5]], tip: { emoji: '🍁', title: 'Autumn leaves peak', tone: 'busy', text: 'Kyoto and Nikko are at their most crowded and expensive. Go early in the day and book stays well ahead.' } },
]

const key = (m: number, d: number) => m * 100 + d

export function seasonTips(arrive: string | null, depart: string | null): SeasonTip[] {
  if (!arrive) return []
  const end = depart || arrive
  const a = new Date(arrive + 'T00:00'), z = new Date(end + 'T00:00')
  if (isNaN(+a) || isNaN(+z) || z < a) return []
  // walk the days (cap at 60) and collect every rule touched
  const hit = new Set<number>()
  const d = new Date(a)
  for (let n = 0; n < 60 && d <= z; n++, d.setDate(d.getDate() + 1)) {
    const k = key(d.getMonth() + 1, d.getDate())
    RULES.forEach((x, i) => { if (x.r.some(([m1, d1, m2, d2]) => k >= key(m1, d1) && k <= key(m2, d2))) hit.add(i) })
  }
  return [...hit].sort((x, y) => x - y).map(i => RULES[i].tip)
}
