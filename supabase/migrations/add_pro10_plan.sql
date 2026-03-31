-- ═══════════════════════════════════════════════════════════════════════
-- Migration: Add Pro 10 plan support
-- ═══════════════════════════════════════════════════════════════════════

-- 1. Add pro10_credits_remaining column to profiles
alter table public.profiles
  add column if not exists pro10_credits_remaining integer not null default 0;

comment on column public.profiles.pro10_credits_remaining is
  'Number of Pro 10 report credits remaining. Decremented on each report generation for pro10 users.';

-- 2. Update plan_tier check constraint to include "pro10"
alter table public.profiles
  drop constraint if exists profiles_plan_tier_check;

alter table public.profiles
  add constraint profiles_plan_tier_check
  check (plan_tier in ('free', 'single', 'pro', 'pro10', 'monthly_pro', 'enterprise'));
