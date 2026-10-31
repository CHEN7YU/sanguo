CREATE TABLE public_comments (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  public_name TEXT NOT NULL CHECK (length(public_name) BETWEEN 2 AND 20),
  kind TEXT NOT NULL CHECK (kind IN ('comment', 'suggestion', 'bug')),
  level_id TEXT,
  device TEXT,
  body TEXT NOT NULL CHECK (length(body) BETWEEN 2 AND 600),
  status TEXT NOT NULL DEFAULT 'received' CHECK (status IN ('received', 'fixing', 'fixed')),
  moderation TEXT NOT NULL DEFAULT 'pending' CHECK (moderation IN ('pending', 'approved', 'hidden')),
  pinned INTEGER NOT NULL DEFAULT 0 CHECK (pinned IN (0, 1)),
  admin_reply TEXT CHECK (admin_reply IS NULL OR length(admin_reply) <= 600),
  created_at INTEGER NOT NULL,
  approved_at INTEGER,
  updated_at INTEGER NOT NULL
);

CREATE INDEX public_comments_public_feed
  ON public_comments(moderation, pinned DESC, approved_at DESC, created_at DESC);
CREATE INDEX public_comments_user ON public_comments(user_id, created_at DESC);
