-- ═══════════════════════════════════════════════════════════════════════
-- rivvl Migration v5 — Payment failure tracking & concurrent generation guard
-- Run this in the Supabase SQL Editor AFTER migration-v4.sql
-- ═══════════════════════════════════════════════════════════════════════

-- ─── 1. ADD PAYMENT FAILURE COLUMNS TO PROFILES ────────────────────────

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS payment_failed boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS payment_failed_at timestamptz;

-- ─── 2. ADD CONCURRENT GENERATION GUARD COLUMN ────────────────────────

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS generating_report boolean NOT NULL DEFAULT false;

-- ─── 3. UPDATE handle_new_user TO HANDLE ERRORS ───────────────────────

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', '')
  );
  RETURN new;
EXCEPTION WHEN OTHERS THEN
  -- Log the error but don't roll back the auth.users insert
  RAISE WARNING 'Failed to create profile for user %: %', new.id, SQLERRM;
  RETURN new;
END;
$$;
