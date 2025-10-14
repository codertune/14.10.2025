-- Migration: Add portal_credentials table for user credential management
-- Purpose: Store encrypted portal credentials for users to access various portals
-- Created: 2025-10-12

-- Create portal_credentials table
CREATE TABLE IF NOT EXISTS portal_credentials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  portal_name text NOT NULL,
  username text NOT NULL,
  encrypted_password bytea NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT unique_user_portal UNIQUE(user_id, portal_name)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_portal_credentials_user_portal
  ON portal_credentials(user_id, portal_name);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_portal_credentials_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_portal_credentials_timestamp ON portal_credentials;
CREATE TRIGGER update_portal_credentials_timestamp
  BEFORE UPDATE ON portal_credentials
  FOR EACH ROW
  EXECUTE FUNCTION update_portal_credentials_updated_at();

-- Grant permissions to spf_user
ALTER TABLE portal_credentials OWNER TO spf_user;

-- Add comment
COMMENT ON TABLE portal_credentials IS 'Stores encrypted portal credentials for users';
