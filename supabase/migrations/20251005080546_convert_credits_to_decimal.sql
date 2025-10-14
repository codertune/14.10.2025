/*
  # Convert Credits to Decimal Type

  This migration converts credit-related columns from integer to numeric(10,2)
  to support decimal credit values like 1.50, 2.00, etc.

  1. Column Changes
    - `work_history.credits_used` (integer → numeric(10,2))
    - `automation_jobs.credits_used` (integer → numeric(10,2))

  2. Data Migration
    - Convert existing integer values to decimal format (e.g., 2 → 2.00)
    - Preserve all existing credit values
    - No data loss during conversion

  3. Important Notes
    - This migration is backward compatible
    - All existing credit values will be preserved
    - Future credit calculations can now use decimal precision
    - Display format should show 2 decimal places (e.g., 2.00)
*/

-- Convert work_history.credits_used from integer to numeric(10,2)
DO $$
BEGIN
  -- Check if column is still integer type
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'work_history'
    AND column_name = 'credits_used'
    AND data_type = 'integer'
  ) THEN
    -- Convert to numeric with 2 decimal places
    ALTER TABLE work_history
    ALTER COLUMN credits_used TYPE numeric(10,2) USING credits_used::numeric(10,2);

    RAISE NOTICE 'Converted work_history.credits_used to numeric(10,2)';
  ELSE
    RAISE NOTICE 'work_history.credits_used is already numeric type or does not exist';
  END IF;
END $$;

-- Convert automation_jobs.credits_used from integer to numeric(10,2)
DO $$
BEGIN
  -- Check if column is still integer type
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'automation_jobs'
    AND column_name = 'credits_used'
    AND data_type = 'integer'
  ) THEN
    -- Change default from 0 to 0.00
    ALTER TABLE automation_jobs
    ALTER COLUMN credits_used DROP DEFAULT;

    -- Convert to numeric with 2 decimal places
    ALTER TABLE automation_jobs
    ALTER COLUMN credits_used TYPE numeric(10,2) USING credits_used::numeric(10,2);

    -- Set new default
    ALTER TABLE automation_jobs
    ALTER COLUMN credits_used SET DEFAULT 0.00;

    RAISE NOTICE 'Converted automation_jobs.credits_used to numeric(10,2)';
  ELSE
    RAISE NOTICE 'automation_jobs.credits_used is already numeric type or does not exist';
  END IF;
END $$;

-- Verify the changes
DO $$
DECLARE
  wh_type text;
  aj_type text;
BEGIN
  SELECT data_type INTO wh_type
  FROM information_schema.columns
  WHERE table_name = 'work_history' AND column_name = 'credits_used';

  SELECT data_type INTO aj_type
  FROM information_schema.columns
  WHERE table_name = 'automation_jobs' AND column_name = 'credits_used';

  RAISE NOTICE 'Migration verification:';
  RAISE NOTICE '  work_history.credits_used type: %', wh_type;
  RAISE NOTICE '  automation_jobs.credits_used type: %', aj_type;
END $$;