ALTER TABLE classrooms ADD COLUMN roster_key CHAR(64) NULL;
ALTER TABLE classrooms ADD UNIQUE INDEX uniq_classroom_roster_key (roster_key);
