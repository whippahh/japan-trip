# Japan Family Trip

A private planning site for the extended family: browse ~140 sights, tours, passes and stays; build your own
list; price your trip (any length); vote on ideas; log who bought which tickets; tick off "ready to go".
Everyone types their name — no passwords. People are grouped into households.

Stack: React + Vite (static site) + Supabase (database). Costs nothing on free tiers.

---------------------------------------------------------------------------------------------------

## 1. Try it locally (no Supabase needed)

    npm install
    npm run dev

Without Supabase keys the site runs in **demo mode** (data saved only in your browser).

## 2. Set up the database (Supabase) — ~5 minutes

You can reuse your existing Supabase account without touching ProgressScape:

* **Safest: create a new project** (free plan allows 2 active projects). Name it e.g. `japan-trip`.
* **Or use your existing project**: every table here is prefixed `jt_`, and the SQL only creates/touches `jt_*`
  tables, so nothing of ProgressScape's is changed. (Traffic for this app is tiny: a few thousand rows.)

Steps:

1. Supabase dashboard → **SQL Editor → New query** → paste all of `supabase/schema.sql` → **Run**.
   (Safe to run again.)
2. **Project Settings → API**: copy the **Project URL** and the **anon public** key.
3. Copy `.env.example` to `.env.local` and fill both values in. Run `npm run dev` again — the "Demo mode" banner disappears.

> The anon key is *meant* to be public in a browser app. Access is open by design (anyone with the site link
> can read/write the `jt_` tables), so don't put anything sensitive in. Never type passport numbers; the checklist
> is just yes/no ticks.

## 3. Put it online, private repo + free hosting

1. Create a **private** GitHub repo and push this folder:

       git init && git add . && git commit -m "Japan trip site"
       git branch -M main
       git remote add origin git@github.com:YOU/japan-trip.git
       git push -u origin main

2. Deploy from that repo with **Cloudflare Pages** (recommended) — or Netlify / Vercel — all have free plans that
   can build from private repos:
   * Build command: `npm run build`   Output directory: `dist`
   * Environment variables: add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (same values as `.env.local`)
3. Share the generated `https://something.pages.dev` link with the family. The site sends `noindex` and
   `robots.txt` disallows crawlers, so it won't show up in search; only people with the link can find it.
   (Optional: turn on Cloudflare Access / Netlify password protection for extra privacy.)

GitHub Pages is **not** suitable here: free GitHub Pages sites are always public, even from a private repo.

## How it works

* **Name-only sign-in.** First visit: type your name, pick/create a household. Name is stored in your browser;
  typing the same name later signs you back in. Parents can switch to a child's profile from the top bar
  ("Acting as") to pick things and tick their checklist.
* **Explore:** filter by area, town, type, effort, toddler-friendliness, price; sort by trip order, votes or price.
  Prices adapt to the age group of whoever you're acting as.
* **Calculator:** dates (or just nights per stay), accommodation split by people sharing, activities (with an optional
  day number to build an itinerary), food by eating style, local transport. Per person, household and group totals.
* **Plans:** six ready-made single-line routes (Classic 14n, Family & Theme Parks 10n, Budget Loop 12n, Temples & Trails 14n,
  Splurge & Slow 10n, One-Week Taster 7n). Customise nights, accommodation style and attractions, apply to yourself, your
  household or everyone, then edit freely. Defined in `src/data/plans.ts`.
* **Route map:** Leaflet + OpenStreetMap (free, no API key). Each person's scheduled picks (those with a day) become a numbered,
  colour-coded path with popups showing how you get there (mode, time, approximate cost). Within a day, stops are ordered to keep
  the path short. A warning appears if a route leaves a base town and later returns (single-day trips are fine).
  Town coordinates are in `src/data/geo.ts`; travel times and fares between bases are estimates.
* **Ideas & votes:** anyone can suggest something; 👍 🤔 👎 on any item; leaderboard.
* **Tickets & payments:** a ledger of who bought what for whom, who owes who (simplified), and which pickers still
  have no ticket. **No money moves through this site.**
* **Ready?** checklist per person (passport ready, flights, insurance, Visit Japan Web, …).

## Editing the content

* Sights, packages, passes, transit: `src/data/catalogue.ts` (price tuple = adult, teen, child, under-6).
* Accommodation: `src/data/stays.ts`. Checklist items: `src/data/checklist.ts`.
* Daily food/transport assumptions and age multipliers: `src/lib/pricing.ts`.
* Yen→A$ rate is editable in the page footer (stored per browser; default ¥110 per A$1).

**All prices are approximate (2025–26 research) — verify on the official sites before booking.** Items I wasn't
sure about carry a note (e.g. Himeji Castle foreign-visitor pricing, Osaka Castle, Todai-ji, Toei Kyoto Studio Park).

## Scripts

    npm run dev        # local dev server
    npm run build      # production build to dist/
    npm run typecheck  # TypeScript check
    npm test           # pricing/catalogue sanity tests
