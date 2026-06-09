ALTER TABLE scripts
    ADD COLUMN IF NOT EXISTS required_tiers TEXT DEFAULT NULL;

DROP TABLE IF EXISTS script_required_robots;
