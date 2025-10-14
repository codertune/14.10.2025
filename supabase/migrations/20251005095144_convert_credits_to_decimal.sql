-- Convert users.credits from integer to numeric(10,2)
DO $$
BEGIN
  -- Check if column is still integer type
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users'
    AND column_name = 'credits'
    AND data_type = 'integer'
  ) THEN
    -- Drop default temporarily
    ALTER TABLE users
    ALTER COLUMN credits DROP DEFAULT;

    -- Convert to numeric with 2 decimal places
    ALTER TABLE users
    ALTER COLUMN credits TYPE numeric(10,2) USING credits::numeric(10,2);

    -- Set new default
    ALTER TABLE users
    ALTER COLUMN credits SET DEFAULT 100.00;

    RAISE NOTICE 'Converted users.credits to numeric(10,2)';
  ELSE
    RAISE NOTICE 'users.credits is already numeric type or does not exist';
  END IF;
END $$;

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
