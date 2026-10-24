CREATE TABLE IF NOT EXISTS analytics_play_daily (
  day TEXT NOT NULL,
  device TEXT NOT NULL CHECK (device IN ('all', 'desktop', 'mobile', 'tablet', 'other')),
  players INTEGER NOT NULL DEFAULT 0 CHECK (players >= 0),
  play_sessions INTEGER NOT NULL DEFAULT 0 CHECK (play_sessions >= 0),
  play_seconds INTEGER NOT NULL DEFAULT 0 CHECK (play_seconds >= 0),
  PRIMARY KEY (day, device)
);

CREATE TABLE IF NOT EXISTS analytics_play_events (
  event_hash TEXT PRIMARY KEY NOT NULL,
  day TEXT NOT NULL,
  player_hash TEXT NOT NULL,
  session_hash TEXT NOT NULL,
  device TEXT NOT NULL CHECK (device IN ('desktop', 'mobile', 'tablet', 'other')),
  seconds INTEGER NOT NULL CHECK (seconds BETWEEN 1 AND 120)
);
CREATE INDEX IF NOT EXISTS analytics_play_events_day ON analytics_play_events(day);

CREATE TABLE IF NOT EXISTS analytics_play_seen (
  day TEXT NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('player', 'session')),
  identity_hash TEXT NOT NULL,
  device TEXT NOT NULL CHECK (device IN ('all', 'desktop', 'mobile', 'tablet', 'other')),
  PRIMARY KEY (day, kind, identity_hash, device)
);

CREATE TABLE IF NOT EXISTS analytics_players (
  player_hash TEXT PRIMARY KEY NOT NULL,
  first_day TEXT NOT NULL,
  last_day TEXT NOT NULL,
  play_seconds INTEGER NOT NULL DEFAULT 0 CHECK (play_seconds >= 0)
);

CREATE TABLE IF NOT EXISTS analytics_play_sessions (
  session_hash TEXT PRIMARY KEY NOT NULL,
  player_hash TEXT NOT NULL,
  first_day TEXT NOT NULL,
  last_day TEXT NOT NULL,
  play_seconds INTEGER NOT NULL DEFAULT 0 CHECK (play_seconds >= 0)
);
CREATE INDEX IF NOT EXISTS analytics_play_sessions_player ON analytics_play_sessions(player_hash);

CREATE TRIGGER IF NOT EXISTS analytics_play_event_count AFTER INSERT ON analytics_play_events
BEGIN
  INSERT INTO analytics_play_daily (day, device, players, play_sessions, play_seconds)
    SELECT NEW.day, devices.device,
      CASE WHEN NOT EXISTS (
        SELECT 1 FROM analytics_play_seen s WHERE s.day = NEW.day AND s.kind = 'player'
          AND s.identity_hash = NEW.player_hash AND s.device = devices.device
      ) THEN 1 ELSE 0 END,
      CASE WHEN NOT EXISTS (
        SELECT 1 FROM analytics_play_seen s WHERE s.day = NEW.day AND s.kind = 'session'
          AND s.identity_hash = NEW.session_hash AND s.device = devices.device
      ) THEN 1 ELSE 0 END,
      NEW.seconds
    FROM (SELECT 'all' AS device UNION ALL SELECT NEW.device) AS devices WHERE 1
    ON CONFLICT(day, device) DO UPDATE SET
      players = analytics_play_daily.players + excluded.players,
      play_sessions = analytics_play_daily.play_sessions + excluded.play_sessions,
      play_seconds = analytics_play_daily.play_seconds + excluded.play_seconds;

  INSERT OR IGNORE INTO analytics_play_seen (day, kind, identity_hash, device) VALUES
    (NEW.day, 'player', NEW.player_hash, 'all'),
    (NEW.day, 'player', NEW.player_hash, NEW.device),
    (NEW.day, 'session', NEW.session_hash, 'all'),
    (NEW.day, 'session', NEW.session_hash, NEW.device);

  INSERT INTO analytics_players (player_hash, first_day, last_day, play_seconds)
    VALUES (NEW.player_hash, NEW.day, NEW.day, NEW.seconds)
    ON CONFLICT(player_hash) DO UPDATE SET
      last_day = excluded.last_day,
      play_seconds = analytics_players.play_seconds + excluded.play_seconds;

  INSERT INTO analytics_play_sessions (session_hash, player_hash, first_day, last_day, play_seconds)
    VALUES (NEW.session_hash, NEW.player_hash, NEW.day, NEW.day, NEW.seconds)
    ON CONFLICT(session_hash) DO UPDATE SET
      last_day = excluded.last_day,
      play_seconds = analytics_play_sessions.play_seconds + excluded.play_seconds;
END;
