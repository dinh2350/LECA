-- Expand the situation_type check constraint to include new categories
ALTER TABLE "scenarios" DROP CONSTRAINT "scenarios_situation_check";
ALTER TABLE "scenarios" ADD CONSTRAINT "scenarios_situation_check"
  CHECK (situation_type IN ('everyday', 'work', 'education', 'technology', 'social', 'travel', 'banking', 'entertain'));
