SELECT COUNT(*) AS registered_accounts FROM password_credentials;

SELECT MIN(day) AS first_statistics_day_china,
  COALESCE(SUM(page_views), 0) AS page_views_since_start,
  COALESCE(SUM(logins), 0) AS successful_logins_since_start
FROM analytics_daily WHERE device = 'all';

SELECT date('now', '+8 hours') AS today_china,
  COALESCE(SUM(page_views), 0) AS page_views,
  COALESCE(SUM(visitors), 0) AS unique_browsers,
  COALESCE(SUM(logins), 0) AS successful_logins,
  COALESCE(SUM(login_users), 0) AS unique_login_accounts
FROM analytics_daily WHERE device = 'all' AND day = date('now', '+8 hours');

SELECT day, page_views, visitors AS unique_browsers, logins AS successful_logins,
  login_users AS unique_login_accounts
FROM analytics_daily
WHERE device = 'all' AND day >= date('now', '+8 hours', '-6 days')
ORDER BY day DESC;

SELECT day, device, page_views, visitors AS unique_browsers,
  logins AS successful_logins, login_users AS unique_login_accounts
FROM analytics_daily
WHERE device <> 'all' AND day >= date('now', '+8 hours', '-6 days')
ORDER BY day DESC, device;

SELECT device, SUM(page_views) AS page_views_since_start, SUM(logins) AS successful_logins_since_start
FROM analytics_daily WHERE device <> 'all' GROUP BY device ORDER BY page_views_since_start DESC;
