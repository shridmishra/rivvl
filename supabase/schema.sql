-- ═══════════════════════════════════════════════════════════════════════
-- rivvl Database Schema
-- Paste this into Supabase SQL Editor and run it.
-- ═══════════════════════════════════════════════════════════════════════

-- ─── 1. PROFILES TABLE ─────────────────────────────────────────────────

create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  full_name text,
  plan_tier text not null default 'free'
    check (plan_tier in ('free', 'single', 'pro', 'pro10', 'monthly_pro', 'enterprise')),
  reports_used integer not null default 0,
  reports_limit integer not null default 1,
  pro10_credits_remaining integer not null default 0,
  stripe_customer_id text,
  stripe_subscription_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is 'User profile data, created automatically on signup.';

-- ─── 2. REPORTS TABLE ──────────────────────────────────────────────────

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  car1_name text not null,
  car2_name text not null,
  car1_year text,
  car2_year text,
  report_data jsonb not null,
  plan_tier_at_generation text not null,
  sections_included text[] not null default '{}',
  created_at timestamptz not null default now()
);

comment on table public.reports is 'Saved comparison reports for each user.';

-- Index for fast lookup by user
create index if not exists idx_reports_user_id on public.reports(user_id);
create index if not exists idx_reports_created_at on public.reports(created_at desc);

-- ─── 3. COMPARISONS LOG TABLE ──────────────────────────────────────────

create table if not exists public.comparisons_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  car1_query text not null,
  car2_query text not null,
  status text not null default 'started'
    check (status in ('started', 'completed', 'failed')),
  error_message text,
  created_at timestamptz not null default now()
);

comment on table public.comparisons_log is 'Log of all comparison attempts for analytics.';

create index if not exists idx_comparisons_log_user_id on public.comparisons_log(user_id);

-- ═══════════════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY (RLS)
-- ═══════════════════════════════════════════════════════════════════════

-- Enable RLS on all tables
alter table public.profiles enable row level security;
alter table public.reports enable row level security;
alter table public.comparisons_log enable row level security;

-- ─── PROFILES POLICIES ─────────────────────────────────────────────────

create policy "Users can read own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- ─── REPORTS POLICIES ──────────────────────────────────────────────────

create policy "Users can read own reports"
  on public.reports for select
  using (auth.uid() = user_id);

create policy "Users can insert own reports"
  on public.reports for insert
  with check (auth.uid() = user_id);

-- ─── COMPARISONS LOG POLICIES ──────────────────────────────────────────

create policy "Users can read own comparison logs"
  on public.comparisons_log for select
  using (auth.uid() = user_id);

create policy "Users can insert own comparison logs"
  on public.comparisons_log for insert
  with check (auth.uid() = user_id);

-- ═══════════════════════════════════════════════════════════════════════
-- AUTO-CREATE PROFILE ON SIGNUP TRIGGER
-- ═══════════════════════════════════════════════════════════════════════

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', '')
  );
  return new;
end;
$$;

-- Drop existing trigger if it exists, then recreate
drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ═══════════════════════════════════════════════════════════════════════
-- UPDATED_AT AUTO-TRIGGER FOR PROFILES
-- ═══════════════════════════════════════════════════════════════════════

create or replace function public.update_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_updated_at on public.profiles;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.update_updated_at();

-- ═══════════════════════════════════════════════════════════════════════
-- INCREMENT REPORTS USED (called from API after saving a report)
-- ═══════════════════════════════════════════════════════════════════════

create or replace function public.increment_reports_used(uid uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.profiles
  set reports_used = reports_used + 1
  where id = uid;
end;
$$;
