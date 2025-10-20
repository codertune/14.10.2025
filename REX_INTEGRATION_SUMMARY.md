# REX/SOO Submission Integration Summary

## Overview
Successfully integrated the REX/SOO (Statement of Origin) submission automation into the Smart Process Flow platform. This allows users to automatically submit multiple SOO forms to the EPB Export Tracker portal with bulk PDF uploads.

## What Was Implemented

### 1. Backend Python Script (`automation_scripts/rex_submission.py`)
- **Created new script** based on the original `rex_submittion` file
- Accepts command-line arguments: CSV file, output directory, job ID, PDF directory, username, password
- Headless Chrome automation with Selenium
- Intelligent PDF file matching by invoice number
- Comprehensive error handling and logging
- Result CSV generation with success/failure status for each record

### 2. Job Queue Integration (`server/services/jobQueue.cjs`)
- Added `rex-soo-submission` to service mappings
- Implemented ZIP file extraction for PDF handling using `adm-zip`
- Added credential retrieval for EPB Export Tracker portal
- Updated `submitJob()` to accept additional files (ZIP)
- Modified `processJob()` and `runPythonScript()` to pass PDF directory
- Automatic cleanup of extracted files after processing

### 3. API Endpoint (`server/index.cjs`)
- **New endpoint**: `POST /api/process-rex-submission`
- Handles multi-file upload (CSV + ZIP)
- Validates both files are present
- Deducts credits before job execution
- Extracts ZIP file to temporary directory
- Submits job to queue with additional file metadata
- Returns job status and queue position

### 4. Frontend Service Configuration

#### NewDashboard.tsx
- Added REX/SOO Submission to `allServices` array
- Category: "EPB Export"
- Added service to credential requirement check
- Portal name mapping: `epb_export_tracker`

#### ServicePage.tsx
- Updated service count from 27 to 28
- Updated description to include REX submission

### 5. Portal Credentials Management

#### PortalCredentialsManager.tsx
- Added new portal config: `epb_export_tracker`
- Display name: "EPB Export Tracker Portal"
- Description: "Required for REX/SOO form submission and export tracking"
- Linked to `rex-soo-submission` service

### 6. Dependencies
- Added `adm-zip` package to `package.json` for ZIP file extraction

### 7. Template File
- Created CSV template at `public/templates/rex-soo-submission-template.csv`
- Contains all required columns with example data

## How It Works

### User Workflow
1. User navigates to Dashboard
2. Selects "REX/SOO Submission" service from dropdown
3. **Configures EPB credentials** (one-time setup):
   - Goes to Credentials tab
   - Adds EPB Export Tracker username and password
   - Credentials are encrypted and stored securely
4. Uploads CSV file with SOO data (required columns listed in template)
5. Uploads ZIP file containing PDF documents:
   - Commercial Invoice PDFs (named: `{InvoiceNo}_invoice.pdf` or similar)
   - Bill of Lading PDFs (named: `{InvoiceNo}_bol.pdf` or similar)
6. Reviews credit cost and confirms submission
7. Job is queued and processed automatically

### Processing Flow
1. API receives CSV and ZIP files
2. ZIP is extracted to job-specific directory
3. Credits are deducted
4. Job is submitted to queue
5. Python script is launched with:
   - CSV file path
   - Output directory
   - Job ID
   - PDF directory (extracted ZIP contents)
   - EPB credentials (retrieved from database)
6. For each CSV row:
   - Login to EPB portal
   - Create new SOO form
   - Fill all fields from CSV
   - Find and upload Commercial Invoice PDF
   - Find and upload Bill of Lading PDF
   - Save and submit form
   - Log result (success/failure)
7. Generate results CSV
8. Update job status in database
9. User can download results from work history

### PDF File Naming Convention
The script supports multiple naming patterns:
- `{InvoiceNo}_invoice.pdf` or `{InvoiceNo}_bol.pdf`
- `{InvoiceNo}-invoice.pdf` or `{InvoiceNo}-bol.pdf`
- `invoice_{InvoiceNo}.pdf` or `bol_{InvoiceNo}.pdf`
- Any filename containing both invoice number and document type

## Files Modified/Created

### Created
- `automation_scripts/rex_submission.py` - Main automation script
- `public/templates/rex-soo-submission-template.csv` - CSV template
- `REX_INTEGRATION_SUMMARY.md` - This document

### Modified
- `package.json` - Added adm-zip dependency
- `server/services/jobQueue.cjs` - Added REX service support, ZIP extraction
- `server/index.cjs` - Added multi-file upload endpoint
- `src/pages/NewDashboard.tsx` - Added REX service, credential check
- `src/pages/ServicePage.tsx` - Updated service count
- `src/components/PortalCredentialsManager.tsx` - Added EPB portal config

## Required CSV Columns

```csv
RexImporterId,DestinationCountryId,FreightRoute,BLNo,BLDate,ContainerNo,AdCode,Serial,Year,EXPDate,BillOfExportNo,BillOfExportDate,HSCode,Quantity,UnitType,InvoiceNo,InvoiceDate,Currency,InvoiceValue,DeclarationDate
```

## Credit Cost
- Default: 10 credits per job
- Can be calculated based on number of rows in CSV

## Security Features
- EPB credentials stored encrypted in PostgreSQL database
- Passwords never logged or exposed in client
- Credentials retrieved securely only during job execution
- Row-level security ensures users can only access their own credentials
- ZIP files automatically cleaned up after extraction
- Temporary files removed after job completion

## Error Handling
- Invalid credentials: Job fails, credits refunded, user notified
- Missing PDF files: Row marked as failed, continues with next row
- Network errors: Logged, row marked as failed
- Timeout: Job marked as failed, credits refunded
- All errors logged to job-specific log file

## Testing Checklist
- [ ] CSV file upload validation
- [ ] ZIP file upload validation
- [ ] EPB credentials configuration
- [ ] Credential check before job submission
- [ ] ZIP extraction and PDF file matching
- [ ] Python script execution with correct arguments
- [ ] Form filling and submission
- [ ] PDF upload functionality
- [ ] Result CSV generation
- [ ] Credit deduction and refund
- [ ] Work history entry creation
- [ ] Download results functionality

## Next Steps / Future Enhancements
1. Add real-time progress updates during processing
2. Implement retry mechanism for failed rows
3. Add PDF preview before upload
4. Validate ZIP contents before submission
5. Add support for additional document types
6. Create detailed user guide with screenshots
7. Add video tutorial for REX submission process
8. Implement batch status checking

## Support
For issues or questions:
1. Check job logs in output directory
2. Review results CSV for specific row failures
3. Verify EPB credentials are correct
4. Ensure PDF files are named correctly
5. Check ZIP file structure and contents

## Build Status
✅ Build completed successfully
✅ No TypeScript errors
✅ All components properly integrated
