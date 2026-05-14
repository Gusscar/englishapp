-- Journal entries (escritura libre)
create table if not exists journal_entries (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz default now(),
  date        date not null default current_date,
  prompt      text,
  content     text not null
);

-- Immersion logs (tracker de inmersion)
create table if not exists immersion_logs (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz default now(),
  date        date not null default current_date,
  type        text not null check (type in ('listening','watching','reading','speaking')),
  minutes     integer not null check (minutes > 0),
  notes       text
);

-- RLS (same pattern as phrases table)
alter table journal_entries enable row level security;
alter table immersion_logs  enable row level security;

create policy "Public journal_entries" on journal_entries for all using (true) with check (true);
create policy "Public immersion_logs"  on immersion_logs  for all using (true) with check (true);
