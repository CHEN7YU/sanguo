CREATE TABLE leaderboard_scores (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  player_id TEXT NOT NULL,
  nickname TEXT NOT NULL,
  level_id TEXT NOT NULL,
  level_name TEXT NOT NULL,
  score INTEGER NOT NULL CHECK (score BETWEEN 0 AND 10000),
  grade TEXT NOT NULL CHECK (grade IN ('S', 'A', 'B', 'C', 'D')),
  elapsed_ms INTEGER NOT NULL CHECK (elapsed_ms BETWEEN 1000 AND 28800000),
  turns INTEGER NOT NULL CHECK (turns >= 1),
  loss_tenths INTEGER NOT NULL CHECK (loss_tenths BETWEEN 0 AND 1000),
  retreats INTEGER NOT NULL CHECK (retreats BETWEEN 0 AND 20),
  victory_type TEXT NOT NULL CHECK (victory_type IN ('normal', 'duel', 'alternate')),
  rule_version INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  UNIQUE (player_id, level_id)
);

CREATE INDEX leaderboard_scores_rank
  ON leaderboard_scores (level_id, score DESC, elapsed_ms ASC, turns ASC, updated_at ASC, id ASC);
