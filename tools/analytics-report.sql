SELECT COUNT(*) AS registered_accounts FROM password_credentials;

SELECT COUNT(*) AS players_since_start,
  COALESCE(SUM(play_seconds), 0) AS total_play_seconds,
  ROUND(COALESCE(SUM(play_seconds), 0) / 3600.0, 2) AS total_play_hours,
  ROUND(CASE WHEN COUNT(*) = 0 THEN 0 ELSE AVG(play_seconds) / 60.0 END, 2) AS average_minutes_per_player
FROM analytics_players;

SELECT MIN(day) AS first_statistics_day_china,
  COALESCE(SUM(page_views), 0) AS page_views_since_start,
  COALESCE(SUM(logins), 0) AS successful_logins_since_start
FROM analytics_daily WHERE device = 'all';

SELECT COALESCE(SUM(play_sessions), 0) AS play_sessions_since_start,
  COALESCE(SUM(play_seconds), 0) AS total_play_seconds
FROM analytics_play_daily WHERE device = 'all';

SELECT date('now', '+8 hours') AS today_china,
  COALESCE(a.page_views, 0) AS page_views,
  COALESCE(a.visitors, 0) AS unique_browsers,
  COALESCE(a.logins, 0) AS successful_logins,
  COALESCE(a.login_users, 0) AS unique_login_accounts,
  COALESCE(p.players, 0) AS players,
  COALESCE(p.play_sessions, 0) AS play_sessions,
  COALESCE(p.play_seconds, 0) AS play_seconds
FROM (SELECT 1) seed
LEFT JOIN analytics_daily a ON a.day = date('now', '+8 hours') AND a.device = 'all'
LEFT JOIN analytics_play_daily p ON p.day = date('now', '+8 hours') AND p.device = 'all';

SELECT a.day, a.page_views, a.visitors AS unique_browsers, a.logins AS successful_logins,
  a.login_users AS unique_login_accounts, COALESCE(p.players, 0) AS players,
  COALESCE(p.play_sessions, 0) AS play_sessions, COALESCE(p.play_seconds, 0) AS play_seconds
FROM analytics_daily a
LEFT JOIN analytics_play_daily p ON p.day = a.day AND p.device = a.device
WHERE a.device = 'all' AND a.day >= date('now', '+8 hours', '-6 days')
UNION ALL
SELECT p.day, 0, 0, 0, 0, p.players, p.play_sessions, p.play_seconds
FROM analytics_play_daily p
WHERE p.device = 'all' AND p.day >= date('now', '+8 hours', '-6 days')
  AND NOT EXISTS (SELECT 1 FROM analytics_daily a WHERE a.day = p.day AND a.device = p.device)
ORDER BY day DESC;

SELECT a.day, a.device, a.page_views, a.visitors AS unique_browsers,
  a.logins AS successful_logins, a.login_users AS unique_login_accounts,
  COALESCE(p.players, 0) AS players, COALESCE(p.play_sessions, 0) AS play_sessions,
  COALESCE(p.play_seconds, 0) AS play_seconds
FROM analytics_daily a
LEFT JOIN analytics_play_daily p ON p.day = a.day AND p.device = a.device
WHERE a.device <> 'all' AND a.day >= date('now', '+8 hours', '-6 days')
UNION ALL
SELECT p.day, p.device, 0, 0, 0, 0, p.players, p.play_sessions, p.play_seconds
FROM analytics_play_daily p
WHERE p.device <> 'all' AND p.day >= date('now', '+8 hours', '-6 days')
  AND NOT EXISTS (SELECT 1 FROM analytics_daily a WHERE a.day = p.day AND a.device = p.device)
ORDER BY day DESC, device;

SELECT device, SUM(page_views) AS page_views_since_start, SUM(logins) AS successful_logins_since_start
FROM analytics_daily WHERE device <> 'all' GROUP BY device ORDER BY page_views_since_start DESC;

SELECT device, SUM(players) AS player_days_since_start,
  SUM(play_sessions) AS play_sessions_since_start, SUM(play_seconds) AS play_seconds_since_start
FROM analytics_play_daily WHERE device <> 'all' GROUP BY device ORDER BY play_seconds_since_start DESC;
