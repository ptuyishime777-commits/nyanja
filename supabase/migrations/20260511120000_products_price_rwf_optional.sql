-- Legacy NOT NULL `price_rwf`; canonical price lives in `payload.priceRwf` / `payload.price_rwf`.

alter table public.products add column if not exists price_rwf integer;

update public.products p
set price_rwf =
  greatest(
    0::integer,
    round(
      coalesce(
        p.price_rwf::numeric,
        cast(nullif(btrim(coalesce(p.payload ->> 'priceRwf', '')), '') as numeric),
        cast(nullif(btrim(coalesce(p.payload ->> 'price_rwf', '')), '') as numeric),
        0::numeric
      )
    )::integer
  )
where p.price_rwf is null;

alter table public.products alter column price_rwf drop not null;
