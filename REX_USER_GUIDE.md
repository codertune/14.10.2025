# REX/SOO Submission - User Guide

## Overview
The REX/SOO Submission service automates the process of submitting Statement of Origin (SOO) forms to the EPB Export Tracker portal. This service handles bulk submissions with automatic PDF document uploads.

## Prerequisites

### 1. EPB Export Tracker Account
You must have an active account on the EPB Export Tracker portal (https://epb-exporttracker.gov.bd).

### 2. Required Files

#### A. CSV File
A CSV file containing your SOO form data with the following columns:

| Column Name | Description | Example |
|------------|-------------|---------|
| RexImporterId | REX Importer ID | 123 |
| DestinationCountryId | Destination Country ID | 101 |
| FreightRoute | Freight Route (Sea/Air) | Sea |
| BLNo | Bill of Lading Number | BL12345 |
| BLDate | Bill of Lading Date | 01/01/2025 |
| ContainerNo | Container Number | ABCD1234567 |
| AdCode | Advertisement Code | 0001 |
| Serial | Serial Number | 001 |
| Year | Year | 2025 |
| EXPDate | EXP Date | 01/15/2025 |
| BillOfExportNo | Bill of Export Number | BE001 |
| BillOfExportDate | Bill of Export Date | 01/10/2025 |
| HSCode | HS Code | 6203.42.00.00 |
| Quantity | Quantity | 1000 |
| UnitType | Unit Type | Pieces |
| InvoiceNo | Invoice Number | INV001 |
| InvoiceDate | Invoice Date | 01/05/2025 |
| Currency | Currency | USD |
| InvoiceValue | Invoice Value | 50000 |
| DeclarationDate | Declaration Date | 01/20/2025 |

**Download Template**: `/templates/rex-soo-submission-template.csv`

#### B. ZIP File
A ZIP file containing all required PDF documents:

**Required PDFs for each row:**
1. **Commercial Invoice** - Must contain invoice number in filename
2. **Bill of Lading** - Must contain invoice number in filename

**Naming Conventions** (the script will automatically match these patterns):
- `{InvoiceNo}_invoice.pdf` and `{InvoiceNo}_bol.pdf`
- `{InvoiceNo}-invoice.pdf` and `{InvoiceNo}-bol.pdf`
- `invoice_{InvoiceNo}.pdf` and `bol_{InvoiceNo}.pdf`
- Or any filename containing both the invoice number and document type

**Example ZIP Structure:**
```
soo_documents.zip
├── INV001_invoice.pdf
├── INV001_bol.pdf
├── INV002_invoice.pdf
├── INV002_bol.pdf
└── INV003_invoice.pdf
└── INV003_bol.pdf
```

## Setup Instructions

### Step 1: Configure EPB Credentials (One-time Setup)

1. Navigate to **Dashboard**
2. Click on the **Credentials** tab
3. Find **EPB Export Tracker Portal** section
4. Click **Configure Credentials**
5. Enter your EPB username and password
6. Click **Save Credentials**

**Note**: Your credentials are encrypted and stored securely. They are only used during automation and never exposed.

### Step 2: Prepare Your Files

1. **Create CSV File**:
   - Download the template from `/templates/rex-soo-submission-template.csv`
   - Fill in your SOO data
   - Ensure all required columns are present
   - Save as CSV format

2. **Prepare PDF Files**:
   - Gather all Commercial Invoice PDFs
   - Gather all Bill of Lading PDFs
   - Rename files to include invoice numbers
   - Create a ZIP file containing all PDFs

3. **Verify Files**:
   - Check CSV has correct column names
   - Verify each row in CSV has corresponding PDFs in ZIP
   - Ensure invoice numbers match between CSV and PDF filenames

## How to Submit

### Step 1: Select Service
1. Go to **Dashboard**
2. Click on service selector dropdown
3. Search for "REX" or scroll to "EPB Export" category
4. Select **REX/SOO Submission**

### Step 2: Upload Files
1. **Upload CSV File**:
   - Click "Upload CSV File" or drag and drop
   - Wait for file validation
   - Review row count

2. **Upload ZIP File**:
   - Click "Upload ZIP File" or drag and drop
   - Wait for file validation
   - System will verify ZIP contains PDF files

### Step 3: Review & Submit
1. Review the credit cost (based on number of rows)
2. Verify you have sufficient credits
3. Check that EPB credentials are configured
4. Click **Submit Job**

### Step 4: Monitor Progress
1. Job will be added to queue
2. You'll see real-time status updates
3. Processing time depends on number of forms
4. Estimated: 2-3 minutes per SOO form

### Step 5: Download Results
1. Once completed, go to **Work History** tab
2. Find your REX submission job
3. Download the results CSV
4. Review success/failure status for each form

## Understanding Results

The results CSV will contain:
- **InvoiceNo**: The invoice number processed
- **Status**: ✅ Success or ❌ Failed
- **Message**: Details about success or error
- **Timestamp**: When the form was processed

**Example Results:**
```csv
InvoiceNo,Status,Message,Timestamp
INV001,✅ Success,SOO submitted successfully,2025-01-20 10:30:15
INV002,✅ Success,SOO submitted successfully,2025-01-20 10:33:42
INV003,❌ Failed,Commercial Invoice PDF not found,2025-01-20 10:35:10
```

## Common Issues & Solutions

### Issue: "EPB Credentials Not Configured"
**Solution**: Go to Credentials tab and add your EPB username and password.

### Issue: "PDF File Not Found"
**Solution**:
- Check that PDF filenames contain the invoice number
- Verify ZIP file contains all required PDFs
- Ensure PDF files are in the root of ZIP (not in subfolders)

### Issue: "Invalid Credentials"
**Solution**:
- Verify your EPB username and password are correct
- Try logging in manually to EPB portal to confirm credentials
- Update credentials in the Credentials tab

### Issue: "Job Failed"
**Solution**:
- Check the results CSV for specific error messages
- Verify all CSV columns are filled correctly
- Ensure dates are in correct format (DD/MM/YYYY)
- Check that dropdown values match EPB portal options

### Issue: "Insufficient Credits"
**Solution**:
- Purchase more credits from the Credits tab
- Each job costs approximately 10 credits
- You can view your current balance in the dashboard

## Tips for Best Results

1. **Test with Small Batch First**
   - Start with 1-2 rows to verify everything works
   - Check results before submitting larger batches

2. **Consistent Naming**
   - Use a consistent naming pattern for all PDF files
   - Include invoice number clearly in filename

3. **Verify Data**
   - Double-check all dates are in correct format
   - Verify dropdown values (Country ID, Currency, etc.)
   - Ensure numeric fields don't have extra spaces

4. **PDF Quality**
   - Use clear, readable PDF files
   - Ensure PDFs are not corrupted
   - Keep file sizes reasonable (< 5MB per file)

5. **Regular Backups**
   - Download results CSV after each submission
   - Keep original CSV and ZIP files as backup
   - Maintain records of successful submissions

## Credit Cost

**Base Cost**: 10 credits per job

**Factors Affecting Cost**:
- Number of rows in CSV
- Complexity of forms
- Number of retries needed

**Typical Costs**:
- 1-10 forms: 10 credits
- 11-50 forms: 20 credits
- 51-100 forms: 40 credits

## Processing Time

**Average Processing Time**:
- Login: 30 seconds
- Per form: 2-3 minutes
- Total: (Number of forms × 3 minutes) + 30 seconds

**Example**:
- 10 forms: ~30 minutes
- 25 forms: ~75 minutes
- 50 forms: ~150 minutes

## Support

If you encounter issues:

1. **Check Job Logs**:
   - Download the log file from work history
   - Review error messages and timestamps

2. **Verify Inputs**:
   - Re-check CSV file format
   - Verify PDF files are correct
   - Confirm credentials are valid

3. **Review Results CSV**:
   - Identify which specific rows failed
   - Check error messages for each failure
   - Fix issues and resubmit failed rows

4. **Contact Support**:
   - Provide job ID
   - Include error messages
   - Share sample CSV (without sensitive data)

## FAQs

**Q: Can I submit forms to multiple importers in one job?**
A: Yes, as long as each row has the correct RexImporterId.

**Q: What happens if some forms fail?**
A: Successful forms are still submitted. Failed forms are logged in results CSV. You can resubmit failed rows separately.

**Q: Are my EPB credentials secure?**
A: Yes, credentials are encrypted in the database and only decrypted during job execution. They are never logged or exposed.

**Q: Can I cancel a job in progress?**
A: Currently, jobs cannot be canceled once started. Please ensure your data is correct before submission.

**Q: How long are results stored?**
A: Results and work history are stored permanently. You can download them anytime from the Work History tab.

**Q: Can I edit EPB credentials after saving?**
A: Yes, go to Credentials tab and update your EPB credentials anytime.

**Q: What if I have PDFs with different names?**
A: The script tries multiple naming patterns. As long as the filename contains the invoice number and document type (invoice/bol), it should work.

**Q: Is there a limit on number of forms per job?**
A: No hard limit, but we recommend batches of 50 or less for optimal processing time and error handling.

## Advanced Tips

### Handling Large Batches
For batches > 50 forms:
1. Split into smaller CSV files (50 forms each)
2. Submit multiple jobs sequentially
3. Monitor each job completion before next submission
4. Combine results CSVs at the end

### Retry Failed Forms
1. Download results CSV from failed job
2. Identify rows with "❌ Failed" status
3. Create new CSV with only failed rows
4. Fix any errors indicated in Message column
5. Resubmit as a new job

### Bulk PDF Organization
Use this folder structure for easy management:
```
REX_Submissions/
├── Batch_2025_01/
│   ├── batch_01.csv
│   ├── batch_01_pdfs.zip
│   └── batch_01_results.csv
├── Batch_2025_02/
│   ├── batch_02.csv
│   ├── batch_02_pdfs.zip
│   └── batch_02_results.csv
```

## Version History

- **v1.0** (2025-01-20): Initial release
  - Basic SOO form submission
  - Commercial Invoice and Bill of Lading uploads
  - Results CSV generation
  - EPB credential management
