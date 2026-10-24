SELECT COUNT(*) AS registered_accounts FROM password_credentials;

SELECT COUNT(*) AS players_since_start,
  COALESCE(SUM(play_seconds), 0) AS total_play_seconds,
  ROUND(COALESCE(SUM(play_seconds), 0) / 3600.0, 2) AS total_play_hours,
  ROUND(CASE WHEN COUNT(*) = 0 THEN 0 ELSE AVG(play_seconds) / 60.0 END, 2) AS average_minutes_per_player
FROM analytics_players;

SELECT MIN(day) AS first_statistics_day_china,
  COALESCE(SUM(page_views), 0) AS page_views_since_start,
  COALESCE(SUM(logins), 0) AS successful_logins_since_start,
  COALESCE(SUM(play_sessions), 0) AS play_sessions_since_start,
  COALESCE(SUM(play_seconds), 0) AS total_play_seconds
FROM analytics_daily WHERE device = 'all';

SELECT date('now', '+8 hours') AS today_china,
  COALESCE(SUM(page_views), 0) AS page_views,
  COALESCE(SUM(visitors), 0) AS unique_browsers,
  COALESCE(SUM(logins), 0) AS successful_logins,
  COALESCE(SUM(login_users), 0) AS unique_login_accounts,
  COALESCE(SUM(players), 0) AS players,
  COALESCE(SUM(play_sessions), 0) AS play_sessions,
  COALESCE(SUM(play_seconds), 0) AS play_seconds
FROM analytics_daily WHERE device = 'all' AND day = date('now', '+8 hours');

SELECT day, page_views, visitors AS unique_browsers, logins AS successful_logins,
  login_users AS unique_login_accounts, players, play_sessions, play_seconds
FROM analytics_daily
WHERE device = 'all' AND day >= date('now', '+8 hours', '-6 days')
ORDER BY day DESC;

SELECT day, device, page_views, visitors AS unique_browsers,
  logins AS successful_logins, login_users AS unique_login_accounts,
  players, play_sessions, play_seconds
FROM analytics_daily
WHERE device <> 'all' AND day >= date('now', '+8 hours', '-6 days')
ORDER BY day DESC, device;

SELECT device, SUM(page_views) AS page_views_since_start, SUM(logins) AS successful_logins_since_start,
  SUM(play_sessions) AS play_sessions_since_start, SUM(play_seconds) AS play_seconds_since_start
FROM analytics_daily WHERE device <> 'all' GROUP BY device ORDER BY page_views_since_start DESC;
