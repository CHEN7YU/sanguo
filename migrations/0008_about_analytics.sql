CREATE TABLE about_analytics_daily (
  day TEXT NOT NULL,
  device TEXT NOT NULL CHECK (device IN ('all', 'desktop', 'mobile', 'tablet', 'other')),
  page_views INTEGER NOT NULL DEFAULT 0 CHECK (page_views >= 0),
  visitors INTEGER NOT NULL DEFAULT 0 CHECK (visitors >= 0),
  play_clicks INTEGER NOT NULL DEFAULT 0 CHECK (play_clicks >= 0),
  click_visitors INTEGER NOT NULL DEFAULT 0 CHECK (click_visitors >= 0),
  PRIMARY KEY (day, device)
);

CREATE TABLE about_analytics_events (
  event_hash TEXT PRIMARY KEY NOT NULL,
  day TEXT NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('view', 'play')),
  actor_hash TEXT NOT NULL,
  device TEXT NOT NULL CHECK (device IN ('desktop', 'mobile', 'tablet', 'other'))
);

CREATE TABLE about_analytics_seen (
  day TEXT NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('view', 'play')),
  actor_hash TEXT NOT NULL,
  device TEXT NOT NULL CHECK (device IN ('all', 'desktop', 'mobile', 'tablet', 'other')),
  PRIMARY KEY (day, kind, actor_hash, device)
);

CREATE INDEX about_analytics_events_day ON about_analytics_events(day);

CREATE TRIGGER about_analytics_event_count AFTER INSERT ON about_analytics_events
BEGIN
  INSERT INTO about_analytics_daily (day, device, page_views, visitors, play_clicks, click_visitors)
    SELECT NEW.day, devices.device,
      CASE WHEN NEW.kind = 'view' THEN 1 ELSE 0 END,
      CASE WHEN NEW.kind = 'view' AND NOT EXISTS (
        SELECT 1 FROM about_analytics_seen s WHERE s.day = NEW.day AND s.kind = NEW.kind
          AND s.actor_hash = NEW.actor_hash AND s.device = devices.device
      ) THEN 1 ELSE 0 END,
      CASE WHEN NEW.kind = 'play' THEN 1 ELSE 0 END,
      CASE WHEN NEW.kind = 'play' AND NOT EXISTS (
        SELECT 1 FROM about_analytics_seen s WHERE s.day = NEW.day AND s.kind = NEW.kind
          AND s.actor_hash = NEW.actor_hash AND s.device = devices.device
      ) THEN 1 ELSE 0 END
    FROM (SELECT 'all' AS device UNION ALL SELECT NEW.device) AS devices WHERE 1
    ON CONFLICT(day, device) DO UPDATE SET
      page_views = about_analytics_daily.page_views + excluded.page_views,
      visitors = about_analytics_daily.visitors + excluded.visitors,
      play_clicks = about_analytics_daily.play_clicks + excluded.play_clicks,
      click_visitors = about_analytics_daily.click_visitors + excluded.click_visitors;

  INSERT OR IGNORE INTO about_analytics_seen (day, kind, actor_hash, device) VALUES
    (NEW.day, NEW.kind, NEW.actor_hash, 'all'),
    (NEW.day, NEW.kind, NEW.actor_hash, NEW.device);
END;
