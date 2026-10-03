import type { Item } from '../lib/types'

export type LatLng = [number, number]

/** Approximate centre of each town/neighbourhood used in the catalogue (lat, lng). */
export const TOWN: Record<string, LatLng> = {
  Akihabara: [35.6984, 139.7731], Asakusa: [35.7148, 139.7967], 'Azabudai Hills': [35.6614, 139.741],
  Chiyoda: [35.6852, 139.7528], Harajuku: [35.6702, 139.7027], Maihama: [35.6329, 139.8804],
  Minato: [35.6586, 139.7454], Mitaka: [35.6963, 139.5704], Narita: [35.772, 140.3929],
  Nihonbashi: [35.6839, 139.7745], Odaiba: [35.6267, 139.776], Oshiage: [35.7101, 139.8107],
  Roppongi: [35.6628, 139.7314], Ryogoku: [35.6967, 139.7931], Shibuya: [35.6595, 139.7005],
  Shinjuku: [35.6938, 139.7034], Takao: [35.6253, 139.2438], 'Tama Center': [35.6244, 139.4242],
  Toyosu: [35.649, 139.789], Tsukiji: [35.6655, 139.7707], Ueno: [35.7141, 139.7774],
  Chinatown: [35.4437, 139.646], 'Minato Mirai': [35.4545, 139.632], Kamakura: [35.3192, 139.5467], Enoshima: [35.2997, 139.4803],
  Hakone: [35.2324, 139.1069], 'Chokoku-no-Mori': [35.2449, 139.0488], Kowakien: [35.244, 139.0557],
  'Lake Ashi': [35.206, 139.026], Kawaguchiko: [35.5127, 138.7525], Fujiyoshida: [35.488, 138.801],
  Nikko: [36.75, 139.5985], Chuzenji: [36.739, 139.485],
  Arashiyama: [35.0094, 135.6668], Fushimi: [34.9671, 135.7727], Gion: [35.0037, 135.7756],
  Higashiyama: [34.9949, 135.785], Kameoka: [35.012, 135.578], Kamigyo: [35.025, 135.762],
  'Kita-ku': [35.0394, 135.7292], Kurama: [35.1186, 135.765], Nakagyo: [35.0142, 135.748],
  Shimogyo: [34.987, 135.76], Uji: [34.884, 135.8], Uzumasa: [35.015, 135.699],
  'Bay Area': [34.655, 135.429], 'Chuo-ku': [34.6873, 135.5262], 'Kansai Airport': [34.432, 135.2304],
  Minoh: [34.833, 135.47], Namba: [34.665, 135.5014], Nipponbashi: [34.66, 135.5058],
  Shinsaibashi: [34.672, 135.5011], Shinsekai: [34.6525, 135.5063], Tennoji: [34.646, 135.513],
  Umeda: [34.7055, 135.4983], 'Universal City': [34.6654, 135.4323],
  Nara: [34.6851, 135.8048], 'Nara Park': [34.689, 135.8398], Naramachi: [34.677, 135.83],
  Kobe: [34.6901, 135.1955], Arima: [34.799, 135.247], Himeji: [34.8394, 134.6939],
  Hiroshima: [34.3853, 132.4553], Miyajima: [34.296, 132.3198],
  Koyasan: [34.213, 135.585], Tanabe: [33.73, 135.377], 'Kii-Tanabe': [33.73, 135.377], Kumano: [33.85, 135.77],
  'Kiso Valley': [35.53, 137.59], Nagano: [36.6486, 138.1948], Yamanouchi: [36.733, 138.43],
}

export const AREA_CENTER: Record<string, LatLng> = {
  'Tokyo': [35.68, 139.76], 'Yokohama & Kamakura': [35.4, 139.55], 'Hakone & Fuji': [35.3, 139.0],
  'Nikko': [36.75, 139.6], 'Kyoto': [35.01, 135.77], 'Osaka': [34.69, 135.5], 'Nara': [34.685, 135.8],
  'Kobe & Himeji': [34.75, 135.0], 'Hiroshima & Miyajima': [34.38, 132.45], 'Koyasan & Kumano': [34.0, 135.6],
  'Nagano & Kiso': [36.0, 138.0],
}

const hash = (s: string) => { let h = 0; for (const c of s) h = (h * 31 + c.charCodeAt(0)) >>> 0; return h }

/** Map position for an item, or null (transit and "anywhere" items have no fixed place). */
export function coordsFor(i: Item): LatLng | null {
  if (i.kind === 'transit' || i.kind === 'pass') return null
  const key = i.town.split(/ \/ | \(/)[0].trim()
  const c = TOWN[key] ?? AREA_CENTER[i.area]
  if (!c) return null
  const h = hash(i.id) // tiny jitter so items in the same town don't stack exactly
  return [c[0] + ((h % 61) - 30) * 0.00005, c[1] + (((h >> 8) % 61) - 30) * 0.00005]
}

/** Coarse "base" for backtracking checks and travel lookups. */
export function nodeOf(i: Item): string {
  if (i.area === 'Hakone & Fuji') return ['Kawaguchiko', 'Fujiyoshida'].includes(i.town) ? 'Fuji' : 'Hakone'
  if (i.area === 'Koyasan & Kumano') return i.town === 'Koyasan' ? 'Koyasan' : 'Kumano'
  return i.area
}

export interface Travel { mode: string; mins: number; yen: number; km: number; approx?: boolean }

const LEGS: Record<string, Omit<Travel, 'km'>> = {
  'Tokyo|Kyoto': { mode: 'Shinkansen', mins: 135, yen: 13870 },
  'Kyoto|Osaka': { mode: 'JR Special Rapid', mins: 30, yen: 580 },
  'Osaka|Tokyo': { mode: 'Shinkansen', mins: 150, yen: 14720 },
  'Hakone|Tokyo': { mode: 'Odakyu Romancecar', mins: 85, yen: 2500 },
  'Hakone|Kyoto': { mode: 'Shinkansen via Odawara', mins: 165, yen: 12000 },
  'Hakone|Osaka': { mode: 'Shinkansen via Odawara', mins: 190, yen: 13000 },
  'Fuji|Tokyo': { mode: 'Highway bus', mins: 120, yen: 2000 },
  'Fuji|Hakone': { mode: 'Bus + train', mins: 150, yen: 3000 },
  'Kyoto|Nara': { mode: 'JR / Kintetsu train', mins: 45, yen: 720 },
  'Nara|Osaka': { mode: 'Kintetsu / JR train', mins: 40, yen: 570 },
  'Tokyo|Yokohama & Kamakura': { mode: 'JR line', mins: 60, yen: 950 },
  'Nikko|Tokyo': { mode: 'Tobu line', mins: 120, yen: 2250 },
  'Nagano & Kiso|Tokyo': { mode: 'Hokuriku Shinkansen', mins: 90, yen: 8500 },
  'Kobe & Himeji|Kyoto': { mode: 'JR Special Rapid', mins: 75, yen: 1500 },
  'Kobe & Himeji|Osaka': { mode: 'JR Special Rapid', mins: 40, yen: 1000 },
  'Hiroshima & Miyajima|Osaka': { mode: 'Shinkansen', mins: 90, yen: 10440 },
  'Hiroshima & Miyajima|Kyoto': { mode: 'Shinkansen', mins: 105, yen: 11000 },
  'Koyasan|Osaka': { mode: 'Nankai line + cable car', mins: 120, yen: 1800 },
  'Kumano|Osaka': { mode: 'JR Kuroshio express', mins: 150, yen: 4900 },
  'Koyasan|Kyoto': { mode: 'Train via Osaka', mins: 180, yen: 2500 },
  'Kumano|Kyoto': { mode: 'JR via Osaka', mins: 200, yen: 5300 },
  'Koyasan|Kumano': { mode: 'Bus / train via Gojo', mins: 270, yen: 4000 },
}

export function haversine(a: LatLng, b: LatLng): number {
  const R = 6371, rad = (d: number) => (d * Math.PI) / 180
  const dLat = rad(b[0] - a[0]), dLng = rad(b[1] - a[1])
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a[0])) * Math.cos(rad(b[0])) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(x))
}

export function travelBetween(a: { at: LatLng; node: string }, b: { at: LatLng; node: string }): Travel {
  const km = haversine(a.at, b.at)
  if (a.node !== b.node) {
    const leg = LEGS[`${a.node}|${b.node}`] ?? LEGS[`${b.node}|${a.node}`]
    if (leg) return { ...leg, km, approx: true }
    return { mode: km > 120 ? 'Shinkansen / express' : 'Train', mins: Math.round(km / 110 * 60 + 30), yen: Math.round(km * 30 / 10) * 10, km, approx: true }
  }
  if (km < 1.2) return { mode: 'Walk', mins: Math.max(3, Math.round(km * 13)), yen: 0, km }
  if (km < 5) return { mode: 'Subway / bus', mins: Math.round(km * 4 + 10), yen: 200, km, approx: true }
  return { mode: 'Train', mins: Math.round(km * 2.5 + 15), yen: Math.min(1500, Math.round((150 + km * 25) / 10) * 10), km, approx: true }
}

export function fmtMins(m: number): string {
  if (m < 60) return `${m} min`
  const h = Math.floor(m / 60), r = m % 60
  return r ? `${h}h${String(r).padStart(2, '0')}` : `${h}h`
}
