/*
  # Email Verification and Password Reset Migration

  1. New Columns Added to users table
    - `verification_token` (VARCHAR 255) - Stores unique email verification tokens
    - `verification_token_expires` (TIMESTAMP) - Tracks when verification tokens expire (24 hours)
    - `password_reset_token` (VARCHAR 255) - Stores unique password reset tokens
    - `password_reset_token_expires` (TIMESTAMP) - Tracks when reset tokens expire (1 hour)

  2. Indexes
    - Add index on `verification_token` for faster lookups during email verification
    - Add index on `password_reset_token` for faster lookups during password reset

  3. Security
    - All new columns are nullable to support existing users
    - Tokens are stored as VARCHAR to accommodate crypto-generated random strings
    - Expiry timestamps enable automatic token invalidation

  4. Important Notes
    - Verification tokens expire after 24 hours for user convenience
    - Password reset tokens expire after 1 hour for enhanced security
    - Existing users will have email_verified set to TRUE by default (backward compatibility)
    - New users will have email_verified set to FALSE requiring verification
*/

-- Add verification token columns
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'verification_token'
  ) THEN
    ALTER TABLE users ADD COLUMN verification_token VARCHAR(255);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'verification_token_expires'
  ) THEN
    ALTER TABLE users ADD COLUMN verification_token_expires TIMESTAMP WITH TIME ZONE;
  END IF;
END $$;

-- Add password reset token columns
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'password_reset_token'
  ) THEN
    ALTER TABLE users ADD COLUMN password_reset_token VARCHAR(255);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'password_reset_token_expires'
  ) THEN
    ALTER TABLE users ADD COLUMN password_reset_token_expires TIMESTAMP WITH TIME ZONE;
  END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_verification_token ON users(verification_token);
CREATE INDEX IF NOT EXISTS idx_users_password_reset_token ON users(password_reset_token);

-- Update existing users to have verified emails (backward compatibility)
UPDATE users SET email_verified = TRUE WHERE email_verified IS NULL;

-- Add comment for documentation
COMMENT ON COLUMN users.verification_token IS 'Token sent via email for email verification, expires after 24 hours';
COMMENT ON COLUMN users.verification_token_expires IS 'Timestamp when verification token expires (24 hours from generation)';
COMMENT ON COLUMN users.password_reset_token IS 'Token sent via email for password reset, expires after 1 hour';
COMMENT ON COLUMN users.password_reset_token_expires IS 'Timestamp when password reset token expires (1 hour from generation)';
