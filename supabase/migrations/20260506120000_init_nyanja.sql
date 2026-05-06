-- Nyanja Gift Hub: catalog, orders, profiles (extends auth.users)

-- ---------- PROFILES ----------
create table if not exists public.profiles (
  id uuid primary key references auth.users on delete cascade,
  email text not null,
  display_name text not null,
  role text not null check (role in ('customer', 'admin')),
  disabled boolean not null default false,
  created_at timestamptz not null default now(),
  cart_json jsonb not null default '[]',
  wishlist_ids jsonb not null default '[]'
);

create index if not exists profiles_email_idx on public.profiles (lower(email));

-- ---------- PRODUCTS ----------
create table if not exists public.products (
  id text primary key,
  payload jsonb not null
);

-- ---------- ORDERS ----------
create table if not exists public.orders (
  id text primary key,
  user_id uuid not null references auth.users on delete cascade,
  payload jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists orders_user_id_created_idx on public.orders (user_id, created_at desc);

-- ---------- NEW AUTH USER → PROFILE ----------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name, role, disabled)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data->>'display_name', split_part(coalesce(new.email, new.id::text), '@', 1)),
    'customer',
    false
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- RLS ----------
alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;

-- Profiles: own row or admin
create policy "profiles_select"
  on public.profiles for select
  using (
    id = (select auth.uid())
    or exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid()) and p.role = 'admin' and not p.disabled
    )
  );

create policy "profiles_insert_own"
  on public.profiles for insert
  with check (id = (select auth.uid()));

create policy "profiles_update_own_cart"
  on public.profiles for update
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

create policy "profiles_update_admin"
  on public.profiles for update
  using (
    exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid()) and p.role = 'admin' and not p.disabled
    )
  )
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid()) and p.role = 'admin' and not p.disabled
    )
  );

-- Products: public read; admin write
create policy "products_select_all"
  on public.products for select
  using (true);

create policy "products_write_admin"
  on public.products for insert
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid()) and p.role = 'admin' and not p.disabled
    )
  );

create policy "products_update_admin"
  on public.products for update
  using (
    exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid()) and p.role = 'admin' and not p.disabled
    )
  );

create policy "products_delete_admin"
  on public.products for delete
  using (
    exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid()) and p.role = 'admin' and not p.disabled
    )
  );

-- Orders
create policy "orders_select"
  on public.orders for select
  using (
    user_id = (select auth.uid())
    or exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid()) and p.role = 'admin' and not p.disabled
    )
  );

create policy "orders_insert_own"
  on public.orders for insert
  with check (user_id = (select auth.uid()));

create policy "orders_update_owner_or_admin"
  on public.orders for update
  using (
    user_id = (select auth.uid())
    or exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid()) and p.role = 'admin' and not p.disabled
    )
  );

-- ---------- SEED PRODUCTS (bundle with migration) ----------
insert into public.products (id, payload)
select
  (elem->>'id')::text,
  elem::jsonb
from jsonb_array_elements(
$nyanja_seed_products$
[{"id":"1","slug":"rose-luxury-perfume-set","name":"Rose Luxury Perfume Set","category":"gift-packages","priceRwf":35000,"compareAtRwf":40000,"images":["/nyanja-images/img-05.png","/nyanja-images/img-06.png"],"description":"A curated trio of floral eau de parfum, silk ribbon, and a keepsake box — crafted for unforgettable moments.","bundleItems":["3 × 15ml travel sprays","Velvet pouch","Handwritten card slot","Ribbon-tied rigid box"],"rating":4.9,"reviewCount":128,"popularity":98,"featured":true,"trending":true,"reviews":[{"id":"r1","author":"Claire U.","rating":5,"text":"Packaging felt like a boutique in Paris. My sister cried (happy tears).","date":"2026-03-12"},{"id":"r2","author":"Jean-Paul K.","rating":5,"text":"Delivered to Kigali in two days. Scents are soft, not overpowering.","date":"2026-02-28"}]},{"id":"2","slug":"kigali-birthday-luxe-box","name":"Kigali Birthday Luxe Box","category":"gift-packages","priceRwf":40000,"images":["/nyanja-images/img-09.png","/nyanja-images/img-10.png"],"description":"Celebrate with artisan treats, a mini sparkling juice, confetti, and a candle — the ultimate birthday gesture.","bundleItems":["Artisan chocolate selection","Mini sparkling juice","Soy candle 40h","Confetti popper"],"rating":4.8,"reviewCount":86,"popularity":92,"featured":true,"reviews":[{"id":"r3","author":"Mutesi A.","rating":5,"text":"Everything was fresh and beautifully arranged.","date":"2026-04-01"}]},{"id":"3","slug":"artisan-chocolate-wine","name":"Artisan Chocolate & Wine","category":"gift-packages","priceRwf":18000,"images":["/nyanja-images/img-02.png","/nyanja-images/img-04.png"],"description":"Single-origin dark bars paired with a refined non-alcoholic red — perfect for evening gifting.","bundleItems":["4 craft chocolate bars","NA reserve bottle","Pairing guide card"],"rating":4.7,"reviewCount":54,"popularity":76},{"id":"4","slug":"spa-serenity-hamper","name":"Spa Serenity Hamper","category":"gift-packages","priceRwf":33000,"images":["/nyanja-images/img-03.png","/nyanja-images/img-04.png"],"description":"Calm in a basket: bath salts, body oil, silk eye mask, and a bamboo brush.","bundleItems":["Dead sea salts","Rose body oil","Silk eye mask","Dry brush"],"rating":4.85,"reviewCount":71,"popularity":88,"trending":true},{"id":"5","slug":"linen-overshirt-cream","name":"Linen Overshirt — Cream","category":"clothes","priceRwf":25000,"images":["/nyanja-images/img-07.png","/nyanja-images/img-08.png"],"description":"Breathable European linen blend, relaxed tailoring, mother-of-pearl buttons.","rating":4.6,"reviewCount":33,"popularity":62},{"id":"6","slug":"silk-evening-dress","name":"Silk Evening Dress","category":"clothes","priceRwf":40000,"compareAtRwf":45000,"images":["/nyanja-images/img-01.jpg","/nyanja-images/img-05.png"],"description":"Bias-cut silk satin, ankle length, invisible zipper — runway softness.","rating":4.95,"reviewCount":41,"popularity":90,"featured":true},{"id":"7","slug":"kids-celebration-outfit","name":"Kids Celebration Outfit","category":"clothes","priceRwf":16000,"images":["/nyanja-images/img-07.png","/nyanja-images/img-06.png"],"description":"Organic cotton set with bow detail — gentle on skin, big on charm.","rating":4.75,"reviewCount":27,"popularity":58},{"id":"8","slug":"minimal-leather-sneakers","name":"Minimal Leather Sneakers","category":"shoes","priceRwf":38000,"images":["/nyanja-images/img-02.png","/nyanja-images/img-03.png"],"description":"Full-grain leather, cushioned footbed, tonal laces — everyday luxury.","rating":4.8,"reviewCount":64,"popularity":85,"trending":true},{"id":"9","slug":"woven-sandals-natural","name":"Woven Sandals — Natural","category":"shoes","priceRwf":20000,"images":["/nyanja-images/img-04.png","/nyanja-images/img-08.png"],"description":"Hand-woven straps, leather sole, soft arch support for warm evenings.","rating":4.55,"reviewCount":19,"popularity":48},{"id":"10","slug":"rose-gold-watch","name":"Rose Gold Watch","category":"accessories","priceRwf":40000,"images":["/nyanja-images/img-10.png","/nyanja-images/img-09.png"],"description":"Sapphire crystal, Swiss movement, blush dial — an heirloom in the making.","rating":4.98,"reviewCount":56,"popularity":94,"trending":true},{"id":"11","slug":"pearl-drop-earrings","name":"Pearl Drop Earrings","category":"accessories","priceRwf":22000,"images":["/nyanja-images/img-06.png","/nyanja-images/img-05.png"],"description":"Freshwater pearls on 14k rose gold hooks — luminous and lightweight.","rating":4.72,"reviewCount":38,"popularity":72},{"id":"12","slug":"cashmere-scarf-gift-set","name":"Cashmere Scarf Gift Set","category":"accessories","priceRwf":30000,"compareAtRwf":36000,"images":["/nyanja-images/img-01.jpg","/nyanja-images/img-03.png"],"description":"Mongolian cashmere wrap with monogram-ready tag and storage box.","bundleItems":["Cashmere wrap 180×70cm","Storage box","Care card"],"rating":4.88,"reviewCount":49,"popularity":80}]
$nyanja_seed_products$::jsonb
) as elem
on conflict (id) do nothing;
