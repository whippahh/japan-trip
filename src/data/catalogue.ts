import type { Item, Kind, Prices, Tier } from '../lib/types'

/*
 * Seed catalogue. ALL PRICES ARE APPROXIMATE (2025–26 research, yen, per person).
 * Verify on the official site before booking — many venues use dynamic pricing.
 * Price tuple: [adult, teen 12–17, child 6–11, under 6]; missing values fall back
 * (teen→adult, child→adult, under 6→free).
 */
const P = (a: number, t?: number, c?: number, k?: number): Prices => ({
  adult: a,
  ...(t !== undefined ? { teen: t } : {}),
  ...(c !== undefined ? { child: c } : {}),
  ...(k !== undefined ? { toddler: k } : {}),
})
type O = Partial<Pick<Item, 'toddlerOk' | 'adultsOnly' | 'tier' | 'kind' | 'link' | 'book' | 'needs' | 'verified'>>
const autoTier = (a: number): Tier => (a <= 2000 ? 'budget' : a <= 12000 ? 'mid' : 'splurge')
const I = (
  id: string, name: string, area: string, town: string, type: string,
  intensity: 1 | 2 | 3, hours: number, prices: Prices, blurb: string, o: O = {},
): Item => ({
  id, name, area, town, type, intensity, hours, prices, blurb,
  toddlerOk: true, tier: autoTier(prices.adult ?? 0), kind: 'sight' as Kind, ...o,
})
const PK: O = { kind: 'package' }
const PS: O = { kind: 'pass' }
const TR: O = { kind: 'transit' }

export const CATALOGUE: Item[] = [
  // ───────────── TOKYO ─────────────
  I('senso-ji', 'Senso-ji & Nakamise Street', 'Tokyo', 'Asakusa', 'Temple & shrine', 1, 2, P(0), "Tokyo's oldest temple with a lantern-lit market street leading to it. Free, atmospheric, great for snacks. Go early or late to beat the crowds."),
  I('meiji-jingu', 'Meiji Jingu & Yoyogi Park', 'Tokyo', 'Harajuku', 'Temple & shrine', 1, 2, P(0), 'A forested shrine walk in the middle of the city — calm, flat and pram-friendly on the main gravel path.'),
  I('takeshita', 'Takeshita Street & Harajuku crepes', 'Tokyo', 'Harajuku', 'Pop culture & shopping', 1, 2, P(1500, 1500, 1000), 'Teen-fashion alley, rainbow candy floss and crepes. Spending money, not an entry fee.', { tier: 'budget' }),
  I('shibuya-crossing', 'Shibuya Crossing & Hachiko', 'Tokyo', 'Shibuya', 'Neighbourhood & street life', 1, 1, P(0), "The world's busiest crossing. View it from the Starbucks or the Shibuya Station Mag's Park deck for free."),
  I('nintendo-pokemon', 'Nintendo Tokyo + Pokémon Center Shibuya', 'Tokyo', 'Shibuya (PARCO)', 'Pop culture & shopping', 1, 1.5, P(0), 'Both stores sit in Shibuya PARCO. Free to browse; limited-edition merch is the trap. Some items have purchase limits or ticketed entry at busy times.', { tier: 'budget' }),
  I('shibuya-sky', 'Shibuya Sky rooftop observatory', 'Tokyo', 'Shibuya', 'Views', 1, 1.5, P(2200, 1700, 1100, 0), 'Open-air rooftop with a 360° view. Sunset slots sell out — book ahead.', { link: 'https://www.shibuya-scramble-square.com/sky/', book: 'Book 2+ weeks ahead; sunset slots go first.' }),
  I('skytree', 'Tokyo Skytree (Tembo Deck)', 'Tokyo', 'Oshiage', 'Views', 1, 1.5, P(2100, 1550, 950, 0), "Japan's tallest tower, with a shopping and aquarium complex underneath. Easy with prams.", { link: 'https://www.tokyo-skytree.jp/en/' }),
  I('tokyo-tower', 'Tokyo Tower Main Deck', 'Tokyo', 'Minato', 'Views', 1, 1, P(1800, 1600, 1000, 0), 'Retro red-and-white icon. Cheaper and quicker than Skytree; great at night.', { link: 'https://www.tokyotower.co.jp/en/' }),
  I('teamlab-planets', 'teamLab Planets TOKYO', 'Tokyo', 'Toyosu', 'Museum & art', 2, 2.5, P(3800, 3000, 1500, 0), 'Walk barefoot through water and mirrored rooms of light. Wet to the knees — wear shorts. Adult price confirmed on the official site; others approximate.', { link: 'https://www.teamlab.art/e/planets/', book: 'Timed tickets; book 2–4 weeks ahead.', verified: true }),
  I('teamlab-borderless', 'teamLab Borderless', 'Tokyo', 'Azabudai Hills', 'Museum & art', 2, 2.5, P(3800, 2800, 1500, 0), 'Rooms of art that move between spaces with no fixed route. Dated tickets; price varies by day.', { link: 'https://www.teamlab.art/e/borderless-azabudai/', book: 'Book ahead; weekends sell out.' }),
  I('ghibli-museum', 'Ghibli Museum', 'Tokyo', 'Mitaka', 'Museum & art', 1, 2, P(1000, 700, 400, 0), 'Whimsical, photo-free museum for Ghibli fans. Fixed entry times; the hardest ticket in Tokyo.', { book: 'Tickets release on the 10th of the previous month; sell out in minutes. Agencies resell at a premium.' }),
  I('tokyo-disneyland', 'Tokyo Disneyland (1-day)', 'Tokyo', 'Maihama', 'Theme park', 3, 10, P(10900, 9300, 6500, 0), 'Classic Disney park. Dynamic pricing: roughly ¥7,900–¥10,900 for adults. Under-3s free.', { link: 'https://www.tokyodisneyresort.jp/en/', book: 'Buy tickets the day they release (about 2 months ahead).' }),
  I('tokyo-disneysea', 'Tokyo DisneySea (1-day)', 'Tokyo', 'Maihama', 'Theme park', 3, 10, P(10900, 9300, 6500, 0), "Many people's pick for adults and teens: rides and shows themed on ports and myths. Same dynamic pricing as Disneyland.", { link: 'https://www.tokyodisneyresort.jp/en/', book: 'Buy tickets the day they release.' }),
  I('disney-premier', 'Disney Premier Access (per ride)', 'Tokyo', 'Maihama', 'Pass & package', 1, 0.2, P(2000, 2000, 2000, 0), 'Pay to skip the queue on a headline ride. About ¥1,500–¥2,500 per attraction. Buy in the app on the day.', { kind: 'pass' }),
  I('puroland', 'Sanrio Puroland', 'Tokyo', 'Tama Center', 'Theme park', 1, 5, P(4900, 3900, 3500, 0), 'Indoor Hello Kitty and friends — good for rainy days and kids.', { link: 'https://www.puroland.jp/en/' }),
  I('ueno-park', 'Ueno Park & museum precinct', 'Tokyo', 'Ueno', 'Nature & hiking', 1, 2.5, P(0), 'Big park with lakes, temples and museums. Easy for running kids.'),
  I('ueno-zoo', 'Ueno Zoo', 'Tokyo', 'Ueno', 'Animals & aquarium', 1, 3, P(600, 200, 0, 0), "Japan's oldest zoo. Cheap and hilly in places.", { link: 'https://www.tokyo-zoo.net/english/ueno/' }),
  I('sumida-aquarium', 'Sumida Aquarium (Skytree Town)', 'Tokyo', 'Oshiage', 'Animals & aquarium', 1, 2, P(2500, 1800, 1200, 0), 'Compact indoor aquarium with a famous jellyfish room and penguins. Pair with Skytree.', { link: 'https://www.sumida-aquarium.com/en/' }),
  I('miraikan-odaiba', 'Miraikan science museum & Odaiba waterfront', 'Tokyo', 'Odaiba', 'Museum & art', 1, 3, P(630, 210, 210, 0), 'Hands-on science, a robot show and the life-size Gundam statue nearby.', { link: 'https://www.miraikan.jst.go.jp/en/' }),
  I('akihabara', 'Akihabara arcades & anime shops', 'Tokyo', 'Akihabara', 'Pop culture & shopping', 1, 3, P(2000, 2000, 1500, 0), 'Multi-floor arcades, gachapon machines and retro games. The figure is typical play money.', { tier: 'budget' }),
  I('omoide-golden-gai', 'Omoide Yokocho & Golden Gai', 'Tokyo', 'Shinjuku', 'Nightlife', 1, 2.5, P(3500, 2000, 1500, 0), 'Smoky yakitori alleys (family-OK early evening) and tiny bars (many have a cover charge; some are adults-only).', { toddlerOk: false }),
  I('shinjuku-gyoen', 'Shinjuku Gyoen garden', 'Tokyo', 'Shinjuku', 'Nature & hiking', 1, 2, P(500, 500, 0, 0), 'Beautiful garden with lawns for picnics. Alcohol not allowed inside.'),
  I('imperial-palace', 'Imperial Palace East Gardens', 'Tokyo', 'Chiyoda', 'Nature & hiking', 1, 1.5, P(0), 'Free grounds and old castle walls close to Tokyo Station.'),
  I('tsukiji-outer', 'Tsukiji Outer Market street-food crawl', 'Tokyo', 'Tsukiji', 'Food & markets', 1, 2, P(3000, 2500, 1500, 0), 'Tamago-yaki, seafood skewers, tuna bites. Go before noon; many stalls close early afternoon.'),
  I('tsukiji-tour', 'Guided Tsukiji food tour', 'Tokyo', 'Tsukiji', 'Food & markets', 1, 3, P(12000, 12000, 8000, 0), 'A guide chooses the stalls and explains what you are eating. Small groups.', { toddlerOk: false }),
  I('sushi-class', 'Family sushi-making class', 'Tokyo', 'Asakusa / Ginza', 'Culture experience', 1, 2, P(9000, 8000, 6000, 0), 'Hands-on class that finishes with eating your own work. Many classes take kids from ~5–6.', { toddlerOk: false }),
  I('sumo-tournament', 'Grand Sumo tournament (Jan / May / Sep)', 'Tokyo', 'Ryogoku', 'Culture experience', 1, 4, P(6500, 6500, 3000, 0), 'Seats from around ¥3,800; the figure is a mid-range chair seat. Only on tournament dates.', { link: 'https://www.sumo.or.jp/EnTicket/', book: 'Check if your dates overlap a tournament; tickets go on sale about a month ahead.', toddlerOk: false }),
  I('ninja-experience', 'Ninja / samurai experience', 'Tokyo', 'Asakusa / Shinjuku', 'Culture experience', 1, 1.5, P(5500, 5500, 4500, 0), 'Shuriken, costumes and a short sword demo. Big hit with ~8–14 year-olds.', { toddlerOk: false }),
  I('tokyo-private-van', 'Private Tokyo highlights van with English driver-guide', 'Tokyo', 'Citywide', 'Day trip & tour', 1, 8, P(8500, 8500, 8500, 0), 'About ¥60,000 per van for a day; this is the per-person figure for a full van of ~7. Door-to-door with kid gear.', { ...PK, tier: 'splurge' }),
  I('round1', 'Round1 bowling, arcade & karaoke', 'Anywhere / Nationwide', 'Round1 branches', 'Pop culture & shopping', 1, 2, P(2500, 2500, 1800, 0), 'All-in-one entertainment venues in every city. Good rainy-day plan for teens.', { tier: 'budget' }),
  I('karaoke', 'Private karaoke room (daytime)', 'Anywhere / Nationwide', 'Karaoke-kan / Big Echo', 'Culture experience', 1, 1.5, P(1500, 1500, 1000, 0), 'Your own room, drinks included. Daytime and early evening are family-friendly.', { tier: 'budget' }),
  I('mt-takao', 'Mt. Takao easy temple hike', 'Tokyo', 'Takao', 'Nature & hiking', 2, 4, P(950, 950, 480, 0), 'Tokyo\'s easy mountain: cable car up, temple, then walk down. Fare shown is the cable car return. ~1 hour from Shinjuku on the Keio line.', { toddlerOk: false }),
  I('roppongi-cocktails', 'Craft cocktail bars (Roppongi / Ginza)', 'Tokyo', 'Roppongi / Ginza', 'Nightlife', 1, 2.5, P(6000), 'Adults-only night out. Bar cover charges around ¥500–¥1,500.', { adultsOnly: true, toddlerOk: false }),
  I('jazz-bar', 'Hidden jazz bar evening', 'Tokyo', 'Shinjuku / Shimokitazawa', 'Nightlife', 1, 2.5, P(4500), 'Small live-music rooms. Music charge ¥1,500–¥3,000 plus drinks.', { adultsOnly: true, toddlerOk: false }),
  I('pokemon-cafe', 'Pokémon Cafe Tokyo (Nihonbashi)', 'Tokyo', 'Nihonbashi', 'Food & markets', 1, 1.5, P(2500, 2500, 2500, 0), 'Themed cafe with timed reservations that are extremely hard to get.', { book: 'Reservations open about a month ahead and vanish quickly.' }),
  I('maid-cafe', 'Akihabara maid cafe', 'Tokyo', 'Akihabara', 'Pop culture & shopping', 1, 1, P(3000, 3000, 3000, 0), 'Only-in-Japan novelty. Fixed set menu plus a table charge. Teens find it hilarious.', { toddlerOk: false }),
  I('purikura', 'Purikura photo booths', 'Anywhere / Nationwide', 'Game centres', 'Pop culture & shopping', 1, 0.5, P(800, 800, 800, 0), 'Decorated sticker photos. Cheap, fun for teens.', { tier: 'budget' }),
  I('tokyo-subway-24', 'Tokyo Subway Ticket 24-hour', 'Tokyo', 'Citywide', 'Pass & package', 1, 0, P(800, 800, 400, 0), 'Unlimited Tokyo Metro and Toei subway for a day. Worth it on heavy sightseeing days.', { ...PS, link: 'https://www.tokyometro.jp/en/ticket/travel/index.html' }),
  I('tokyo-subway-72', 'Tokyo Subway Ticket 72-hour', 'Tokyo', 'Citywide', 'Pass & package', 1, 0, P(1500, 1500, 750, 0), 'Three days of unlimited subway rides. Usually the best-value option for first-timers.', { ...PS, link: 'https://www.tokyometro.jp/en/ticket/travel/index.html' }),
  I('skyliner', 'Narita Airport ⇄ Tokyo (Keisei Skyliner, one way)', 'Tokyo', 'Narita / Ueno', 'Transport', 1, 0.7, P(2580, 2580, 1290, 0), 'Fast and comfortable airport train with luggage space.', TR),

  // ───────────── YOKOHAMA & KAMAKURA ─────────────
  I('cupnoodles-yokohama', 'Cup Noodles Museum Yokohama', 'Yokohama & Kamakura', 'Minato Mirai', 'Museum & art', 1, 2, P(500, 500, 0, 0), 'Design your own cup noodles (extra ¥500). Easy half-day; combine with Chinatown.', { link: 'https://www.cupnoodles-museum.jp/en/yokohama/' }),
  I('yokohama-chinatown', 'Yokohama Chinatown food crawl', 'Yokohama & Kamakura', 'Chinatown', 'Food & markets', 1, 2, P(2500, 2500, 1500, 0), "Japan's biggest Chinatown: dumplings, mango pudding, steamed buns."),
  I('cosmo-world', 'Cosmo World & Cosmo Clock ferris wheel', 'Yokohama & Kamakura', 'Minato Mirai', 'Theme park', 1, 2, P(900, 900, 500, 0), 'Waterfront amusement park. Pay per ride.', { tier: 'budget' }),
  I('kamakura-buddha', 'Great Buddha (Kotoku-in) & Hase-dera', 'Yokohama & Kamakura', 'Kamakura', 'Temple & shrine', 1, 3, P(700, 700, 350, 0), 'Giant bronze Buddha plus a cliffside temple with sea views. Ride the Enoden tram between them.', { needs: 't-kamakura' }),
  I('kamakura-hike', 'Daibutsu hiking trail (Kita-Kamakura to the Buddha)', 'Yokohama & Kamakura', 'Kamakura', 'Nature & hiking', 2, 3, P(0), 'A forested ridge walk linking temples. Rooty and uneven — baby carrier, not a stroller.', { toddlerOk: false, needs: 't-kamakura' }),
  I('enoshima', 'Enoshima island & Shin-Enoshima Aquarium', 'Yokohama & Kamakura', 'Enoshima', 'Animals & aquarium', 2, 4, P(2800, 1800, 1200, 0), 'Seaside island with shrines, caves, whitebait rice bowls and an aquarium. Combines well with Kamakura.', { needs: 't-kamakura' }),
  I('t-kamakura', 'Tokyo ⇄ Kamakura (JR, return)', 'Yokohama & Kamakura', 'Kamakura', 'Transport', 1, 2, P(1900, 1900, 950, 0), 'About an hour each way from Tokyo or Shinjuku.', TR),

  // ───────────── HAKONE & FUJI ─────────────
  I('hakone-freepass', 'Hakone Freepass (2-day, from Shinjuku)', 'Hakone & Fuji', 'Hakone', 'Pass & package', 1, 0, P(6100, 6100, 1500, 0), 'Return train from Shinjuku plus unlimited Hakone trains, cable car, ropeway, pirate ship and buses for two days. Sightseeing discounts included.', { ...PS, link: 'https://www.odakyu.jp/english/passes/hakone/' }),
  I('hakone-openair', 'Hakone Open-Air Museum', 'Hakone & Fuji', 'Chokoku-no-Mori', 'Museum & art', 1, 2.5, P(2500, 1700, 800, 0), 'Giant sculptures on a hillside, a Picasso pavilion and a foot onsen. Kids love the climbing sculptures.', { link: 'https://www.hakone-oam.or.jp/en/' }),
  I('owakudani', 'Owakudani volcanic valley (black eggs)', 'Hakone & Fuji', 'Hakone', 'Nature & hiking', 1, 2, P(500, 500, 500, 0), 'Sulphur vents and eggs boiled black in the springs. Ropeway included in the Freepass. Closes if gas levels are high.'),
  I('ashi-cruise', 'Lake Ashi pirate ship cruise', 'Hakone & Fuji', 'Lake Ashi', 'Day trip & tour', 1, 1, P(0, 0, 0, 0), 'Included in the Hakone Freepass (about ¥1,200 if paid separately). Fuji views on clear days.'),
  I('yunessun', 'Yunessun spa resort (swimsuit onsen)', 'Hakone & Fuji', 'Kowakien', 'Onsen & wellness', 1, 3, P(3000, 3000, 1500, 0), 'Swimsuit-friendly onsen with wine, coffee and green-tea baths — an easy first onsen for mixed families and tattoos.'),
  I('fuji-q', 'Fuji-Q Highland (thrill rides)', 'Hakone & Fuji', 'Kawaguchiko', 'Theme park', 3, 8, P(6800, 5500, 4500, 0), 'Record-breaking coasters and a Thomas Land for younger kids, under Mt Fuji. Price is a Free Pass. Check the height limits.', { link: 'https://www.fujiq.jp/en/', needs: 't-fuji-bus' }),
  I('chureito', 'Chureito Pagoda & Lake Kawaguchi views', 'Hakone & Fuji', 'Fujiyoshida', 'Views', 2, 2, P(0), 'The postcard Fuji-and-pagoda view. About 400 steps — carrier only for little ones.', { toddlerOk: false, needs: 't-fuji-bus' }),
  I('fuji-hakone-van', 'Mt Fuji & Hakone small-group day tour', 'Hakone & Fuji', 'From Tokyo', 'Day trip & tour', 1, 11, P(16000, 16000, 10000, 0), 'Guided day trip with transport — easiest way to see both in a day. Long days; check toddler policies.', { ...PK, toddlerOk: false }),
  I('t-fuji-bus', 'Shinjuku ⇄ Kawaguchiko highway bus (return)', 'Hakone & Fuji', 'Kawaguchiko', 'Transport', 1, 4, P(4000, 4000, 2000, 0), 'About 2 hours each way. Reserve seats online.', TR),

  // ───────────── NIKKO ─────────────
  I('nikko-toshogu', 'Nikko Toshogu & World Heritage shrines', 'Nikko', 'Nikko', 'Temple & shrine', 2, 4, P(1600, 1600, 550, 0), "Lavish gilded shrines in a cedar forest. Figure is for Toshogu; add Rinno-ji and Futarasan if you want the full set.", { link: 'https://www.toshogu.jp/english/', needs: 't-nikko' }),
  I('kegon-falls', 'Kegon Falls & Lake Chuzenji', 'Nikko', 'Chuzenji', 'Nature & hiking', 1, 2, P(600, 600, 300, 0), "One of Japan's best waterfalls. Bus up the winding Irohazaka road.", { needs: 't-nikko' }),
  I('t-nikko', 'Asakusa ⇄ Nikko (Tobu line, return)', 'Nikko', 'Nikko', 'Transport', 1, 4, P(4500, 4500, 2250, 0), 'About 2 hours each way. Approximate; add local bus fares in Nikko.', TR),

  // ───────────── KYOTO ─────────────
  I('fushimi-inari', 'Fushimi Inari Shrine (torii gate trail)', 'Kyoto', 'Fushimi', 'Temple & shrine', 2, 3, P(0), 'Thousands of vermilion gates. Open 24 hours and free. Go at dawn or after dark. Many stairs.', { link: 'https://inari.jp/en/' }),
  I('fushimi-hike-tour', 'Guided Fushimi Inari sunrise hike', 'Kyoto', 'Fushimi', 'Day trip & tour', 2, 3, P(7500, 7500, 4500, 0), 'Small-group guide who knows the quiet side paths and the fox-shrine stories. Often includes a snack.', { ...PK, toddlerOk: false }),
  I('kiyomizu', 'Kiyomizu-dera & Higashiyama streets', 'Kyoto', 'Higashiyama', 'Temple & shrine', 2, 3, P(500, 500, 200, 0), 'Wooden stage over the hillside with old-town lanes of sweets and souvenirs. Steep and busy.', { link: 'https://www.kiyomizudera.or.jp/en/' }),
  I('kinkakuji', 'Kinkaku-ji (Golden Pavilion)', 'Kyoto', 'Kita-ku', 'Temple & shrine', 1, 1, P(500, 500, 300, 0), 'The gold-leaf pavilion across the pond. A quick one-way loop.', { link: 'https://www.shokoku-ji.jp/en/kinkakuji/' }),
  I('ginkakuji', 'Ginkaku-ji & Philosopher\'s Path', 'Kyoto', 'Higashiyama', 'Temple & shrine', 1, 2, P(600, 600, 300, 0), 'Zen garden and a canal-side walk to Nanzen-ji. Some sources list higher entry — check.'),
  I('nijo-castle', 'Nijo Castle', 'Kyoto', 'Nakagyo', 'Castle & history', 1, 2, P(1300, 400, 400, 0), 'Shogun palace with "nightingale floors" that squeak to catch intruders.', { link: 'https://nijo-jocastle.city.kyoto.lg.jp/?lang=en' }),
  I('ryoanji', 'Ryoan-ji rock garden', 'Kyoto', 'Kita-ku', 'Temple & shrine', 1, 1, P(500, 500, 300, 0), 'Famous minimalist Zen garden. Quick and good for a quiet moment.'),
  I('arashiyama-bamboo', 'Arashiyama Bamboo Grove & Togetsukyo Bridge', 'Kyoto', 'Arashiyama', 'Nature & hiking', 1, 2, P(0), 'Free. Very crowded after 9am; easy walking.'),
  I('tenryuji', 'Tenryu-ji Zen garden', 'Kyoto', 'Arashiyama', 'Temple & shrine', 1, 1, P(500, 500, 300, 0), 'Garden entrance connects straight to the bamboo grove.'),
  I('monkey-park', 'Iwatayama Monkey Park', 'Kyoto', 'Arashiyama', 'Animals & aquarium', 2, 1.5, P(1200, 1200, 800, 0), '20-minute uphill walk to feed wild macaques and see the city. Stairs and slopes — not for strollers.', { toddlerOk: false }),
  I('sagano-train', 'Sagano Romantic Train', 'Kyoto', 'Arashiyama', 'Day trip & tour', 1, 1, P(880, 880, 440, 0), 'A 25-minute scenic open-sided train through the river gorge. Book ahead for autumn leaves.', { link: 'https://www.sagano-kanko.co.jp/en/' }),
  I('hozugawa', 'Hozugawa River Boat ride', 'Kyoto', 'Kameoka', 'Day trip & tour', 2, 2.5, P(4500, 4500, 3000, 0), 'Two-hour boat ride down gentle rapids. Check minimum age with the operator.', { link: 'https://www.hozugawakudari.jp/en/', toddlerOk: false }),
  I('nishiki-market', 'Nishiki Market (street-food stroll)', 'Kyoto', 'Nakagyo', 'Food & markets', 1, 2, P(3000, 3000, 1500, 0), "Kyoto's Kitchen: pickles, tofu doughnuts, sweet omelette skewers. Eating while walking is frowned on — stand beside the stall."),
  I('gion-evening', 'Gion & Hanamikoji evening stroll + Yasaka Shrine', 'Kyoto', 'Gion', 'Neighbourhood & street life', 1, 2, P(0), 'Wooden teahouses and the chance of a maiko at dusk. Respect the no-photo-on-private-lanes signs.'),
  I('kyoto-imperial', 'Kyoto Imperial Palace Park', 'Kyoto', 'Kamigyo', 'Nature & hiking', 1, 1.5, P(0), 'Free, spacious grounds good for little legs and picnics.'),
  I('kimono-rental', 'Kimono rental (half day)', 'Kyoto', 'Higashiyama / Gion', 'Culture experience', 1, 4, P(5500, 5500, 3500, 0), 'Dress up and walk the old streets. Booked slots include hair styling at most shops.', { toddlerOk: false }),
  I('tea-ceremony', 'Tea ceremony experience', 'Kyoto', 'Gion / Higashiyama', 'Culture experience', 1, 1, P(4000, 4000, 2500, 0), 'Matcha and wagashi with a host. Quiet, formal — best for kids who can sit still ~45 minutes.', { toddlerOk: false }),
  I('maiko-dinner', 'Maiko / geiko dinner', 'Kyoto', 'Gion', 'Culture experience', 1, 2, P(25000, 25000, 25000, 0), 'Kaiseki dinner with a performance. Splurge. Many venues require older children.', { toddlerOk: false, tier: 'splurge' }),
  I('kyoto-cooking', 'Nishiki market tour + cooking class', 'Kyoto', 'Nakagyo', 'Culture experience', 1, 4, P(9000, 9000, 6000, 0), 'Shop with the chef, then cook a Japanese meal.', { toddlerOk: false }),
  I('kyoto-railway-museum', 'Kyoto Railway Museum', 'Kyoto', 'Shimogyo', 'Museum & art', 1, 3, P(1500, 1300, 500, 0), 'Great for trainspotters and young kids. Steam-train ride and a big hands-on hall.', { link: 'https://www.kyotorailwaymuseum.jp/en/' }),
  I('kyoto-aquarium', 'Kyoto Aquarium', 'Kyoto', 'Shimogyo', 'Animals & aquarium', 1, 2, P(2400, 1800, 1200, 0), 'Compact city aquarium with otters and a dolphin stadium. Easy rainy-day option.', { link: 'https://www.kyoto-aquarium.com/eng/' }),
  I('toei-kyoto-studio', 'Toei Kyoto Studio Park', 'Kyoto', 'Uzumasa', 'Theme park', 1, 3, P(2800, 2800, 1400, 0), 'Samurai film set. Reopened with a more adult-oriented concept — check current price and kid suitability.', { toddlerOk: false }),
  I('kurama-kibune', 'Kurama–Kibune mountain temple hike', 'Kyoto', 'Kurama', 'Nature & hiking', 3, 4, P(500, 500, 250, 0), 'Forest trail between two mountain villages, ending in a riverside restaurant. Rooty, steep in places.', { toddlerOk: false }),
  I('uji-byodoin', 'Uji: Byodo-in & matcha', 'Kyoto', 'Uji', 'Temple & shrine', 1, 3, P(700, 700, 300, 0), "The temple on the ¥10 coin, with the best matcha desserts around. 20 minutes from Kyoto Station."),
  I('kyoto-bus-1day', 'Kyoto Subway & Bus 1-Day Pass', 'Kyoto', 'Citywide', 'Pass & package', 1, 0, P(1100, 1100, 550, 0), 'Handy for a temple-heavy day. Compare with a few single fares first.', PS),
  I('t-shinkansen-tk', 'Tokyo → Kyoto Shinkansen Nozomi (one way)', 'Kyoto', 'Tokyo / Kyoto', 'Transport', 1, 2.25, P(13870, 13870, 6930, 0), 'A little over two hours. Reserve seats; oversized luggage needs a reservation too.', TR),
  I('t-kyoto-osaka', 'Kyoto → Osaka JR (one way)', 'Osaka', 'Kyoto / Osaka', 'Transport', 1, 0.5, P(580, 580, 290, 0), 'About 30 minutes on the JR Special Rapid.', TR),

  // ───────────── OSAKA ─────────────
  I('usj', 'Universal Studios Japan (1-day)', 'Osaka', 'Universal City', 'Theme park', 3, 10, P(10900, 10900, 6500, 0), 'Super Nintendo World, Wizarding World, Minion Park. Dynamic pricing; children (4–11) priced lower; under-4s (some sources say under-3s) free.', { link: 'https://www.usj.co.jp/web/en/us', book: 'Tickets and Super Nintendo World timed entry on the app.' }),
  I('usj-2day', 'USJ 2-Day Studio Pass', 'Osaka', 'Universal City', 'Theme park', 3, 20, P(18500, 18500, 11000, 0), 'Two consecutive days; much less rushed. Price approximate.', { link: 'https://www.usj.co.jp/web/en/us' }),
  I('usj-express', 'USJ Express Pass 4 (skip-the-line)', 'Osaka', 'Universal City', 'Pass & package', 1, 0, P(18000, 18000, 18000, 0), 'Priority entry on a set of rides; prices range from about ¥14,000 to ¥30,000 depending on date. Adds up quickly across a group.', { ...PS, tier: 'splurge' }),
  I('osaka-castle', 'Osaka Castle keep & park', 'Osaka', 'Chuo-ku', 'Castle & history', 1, 3, P(1200, 1200, 0, 0), 'Museum inside, views at the top. Some sources still show ¥600 — check the current price.', { link: 'https://www.osakacastle.net/english/' }),
  I('dotonbori', 'Dotonbori neon street-food night', 'Osaka', 'Namba', 'Food & markets', 1, 3, P(3500, 3000, 2000, 0), 'Takoyaki, okonomiyaki and the Glico Man sign. Packed in the evening.'),
  I('kuromon', 'Kuromon Market', 'Osaka', 'Namba', 'Food & markets', 1, 2, P(3000, 3000, 1500, 0), 'Grill-your-own scallops and wagyu skewers. Best late morning.'),
  I('kaiyukan', 'Osaka Aquarium Kaiyukan', 'Osaka', 'Bay Area', 'Animals & aquarium', 1, 3, P(2700, 2700, 1400, 0), "One of the world's largest aquariums, with a whale shark tank. Pair with the Tempozan ferris wheel.", { link: 'https://www.kaiyukan.com/language/eng/' }),
  I('tempozan-wheel', 'Tempozan Giant Ferris Wheel', 'Osaka', 'Bay Area', 'Views', 1, 0.5, P(800, 800, 400, 0), 'Next to the aquarium; 15-minute ride.', { tier: 'budget' }),
  I('umeda-sky', 'Umeda Sky Building Floating Garden', 'Osaka', 'Umeda', 'Views', 1, 1, P(1500, 1500, 700, 0), 'The glass escalator between two towers and an open-air deck.', { link: 'https://www.skybldg.co.jp/en/' }),
  I('harukas', 'Abeno Harukas 300 observatory', 'Osaka', 'Tennoji', 'Views', 1, 1, P(2000, 1500, 1000, 0), "Japan's tallest skyscraper; dynamic pricing.", { link: 'https://www.abenoharukas-300.jp/en/' }),
  I('shinsekai', 'Shinsekai & Tsutenkaku Tower (kushikatsu)', 'Osaka', 'Shinsekai', 'Neighbourhood & street life', 1, 2.5, P(2400, 2400, 1500, 0), 'Retro neon district with deep-fried skewers (no double-dipping!).'),
  I('nintendo-osaka', 'Nintendo Osaka & Pokémon Center Osaka', 'Osaka', 'Shinsaibashi (Daimaru)', 'Pop culture & shopping', 1, 1.5, P(0), 'Mirrors the Tokyo stores. Free to browse.'),
  I('den-den-town', 'Den Den Town (retro games & anime)', 'Osaka', 'Nipponbashi', 'Pop culture & shopping', 1, 2, P(1500, 1500, 1000, 0), "Osaka's Akihabara. Cheaper second-hand games and figures.", { tier: 'budget' }),
  I('osaka-food-tour', 'Guided Osaka street-food tour', 'Osaka', 'Namba / Dotonbori', 'Food & markets', 1, 3, P(9000, 9000, 6500, 0), 'Local guide, a handful of stops. Queues skipped.'),
  I('osaka-cooking', 'Okonomiyaki / takoyaki cooking class', 'Osaka', 'Namba', 'Culture experience', 1, 2, P(6500, 6500, 5000, 0), 'Flip your own pancakes. Great for kids.', { toddlerOk: false }),
  I('osaka-nightlife', 'Namba & Hozenji bar-hopping', 'Osaka', 'Namba', 'Nightlife', 1, 3, P(4000), 'Narrow lanes, standing bars and izakaya. Adults only.', { adultsOnly: true, toddlerOk: false }),
  I('minoo-park', 'Minoo Park waterfall walk', 'Osaka', 'Minoh', 'Nature & hiking', 2, 3, P(500, 500, 500, 0), '40 minutes from Osaka. Wild monkeys on the path and deep-fried maple-leaf snacks.', { toddlerOk: false }),
  I('tennoji-zoo', 'Tennoji Zoo', 'Osaka', 'Tennoji', 'Animals & aquarium', 1, 3, P(500, 500, 200, 0), 'Cheap zoo in the middle of the city, next to Harukas.'),
  I('osaka-amazing-1day', 'Osaka Amazing Pass (1-day)', 'Osaka', 'Citywide', 'Pass & package', 1, 0, P(3500, 3500, 3500, 0), 'Unlimited subway/bus plus free entry to many attractions. Confirm it is still on sale and which attractions are included.', PS),
  I('t-kix', 'Kansai Airport ⇄ Osaka (Nankai Rapi:t, one way)', 'Osaka', 'Kansai Airport', 'Transport', 1, 0.7, P(1450, 1450, 730, 0), 'Limited express to Namba.', TR),

  // ───────────── NARA ─────────────
  I('nara-deer', 'Nara Park deer', 'Nara', 'Nara Park', 'Animals & aquarium', 1, 2, P(200, 200, 200, 0), 'Hundreds of bowing deer. Crackers cost about ¥200. Deer can bite — keep little kids back.', { needs: 't-nara' }),
  I('todaiji', 'Todai-ji Great Buddha Hall', 'Nara', 'Nara Park', 'Temple & shrine', 1, 1.5, P(800, 800, 400, 0), 'The enormous bronze Buddha in a vast wooden hall. The price has risen in recent years — check.', { link: 'https://www.todaiji.or.jp/en/', needs: 't-nara' }),
  I('kasuga-taisha', 'Kasuga Taisha lantern shrine', 'Nara', 'Nara Park', 'Temple & shrine', 1, 1.5, P(500, 500, 500, 0), 'Thousands of lanterns in a cedar forest.', { needs: 't-nara' }),
  I('naramachi', 'Naramachi old town & mochi', 'Nara', 'Naramachi', 'Neighbourhood & street life', 1, 2, P(1000, 1000, 500, 0), 'Merchant houses, cafes and the famous fast-pounded mochi stall.', { needs: 't-nara' }),
  I('t-nara', 'Kyoto ⇄ Nara (return)', 'Nara', 'Nara', 'Transport', 1, 2, P(1400, 1400, 700, 0), 'About 45 minutes each way (JR or Kintetsu).', TR),

  // ───────────── KOBE & HIMEJI ─────────────
  I('himeji-castle', 'Himeji Castle', 'Kobe & Himeji', 'Himeji', 'Castle & history', 2, 3, P(2500, 500, 500, 0), 'Japan\'s best-preserved white castle. Foreign-visitor pricing was announced for 2026 — verify the current figure. Many stairs.', { toddlerOk: false, needs: 't-himeji' }),
  I('kobe-beef', 'Kobe beef lunch', 'Kobe & Himeji', 'Kobe', 'Food & markets', 1, 1.5, P(9000, 9000, 6000, 0), 'Teppanyaki or steakhouse lunch menus cost far less than dinner.', { needs: 't-kobe' }),
  I('arima-onsen', 'Arima Onsen town & Kin-no-Yu bath', 'Kobe & Himeji', 'Arima', 'Onsen & wellness', 1, 3, P(800, 800, 400, 0), 'One of Japan\'s oldest hot-spring towns, reached via Kobe. The golden spring is public bathing.', { toddlerOk: false }),
  I('nunobiki', 'Kobe Nunobiki herb garden & ropeway', 'Kobe & Himeji', 'Kobe', 'Nature & hiking', 1, 2.5, P(1800, 1800, 900, 0), 'City-view ropeway ride, a hillside garden and German-style tea rooms.', { needs: 't-kobe' }),
  I('t-himeji', 'Osaka ⇄ Himeji (JR, return)', 'Kobe & Himeji', 'Himeji', 'Transport', 1, 2, P(3000, 3000, 1500, 0), 'About an hour each way on the JR Special Rapid.', TR),
  I('t-kobe', 'Osaka ⇄ Kobe (return)', 'Kobe & Himeji', 'Kobe', 'Transport', 1, 1, P(800, 800, 400, 0), '30 minutes each way.', TR),

  // ───────────── HIROSHIMA & MIYAJIMA ─────────────
  I('hiroshima-peace', 'Hiroshima Peace Memorial Park & Museum', 'Hiroshima & Miyajima', 'Hiroshima', 'Museum & art', 1, 3, P(200, 100, 50, 0), 'Sobering and important. Exhibits may be heavy for younger kids; the park itself is gentle.', { link: 'https://hpmmuseum.jp/?lang=eng', needs: 't-hiroshima' }),
  I('miyajima', 'Miyajima: floating torii & Itsukushima Shrine', 'Hiroshima & Miyajima', 'Miyajima', 'Temple & shrine', 1, 4, P(800, 800, 300, 0), 'Ferry across to the shrine and wild deer. Price includes the ferry and shrine fee. Tide times matter for the gate.', { needs: 't-hiroshima' }),
  I('miyajima-ropeway', 'Mt. Misen ropeway', 'Hiroshima & Miyajima', 'Miyajima', 'Nature & hiking', 2, 2, P(2000, 2000, 1000, 0), 'Ropeway to near the summit, then a short walk to the views.', { toddlerOk: false }),
  I('hiroshima-okonomiyaki', 'Hiroshima-style okonomiyaki lunch', 'Hiroshima & Miyajima', 'Hiroshima', 'Food & markets', 1, 1, P(1500, 1500, 1000, 0), 'Layered with noodles; try Okonomimura.', { tier: 'budget' }),
  I('t-hiroshima', 'Osaka ⇄ Hiroshima Shinkansen (return)', 'Hiroshima & Miyajima', 'Hiroshima', 'Transport', 1, 3, P(20000, 20000, 10000, 0), 'About 1h30 each way. Easier as an overnight if you can.', TR),

  // ───────────── KOYASAN & KUMANO ─────────────
  I('koyasan-day', 'Koyasan: Okunoin cemetery & temples', 'Koyasan & Kumano', 'Koyasan', 'Temple & shrine', 2, 5, P(1000, 1000, 500, 0), 'Forest cemetery of 200,000 moss-covered graves and a mountaintop temple town. Atmospheric.', { link: 'https://www.shukubo.net/', needs: 't-koyasan' }),
  I('koyasan-shukubo', 'Koyasan temple stay (shukubo), 1 night with dinner, breakfast & prayers', 'Koyasan & Kumano', 'Koyasan', 'Culture experience', 1, 18, P(16000, 16000, 10000, 0), 'Includes the night\'s lodging — do not also count a hotel for that night. Quiet, vegetarian meals, early-morning prayers. Check toddler policies.', { ...PK, toddlerOk: false, link: 'https://www.shukubo.net/', needs: 't-koyasan' }),
  I('kumano-guided-day', 'Kumano Kodo guided day hike', 'Koyasan & Kumano', 'Tanabe', 'Day trip & tour', 3, 8, P(17000, 17000, 10000, 0), 'Takijiri-oji to Chikatsuyu on the ancient pilgrim path, with a guide and lunch. Moderate; allow a full day.', { ...PK, toddlerOk: false, link: 'https://www.tb-kumano.jp/en/', needs: 't-kumano' }),
  I('kumano-3day', 'Kumano Kodo 3-day self-guided package', 'Koyasan & Kumano', 'Kumano', 'Day trip & tour', 3, 24, P(60000, 60000, 40000, 0), 'Lodging, dinners and luggage transfer arranged by an operator. Includes the night\'s lodging. Strenuous — older teens and fit adults.', { ...PK, toddlerOk: false, link: 'https://www.tb-kumano.jp/en/', needs: 't-kumano' }),
  I('t-koyasan', 'Osaka ⇄ Koyasan (Nankai, World Heritage ticket)', 'Koyasan & Kumano', 'Koyasan', 'Transport', 1, 4, P(3500, 3500, 1800, 0), 'About 2 hours each way by train, cable car and bus. Approximate.', TR),
  I('t-kumano', 'Osaka → Kii-Tanabe (JR Kuroshio, return)', 'Koyasan & Kumano', 'Kii-Tanabe', 'Transport', 1, 4, P(9800, 9800, 4900, 0), 'About 2.5 hours each way. Approximate.', TR),

  // ───────────── NAGANO & KISO ─────────────
  I('snow-monkeys', 'Jigokudani Snow Monkey Park', 'Nagano & Kiso', 'Yamanouchi', 'Animals & aquarium', 2, 3, P(800, 800, 400, 0), "Macaques bathing in hot springs. Best in winter. A 30-minute forest walk each way. Entrance fee is for the park only.", { toddlerOk: false, needs: 't-nagano' }),
  I('nakasendo-walk', 'Nakasendo Magome → Tsumago self-guided walk', 'Nagano & Kiso', 'Kiso Valley', 'Nature & hiking', 2, 4, P(0), 'Old post-town trail, about 8 km. Luggage forwarding available.', { toddlerOk: false, needs: 't-kiso' }),
  I('nakasendo-guided', 'Nakasendo guided hike with luggage transfer', 'Nagano & Kiso', 'Kiso Valley', 'Day trip & tour', 2, 6, P(12000, 12000, 7000, 0), 'Guide plus bag transfer between the two villages.', { ...PK, toddlerOk: false, needs: 't-kiso' }),
  I('t-nagano', 'Tokyo ⇄ Nagano Shinkansen (return)', 'Nagano & Kiso', 'Nagano', 'Transport', 1, 3, P(17000, 17000, 8500, 0), 'About 1h30 each way, plus a bus to the park. Approximate.', TR),
  I('t-kiso', 'Nagoya ⇄ Magome/Nakatsugawa (return)', 'Nagano & Kiso', 'Kiso Valley', 'Transport', 1, 3, P(9000, 9000, 4500, 0), 'Approximate; includes the local bus.', TR),

  // ───────────── NATIONWIDE ─────────────
  I('sento', 'Public bathhouse (sento) experience', 'Anywhere / Nationwide', 'Citywide', 'Onsen & wellness', 1, 1.5, P(550, 550, 200, 0), 'Cheap neighbourhood baths. Tattoo rules vary — ask first.', { tier: 'budget' }),
  I('conbini', 'Convenience-store feast challenge', 'Anywhere / Nationwide', 'Citywide', 'Food & markets', 1, 1, P(1500, 1500, 1000, 0), 'Egg sandwiches, onigiri, fried chicken. Cheap, delicious.', { tier: 'budget' }),
  I('kaiten-sushi', 'Conveyor-belt sushi dinner', 'Anywhere / Nationwide', 'Citywide', 'Food & markets', 1, 1, P(2000, 2000, 1200, 0), 'Sushiro, Kura or Hamazushi. Order on the tablet, kids love the belt.', { tier: 'budget' }),
  I('ramen-lunch', 'Ramen lunch', 'Anywhere / Nationwide', 'Citywide', 'Food & markets', 1, 1, P(1200, 1200, 800, 0), 'Pick a ticket machine shop. Kids bowls are common.', { tier: 'budget' }),
  I('don-quijote', 'Don Quijote & 100-yen store haul', 'Anywhere / Nationwide', 'Citywide', 'Pop culture & shopping', 1, 1.5, P(2000, 2000, 1500, 0), 'Souvenir and snack heaven. Tax-free for tourists with a passport.', { tier: 'budget' }),
  I('baseball', 'Pro baseball game (season: Mar–Oct)', 'Anywhere / Nationwide', 'Dome / stadium', 'Culture experience', 1, 3.5, P(3500, 3500, 2000, 0), 'Crowds with trumpets and chants. Picnic food and draught beer.', {}),
]
