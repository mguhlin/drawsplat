-- Account-owned boards. One current copy per board avoids snapshot storage growth.
CREATE TABLE IF NOT EXISTS cloud_boards (
  user_id BIGINT UNSIGNED NOT NULL,
  board_key VARCHAR(80) NOT NULL,
  title VARCHAR(200) NOT NULL DEFAULT '',
  board_json JSON NOT NULL,
  revision BIGINT UNSIGNED NOT NULL DEFAULT 1,
  updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (user_id, board_key),
  CONSTRAINT fk_cloud_boards_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
