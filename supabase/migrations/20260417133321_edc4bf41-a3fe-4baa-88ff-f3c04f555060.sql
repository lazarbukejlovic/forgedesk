
-- ENUMS
create type public.app_role as enum ('admin', 'customer');
create type public.setup_group as enum ('surface', 'stands', 'lighting', 'organization', 'accessories');
create type public.order_status as enum ('pending', 'paid', 'fulfilled', 'shipped', 'delivered', 'cancelled', 'refunded');

-- updated_at helper
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

-- PROFILES
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
create policy "profiles_select_own" on public.profiles for select using (auth.uid() = id);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id);
create policy "profiles_insert_own" on public.profiles for insert with check (auth.uid() = id);
create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

-- USER ROLES
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create policy "user_roles_read_own_or_admin" on public.user_roles for select
  using (auth.uid() = user_id or public.has_role(auth.uid(), 'admin'));
create policy "user_roles_admin_manage" on public.user_roles for all
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

-- handle_new_user trigger
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)));
  insert into public.user_roles (user_id, role) values (new.id, 'customer') on conflict do nothing;
  return new;
end;
$$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ADDRESSES
create table public.addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  label text,
  first_name text not null,
  last_name text not null,
  line1 text not null,
  line2 text,
  city text not null,
  region text,
  postal_code text not null,
  country text not null default 'United States',
  phone text,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.addresses enable row level security;
create index addresses_user_id_idx on public.addresses(user_id);
create policy "addresses_owner_all" on public.addresses for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create trigger addresses_updated_at before update on public.addresses
  for each row execute function public.set_updated_at();

-- CATEGORIES
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  tagline text,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.categories enable row level security;
create policy "categories_public_read" on public.categories for select using (true);
create policy "categories_admin_write" on public.categories for all
  using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));
create trigger categories_updated_at before update on public.categories
  for each row execute function public.set_updated_at();

-- PRODUCTS
create table public.products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  short_description text,
  description text,
  category_id uuid references public.categories(id) on delete set null,
  setup_group setup_group not null default 'accessories',
  price_cents int not null check (price_cents >= 0),
  compare_at_cents int,
  primary_image text not null,
  badges text[] not null default '{}',
  compatibility text[] not null default '{}',
  bundle_savings_eligible boolean not null default true,
  stock_count int not null default 0 check (stock_count >= 0),
  rating numeric(2,1) not null default 0,
  review_count int not null default 0,
  is_active boolean not null default true,
  is_featured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.products enable row level security;
create index products_category_idx on public.products(category_id);
create index products_active_idx on public.products(is_active);
create policy "products_public_read" on public.products for select using (true);
create policy "products_admin_write" on public.products for all
  using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));
create trigger products_updated_at before update on public.products
  for each row execute function public.set_updated_at();

-- PRODUCT IMAGES
create table public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  url text not null,
  alt text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
alter table public.product_images enable row level security;
create index product_images_product_idx on public.product_images(product_id);
create policy "product_images_public_read" on public.product_images for select using (true);
create policy "product_images_admin_write" on public.product_images for all
  using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

-- PRODUCT VARIANTS
create table public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  axis text not null,
  option_key text not null,
  option_label text not null,
  swatch text,
  price_delta_cents int not null default 0,
  stock_count int not null default 0 check (stock_count >= 0),
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  unique (product_id, axis, option_key)
);
alter table public.product_variants enable row level security;
create index product_variants_product_idx on public.product_variants(product_id);
create policy "product_variants_public_read" on public.product_variants for select using (true);
create policy "product_variants_admin_write" on public.product_variants for all
  using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

-- PRODUCT SPECS
create table public.product_specs (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  label text not null,
  value text not null,
  sort_order int not null default 0
);
alter table public.product_specs enable row level security;
create index product_specs_product_idx on public.product_specs(product_id);
create policy "product_specs_public_read" on public.product_specs for select using (true);
create policy "product_specs_admin_write" on public.product_specs for all
  using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

-- BUNDLES
create table public.bundles (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  tagline text,
  image text not null,
  discount_pct numeric(4,3) not null default 0.10 check (discount_pct >= 0 and discount_pct < 1),
  is_featured boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.bundles enable row level security;
create policy "bundles_public_read" on public.bundles for select using (true);
create policy "bundles_admin_write" on public.bundles for all
  using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));
create trigger bundles_updated_at before update on public.bundles
  for each row execute function public.set_updated_at();

create table public.bundle_products (
  id uuid primary key default gen_random_uuid(),
  bundle_id uuid not null references public.bundles(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  sort_order int not null default 0,
  unique (bundle_id, product_id)
);
alter table public.bundle_products enable row level security;
create index bundle_products_bundle_idx on public.bundle_products(bundle_id);
create policy "bundle_products_public_read" on public.bundle_products for select using (true);
create policy "bundle_products_admin_write" on public.bundle_products for all
  using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

-- CART ITEMS (use partial unique indexes since UNIQUE can't have function expressions)
create table public.cart_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  variant_key text not null default '',
  variant_label text not null default '',
  quantity int not null default 1 check (quantity > 0),
  unit_price_cents int not null check (unit_price_cents >= 0),
  bundle_id uuid references public.bundles(id) on delete set null,
  bundle_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.cart_items enable row level security;
create index cart_items_user_idx on public.cart_items(user_id);
create unique index cart_items_unique_with_bundle
  on public.cart_items(user_id, product_id, variant_key, bundle_id)
  where bundle_id is not null;
create unique index cart_items_unique_no_bundle
  on public.cart_items(user_id, product_id, variant_key)
  where bundle_id is null;
create policy "cart_owner_all" on public.cart_items for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create trigger cart_items_updated_at before update on public.cart_items
  for each row execute function public.set_updated_at();

-- WISHLIST
create table public.wishlist_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, product_id)
);
alter table public.wishlist_items enable row level security;
create index wishlist_user_idx on public.wishlist_items(user_id);
create policy "wishlist_owner_all" on public.wishlist_items for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- REVIEWS
create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  rating int not null check (rating between 1 and 5),
  title text not null,
  body text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (product_id, user_id)
);
alter table public.reviews enable row level security;
create index reviews_product_idx on public.reviews(product_id);
create policy "reviews_public_read" on public.reviews for select using (true);
create policy "reviews_owner_insert" on public.reviews for insert with check (auth.uid() = user_id);
create policy "reviews_owner_update" on public.reviews for update using (auth.uid() = user_id);
create policy "reviews_owner_admin_delete" on public.reviews for delete
  using (auth.uid() = user_id or public.has_role(auth.uid(), 'admin'));
create trigger reviews_updated_at before update on public.reviews
  for each row execute function public.set_updated_at();

-- SAVED SETUPS
create table public.saved_setups (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null default 'My Setup',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.saved_setups enable row level security;
create index saved_setups_user_idx on public.saved_setups(user_id);
create policy "saved_setups_owner_all" on public.saved_setups for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create trigger saved_setups_updated_at before update on public.saved_setups
  for each row execute function public.set_updated_at();

create table public.saved_setup_items (
  id uuid primary key default gen_random_uuid(),
  setup_id uuid not null references public.saved_setups(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  variant_key text not null default '',
  variant_label text not null default '',
  unique (setup_id, product_id, variant_key)
);
alter table public.saved_setup_items enable row level security;
create index saved_setup_items_setup_idx on public.saved_setup_items(setup_id);
create policy "saved_setup_items_owner_all" on public.saved_setup_items for all
  using (exists (select 1 from public.saved_setups s where s.id = setup_id and s.user_id = auth.uid()))
  with check (exists (select 1 from public.saved_setups s where s.id = setup_id and s.user_id = auth.uid()));

-- DISCOUNT CODES
create table public.discount_codes (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  description text,
  percent_off int check (percent_off between 1 and 100),
  amount_off_cents int check (amount_off_cents > 0),
  min_subtotal_cents int not null default 0,
  max_redemptions int,
  redemption_count int not null default 0,
  starts_at timestamptz,
  ends_at timestamptz,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    (percent_off is not null and amount_off_cents is null)
    or (percent_off is null and amount_off_cents is not null)
  )
);
alter table public.discount_codes enable row level security;
create policy "discount_codes_admin_manage" on public.discount_codes for all
  using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));
create policy "discount_codes_auth_read_active" on public.discount_codes for select
  to authenticated using (is_active = true);
create trigger discount_codes_updated_at before update on public.discount_codes
  for each row execute function public.set_updated_at();

-- ORDERS
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  email text not null,
  status order_status not null default 'pending',
  subtotal_cents int not null default 0,
  discount_cents int not null default 0,
  shipping_cents int not null default 0,
  total_cents int not null default 0,
  discount_code text,
  shipping_address jsonb,
  stripe_session_id text unique,
  stripe_payment_intent text,
  placed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.orders enable row level security;
create index orders_user_idx on public.orders(user_id);
create index orders_status_idx on public.orders(status);
create policy "orders_owner_or_admin_read" on public.orders for select
  using (auth.uid() = user_id or public.has_role(auth.uid(), 'admin'));
create policy "orders_admin_manage" on public.orders for all
  using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));
create trigger orders_updated_at before update on public.orders
  for each row execute function public.set_updated_at();

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  product_name text not null,
  variant_label text not null default '',
  quantity int not null check (quantity > 0),
  unit_price_cents int not null check (unit_price_cents >= 0),
  bundle_name text,
  created_at timestamptz not null default now()
);
alter table public.order_items enable row level security;
create index order_items_order_idx on public.order_items(order_id);
create policy "order_items_read_via_parent" on public.order_items for select
  using (exists (
    select 1 from public.orders o
    where o.id = order_id and (o.user_id = auth.uid() or public.has_role(auth.uid(), 'admin'))
  ));
create policy "order_items_admin_manage" on public.order_items for all
  using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));
