/*
  # Create Contact Messages Table

  ## Overview
  This migration creates a table to store all contact form submissions from users,
  allowing administrators to view and manage inquiries through the admin dashboard.

  ## New Tables
    - `contact_messages`
      - `id` (uuid, primary key) - Unique identifier for each message
      - `name` (text, required) - Name of the person submitting the form
      - `email` (text, required) - Email address of the submitter
      - `company` (text, nullable) - Company name (optional field)
      - `subject` (text, required) - Subject line of the inquiry
      - `message` (text, required) - Full message content
      - `submitted_at` (timestamptz) - Timestamp when the message was submitted
      - `ip_address` (text, nullable) - IP address of the submitter for security tracking
      - `status` (text, default 'new') - Message status: 'new', 'read', 'resolved'

  ## Indexes
    - Index on `email` for efficient querying of messages from specific users
    - Index on `submitted_at` for chronological sorting and date filtering
    - Index on `status` for filtering messages by their status

  ## Security
    - Enable RLS on `contact_messages` table
    - Allow public INSERT (rate limiting handled at application layer)
    - Restrict SELECT/UPDATE to authenticated admin users only

  ## Important Notes
    - Rate limiting is enforced at the application layer (3 submissions per hour per email)
    - All contact form submissions are stored even if email notification fails
    - IP addresses are stored for security and abuse prevention purposes
*/

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

-- Enable Row Level Security
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;

-- Policy: Allow anyone to submit contact messages (public access)
CREATE POLICY "Anyone can submit contact messages"
  ON contact_messages
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Policy: Only authenticated users can view contact messages
-- Note: Application layer will verify admin status
CREATE POLICY "Authenticated users can view contact messages"
  ON contact_messages
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Only authenticated users can update message status
-- Note: Application layer will verify admin status
CREATE POLICY "Authenticated users can update message status"
  ON contact_messages
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);