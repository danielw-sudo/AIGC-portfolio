-- Structured generation parameters (sampler, steps, cfg, seed, etc.)
-- Stored as JSON string, same pattern as metadata column.
ALTER TABLE entries ADD COLUMN prompt_params TEXT;
