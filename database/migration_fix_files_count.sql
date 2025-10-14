/*
  # Fix files_generated_count for Existing Records

  This migration recalculates the files_generated_count for existing work history records
  to correctly count report PDFs as generated files.

  1. Updates
    - Recalculate files_generated_count based on result_files JSONB array
    - Exclude only intermediate files in subdirectories (pdfs/)
    - Ensure at least 1 file is counted if result_files has any entries

  2. Logic
    - Count all files in result_files array
    - Subtract files that are in subdirectories (intermediate files)
    - If count is 0 but result_files has entries, set to 1 (final report)

  3. Important Notes
    - This fixes the issue where report PDFs were incorrectly counted as 0
    - Only affects records where files_generated_count is 0 but result_files exist
*/

-- Update work_history records to fix files_generated_count
UPDATE work_history
SET files_generated_count = CASE
  -- If result_files is empty, count should be 0
  WHEN result_files IS NULL OR result_files::text = '[]' THEN 0
  -- Count files that are not in subdirectories
  ELSE (
    SELECT COUNT(*)
    FROM jsonb_array_elements_text(result_files) AS file
    WHERE file NOT LIKE '%pdfs/%'
      AND file NOT LIKE '%/pdfs/%'
      AND file NOT LIKE '%\pdfs\%'
  )
END
WHERE files_generated_count = 0 AND result_files IS NOT NULL AND result_files::text != '[]';

-- Ensure at least 1 if there are result files but filtered count is 0
-- This catches cases where only a combined report PDF exists
UPDATE work_history
SET files_generated_count = 1
WHERE files_generated_count = 0
  AND result_files IS NOT NULL
  AND jsonb_array_length(result_files) > 0;

-- Verify the updates
DO $$
DECLARE
  fixed_count integer;
  total_with_files integer;
BEGIN
  SELECT COUNT(*) INTO fixed_count
  FROM work_history
  WHERE result_files IS NOT NULL
    AND jsonb_array_length(result_files) > 0
    AND files_generated_count > 0;

  SELECT COUNT(*) INTO total_with_files
  FROM work_history
  WHERE result_files IS NOT NULL
    AND jsonb_array_length(result_files) > 0;

  RAISE NOTICE 'Migration results:';
  RAISE NOTICE '  Total records with result files: %', total_with_files;
  RAISE NOTICE '  Records with files_generated_count > 0: %', fixed_count;
  RAISE NOTICE '  Fixed % records', fixed_count;
END $$;
