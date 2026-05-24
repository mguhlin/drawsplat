-- DrawSplat MySQL backend — Phase 4 compliance migration.
-- Run after schema.sql (which provides organizations, rooms, board_snapshots,
-- media_assets, templates, turnins, audit_events).

CREATE TABLE IF NOT EXISTS users (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  external_id VARCHAR(128) NULL,
  organization_id BIGINT UNSIGNED NULL,
  campus_id BIGINT UNSIGNED NULL,
  email VARCHAR(190) NULL,
  display_name VARCHAR(190) NULL,
  student_name VARCHAR(190) NULL,
  class_name VARCHAR(190) NULL,
  role ENUM('district_admin','campus_admin','teacher','student','parent') NOT NULL DEFAULT 'student',
  age_band ENUM('under_13','13_to_17','18_plus','unknown_minor') NOT NULL DEFAULT 'unknown_minor',
  age_source VARCHAR(80) NOT NULL DEFAULT 'unknown',
  age_locked TINYINT(1) NOT NULL DEFAULT 1,
  age_changed_by VARCHAR(190) NULL,
  age_changed_at DATETIME NULL,
  age_change_reason VARCHAR(500) NULL,
  password_hash VARBINARY(64) NULL,
  password_salt VARBINARY(32) NULL,
  parent_code_hash VARBINARY(64) NULL,
  parent_code_expires_at DATETIME NULL,
  provider ENUM('email','google','microsoft','clever','classlink','manual') NULL,
  provider_subject VARCHAR(190) NULL,
  last_seen_at DATETIME NULL,
  deleted_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_users_email (email),
  UNIQUE KEY uniq_users_external (external_id),
  INDEX idx_users_org_role (organization_id, role),
  INDEX idx_users_provider (provider, provider_subject),
  CONSTRAINT fk_users_organization FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS sessions (
  id CHAR(36) NOT NULL PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  session_token_hash VARBINARY(64) NOT NULL,
  ip VARCHAR(64) NULL,
  user_agent VARCHAR(512) NULL,
  issued_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME NOT NULL,
  revoked_at DATETIME NULL,
  INDEX idx_sessions_user (user_id),
  INDEX idx_sessions_expires (expires_at),
  CONSTRAINT fk_sessions_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS parent_requests (
  id CHAR(36) NOT NULL PRIMARY KEY,
  parent_name VARCHAR(190) NOT NULL,
  parent_email VARCHAR(190) NOT NULL,
  student_user_id BIGINT UNSIGNED NULL,
  student_name VARCHAR(190) NOT NULL,
  class_name VARCHAR(190) NULL,
  request_type ENUM('view','export','correct','delete','pause','safety_report','privacy_question') NOT NULL,
  details TEXT NULL,
  status ENUM('pending_verification','verified','approved','denied','completed') NOT NULL DEFAULT 'pending_verification',
  assigned_to BIGINT UNSIGNED NULL,
  decision_note TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  decided_at DATETIME NULL,
  INDEX idx_parent_requests_status (status, created_at),
  CONSTRAINT fk_parent_requests_student FOREIGN KEY (student_user_id) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_parent_requests_assigned FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS time_usage (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  usage_date DATE NOT NULL,
  seconds_today INT UNSIGNED NOT NULL DEFAULT 0,
  session_start DATETIME NULL,
  last_beat DATETIME NULL,
  UNIQUE KEY uniq_time_user_date (user_id, usage_date),
  INDEX idx_time_usage_date (usage_date),
  CONSTRAINT fk_time_usage_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS image_queue (
  id CHAR(36) NOT NULL PRIMARY KEY,
  board_id BIGINT UNSIGNED NULL,
  uploaded_by BIGINT UNSIGNED NULL,
  filename VARCHAR(255) NOT NULL,
  storage_key VARCHAR(512) NOT NULL,
  mime_type VARCHAR(128) NOT NULL,
  byte_size BIGINT UNSIGNED NOT NULL DEFAULT 0,
  status ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  decided_by BIGINT UNSIGNED NULL,
  decided_at DATETIME NULL,
  decision_note VARCHAR(500) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_image_queue_status (status, created_at),
  CONSTRAINT fk_image_queue_board FOREIGN KEY (board_id) REFERENCES board_snapshots(id) ON DELETE SET NULL,
  CONSTRAINT fk_image_queue_uploader FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_image_queue_decider FOREIGN KEY (decided_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS compliance_config (
  config_key VARCHAR(64) NOT NULL PRIMARY KEY,
  config_json JSON NOT NULL,
  updated_by BIGINT UNSIGNED NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_compliance_updated_by FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS rate_limits (
  rl_key VARCHAR(190) NOT NULL PRIMARY KEY,
  counter INT UNSIGNED NOT NULL DEFAULT 0,
  expires_at DATETIME NOT NULL,
  INDEX idx_rate_limits_expires (expires_at)
);

-- Add user references to existing audit_events.
ALTER TABLE audit_events
  ADD COLUMN actor_user_id BIGINT UNSIGNED NULL AFTER actor,
  ADD COLUMN actor_role VARCHAR(40) NULL AFTER actor_user_id,
  ADD INDEX idx_audit_actor_user (actor_user_id),
  ADD INDEX idx_audit_action_created (action, created_at);

-- Helpful seed: insert the default compliance config row if absent.
INSERT INTO compliance_config (config_key, config_json)
SELECT 'main', JSON_OBJECT(
  'safety', JSON_OBJECT(
    'text', JSON_OBJECT('enabled', TRUE, 'blockOnMatch', TRUE, 'logOnMatch', TRUE),
    'links', JSON_OBJECT('enabled', TRUE, 'blockUnapproved', TRUE)
  ),
  'retention', JSON_OBJECT(
    'boards', JSON_OBJECT('archiveAfterDays', 90, 'deleteAfterDays', 365),
    'audit', JSON_OBJECT('keepDays', 365),
    'parentRequests', JSON_OBJECT('keepDays', 1095)
  ),
  'parentAccess', JSON_OBJECT('portalEnabled', TRUE, 'requestFormEnabled', TRUE, 'verificationMethod', 'teacher_code'),
  'timeLimits', JSON_OBJECT('enabled', FALSE, 'dailySeconds', 1800, 'allowedHoursStart', '07:30', 'allowedHoursEnd', '17:00', 'weekendAllowed', FALSE),
  'privacy', JSON_OBJECT('studentDataTrainsAiModels', FALSE, 'advertising', FALSE, 'dataSold', FALSE)
)
WHERE NOT EXISTS (SELECT 1 FROM compliance_config WHERE config_key = 'main');
