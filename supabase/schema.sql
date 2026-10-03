-- Japan Family Trip — Supabase schema
-- Paste this whole file into Supabase > SQL Editor > Run. Safe to re-run.
-- Every table is prefixed jt_ so it can never collide with another app (e.g. ProgressScape)
-- if you share a project. It only ever touches jt_* tables.

create extension if not exists pgcrypto;

create table if not exists jt_households (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  created_at  timestamptz not null default now()
);

create table if not exists jt_people (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  household_id uuid references jt_households(id) on delete set null,
  age_group    text not null default 'adult' check (age_group in ('adult','teen','child','toddler')),
  arrive       date,
  depart       date,
  tier         text not null default 'mid' check (tier in ('budget','mid','splurge')),
  stays        jsonb not null default '[]'::jsonb,
  notes        text,
  created_at   timestamptz not null default now()
);

-- "I'm doing this" — one row per person per catalogue item / suggestion
create table if not exists jt_picks (
  person_id  uuid not null references jt_people(id) on delete cascade,
  item_id    text not null,
  day        int,
  created_at timestamptz not null default now(),
  primary key (person_id, item_id)
);

create table if not exists jt_suggestions (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  url         text,
  area        text,
  type        text,
  price_adult int not null default 0,
  price_child int,
  note        text,
  added_by    uuid references jt_people(id) on delete set null,
  created_at  timestamptz not null default now()
);

-- Opinion votes on catalogue items or suggestions (vote: 1 = in, 0 = maybe, -1 = pass)
create table if not exists jt_votes (
  target_id  text not null,
  person_id  uuid not null references jt_people(id) on delete cascade,
  vote       smallint not null check (vote in (-1,0,1)),
  created_at timestamptz not null default now(),
  primary key (target_id, person_id)
);

-- Ticket / payment LEDGER. Records who bought what; no money moves through this app.
create table if not exists jt_tickets (
  id         uuid primary key default gen_random_uuid(),
  label      text not null,
  item_id    text,
  amount_yen int not null default 0,
  status     text not null default 'planned' check (status in ('planned','bought')),
  paid_by    uuid references jt_people(id) on delete set null,
  covers     jsonb not null default '[]'::jsonb,
  settled    boolean not null default false,
  note       text,
  created_at timestamptz not null default now()
);

-- Readiness ticks (passport ready? etc). NEVER store passport numbers.
create table if not exists jt_checklist (
  person_id  uuid not null references jt_people(id) on delete cascade,
  key        text not null,
  done       boolean not null default true,
  primary key (person_id, key)
);

-- Open access for anyone holding the site link (by design: low-security family site).
do $$
declare t text;
begin
  foreach t in array array['jt_households','jt_people','jt_picks','jt_suggestions','jt_votes','jt_tickets','jt_checklist']
  loop
    execute format('alter table %I enable row level security', t);
    execute format('drop policy if exists %I on %I', t || '_open', t);
    execute format('create policy %I on %I for all to anon, authenticated using (true) with check (true)', t || '_open', t);
    execute format('grant select, insert, update, delete on %I to anon, authenticated', t);
  end loop;
end $$;
