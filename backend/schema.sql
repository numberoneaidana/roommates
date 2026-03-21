-- =============================================================================
--  roommate-kz  ·  Supabase Schema
--  Run this in the Supabase SQL Editor (Database → SQL Editor → New query)
--  Safe to re-run: everything uses IF NOT EXISTS / OR REPLACE
-- =============================================================================

-- ── Extensions ────────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================================
--  USERS / AUTH  (separate from Supabase Auth – holds profile data)
-- =============================================================================
CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email         TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  reset_token_hash TEXT,
  reset_expires_at TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token_hash TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_expires_at TIMESTAMPTZ;

-- =============================================================================
--  PROFILES  (public-facing roommate card data)
-- =============================================================================
CREATE TABLE IF NOT EXISTS profiles (
  id            UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,

  -- Basic info
  name          TEXT NOT NULL,
  age           INT  CHECK (age >= 16 AND age <= 99),
  gender        TEXT CHECK (gender IN ('male','female','other')),
  bio           TEXT CHECK (char_length(bio) <= 600),
  occupation    TEXT,
  study_work    TEXT,

  -- Location
  region        TEXT,
  address       TEXT,
  lat           DOUBLE PRECISION,
  lng           DOUBLE PRECISION,

  -- Roommate preferences
  renter_type   TEXT CHECK (renter_type IN ('looking','has_place')) DEFAULT 'looking',
  budget        INT  CHECK (budget >= 0),
  move_in       TEXT,
  schedule      TEXT CHECK (schedule IN ('Жаворонок','Сова','Переменный')),
  cleanliness   INT  CHECK (cleanliness BETWEEN 1 AND 5),
  pets          TEXT CHECK (pets IN ('yes','no','')),
  smoking       TEXT CHECK (smoking IN ('yes','no','')),
  alcohol       TEXT CHECK (alcohol IN ('yes','no','')),
  remote        TEXT CHECK (remote IN ('yes','no','')),
  religion      TEXT,

  -- Arrays stored as JSONB
  tags          JSONB NOT NULL DEFAULT '[]',
  languages     JSONB NOT NULL DEFAULT '[]',
  photos        JSONB NOT NULL DEFAULT '[]',

  -- Metadata
  verified      BOOLEAN NOT NULL DEFAULT FALSE,
  online        BOOLEAN NOT NULL DEFAULT FALSE,
  last_seen     TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Indexes ───────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_profiles_region   ON profiles (region);
CREATE INDEX IF NOT EXISTS idx_profiles_gender   ON profiles (gender);
CREATE INDEX IF NOT EXISTS idx_profiles_budget   ON profiles (budget);
CREATE INDEX IF NOT EXISTS idx_profiles_online   ON profiles (online) WHERE online = TRUE;

-- =============================================================================
--  LIKES  (one directional swipe)
-- =============================================================================
CREATE TABLE IF NOT EXISTS likes (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  liker_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  liked_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (liker_id, liked_id)
);

CREATE INDEX IF NOT EXISTS idx_likes_liker  ON likes (liker_id);
CREATE INDEX IF NOT EXISTS idx_likes_liked  ON likes (liked_id);

-- =============================================================================
--  PASSES  (swipe left)
-- =============================================================================
CREATE TABLE IF NOT EXISTS passes (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  passer_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  passed_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (passer_id, passed_id)
);

-- =============================================================================
--  MATCHES  (mutual like = match, created automatically by trigger)
-- =============================================================================
CREATE TABLE IF NOT EXISTS matches (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user1_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user2_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Ensure only one match row per pair
  UNIQUE (
    LEAST(user1_id::TEXT, user2_id::TEXT),
    GREATEST(user1_id::TEXT, user2_id::TEXT)
  )
);

CREATE INDEX IF NOT EXISTS idx_matches_user1 ON matches (user1_id);
CREATE INDEX IF NOT EXISTS idx_matches_user2 ON matches (user2_id);

-- =============================================================================
--  MESSAGES
-- =============================================================================
CREATE TABLE IF NOT EXISTS messages (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id    UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  sender_id   UUID NOT NULL REFERENCES users(id)   ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES users(id)   ON DELETE CASCADE,
  content     TEXT NOT NULL CHECK (char_length(content) > 0 AND char_length(content) <= 2000),
  read_at     TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_match    ON messages (match_id, created_at);
CREATE INDEX IF NOT EXISTS idx_messages_sender   ON messages (sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver ON messages (receiver_id, read_at) WHERE read_at IS NULL;

-- =============================================================================
--  TRIGGER: auto-create match when a mutual like occurs
-- =============================================================================
CREATE OR REPLACE FUNCTION fn_auto_match()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_match_id UUID;
BEGIN
  -- Does the other user already like NEW.liker_id?
  IF EXISTS (
    SELECT 1 FROM likes
    WHERE liker_id = NEW.liked_id AND liked_id = NEW.liker_id
  ) THEN
    -- Insert match (ignore if already exists)
    INSERT INTO matches (user1_id, user2_id)
    VALUES (
      LEAST   (NEW.liker_id::TEXT, NEW.liked_id::TEXT)::UUID,
      GREATEST(NEW.liker_id::TEXT, NEW.liked_id::TEXT)::UUID
    )
    ON CONFLICT DO NOTHING
    RETURNING id INTO v_match_id;

    -- Expose the new match_id via a temp advisory lock payload for the API
    -- (The API polls pg_try_advisory_xact_lock approach; simpler: just notify)
    IF v_match_id IS NOT NULL THEN
      PERFORM pg_notify(
        'new_match',
        json_build_object(
          'match_id',  v_match_id,
          'user1_id',  NEW.liker_id,
          'user2_id',  NEW.liked_id
        )::TEXT
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_auto_match ON likes;
CREATE TRIGGER trg_auto_match
  AFTER INSERT ON likes
  FOR EACH ROW EXECUTE FUNCTION fn_auto_match();

-- =============================================================================
--  TRIGGER: keep updated_at fresh
-- =============================================================================
CREATE OR REPLACE FUNCTION fn_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS trg_users_updated    ON users;
CREATE TRIGGER trg_users_updated
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION fn_updated_at();

DROP TRIGGER IF EXISTS trg_profiles_updated ON profiles;
CREATE TRIGGER trg_profiles_updated
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION fn_updated_at();

-- =============================================================================
--  ROW LEVEL SECURITY (RLS)
-- =============================================================================

-- ── Enable RLS ────────────────────────────────────────────────────────────────
ALTER TABLE users    ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes    ENABLE ROW LEVEL SECURITY;
ALTER TABLE passes   ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches  ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- ── users ─────────────────────────────────────────────────────────────────────
-- Users can only read/update their own row; no one can delete via API
DROP POLICY IF EXISTS "users_select_own"  ON users;
CREATE POLICY "users_select_own"
  ON users FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "users_update_own"  ON users;
CREATE POLICY "users_update_own"
  ON users FOR UPDATE USING (auth.uid() = id);

-- ── profiles ──────────────────────────────────────────────────────────────────
-- Anyone authenticated can read profiles (discovery feed)
DROP POLICY IF EXISTS "profiles_select_authenticated" ON profiles;
CREATE POLICY "profiles_select_authenticated"
  ON profiles FOR SELECT TO authenticated USING (TRUE);

-- Only owner can insert / update their own profile
DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
CREATE POLICY "profiles_insert_own"
  ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
CREATE POLICY "profiles_update_own"
  ON profiles FOR UPDATE USING (auth.uid() = id);

-- ── likes ─────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "likes_select_own" ON likes;
CREATE POLICY "likes_select_own"
  ON likes FOR SELECT USING (auth.uid() = liker_id OR auth.uid() = liked_id);

DROP POLICY IF EXISTS "likes_insert_own" ON likes;
CREATE POLICY "likes_insert_own"
  ON likes FOR INSERT WITH CHECK (auth.uid() = liker_id);

DROP POLICY IF EXISTS "likes_delete_own" ON likes;
CREATE POLICY "likes_delete_own"
  ON likes FOR DELETE USING (auth.uid() = liker_id);

-- ── passes ────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "passes_insert_own" ON passes;
CREATE POLICY "passes_insert_own"
  ON passes FOR INSERT WITH CHECK (auth.uid() = passer_id);

DROP POLICY IF EXISTS "passes_select_own" ON passes;
CREATE POLICY "passes_select_own"
  ON passes FOR SELECT USING (auth.uid() = passer_id);

-- ── matches ───────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "matches_select_participant" ON matches;
CREATE POLICY "matches_select_participant"
  ON matches FOR SELECT USING (auth.uid() = user1_id OR auth.uid() = user2_id);

-- ── messages ──────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "messages_select_participant" ON messages;
CREATE POLICY "messages_select_participant"
  ON messages FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

DROP POLICY IF EXISTS "messages_insert_sender" ON messages;
CREATE POLICY "messages_insert_sender"
  ON messages FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- =============================================================================
--  HELPER VIEWS  (used by the API to avoid N+1 queries)
-- =============================================================================
CREATE OR REPLACE VIEW v_matches_with_users AS
SELECT
  m.id           AS match_id,
  m.created_at   AS matched_at,
  m.user1_id,
  m.user2_id,
  p1.name        AS user1_name,
  p2.name        AS user2_name,
  (
    SELECT row_to_json(p2.*)
    FROM profiles p2
    WHERE p2.id = m.user2_id
  )              AS user2_profile,
  (
    SELECT row_to_json(p1.*)
    FROM profiles p1
    WHERE p1.id = m.user1_id
  )              AS user1_profile
FROM matches m
JOIN profiles p1 ON p1.id = m.user1_id
JOIN profiles p2 ON p2.id = m.user2_id;

-- =============================================================================
--  DONE ✓
-- =============================================================================
