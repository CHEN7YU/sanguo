CREATE TABLE analytics_daily (
  day TEXT NOT NULL,
  device TEXT NOT NULL CHECK (device IN ('all', 'desktop', 'mobile', 'tablet', 'other')),
  page_views INTEGER NOT NULL DEFAULT 0 CHECK (page_views >= 0),
  visitors INTEGER NOT NULL DEFAULT 0 CHECK (visitors >= 0),
  logins INTEGER NOT NULL DEFAULT 0 CHECK (logins >= 0),
  login_users INTEGER NOT NULL DEFAULT 0 CHECK (login_users >= 0),
  PRIMARY KEY (day, device)
);

CREATE TABLE analytics_events (
  event_hash TEXT PRIMARY KEY NOT NULL,
  day TEXT NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('visit', 'login')),
  actor_hash TEXT NOT NULL,
  device TEXT NOT NULL CHECK (device IN ('desktop', 'mobile', 'tablet', 'other'))
);
CREATE INDEX analytics_events_day ON analytics_events(day);

CREATE TABLE analytics_seen (
  day TEXT NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('visit', 'login')),
  actor_hash TEXT NOT NULL,
  device TEXT NOT NULL CHECK (device IN ('all', 'desktop', 'mobile', 'tablet', 'other')),
  PRIMARY KEY (day, kind, actor_hash, device)
);

CREATE TRIGGER analytics_event_count AFTER INSERT ON analytics_events
BEGIN
  INSERT INTO analytics_daily (day, device, page_views, visitors, logins, login_users)
    SELECT NEW.day, devices.device,
      CASE WHEN NEW.kind = 'visit' THEN 1 ELSE 0 END,
      CASE WHEN NEW.kind = 'visit' AND NOT EXISTS (
        SELECT 1 FROM analytics_seen s WHERE s.day = NEW.day AND s.kind = NEW.kind
          AND s.actor_hash = NEW.actor_hash AND s.device = devices.device
      ) THEN 1 ELSE 0 END,
      CASE WHEN NEW.kind = 'login' THEN 1 ELSE 0 END,
      CASE WHEN NEW.kind = 'login' AND NOT EXISTS (
        SELECT 1 FROM analytics_seen s WHERE s.day = NEW.day AND s.kind = NEW.kind
          AND s.actor_hash = NEW.actor_hash AND s.device = devices.device
      ) THEN 1 ELSE 0 END
    FROM (SELECT 'all' AS device UNION ALL SELECT NEW.device) AS devices WHERE 1
    ON CONFLICT(day, device) DO UPDATE SET
      page_views = analytics_daily.page_views + excluded.page_views,
      visitors = analytics_daily.visitors + excluded.visitors,
      logins = analytics_daily.logins + excluded.logins,
      login_users = analytics_daily.login_users + excluded.login_users;

  INSERT OR IGNORE INTO analytics_seen (day, kind, actor_hash, device) VALUES
    (NEW.day, NEW.kind, NEW.actor_hash, 'all'),
    (NEW.day, NEW.kind, NEW.actor_hash, NEW.device);
END;
