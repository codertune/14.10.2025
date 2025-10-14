# Email Verification & Password Reset Setup Guide

This guide will help you set up email verification and password reset functionality using Zoho Mail.

## Table of Contents
1. [Zoho Mail Account Setup](#zoho-mail-account-setup)
2. [Database Migration](#database-migration)
3. [Environment Configuration](#environment-configuration)
4. [Testing the Implementation](#testing-the-implementation)
5. [Troubleshooting](#troubleshooting)

---

## Zoho Mail Account Setup

### Step 1: Create a Zoho Mail Account

1. Go to [https://www.zoho.com/mail/](https://www.zoho.com/mail/)
2. Click "Sign Up" and create a free account
3. Verify your email address

### Step 2: Enable IMAP/SMTP Access

1. Log in to your Zoho Mail account
2. Click on the **Settings** gear icon (top right)
3. Go to **Mail Accounts** → **IMAP Access**
4. Enable IMAP access if it's not already enabled

### Step 3: Generate App-Specific Password

For security reasons, Zoho requires you to use app-specific passwords for SMTP access:

1. Go to [https://accounts.zoho.com/](https://accounts.zoho.com/)
2. Click on your profile icon → **My Account**
3. Navigate to **Security** → **App Passwords**
4. Click **Generate New Password**
5. Enter a name (e.g., "Smart Process Flow SMTP")
6. Click **Generate**
7. **IMPORTANT**: Copy the generated password immediately - you won't be able to see it again!

### Step 4: Note Your SMTP Credentials

You'll need these details for configuration:

- **SMTP Host**: `smtp.zoho.com`
- **SMTP Port**: `587` (TLS) or `465` (SSL)
- **Email Address**: Your Zoho email address (e.g., `yourname@zoho.com`)
- **App Password**: The app-specific password you just generated

---

## Database Migration

### For PostgreSQL Users

Run the migration script to add the required columns to your `users` table:

```bash
# If using psql command line
psql -h $DB_HOST -U $DB_USER -d $DB_NAME -f database/migration_email_verification_and_password_reset.sql

# Or connect to your database and run:
\i database/migration_email_verification_and_password_reset.sql
```

The migration adds these columns:
- `verification_token` (VARCHAR 255)
- `verification_token_expires` (TIMESTAMP)
- `password_reset_token` (VARCHAR 255)
- `password_reset_token_expires` (TIMESTAMP)

### Verify Migration Success

Check if the columns were added:

```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'users'
AND column_name IN ('verification_token', 'verification_token_expires', 'password_reset_token', 'password_reset_token_expires');
```

You should see all 4 columns listed.

---

## Environment Configuration

### Step 1: Update .env File

Open your `.env` file and update the following variables with your Zoho Mail credentials:

```env
# Email Configuration (Zoho Mail)
ZOHO_EMAIL=your-actual-email@zoho.com
ZOHO_PASSWORD=your-app-specific-password-here
SMTP_HOST=smtp.zoho.com
SMTP_PORT=587
EMAIL_FROM_NAME=Smart Process Flow

# Application URLs
BASE_URL=http://localhost:5173

# Token Expiry (in milliseconds)
VERIFICATION_TOKEN_EXPIRY=86400000  # 24 hours
RESET_TOKEN_EXPIRY=3600000          # 1 hour

# Rate Limiting
EMAIL_RATE_LIMIT_MAX=3              # Max 3 emails
EMAIL_RATE_LIMIT_WINDOW=3600000     # Per 1 hour
```

### Step 2: Update BASE_URL for Production

When deploying to production, update the `BASE_URL` to your actual domain:

```env
BASE_URL=https://yourdomain.com
```

This URL is used to generate verification and password reset links in emails.

---

## Testing the Implementation

### Test 1: User Registration & Email Verification

1. **Start the server**:
   ```bash
   npm run server
   ```

2. **Start the frontend**:
   ```bash
   npm run dev
   ```

3. **Register a new user**:
   - Go to your application
   - Click "Sign Up"
   - Fill in all required fields
   - Click "Create Account"

4. **Check your email**:
   - You should receive a verification email within a few seconds
   - Check your spam folder if you don't see it
   - The email will have a "Verify Email Address" button

5. **Verify your email**:
   - Click the verification button in the email
   - You should be redirected to a success page
   - After 5 seconds, you'll be redirected to the login page

6. **Test login**:
   - Try logging in with your new account
   - You should now be able to access the dashboard

### Test 2: Email Verification Warning

1. **Register a new user** (follow steps above)
2. **Try to login WITHOUT verifying email**:
   - Go to the login page
   - Enter your credentials
   - Click "Sign In"

3. **Expected behavior**:
   - You should see a yellow warning message: "Email Verification Required"
   - There should be a "Resend Verification Email" button
   - Click the button to receive a new verification email

### Test 3: Password Reset

1. **Request password reset**:
   - On the login page, click "Forgot Password?"
   - Enter your email address
   - Click "Send Reset Link"

2. **Check your email**:
   - You should receive a password reset email
   - The email will have a "Reset Password" button
   - **Note**: This link expires in 1 hour

3. **Reset your password**:
   - Click the reset button in the email
   - Enter your new password (minimum 6 characters)
   - Confirm the new password
   - Click "Reset Password"

4. **Login with new password**:
   - You should be redirected to the login page
   - Login with your new password
   - You should also receive a confirmation email about the password change

### Test 4: Expired Tokens

1. **Test expired verification token**:
   - The database migration script doesn't set existing verification tokens
   - You can manually test by waiting 24+ hours after registration
   - Or manually set an expired date in the database:
     ```sql
     UPDATE users
     SET verification_token_expires = NOW() - INTERVAL '1 day'
     WHERE email = 'test@example.com';
     ```

2. **Test expired reset token**:
   - Wait 1+ hour after requesting password reset
   - Try to use the reset link
   - You should see an error message about the expired token

---

## Troubleshooting

### Issue: Emails Not Sending

**Possible Causes & Solutions**:

1. **Incorrect credentials**:
   - Double-check your `ZOHO_EMAIL` and `ZOHO_PASSWORD` in `.env`
   - Make sure you're using the app-specific password, not your account password

2. **SMTP blocked by firewall**:
   - Check if port 587 is open on your server
   - Try using port 465 with SSL instead:
     ```env
     SMTP_PORT=465
     ```

3. **Check server logs**:
   ```bash
   # Look for email service errors
   npm run server
   ```
   - Look for messages like "Email service ready" or error messages

### Issue: "Email service not configured" Message

This means the environment variables are not loaded correctly:

1. **Check .env file exists**:
   ```bash
   ls -la .env
   ```

2. **Restart the server**:
   ```bash
   # Stop the server (Ctrl+C) and restart
   npm run server
   ```

3. **Verify environment variables are loaded**:
   ```bash
   # In your server code, temporarily log:
   console.log('ZOHO_EMAIL:', process.env.ZOHO_EMAIL);
   ```

### Issue: Verification Link Not Working

1. **Check BASE_URL**:
   - Make sure `BASE_URL` in `.env` matches your frontend URL
   - For local development: `http://localhost:5173`
   - For production: `https://yourdomain.com`

2. **Check token in database**:
   ```sql
   SELECT email, verification_token, verification_token_expires
   FROM users
   WHERE email = 'test@example.com';
   ```
   - Token should not be NULL
   - Expiry date should be in the future

### Issue: Rate Limit Exceeded

If you see "Rate limit exceeded" messages:

1. **Wait the specified time** (default: 1 hour)

2. **Or adjust rate limits in .env**:
   ```env
   EMAIL_RATE_LIMIT_MAX=5
   EMAIL_RATE_LIMIT_WINDOW=1800000  # 30 minutes
   ```

3. **Or clear the rate limit cache** (server restart):
   ```bash
   # Stop and restart the server
   npm run server
   ```

### Issue: Emails Going to Spam

To improve email deliverability:

1. **Verify your domain with Zoho** (if using custom domain)
2. **Add SPF and DKIM records** to your DNS
3. **Warm up your email address**:
   - Start by sending a few emails per day
   - Gradually increase volume
   - Don't send to many users at once initially

4. **Check email content**:
   - Avoid spam trigger words
   - Include plain text version (already implemented)
   - Make sure unsubscribe link is present (if required)

### Issue: Database Columns Not Found

If you get errors about missing columns:

1. **Run the migration**:
   ```bash
   psql -h $DB_HOST -U $DB_USER -d $DB_NAME -f database/migration_email_verification_and_password_reset.sql
   ```

2. **Check if columns exist**:
   ```sql
   \d users
   ```

3. **Manually add columns if needed**:
   ```sql
   ALTER TABLE users ADD COLUMN verification_token VARCHAR(255);
   ALTER TABLE users ADD COLUMN verification_token_expires TIMESTAMP WITH TIME ZONE;
   ALTER TABLE users ADD COLUMN password_reset_token VARCHAR(255);
   ALTER TABLE users ADD COLUMN password_reset_token_expires TIMESTAMP WITH TIME ZONE;
   ```

---

## Additional Configuration

### Custom Email Templates

To customize email templates, edit `/server/emailService.cjs`:

- `getVerificationEmailTemplate()` - Verification email
- `getPasswordResetEmailTemplate()` - Password reset email
- `getWelcomeEmailTemplate()` - Welcome email after verification
- `getPasswordChangeConfirmationTemplate()` - Password change confirmation

### Adjust Token Expiry Times

In `.env`:

```env
# Verification emails valid for 48 hours
VERIFICATION_TOKEN_EXPIRY=172800000

# Password reset valid for 30 minutes
RESET_TOKEN_EXPIRY=1800000
```

### Change Rate Limits

In `.env`:

```env
# Allow 5 emails per 30 minutes
EMAIL_RATE_LIMIT_MAX=5
EMAIL_RATE_LIMIT_WINDOW=1800000
```

---

## Security Best Practices

1. **Never commit .env file to version control**
   - Already in .gitignore
   - Use environment variables in production

2. **Use strong app-specific passwords**
   - Don't share your Zoho account password
   - Rotate app passwords periodically

3. **Monitor email sending**
   - Check server logs regularly
   - Watch for unusual patterns

4. **Keep token expiry times reasonable**
   - Verification: 24 hours (default)
   - Password reset: 1 hour (default)

5. **Implement additional security measures**:
   - Add CAPTCHA to registration form
   - Implement account lockout after failed attempts
   - Add 2FA for sensitive operations

---

## Support

If you encounter issues not covered in this guide:

1. Check the server logs for detailed error messages
2. Verify all environment variables are set correctly
3. Test with a simple email first
4. Check Zoho Mail's status page for service outages

For Zoho-specific issues, visit: [https://help.zoho.com/portal/en/community/mail](https://help.zoho.com/portal/en/community/mail)
