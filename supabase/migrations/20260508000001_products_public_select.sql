-- Fix empty storefront: allow anyone to read products with the anon key (Vite SPA).
-- Older scripts sometimes used "active = true" without rows, or policies that block anon.

alter table public.products enable row level security;

drop policy if exists "Anyone reads active products" on public.products;
drop policy if exists products_select_all on public.products;
drop policy if exists products_select_anon on public.products;

create policy products_select_anon
  on public.products
  for select
  to anon, authenticated
  using (true);
