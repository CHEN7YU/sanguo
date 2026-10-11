CREATE TABLE save_bundles (
  user_id TEXT PRIMARY KEY NOT NULL REFERENCES users(id),
  payload TEXT NOT NULL,
  revision INTEGER NOT NULL CHECK (revision >= 1),
  updated_at INTEGER NOT NULL,
  request_id TEXT NOT NULL
);

CREATE TABLE save_history (
  user_id TEXT NOT NULL REFERENCES users(id),
  revision INTEGER NOT NULL,
  payload TEXT NOT NULL,
  updated_at INTEGER NOT NULL,
  PRIMARY KEY (user_id, revision)
);

CREATE TRIGGER save_bundle_history AFTER UPDATE ON save_bundles
WHEN OLD.payload <> NEW.payload
BEGIN
  INSERT INTO save_history (user_id, revision, payload, updated_at)
    VALUES (OLD.user_id, OLD.revision, OLD.payload, OLD.updated_at);
  DELETE FROM save_history
    WHERE user_id = NEW.user_id AND revision NOT IN (
      SELECT revision FROM save_history WHERE user_id = NEW.user_id ORDER BY revision DESC LIMIT 3
    );
  DELETE FROM save_history
    WHERE user_id = NEW.user_id AND (
      SELECT COALESCE(SUM(length(CAST(h.payload AS BLOB))), 0) FROM save_history h
        WHERE h.user_id = NEW.user_id AND h.revision >= save_history.revision
    ) + length(CAST(NEW.payload AS BLOB)) > 512000;
END;
