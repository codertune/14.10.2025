/*
  # Create Portal Credentials Table

  1. New Tables
    - `portal_credentials`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users)
      - `portal_name` (text) - Name of the portal (e.g., 'bangladesh_bank_exp')
      - `username` (text) - Portal username
      - `encrypted_password` (text) - Encrypted password using pgcrypto
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `portal_credentials` table
    - Add policy for users to manage only their own credentials
    - Add unique constraint on user_id + portal_name combination
    - Add indexes for faster credential lookups

  3. Functions
    - Helper functions to encrypt and decrypt passwords using pgcrypto
*/

-- Enable pgcrypto extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create portal_credentials table
CREATE TABLE IF NOT EXISTS portal_credentials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  portal_name text NOT NULL,
  username text NOT NULL,
  encrypted_password bytea NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT unique_user_portal UNIQUE(user_id, portal_name)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_portal_credentials_user_portal
  ON portal_credentials(user_id, portal_name);

-- Enable Row Level Security
ALTER TABLE portal_credentials ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view only their own credentials
CREATE POLICY "Users can view own credentials"
  ON portal_credentials
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Policy: Users can insert their own credentials
CREATE POLICY "Users can insert own credentials"
  ON portal_credentials
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Policy: Users can update their own credentials
CREATE POLICY "Users can update own credentials"
  ON portal_credentials
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Policy: Users can delete their own credentials
CREATE POLICY "Users can delete own credentials"
  ON portal_credentials
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_portal_credentials_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_portal_credentials_timestamp ON portal_credentials;
CREATE TRIGGER update_portal_credentials_timestamp
  BEFORE UPDATE ON portal_credentials
  FOR EACH ROW
  EXECUTE FUNCTION update_portal_credentials_updated_at();
