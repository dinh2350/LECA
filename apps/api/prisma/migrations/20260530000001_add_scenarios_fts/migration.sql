-- Add full-text search GIN index on scenarios title + description
-- Used by GET /v1/scenarios?q=... for sub-500ms full-text search

CREATE INDEX "idx_scenarios_fts"
  ON "scenarios"
  USING GIN (to_tsvector('english', title || ' ' || COALESCE(description, '')));
