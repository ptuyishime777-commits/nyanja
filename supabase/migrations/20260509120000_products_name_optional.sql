-- Products drift fix: legacy NOT NULL `name` while app sends `id` + `payload` → 23502.
-- Canonical model: name is nullable; payload is source of truth.

alter table public.products add column if not exists name text;

update public.products p
set name = coalesce(
  nullif(btrim(coalesce(p.name, '')), ''),
  nullif(btrim(coalesce(p.payload->>'name', '')), ''),
  nullif(btrim(coalesce(p.id::text, '')), ''),
  'Product'
)
where p.name is null
   or length(btrim(coalesce(p.name, ''))) = 0;

alter table public.products alter column name drop not null;
