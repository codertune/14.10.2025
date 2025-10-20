# REX SOO Submission System - Setup Guide

## Overview

The REX SOO Submission system allows users to upload CSV templates along with Bill of Lading (BL) and Commercial Invoice PDFs for export submissions. The system automatically extracts PDFs from ZIP files, matches them with CSV data based on BL and Invoice numbers, and stores everything in the database.

## Features

- **Multi-Step Upload Process**: Upload ZIP file with PDFs, then upload CSV template separately
- **Automatic Document Matching**: Intelligently matches PDFs with CSV rows based on BL and Invoice numbers
- **Credit System Integration**: Admin-configurable credit cost per submission (default: 2.0 credits)
- **Document Management**: View, download, and manage all submissions with linked documents
- **Validation**: Shows missing documents before final submission

## Setup Instructions

### 1. Run Database Migration

First, run the migration to create the necessary database tables:

```bash
node run-rex-migration.cjs
```

This will create:
- `rex_submissions` table - Stores CSV submission data
- `rex_documents` table - Stores uploaded PDF files
- Service template entry in `service_templates` table

### 2. Verify Database Tables

Connect to your PostgreSQL database and verify the tables were created:

```sql
SELECT * FROM rex_submissions;
SELECT * FROM rex_documents;
SELECT * FROM service_templates WHERE service_id = 'rex-soo-submission';
```

### 3. Access the Feature

After the migration, users can access the REX SOO Submission page at:

```
http://localhost:5173/rex-soo-submission
```

(You must be logged in to access this page)

## How to Use

### Step 1: Prepare Your Files

1. **CSV Template**: Download the template from the application or use `/public/templates/rex-soo-submission-template.csv`

2. **PDF Files**: Prepare your BL and Invoice PDFs with these naming conventions:
   - BL files should contain the BL number in the filename
     - Examples: `CTG0018444.pdf`, `BL_CTG0018444.pdf`, `CTG0018444_BL.pdf`

   - Invoice files should contain the invoice number in the filename
     - Examples: `2309673.pdf`, `INV_2309673.pdf`, `2309673_invoice.pdf`

3. **ZIP File**: Put all PDF files into a ZIP archive

### Step 2: Upload Process

1. **Upload ZIP File**:
   - Click "Browse Files" under Step 1
   - Select your ZIP file containing all PDFs
   - Click "Extract ZIP"
   - The system will extract and list all PDF files

2. **Upload CSV Template**:
   - Click "Browse Files" under Step 2
   - Select your CSV file with submission data
   - Click "Parse CSV"
   - The system will parse the CSV and match documents automatically

3. **Review & Submit**:
   - Check the matching results table
   - See which documents are matched (green checkmarks)
   - See which documents are missing (red alerts)
   - Only rows with all documents will be submitted
   - Click "Submit X Entries" to finalize

### Step 3: Manage Submissions

- View all your submissions in the table at the bottom
- Click eye icon to view submission details
- Click download icon to download associated PDFs
- All submissions are stored permanently in the database

## CSV Template Format

The CSV file must include these required columns:

- `RexImporterId` - Name of the importer
- `DestinationCountryId` - Destination country
- `FreightRoute` - Shipping route
- `BLNo` - Bill of Lading number **(required for document matching)**
- `BLDate` - BL date
- `ContainerNo` - Container number
- `AdCode` - AD Code
- `Serial` - Serial number
- `Year` - Year
- `EXPDate` - Export date
- `BillOfExportNo` - Bill of Export number
- `BillOfExportDate` - Bill of Export date
- `HSCode` - HS Code
- `Quantity` - Quantity
- `UnitType` - Unit type
- `InvoiceNo` - Invoice number **(required for document matching)**
- `InvoiceDate` - Invoice date
- `Currency` - Currency (e.g., USD, EUR)
- `InvoiceValue` - Invoice value
- `DeclarationDate` - Declaration date

**Important**: The `BLNo` and `InvoiceNo` columns are critical for automatic document matching.

## Document Matching Logic

The system uses intelligent pattern matching to link PDFs with CSV rows:

1. For each CSV row, it extracts the `BLNo` and `InvoiceNo`
2. It searches the extracted PDF filenames for matches using case-insensitive regex
3. Successfully matched documents are marked with green checkmarks
4. Missing documents are flagged with red alerts
5. Only complete rows (with both BL and Invoice) are submitted

### Supported Filename Patterns

The matching system is flexible and supports various naming conventions:

- Direct number match: `CTG0018444.pdf` matches BLNo "CTG0018444"
- With prefix: `BL_CTG0018444.pdf` matches BLNo "CTG0018444"
- With suffix: `CTG0018444_BL.pdf` matches BLNo "CTG0018444"
- Invoice files: `2309673.pdf`, `INV_2309673.pdf`, `invoice_2309673.pdf`

## Admin Configuration

Admins can configure the credit cost for REX SOO submissions:

1. Log in as admin
2. Go to Admin Dashboard
3. Find "REX SOO Submission" in the services list
4. Update the `credit_cost` field (default is 2.0 credits per submission)

Or update directly in the database:

```sql
UPDATE service_templates
SET credit_cost = 3.0
WHERE service_id = 'rex-soo-submission';
```

## API Endpoints

The following API endpoints are available:

- `POST /api/rex-soo/upload-zip` - Upload and extract ZIP file
- `POST /api/rex-soo/upload-csv` - Parse CSV template
- `POST /api/rex-soo/match-documents` - Match CSV rows with PDFs
- `POST /api/rex-soo/submit` - Submit final data to database
- `GET /api/rex-soo/submissions/:userId` - Get all submissions for a user
- `GET /api/rex-soo/submission/:submissionId` - Get submission details
- `GET /api/rex-soo/document/:documentId/download` - Download a specific document
- `DELETE /api/rex-soo/submission/:submissionId` - Delete a submission

## File Storage

Uploaded files are stored in the following structure:

```
uploads/
  rex-temp/              # Temporary extraction folder
    {user-id}/
      {upload-id}/
        {pdf-files}

  rex-submissions/       # Permanent storage
    {user-id}/
      {submission-id}/
        bl_{filename}
        invoice_{filename}
```

Temporary files in `rex-temp` are automatically cleaned up after successful submission.

## Troubleshooting

### Documents Not Matching

If documents aren't being matched automatically:

1. Check that your PDF filenames contain the exact BL or Invoice number
2. Ensure there are no extra spaces or special characters
3. Try simpler filenames: just the number with .pdf extension

### CSV Parsing Errors

If CSV parsing fails:

1. Verify the CSV file has all required columns
2. Check for special characters or encoding issues
3. Make sure dates are in DD.MM.YYYY or YYYY-MM-DD format
4. Ensure numeric fields (Quantity, InvoiceValue) are valid numbers

### Upload Failures

If uploads fail:

1. Check file size limits (ZIP and CSV should be under upload limits)
2. Verify you have sufficient credits
3. Check that ZIP file contains only PDF files
4. Ensure database connection is active

## Security Notes

- All submissions are user-specific and access-controlled
- PDF files are stored in user-specific directories
- Only authenticated users can submit and view their own data
- Admins can configure credit costs but cannot modify user submissions

## Support

For issues or questions, contact your system administrator or check the application logs in:
- Backend logs: Check server console output
- Database logs: Check PostgreSQL logs
- File system: Check `uploads/rex-temp` and `uploads/rex-submissions` directories
