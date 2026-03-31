-- ═══════════════════════════════════════════════════════════════════════
-- rivvl Migration v4 — Stripe Webhook Idempotency
-- Run this in the Supabase SQL Editor AFTER migration-v3.sql
-- ═══════════════════════════════════════════════════════════════════════

-- ─── 1. STRIPE EVENTS TABLE (webhook idempotency) ──────────────────

CREATE TABLE IF NOT EXISTS public.stripe_events (
  event_id text PRIMARY KEY,
  processed_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.stripe_events IS 'Tracks processed Stripe webhook events for idempotency.';

-- Enable RLS — only service role should access this table
ALTER TABLE public.stripe_events ENABLE ROW LEVEL SECURITY;

-- No public policies — only the service role (used by the webhook handler) can read/write.
