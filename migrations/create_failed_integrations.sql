-- Migration: Create failed_integrations table for tracking Embedly/Zoho sync failures
-- Date: 2026-02-22
--
-- This table is referenced in lib/integrations/embedly.ts but was never created,
-- causing all failure tracking to silently error on every Embedly sync failure.

CREATE TABLE IF NOT EXISTS failed_integrations (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_type     VARCHAR(100) NOT NULL,  -- e.g. 'embedly_customer_creation', 'embedly_wallet_creation'
  user_email           VARCHAR(255) NOT NULL,
  embedly_customer_id  VARCHAR(255),           -- set when customer was created but wallet failed
  error_message        TEXT,
  error_details        JSONB DEFAULT '{}',
  status               VARCHAR(50) NOT NULL DEFAULT 'pending_retry',  -- 'pending_retry', 'resolved', 'ignored'
  retry_count          INTEGER NOT NULL DEFAULT 0,
  resolved_at          TIMESTAMPTZ,
  resolved_by          VARCHAR(255),           -- email of admin who resolved
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast lookup by email (used in admin panel and recovery scripts)
CREATE INDEX IF NOT EXISTS idx_failed_integrations_email
  ON failed_integrations (user_email);

-- Index for filtering by status (admins view pending_retry entries)
CREATE INDEX IF NOT EXISTS idx_failed_integrations_status
  ON failed_integrations (status);

-- Index for filtering by type
CREATE INDEX IF NOT EXISTS idx_failed_integrations_type
  ON failed_integrations (integration_type);

-- RLS: only service role (admin client) can read/write this table
ALTER TABLE failed_integrations ENABLE ROW LEVEL SECURITY;
