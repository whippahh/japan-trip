export const AREAS = [
  'Tokyo', 'Yokohama & Kamakura', 'Hakone & Fuji', 'Nikko', 'Kyoto', 'Osaka', 'Nara',
  'Kobe & Himeji', 'Hiroshima & Miyajima', 'Koyasan & Kumano', 'Nagano & Kiso', 'Anywhere / Nationwide',
] as const

export const AREA_META: Record<string, { emoji: string; color: string }> = {
  'Tokyo': { emoji: '🗼', color: '#d9432f' },
  'Yokohama & Kamakura': { emoji: '⚓', color: '#2f7fb0' },
  'Hakone & Fuji': { emoji: '🗻', color: '#5a7fa8' },
  'Nikko': { emoji: '🍁', color: '#b5651d' },
  'Kyoto': { emoji: '⛩️', color: '#a8324a' },
  'Osaka': { emoji: '🏯', color: '#e08a1e' },
  'Nara': { emoji: '🦌', color: '#7a9a5b' },
  'Kobe & Himeji': { emoji: '🥩', color: '#8a5a9a' },
  'Hiroshima & Miyajima': { emoji: '🕊️', color: '#3b8a8a' },
  'Koyasan & Kumano': { emoji: '🌲', color: '#4d6b3a' },
  'Nagano & Kiso': { emoji: '🐒', color: '#6b6b8a' },
  'Anywhere / Nationwide': { emoji: '🎌', color: '#1f2d4d' },
}

export const TYPES = [
  'Theme park', 'Temple & shrine', 'Castle & history', 'Museum & art', 'Nature & hiking',
  'Views', 'Food & markets', 'Nightlife', 'Pop culture & shopping', 'Onsen & wellness',
  'Culture experience', 'Day trip & tour', 'Animals & aquarium', 'Neighbourhood & street life',
  'Pass & package', 'Transport',
] as const

export const TYPE_EMOJI: Record<string, string> = {
  'Theme park': '🎢', 'Temple & shrine': '⛩️', 'Castle & history': '🏯', 'Museum & art': '🎨',
  'Nature & hiking': '🥾', 'Views': '🌆', 'Food & markets': '🍜', 'Nightlife': '🍶',
  'Pop culture & shopping': '🎮', 'Onsen & wellness': '♨️', 'Culture experience': '🎎',
  'Day trip & tour': '🚌', 'Animals & aquarium': '🐠', 'Neighbourhood & street life': '🏮',
  'Pass & package': '🎟️', 'Transport': '🚅',
}
