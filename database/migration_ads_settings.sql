/*
  # Create Google AdSense Settings Table

  1. New Tables
    - `ads_settings`
      - `id` (uuid, primary key) - Unique identifier for each ad placement
      - `ad_client_id` (text) - Google AdSense client ID
      - `ad_slot_id` (text) - Google AdSense ad slot ID
      - `ad_format` (text) - Ad format type (default: 'auto')
      - `full_width_responsive` (boolean) - Whether ad is full width responsive
      - `enabled` (boolean) - Whether this ad placement is enabled
      - `placement_location` (text, unique) - Location identifier for the ad placement
      - `page_name` (text) - Page where the ad appears (Dashboard or Blog)
      - `description` (text) - Human-readable description of the placement
      - `created_at` (timestamptz) - Creation timestamp
      - `updated_at` (timestamptz) - Last update timestamp

  2. Initial Data
    - Insert 6 default ad placement configurations
    - All placements disabled by default for admin to enable
    - Uses provided Google AdSense credentials (ca-pub-4617878161064725, slot: 9346531698)
*/

-- Create ads_settings table
CREATE TABLE IF NOT EXISTS ads_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_client_id text NOT NULL DEFAULT 'ca-pub-4617878161064725',
  ad_slot_id text NOT NULL DEFAULT '9346531698',
  ad_format text NOT NULL DEFAULT 'auto',
  full_width_responsive boolean NOT NULL DEFAULT true,
  enabled boolean NOT NULL DEFAULT false,
  placement_location text UNIQUE NOT NULL,
  page_name text NOT NULL,
  description text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Insert default ad placement configurations
INSERT INTO ads_settings (placement_location, page_name, description, enabled) VALUES
  ('dashboard_after_stats', 'Dashboard', 'Ad displayed after the statistics cards on user dashboard', false),
  ('dashboard_after_button', 'Dashboard', 'Ad displayed after the Start Automation button', false),
  ('blog_listing_top', 'Blog', 'Ad displayed at the top of blog listing page', false),
  ('blog_listing_bottom', 'Blog', 'Ad displayed at the bottom of blog listing page', false),
  ('blog_single_top', 'Blog', 'Ad displayed at the top of single blog post', false),
  ('blog_single_bottom', 'Blog', 'Ad displayed at the bottom of single blog post', false)
ON CONFLICT (placement_location) DO NOTHING;

-- Create function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_ads_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS ads_settings_updated_at ON ads_settings;
CREATE TRIGGER ads_settings_updated_at
  BEFORE UPDATE ON ads_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_ads_settings_updated_at();
