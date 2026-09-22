-- =============================================================================
-- CODEQUEST — Initial PostgreSQL schema
-- Run once against a fresh Postgres 15+ database.
-- All tables use UUID primary keys, RLS is enabled for user-scoped tables.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Extensions
-- ---------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "pgcrypto";   -- gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "pg_trgm";    -- fuzzy search on badge names

-- ---------------------------------------------------------------------------
-- USERS
-- (NextAuth manages inserts/updates via PrismaAdapter; we add game columns)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                TEXT,
  email               TEXT UNIQUE,
  email_verified      TIMESTAMPTZ,
  image               TEXT,
  -- game state
  total_xp            INTEGER NOT NULL DEFAULT 0,
  level               INTEGER NOT NULL DEFAULT 1,
  hearts              INTEGER NOT NULL DEFAULT 5 CHECK (hearts BETWEEN 0 AND 5),
  streak_count        INTEGER NOT NULL DEFAULT 0,
  last_active_date    DATE,
  last_heart_loss_at  TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- NextAuth required tables ------------------------------------------------
CREATE TABLE IF NOT EXISTS accounts (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type                 TEXT NOT NULL,
  provider             TEXT NOT NULL,
  provider_account_id  TEXT NOT NULL,
  refresh_token        TEXT,
  access_token         TEXT,
  expires_at           BIGINT,
  token_type           TEXT,
  scope                TEXT,
  id_token             TEXT,
  session_state        TEXT,
  UNIQUE (provider, provider_account_id)
);

CREATE TABLE IF NOT EXISTS sessions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_token TEXT UNIQUE NOT NULL,
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires       TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS verification_tokens (
  identifier  TEXT NOT NULL,
  token       TEXT NOT NULL UNIQUE,
  expires     TIMESTAMPTZ NOT NULL,
  PRIMARY KEY (identifier, token)
);

-- ---------------------------------------------------------------------------
-- QUESTS (static catalogue, seeded below)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS quests (
  id              TEXT PRIMARY KEY,    -- 'syntax-dungeon', 'exec-arena', …
  name            TEXT NOT NULL,
  difficulty      TEXT NOT NULL CHECK (difficulty IN ('EASY','MEDIUM','HARD','BOSS')),
  base_xp         INTEGER NOT NULL,
  min_time_secs   INTEGER NOT NULL,    -- anti-cheat minimum
  display_order   INTEGER NOT NULL DEFAULT 0
);

-- ---------------------------------------------------------------------------
-- USER QUEST COMPLETIONS
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_quest_completions (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  quest_id         TEXT NOT NULL REFERENCES quests(id),
  completed_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  xp_earned       INTEGER NOT NULL,
  time_spent_secs  INTEGER NOT NULL,
  is_optimal       BOOLEAN NOT NULL DEFAULT FALSE,  -- Hanoi optimal-moves flag
  streak_at_time   INTEGER NOT NULL DEFAULT 0
);

-- ---------------------------------------------------------------------------
-- BADGES (static catalogue)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS badges (
  id           TEXT PRIMARY KEY,   -- 'bug-squasher', 'completionist', …
  icon         TEXT NOT NULL,
  name         TEXT NOT NULL,
  description  TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0
);

-- ---------------------------------------------------------------------------
-- USER BADGES (earned)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_badges (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  badge_id    TEXT NOT NULL REFERENCES badges(id),
  earned_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, badge_id)
);

-- ---------------------------------------------------------------------------
-- SKILL NODES (static catalogue)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS skill_nodes (
  id            TEXT PRIMARY KEY,   -- 'vars', 'loops', 'functions', …
  icon          TEXT NOT NULL,
  name          TEXT NOT NULL,
  quest_id      TEXT REFERENCES quests(id),
  initial_status TEXT NOT NULL CHECK (initial_status IN ('unlocked','active','locked')),
  display_order  INTEGER NOT NULL DEFAULT 0
);

-- ---------------------------------------------------------------------------
-- USER SKILL NODES (runtime unlock state per user)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_skill_nodes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  node_id     TEXT NOT NULL REFERENCES skill_nodes(id),
  status      TEXT NOT NULL CHECK (status IN ('unlocked','active','locked')),
  unlocked_at TIMESTAMPTZ,
  UNIQUE (user_id, node_id)
);

-- =============================================================================
-- INDEXES
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_uqc_user      ON user_quest_completions(user_id);
CREATE INDEX IF NOT EXISTS idx_uqc_quest     ON user_quest_completions(quest_id);
CREATE INDEX IF NOT EXISTS idx_uqc_completed ON user_quest_completions(completed_at DESC);
CREATE INDEX IF NOT EXISTS idx_ub_user       ON user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_usn_user      ON user_skill_nodes(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_accounts_user ON accounts(user_id);

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================
ALTER TABLE users                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts               ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions               ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_quest_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges            ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_skill_nodes       ENABLE ROW LEVEL SECURITY;

-- Users can read/write their own row
CREATE POLICY users_self ON users
  USING (id = current_setting('app.current_user_id', TRUE)::UUID)
  WITH CHECK (id = current_setting('app.current_user_id', TRUE)::UUID);

-- Accounts
CREATE POLICY accounts_self ON accounts
  USING (user_id = current_setting('app.current_user_id', TRUE)::UUID);

-- Sessions
CREATE POLICY sessions_self ON sessions
  USING (user_id = current_setting('app.current_user_id', TRUE)::UUID);

-- Quest completions
CREATE POLICY uqc_self ON user_quest_completions
  USING (user_id = current_setting('app.current_user_id', TRUE)::UUID)
  WITH CHECK (user_id = current_setting('app.current_user_id', TRUE)::UUID);

-- Badges earned
CREATE POLICY ub_self ON user_badges
  USING (user_id = current_setting('app.current_user_id', TRUE)::UUID)
  WITH CHECK (user_id = current_setting('app.current_user_id', TRUE)::UUID);

-- Skill nodes
CREATE POLICY usn_self ON user_skill_nodes
  USING (user_id = current_setting('app.current_user_id', TRUE)::UUID)
  WITH CHECK (user_id = current_setting('app.current_user_id', TRUE)::UUID);

-- Service-role bypass (used by Next.js server with POSTGRES_SERVICE_ROLE_KEY)
CREATE ROLE codequest_service;
GRANT ALL ON ALL TABLES IN SCHEMA public TO codequest_service;
ALTER ROLE codequest_service BYPASS ROW LEVEL SECURITY;

-- =============================================================================
-- TRIGGERS — updated_at
-- =============================================================================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- =============================================================================
-- SEED DATA
-- =============================================================================

-- Quests
INSERT INTO quests (id, name, difficulty, base_xp, min_time_secs, display_order) VALUES
  ('syntax-dungeon', 'Syntax Dungeon',     'EASY',   30, 10, 1),
  ('exec-arena',     'Execution Arena',    'MEDIUM',  20, 15, 2),
  ('sort-arena',     'Sort Arena',         'MEDIUM',  40,  8, 3),
  ('hanoi',          'Tower of Hanoi',     'HARD',    50, 20, 4),
  ('bst',            'Binary Search Tree', 'HARD',    60, 12, 5),
  ('stack-boss',     'Stack Boss',         'BOSS',    35, 10, 6)
ON CONFLICT (id) DO UPDATE
  SET name=EXCLUDED.name, difficulty=EXCLUDED.difficulty,
      base_xp=EXCLUDED.base_xp, min_time_secs=EXCLUDED.min_time_secs;

-- Badges
INSERT INTO badges (id, icon, name, description, display_order) VALUES
  ('first-login',     '🌟', 'FIRST LOGIN',     'Opened CodeQuest',                          1),
  ('bug-squasher',    '🐛', 'BUG SQUASHER',    'Completed a syntax puzzle',                  2),
  ('time-traveler',   '⏪', 'TIME TRAVELER',   'Stepped backward in execution',              3),
  ('debugger',        '🧭', 'DEBUGGER',        'Ran a program to completion',                4),
  ('sort-master',     '🫧', 'SORT MASTER',     'Finished bubble sort visualizer',            5),
  ('tower-conqueror', '🏰', 'TOWER CONQUEROR', 'Solved Tower of Hanoi',                     6),
  ('tree-whisperer',  '🌳', 'TREE WHISPERER',  'Built a BST with 5+ nodes',                 7),
  ('stack-overflow',  '📚', 'STACK OVERFLOW',  'Pushed 5 items on the stack',               8),
  ('queue-master',    '🚶', 'QUEUE MASTER',    'Dequeued 5 items from a queue',              9),
  ('on-a-roll',       '🔥', 'ON A ROLL',       'Earned XP three times',                    10),
  ('perfect-hanoi',   '💎', 'OPTIMAL MOVER',   'Solved Hanoi in minimum moves',            11),
  ('completionist',   '🏆', 'COMPLETIONIST',   'Cleared all six games',                    12)
ON CONFLICT (id) DO UPDATE
  SET icon=EXCLUDED.icon, name=EXCLUDED.name, description=EXCLUDED.description;

-- Skill nodes
INSERT INTO skill_nodes (id, icon, name, quest_id, initial_status, display_order) VALUES
  ('vars',      '📝', 'Variables',       'syntax-dungeon', 'unlocked', 1),
  ('loops',     '🔄', 'Loops',           'syntax-dungeon', 'unlocked', 2),
  ('functions', 'λ',  'Functions',       'syntax-dungeon', 'active',   3),
  ('execution', '⚡', 'Execution',       'exec-arena',     'active',   4),
  ('recursion', '∞',  'Recursion',       'exec-arena',     'locked',   5),
  ('sorting',   '🫧', 'Sorting',         'sort-arena',     'locked',   6),
  ('hanoi',     '🏰', 'Recursion+',      'hanoi',          'locked',   7),
  ('trees',     '🌳', 'Trees',           'bst',            'locked',   8),
  ('stacks',    '📚', 'Stacks & Queues', 'stack-boss',     'locked',   9)
ON CONFLICT (id) DO UPDATE
  SET icon=EXCLUDED.icon, name=EXCLUDED.name,
      quest_id=EXCLUDED.quest_id, initial_status=EXCLUDED.initial_status;
