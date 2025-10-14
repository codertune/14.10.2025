-- Migration: Create Notifications System and Enhanced Credential Management
-- Purpose: Add notification system for credential failures and improve credential tracking
-- Created: 2025-10-12

-- ====================================================================================
-- 1. CREATE NOTIFICATIONS TABLE
-- ====================================================================================

CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type text NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  portal_name text,
  job_id text,
  action_url text,
  action_label text,
  is_read boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  read_at timestamp with time zone
);

-- ====================================================================================
-- 2. CREATE NOTIFICATION_PREFERENCES TABLE
-- ====================================================================================

CREATE TABLE IF NOT EXISTS notification_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  email_on_credential_failure boolean DEFAULT true,
  email_on_job_complete boolean DEFAULT false,
  email_on_credit_low boolean DEFAULT true,
  in_app_notifications boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- ====================================================================================
-- 3. ENHANCE PORTAL_CREDENTIALS TABLE
-- ====================================================================================

-- Add columns to portal_credentials if they don't exist
DO $$
BEGIN
  -- Add last_test_at column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'portal_credentials' AND column_name = 'last_test_at'
  ) THEN
    ALTER TABLE portal_credentials ADD COLUMN last_test_at timestamp with time zone;
  END IF;

  -- Add last_test_success column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'portal_credentials' AND column_name = 'last_test_success'
  ) THEN
    ALTER TABLE portal_credentials ADD COLUMN last_test_success boolean;
  END IF;

  -- Add failure_count column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'portal_credentials' AND column_name = 'failure_count'
  ) THEN
    ALTER TABLE portal_credentials ADD COLUMN failure_count integer DEFAULT 0;
  END IF;

  -- Add last_failure_at column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'portal_credentials' AND column_name = 'last_failure_at'
  ) THEN
    ALTER TABLE portal_credentials ADD COLUMN last_failure_at timestamp with time zone;
  END IF;
END $$;

-- ====================================================================================
-- 4. CREATE INDEXES FOR PERFORMANCE
-- ====================================================================================

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notification_preferences_user_id ON notification_preferences(user_id);

-- ====================================================================================
-- 5. CREATE FUNCTIONS FOR AUTOMATIC TIMESTAMP UPDATES
-- ====================================================================================

-- Function to update notification_preferences updated_at
CREATE OR REPLACE FUNCTION update_notification_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ====================================================================================
-- 6. CREATE TRIGGERS
-- ====================================================================================

-- Trigger to automatically update notification_preferences updated_at
DROP TRIGGER IF EXISTS update_notification_preferences_timestamp ON notification_preferences;
CREATE TRIGGER update_notification_preferences_timestamp
  BEFORE UPDATE ON notification_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_notification_preferences_updated_at();

-- ====================================================================================
-- 7. SET TABLE OWNERSHIP
-- ====================================================================================

ALTER TABLE notifications OWNER TO spf_user;
ALTER TABLE notification_preferences OWNER TO spf_user;

-- ====================================================================================
-- 8. ADD COMMENTS
-- ====================================================================================

COMMENT ON TABLE notifications IS 'Stores user notifications for credential failures, job completions, etc.';
COMMENT ON TABLE notification_preferences IS 'Stores user preferences for different notification types';
COMMENT ON COLUMN portal_credentials.last_test_at IS 'Timestamp of last credential test';
COMMENT ON COLUMN portal_credentials.last_test_success IS 'Result of last credential test';
COMMENT ON COLUMN portal_credentials.failure_count IS 'Count of consecutive credential failures';
COMMENT ON COLUMN portal_credentials.last_failure_at IS 'Timestamp of last credential failure';
