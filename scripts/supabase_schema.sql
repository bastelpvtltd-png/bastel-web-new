-- ============================================================
-- BASTEL PVT LTD — Supabase Database Schema
-- Run this in: Supabase Dashboard → SQL Editor → Run
-- ============================================================

-- REGISTRATIONS table
CREATE TABLE IF NOT EXISTS registrations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trade_type      TEXT NOT NULL CHECK (trade_type IN ('exporter','importer','both')),
  full_name       TEXT NOT NULL,
  company_name    TEXT,
  email           TEXT NOT NULL UNIQUE,
  phone           TEXT NOT NULL,
  country         TEXT NOT NULL,
  trade_category  TEXT NOT NULL,
  volume          TEXT,
  freight_mode    TEXT,
  trade_countries TEXT,
  requirements    TEXT,
  status          TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','reviewed','approved','rejected')),
  notes           TEXT,                -- internal admin notes
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ
);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_registrations_updated
  BEFORE UPDATE ON registrations
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- NOTIFY LIST table
CREATE TABLE IF NOT EXISTS notify_list (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  email       TEXT NOT NULL UNIQUE,
  trade_type  TEXT DEFAULT 'both' CHECK (trade_type IN ('exporter','importer','both')),
  notified    BOOLEAN DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- CONTACT MESSAGES table
CREATE TABLE IF NOT EXISTS contact_messages (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  email       TEXT NOT NULL,
  service     TEXT,
  message     TEXT NOT NULL,
  status      TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new','read','replied')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Row Level Security (RLS) ─────────────────────────────────
-- Enable RLS on all tables (backend uses service_role key which bypasses RLS)
ALTER TABLE registrations    ENABLE ROW LEVEL SECURITY;
ALTER TABLE notify_list      ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;

-- No public SELECT/INSERT — all access goes through your backend API
-- The service_role key your backend uses bypasses these policies

-- ── Indexes ──────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_reg_email  ON registrations (email);
CREATE INDEX IF NOT EXISTS idx_reg_status ON registrations (status);
CREATE INDEX IF NOT EXISTS idx_reg_type   ON registrations (trade_type);
CREATE INDEX IF NOT EXISTS idx_notify_email ON notify_list (email);
CREATE INDEX IF NOT EXISTS idx_contact_status ON contact_messages (status);

-- Done! ✅
