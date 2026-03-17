-- Phase 2: Enable PostGIS extension
-- MUST run before any migration that uses the geography type.
-- Supabase sets search_path to include extensions schema, so ST_DWithin etc. are callable unqualified.
CREATE EXTENSION IF NOT EXISTS postgis WITH SCHEMA extensions;

-- Add geography column to posts table (authoritative geospatial field)
-- lat/lng decimal columns remain as human-readable duplicates (from Phase 1 schema)
ALTER TABLE posts ADD COLUMN IF NOT EXISTS location geography(POINT, 4326);

-- GIST spatial index — required for ST_DWithin to use index pruning
CREATE INDEX IF NOT EXISTS posts_location_gist_idx ON posts USING GIST (location);
