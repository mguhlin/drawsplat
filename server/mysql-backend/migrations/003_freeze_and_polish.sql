-- DrawSplat MySQL backend — Phase 4 freeze + parent-request listing migration.
-- Run after migrations/002_compliance.sql.

ALTER TABLE rooms
  ADD COLUMN IF NOT EXISTS frozen TINYINT(1) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS frozen_by BIGINT UNSIGNED NULL,
  ADD COLUMN IF NOT EXISTS frozen_at DATETIME NULL,
  ADD COLUMN IF NOT EXISTS frozen_reason VARCHAR(500) NULL;

-- Some MySQL builds don't support IF NOT EXISTS on ADD COLUMN — guard each
-- statement individually if you hit a syntax error and re-run as needed.

CREATE INDEX IF NOT EXISTS idx_parent_requests_parent_email ON parent_requests (parent_email, created_at);

-- Helpful seed: clear stale rate-limit rows older than 24h.
DELETE FROM rate_limits WHERE expires_at < (NOW() - INTERVAL 1 DAY);
