CREATE TABLE password_credentials (
  username TEXT PRIMARY KEY NOT NULL,
  display_name TEXT NOT NULL,
  user_id TEXT NOT NULL UNIQUE REFERENCES users(id),
  salt TEXT NOT NULL,
  password_hash TEXT NOT NULL
);

CREATE TABLE auth_attempts (
  bucket TEXT PRIMARY KEY NOT NULL,
  attempts INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
);
CREATE INDEX auth_attempts_expiry ON auth_attempts(expires_at);
CREATE INDEX auth_sessions_user_expiry ON auth_sessions(user_id, expires_at);
