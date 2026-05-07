-- Products drift fix: hosted DBs may have legacy NOT NULL columns (e.g. `name`)
-- without the app supplying them — upserts target `id` + `payload`.
-- Postgres 23502: null value in column "name" violates not-null constraint

alter table public.products add column if not exists name text;

update public.products p
set name = trim(
  coalesce(
    nullif(trim(coalesce(p.name, '')), ''),
    nullif(trim(coalesce(p.payload ->> 'name', '')), ''),
    trim(coalesce(p.id, '')),
    'Product'
  )
)
where p.name is null
   or trim(coalesce(p.name, '')) = '';

alter table public.products alter column name drop not null;
