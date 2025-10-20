# Portal Credential Message Fix - Implementation Summary

## Problem
When uploading files in the dashboard:
1. CSV file uploads for services like `exp-search` showed "This service requires Bangladesh Bank portal credentials" - **CORRECT**
2. ZIP file uploads for `rex-soo-submission` service showed the **WRONG** portal message instead of "EPB Export Tracker Portal - Required for REX/SOO form submission"
3. File upload validation didn't distinguish between different service requirements

## Solution Implemented

### 1. Service Configuration Mapping
Created a comprehensive `SERVICE_CONFIG` object that maps each service to:
- **acceptedFormats**: File types the service accepts (`.csv`, `.zip`, `.pdf`, etc.)
- **hasTemplate**: Whether a CSV template download is available
- **requiresCredentials**: Portal name if credentials are required
- **credentialPortal**: Portal identifier for API calls
- **credentialPortalDisplay**: Human-readable portal name for UI display

**Example configurations:**
```typescript
'exp-search': {
  acceptedFormats: '.csv,.xlsx,.xls',
  hasTemplate: true,
  requiresCredentials: 'bangladesh_bank_exp',
  credentialPortal: 'bangladesh_bank_exp',
  credentialPortalDisplay: 'Bangladesh Bank EXP Portal'
},
'rex-soo-submission': {
  acceptedFormats: '.zip',
  hasTemplate: true,
  requiresCredentials: 'epb_export_tracker',
  credentialPortal: 'epb_export_tracker',
  credentialPortalDisplay: 'EPB Export Tracker Portal'
}
```

### 2. Dynamic State Management
Added new state variables to track portal-specific information:
- `credentialPortalName`: Portal identifier for API calls
- `credentialPortalDisplay`: Human-readable portal name
- `acceptedFileFormats`: Dynamic file format restrictions per service

### 3. Enhanced Service Selection Logic
Updated `handleServiceSelect` function to:
- Load service configuration dynamically
- Set appropriate file format restrictions
- Determine if credentials are required
- Store correct portal information for display

### 4. Dynamic Credential Warning Messages
Updated the credential warning to display the **correct portal name**:
- For `exp-search` → "This service requires **Bangladesh Bank EXP Portal** credentials"
- For `rex-soo-submission` → "This service requires **EPB Export Tracker Portal** credentials"

### 5. File Upload Validation
- `FileUploadZone` now receives dynamic `acceptedFormats` prop
- ZIP files only accepted for `rex-soo-submission` and `pdf-excel-converter`
- CSV files accepted for most other services
- Added helpful notes for special services:
  - REX: "Upload a ZIP file containing Commercial Invoice and Bill of Lading PDFs"
  - PDF Converter: "Upload PDF files or a ZIP containing multiple PDFs"

### 6. Template Download Button
- Shows conditionally based on `SERVICE_CONFIG[serviceId].hasTemplate`
- Hidden for services without CSV templates (like PDF converter)

### 7. Portal Credentials Modal Integration
- Modal receives correct `portalName` and `portalDisplayName` dynamically
- Credential checks use the correct portal after modal close
- Supports both `bangladesh_bank_exp` and `epb_export_tracker` portals

## Files Modified
- `/src/pages/NewDashboard.tsx` - Main dashboard component with all fixes

## Testing Checklist
- [ ] Select `exp-search` service with CSV file → Shows "Bangladesh Bank EXP Portal" message
- [ ] Select `rex-soo-submission` service with ZIP file → Shows "EPB Export Tracker Portal" message
- [ ] Upload wrong file type → Shows appropriate error
- [ ] Click "Configure Credentials" → Opens correct portal configuration modal
- [ ] Template download button shows/hides appropriately
- [ ] File format hints appear for special services

## Benefits
1. **Accurate portal identification** - Users see the correct portal name for their selected service
2. **Better file validation** - Prevents uploading wrong file types
3. **Improved user guidance** - Clear instructions for ZIP and PDF uploads
4. **Maintainable code** - Centralized service configuration makes adding new services easier
5. **Type safety** - TypeScript ensures all configurations are complete

## Future Enhancements
- Add more detailed file format instructions per service
- Add file preview before processing
- Support drag-and-drop for multiple files
- Add validation messages for file content structure
