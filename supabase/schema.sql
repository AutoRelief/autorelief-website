-- MVP schema for Supabase PostgreSQL.
-- Apply in a new Supabase project only after reviewing the policies with your developer.
create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  created_at timestamptz not null default now()
);

create table if not exists public.vehicles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  make text, model text, year int, plate_number text,
  created_at timestamptz not null default now()
);

create table if not exists public.providers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  business_name text not null,
  craft text not null,
  phone text not null,
  service_areas text[] not null default '{}',
  is_available boolean not null default false,
  verification_status text not null default 'pending'
    check (verification_status in ('pending','approved','rejected','suspended')),
  created_at timestamptz not null default now()
);

create table if not exists public.rescue_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  issue_type text not null,
  vehicle_details text,
  phone text,
  latitude double precision,
  longitude double precision,
  status text not null default 'waiting'
    check (status in ('waiting','assigned','en_route','completed','cancelled')),
  assigned_provider_id uuid references public.providers(id),
  created_at timestamptz not null default now(),
  location_expires_at timestamptz not null default (now() + interval '24 hours')
);

create index if not exists providers_availability_idx on public.providers(is_available, verification_status);
create index if not exists rescue_status_created_idx on public.rescue_requests(status, created_at desc);

alter table public.profiles enable row level security;
alter table public.vehicles enable row level security;
alter table public.providers enable row level security;
alter table public.rescue_requests enable row level security;

-- Customers may access only their own profile and vehicles.
create policy "profile owner read/update" on public.profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);
create policy "vehicle owner access" on public.vehicles
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Public users must not be able to list private provider documents or exact live locations.
-- Provider discovery should be exposed through a restricted server-side RPC/view.
create policy "provider owner read" on public.providers
  for select using (auth.uid() = user_id);
create policy "provider owner create" on public.providers
  for insert with check (auth.uid() = user_id);
create policy "provider owner update" on public.providers
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Customers can read their own requests. Create requests through a server-side
-- Edge Function/route with validation, rate limiting and abuse controls.
create policy "request owner read" on public.rescue_requests
  for select using (auth.uid() = user_id);

-- Do not expose service-role keys in the browser. Never enable broad public
-- INSERT/UPDATE policies on rescue_requests for a production SOS workflow.
