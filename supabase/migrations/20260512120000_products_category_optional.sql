-- Legacy NOT NULL `category`; canonical category lives in `payload.category`.

alter table public.products add column if not exists category text;

update public.products p
set category = coalesce(
  nullif(btrim(coalesce(p.category, '')), ''),
  nullif(btrim(coalesce(p.payload ->> 'category', '')), ''),
  'gift-packages'
)
where p.category is null
   or length(btrim(coalesce(p.category, ''))) = 0;

alter table public.products alter column category drop not null;
