-- Same pattern as legacy NOT NULL `name`: drifted schemas require `slug` on insert.
-- App stores full product in `payload`; these columns satisfy NOT NULL triggers / ORMs.

alter table public.products add column if not exists slug text;

update public.products p
set slug = coalesce(
  nullif(btrim(coalesce(p.slug, '')), ''),
  nullif(btrim(coalesce(p.payload->>'slug', '')), ''),
  case
    when btrim(coalesce(p.id::text, '')) ~ '^p-' then 'item-' || btrim(coalesce(p.id::text, ''))
    else nullif(btrim(coalesce(p.id::text, '')), '')
  end,
  'product'
)
where p.slug is null
   or length(btrim(coalesce(p.slug, ''))) = 0;

alter table public.products alter column slug drop not null;
