-- ═══════════════════════════════════════════════════════════════════════
-- rivvl Migration v3 — Round 3 Fixes
-- Run this in the Supabase SQL Editor AFTER migration-v2.sql
-- ═══════════════════════════════════════════════════════════════════════

-- ─── 1. CONTACT SUBMISSIONS TABLE ────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.contact_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  email text NOT NULL,
  company_name text NOT NULL,
  phone text,
  num_locations text,
  message text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.contact_submissions IS 'Enterprise contact form submissions.';

-- Enable RLS
ALTER TABLE public.contact_submissions ENABLE ROW LEVEL SECURITY;

-- Anyone can insert (even anonymous visitors)
CREATE POLICY "Anyone can submit contact form"
  ON public.contact_submissions FOR INSERT
  WITH CHECK (true);

-- Only service role can read (admin only)
-- No SELECT policy = no public reads, which is correct for contact forms.

-- ─── 2. REPORTS: Add RLS policies for DELETE and UPDATE ──────────────

-- Allow users to delete their own reports
CREATE POLICY "Users can delete own reports"
  ON public.reports FOR DELETE
  USING (auth.uid() = user_id);

-- Allow users to update their own reports (e.g., rename)
CREATE POLICY "Users can update own reports"
  ON public.reports FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
