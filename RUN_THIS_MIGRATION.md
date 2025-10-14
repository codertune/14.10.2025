# Critical Database Migration Required

## Issue
The application is failing with error: `invalid input syntax for type integer: "61.8"`

This happens because the `users.credits` column is still INTEGER type, but the application now needs to support decimal credit values (e.g., 2.20 credits).

## Root Cause
- User has 64 credits (integer)
- Automation costs 2.20 credits
- Calculation: 64 - 2.20 = 61.8 (decimal)
- PostgreSQL cannot store 61.8 in an INTEGER column → ERROR

## Solution
Run the following SQL migration on your PostgreSQL database:

```sql
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
    RAISE NOTICE 'users.credits is already numeric type';
  END IF;
END $$;
```

## How to Run

### Option 1: Using psql command line
```bash
psql -h $DB_HOST -U $DB_USER -d $DB_NAME -f database/migration_credits_to_decimal.sql
```

### Option 2: Using your database client
Connect to your database and run the SQL from `database/migration_credits_to_decimal.sql`

### Option 3: Direct SQL execution
```bash
psql "postgresql://$DB_USER:$DB_PASSWORD@$DB_HOST:$DB_PORT/$DB_NAME"
```
Then paste the SQL above.

## Verification
After running the migration, verify it worked:

```sql
SELECT column_name, data_type, numeric_precision, numeric_scale
FROM information_schema.columns
WHERE table_name = 'users' AND column_name = 'credits';
```

Expected result:
```
 column_name | data_type | numeric_precision | numeric_scale
-------------+-----------+-------------------+---------------
 credits     | numeric   |                10 |             2
```

## What's Fixed
1. **Backend code**: Changed `parseInt()` to `parseFloat()` to preserve decimal precision
2. **Schema documentation**: Updated schema.sql to reflect numeric(10,2) for all credit columns
3. **Migration file**: Updated to include users.credits conversion

## After Migration
Once the migration is complete:
1. Restart your application server
2. Test with decimal credit values (e.g., 64.00 - 2.20 = 61.80)
3. Verify work history shows exact decimal amounts

The error will be resolved and your credit system will properly handle decimal values!
