# User Guide: Managing Portal Credentials

## Quick Start

This guide will help you set up, test, and manage your Bangladesh Bank EXP portal credentials for automation services.

## What Are Portal Credentials?

Some automation services require logging into third-party portals on your behalf. Your portal credentials (username and password) are stored securely and used only for automation purposes.

### Supported Portals
- Bangladesh Bank EXP Portal (required for EXP search, download, and related services)

## Setting Up Credentials

### First Time Setup

1. **Navigate to Account Settings**
   - Click your name in the top right corner
   - Select "Account Settings" from dropdown
   - Or click the user icon

2. **Go to Portal Access Tab**
   - Click "Portal Access" in the sidebar
   - You'll see a list of portal integrations

3. **Configure Bangladesh Bank EXP**
   - Find "Bangladesh Bank EXP Portal" card
   - Click the green "Configure" button
   - A modal will open

4. **Enter Your Credentials**
   - Username: Your Bangladesh Bank portal username
   - Password: Your Bangladesh Bank portal password
   - Both fields are required

5. **Test Your Credentials (Recommended)**
   - Click the purple "Test Credentials" button
   - Wait 15-60 seconds for validation
   - You'll see either:
     - ✓ Green success message - Credentials work!
     - ✗ Red error message - Something is wrong

6. **Save Credentials**
   - If test passed, click "Save Credentials"
   - If test failed, fix the issue and test again
   - Once saved, you can start using automation services

## Testing Credentials

### Why Test?

Testing helps you:
- Verify credentials are correct before running automation
- Avoid wasting credits on failed jobs
- Get immediate feedback on any issues
- Save time troubleshooting

### How to Test

1. Open the credential modal (see steps above)
2. Enter or verify your credentials
3. Click "Test Credentials" button
4. Wait for the result (15-60 seconds)
5. Check the message

### Test Results

**Success Messages:**
- "Credentials are valid and working!" - You're all set!

**Error Messages:**
- "Invalid username or password" - Check your credentials
- "Connection error" - Check internet connection
- "Connection timeout" - Portal may be slow, try again later

## Updating Credentials

### When to Update

Update your credentials when:
- You receive a notification about invalid credentials
- You changed your password on the Bangladesh Bank portal
- Automation jobs are failing
- Test shows credentials are no longer working

### How to Update

1. **From Notification** (Fastest)
   - Click the bell icon in header
   - Find "Portal Credentials Invalid" notification
   - Click "Update Credentials" button
   - You'll be taken directly to the credentials modal

2. **From Account Settings**
   - Go to Account Settings > Portal Access
   - Find Bangladesh Bank EXP Portal card
   - Click "Update" button
   - Modal opens with existing username pre-filled

3. **Update Process**
   - Enter new password (or change username if needed)
   - Click "Test Credentials" to verify
   - If successful, click "Update Credentials" to save

## Understanding Notifications

### Notification Bell

The bell icon in the header shows:
- Red badge with number = unread notifications
- Click to see notification list
- Auto-updates every 30 seconds

### Notification Types

**Credential Failures:**
- Title: "Portal Credentials Invalid"
- Message: Explains the issue
- Action: "Update Credentials" - Click to fix

**What Triggers Notifications:**
- Automation fails due to invalid login
- Exit code 2 from automation script
- Detected invalid credentials error

### Managing Notifications

- **Mark as Read**: Click checkmark on individual notification
- **Mark All Read**: Click "Mark all read" at top
- **Delete**: Click X on individual notification
- **Take Action**: Click action button (e.g., "Update Credentials")

## Troubleshooting

### Problem: Credentials Keep Failing

**Solutions:**
1. Double-check username and password
2. Try logging in manually to the portal first
3. Ensure no special characters are causing issues
4. Check if your portal account is active
5. Contact support if issue persists

### Problem: Test Takes Too Long

**What's Normal:**
- Test can take 15-60 seconds
- This is because we actually log in to the portal
- Slower during peak hours

**When to Worry:**
- Test runs over 60 seconds
- Browser might be timing out
- Try again or contact support

### Problem: Can't Find Credentials Section

**Solution:**
1. Make sure you're logged in
2. Click your name/user icon in header
3. Select "Account Settings"
4. Look for "Portal Access" tab in sidebar
5. Should see portal cards there

### Problem: Automation Still Fails After Update

**Checklist:**
1. Did you click "Save" after testing?
2. Did test show success before saving?
3. Try testing again to confirm
4. Check if portal website is accessible
5. Wait a few minutes and retry automation
6. Contact support with job ID

## Best Practices

### Security

✓ **DO:**
- Keep credentials up to date
- Test after changing password
- Log out of shared computers
- Use strong, unique passwords

✗ **DON'T:**
- Share your credentials with others
- Use the same password everywhere
- Ignore credential failure notifications
- Save credentials on public computers

### Efficiency

✓ **DO:**
- Test credentials before bulk operations
- Update credentials immediately when notified
- Check notifications regularly
- Save credentials after successful test

✗ **DON'T:**
- Run automation without testing first
- Ignore repeated failures
- Delay updating invalid credentials
- Skip the test step

## FAQ

**Q: Are my credentials safe?**
A: Yes! Credentials are encrypted in the database and only used for automation. They are never shared or exposed.

**Q: Can I use different credentials for different services?**
A: Currently, one set of credentials per portal. Future updates may support multiple accounts.

**Q: What happens if I don't set up credentials?**
A: Services requiring portal access will fail. You'll be prompted to set up credentials when trying to use them.

**Q: How often should I test my credentials?**
A: Test after initial setup, after password changes, and whenever you receive failure notifications.

**Q: Can I delete my credentials?**
A: Yes! Click "Delete" button in the credentials modal. You can add them back anytime.

**Q: Will automation work without testing?**
A: Yes, but testing is recommended to avoid wasted credits and failed jobs.

**Q: How do I know if credentials are being used?**
A: Services that require credentials show in the portal's "Used by" section. Currently: exp-search, exp-issue, exp-correction, exp-duplicate-reporting.

## Getting Help

If you encounter issues:

1. Check this guide first
2. Review error messages carefully
3. Try testing credentials again
4. Check notification messages for guidance
5. Contact support with:
   - Your user email
   - Portal name (Bangladesh Bank EXP)
   - Error message
   - Job ID (if automation failed)

## Summary

**Quick Steps to Success:**

1. ✓ Navigate to Account Settings > Portal Access
2. ✓ Click "Configure" on Bangladesh Bank EXP Portal
3. ✓ Enter username and password
4. ✓ Click "Test Credentials" and wait
5. ✓ If successful, click "Save Credentials"
6. ✓ Start using automation services!

**When Something Goes Wrong:**

1. Check notification bell
2. Click "Update Credentials" in notification
3. Verify and update your credentials
4. Test to confirm they work
5. Save and try automation again

That's it! You're now ready to manage your portal credentials effectively.
