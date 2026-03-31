-- ═══════════════════════════════════════════════════════════════════════
-- rivvl Migration v2
-- Run this in the Supabase SQL Editor AFTER the initial schema.sql
-- ═══════════════════════════════════════════════════════════════════════

-- ─── REPORTS: Add support for 3–4 car comparisons + custom names ─────

ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS car3_name text;
ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS car4_name text;
ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS custom_name text;
