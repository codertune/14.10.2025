-- Migration: Create contact_messages table
-- Date: 2025-10-09
-- Description: Add table to store contact form submissions from users

-- Create contact_messages table
CREATE TABLE IF NOT EXISTS contact_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  company text,
  subject text NOT NULL,
  message text NOT NULL,
  submitted_at timestamptz DEFAULT now() NOT NULL,
  ip_address text,
  status text DEFAULT 'new' NOT NULL CHECK (status IN ('new', 'read', 'resolved'))
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_contact_messages_email ON contact_messages(email);
CREATE INDEX IF NOT EXISTS idx_contact_messages_submitted_at ON contact_messages(submitted_at DESC);
CREATE INDEX IF NOT EXISTS idx_contact_messages_status ON contact_messages(status);

-- Add comment to table
COMMENT ON TABLE contact_messages IS 'Stores all contact form submissions from users';
COMMENT ON COLUMN contact_messages.status IS 'Message status: new, read, or resolved';
