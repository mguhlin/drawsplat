-- Portable MySQL 8 DDL; migration runner also handles previously applied columns.
ALTER TABLE rooms ADD COLUMN frozen TINYINT(1) NOT NULL DEFAULT 0;
ALTER TABLE rooms ADD COLUMN frozen_by BIGINT UNSIGNED NULL;
ALTER TABLE rooms ADD COLUMN frozen_at DATETIME NULL;
ALTER TABLE rooms ADD COLUMN frozen_reason VARCHAR(500) NULL;
CREATE INDEX idx_parent_requests_parent_email ON parent_requests (parent_email, created_at);
DELETE FROM rate_limits WHERE expires_at < (NOW() - INTERVAL 1 DAY);
