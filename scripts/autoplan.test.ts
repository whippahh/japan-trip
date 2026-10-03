import { autoArrange } from '../src/lib/autoplan'
import { CATALOGUE } from '../src/data/catalogue'
const get = (id: string) => CATALOGUE.find(i => i.id === id)
const ids = ['fushimi-inari', 'nara-deer', 'senso-ji', 'teamlab-planets', 'usj', 'arashiyama-bamboo', 'ueno-park'].filter(i => get(i))
const person: any = { id: 'p', tier: 'mid', stays: [], age_group: 'adult' }
const r = autoArrange(person, ids.map(i => ({ person_id: 'p', item_id: i, day: null })), get, 3)!
console.log(ids.length, 'picks ->', JSON.stringify(r.bases), r.totalDays, 'days;', r.stays.map(s => s.stayId + ':' + s.nights).join(' '))
console.log(r.days.map(d => `${d.day}:${d.item_id}`).join(' '))
if (!r.bases.length || r.bases[0].name !== 'Tokyo') throw new Error('expected Tokyo first')
console.log('OK autoplan')
