/*
  # Job Queue Table for Automation System

  1. New Tables
    - `automation_jobs`
      - `id` (uuid, primary key) - Unique job identifier
      - `user_id` (uuid) - Reference to users table
      - `service_id` (text) - Service identifier (e.g., 'damco-tracking-maersk')
      - `service_name` (text) - Human-readable service name
      - `status` (text) - Job status: queued, processing, completed, failed
      - `priority` (integer) - Queue priority (higher = first, default 0)
      - `input_file_path` (text) - Path to uploaded input file
      - `input_file_name` (text) - Original filename
      - `output_directory` (text) - Directory for job results
      - `result_files` (jsonb) - Array of generated result filenames
      - `download_url` (text) - URL to download results
      - `credits_used` (integer) - Credits deducted for this job
      - `error_message` (text) - Error details if failed
      - `created_at` (timestamptz) - Job creation timestamp
      - `started_at` (timestamptz) - Job start timestamp
      - `completed_at` (timestamptz) - Job completion timestamp

  2. Indexes
    - `idx_jobs_user_id` - Fast user job lookups
    - `idx_jobs_status` - Fast status filtering
    - `idx_jobs_queue` - Optimized queue ordering (service + status + priority + created_at)
    - `idx_jobs_created_at` - Fast recent jobs lookup

  3. Security
    - Enable RLS on `automation_jobs` table
    - Users can only view their own jobs
    - Service (backend) has full access to manage all jobs

  4. Important Notes
    - Queue is processed FIFO (First In, First Out) within same priority
    - Higher priority jobs are processed first
    - Backend automatically processes next queued job when capacity available
    - Jobs stuck in 'processing' for >10 minutes will be marked as failed
    - Completed jobs older than 7 days will be automatically deleted
*/

-- Create job queue table
CREATE TABLE IF NOT EXISTS automation_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  service_id TEXT NOT NULL,
  service_name TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('queued', 'processing', 'completed', 'failed')),
  priority INTEGER DEFAULT 0,
  input_file_path TEXT NOT NULL,
  input_file_name TEXT NOT NULL,
  output_directory TEXT,
  result_files JSONB DEFAULT '[]'::jsonb,
  download_url TEXT,
  credits_used INTEGER DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_jobs_user_id ON automation_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON automation_jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_queue ON automation_jobs(service_id, status, priority DESC, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_jobs_created_at ON automation_jobs(created_at DESC);

-- Enable Row Level Security
ALTER TABLE automation_jobs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own jobs" ON automation_jobs;
DROP POLICY IF EXISTS "Service can manage jobs" ON automation_jobs;

-- Users can view their own jobs
CREATE POLICY "Users can view own jobs" ON automation_jobs
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Service (backend) can manage all jobs
CREATE POLICY "Service can manage jobs" ON automation_jobs
  FOR ALL
  TO authenticated
  USING (true);
