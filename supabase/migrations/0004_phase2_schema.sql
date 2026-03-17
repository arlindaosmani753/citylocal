-- Phase 2 schema additions
-- Requires: 0002_enable_postgis.sql (PostGIS must be enabled before geography type is usable)

-- 1. Create place_category enum
DO $$ BEGIN
  CREATE TYPE place_category AS ENUM (
    'restaurant', 'cafe', 'bar', 'activity', 'sport',
    'tourist_attraction', 'shopping', 'other'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 2. Alter posts.category from varchar to the new enum
-- Existing null values stay null; existing varchar values need a default or cast
ALTER TABLE posts
  ALTER COLUMN category TYPE place_category
  USING category::place_category;

-- 3. Add Phase 2 columns to posts
ALTER TABLE posts
  ADD COLUMN IF NOT EXISTS location_name        varchar(200),
  ADD COLUMN IF NOT EXISTS recurrence_interval  interval,
  ADD COLUMN IF NOT EXISTS recurrence_ends_at   timestamptz;

-- Note: posts.location (geography) was already added in 0002_enable_postgis.sql

-- 4. Create post_images table
CREATE TABLE IF NOT EXISTS post_images (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id       uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  storage_path  text NOT NULL,
  display_order integer NOT NULL DEFAULT 0,
  created_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS post_images_post_idx ON post_images(post_id);

-- 5. Create event_rsvps table
CREATE TABLE IF NOT EXISTS event_rsvps (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  post_id    uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT event_rsvps_user_post_unique UNIQUE (user_id, post_id)
);
CREATE INDEX IF NOT EXISTS event_rsvps_post_idx ON event_rsvps(post_id);
CREATE INDEX IF NOT EXISTS event_rsvps_user_idx ON event_rsvps(user_id);
