-- Some projects created `public.orders` before the `payload` column existed.
-- PostgREST then errors: "Could not find the 'payload' column of 'orders' in the schema cache".

alter table public.orders
  add column if not exists payload jsonb;

-- Backfill empty object for any legacy rows before enforcing NOT NULL
update public.orders
set payload = '{}'::jsonb
where payload is null;

alter table public.orders
  alter column payload set default '{}'::jsonb;

alter table public.orders
  alter column payload set not null;
