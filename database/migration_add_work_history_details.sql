/*
  # Add Per-Row Tracking to Work History

  This migration enhances the work_history table to support detailed per-row tracking
  for bulk upload operations. It adds columns to track:
  - The number of files generated per work history entry
  - The associated bulk upload ID for grouped operations
  - The row number within a bulk upload batch

  1. New Columns
    - `files_generated_count` (integer) - Number of files generated for this entry
    - `bulk_upload_id` (uuid) - Reference to parent bulk upload if applicable
    - `row_number` (integer) - Row number within bulk upload batch

  2. Indexes
    - Index on bulk_upload_id for efficient bulk upload queries
    - Index on row_number for ordering and filtering

  3. Data Migration
    - Set files_generated_count to 1 for existing single-file entries
    - Set files_generated_count based on result_files array length

  4. Important Notes
    - This migration is backward compatible with existing data
    - NULL bulk_upload_id indicates a single file upload (not part of bulk)
    - files_generated_count defaults to 1 for new entries
*/

-- Add new columns to work_history table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'work_history' AND column_name = 'files_generated_count'
  ) THEN
    ALTER TABLE public.work_history ADD COLUMN files_generated_count integer DEFAULT 1;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'work_history' AND column_name = 'bulk_upload_id'
  ) THEN
    ALTER TABLE public.work_history ADD COLUMN bulk_upload_id uuid REFERENCES public.bulk_uploads(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'work_history' AND column_name = 'row_number'
  ) THEN
    ALTER TABLE public.work_history ADD COLUMN row_number integer;
  END IF;
END $$;

-- Update existing records to set files_generated_count based on result_files array
UPDATE public.work_history
SET files_generated_count = CASE
  WHEN result_files IS NULL OR result_files::text = '[]' THEN 0
  ELSE jsonb_array_length(result_files)
END
WHERE files_generated_count IS NULL OR files_generated_count = 1;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_work_history_bulk_upload_id ON public.work_history(bulk_upload_id);
CREATE INDEX IF NOT EXISTS idx_work_history_row_number ON public.work_history(row_number);

-- Add a composite index for bulk upload queries
CREATE INDEX IF NOT EXISTS idx_work_history_bulk_row ON public.work_history(bulk_upload_id, row_number) WHERE bulk_upload_id IS NOT NULL;
