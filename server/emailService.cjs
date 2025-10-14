require('dotenv').config();
const axios = require('axios');
const qs = require('querystring');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

class EmailService {
  constructor() {
    this.clientId = process.env.ZOHO_CLIENT_ID;
    this.clientSecret = process.env.ZOHO_CLIENT_SECRET;
    this.refreshToken = process.env.ZOHO_REFRESH_TOKEN;
    this.accountId = process.env.ZOHO_ACCOUNT_ID;
    this.baseUrl = process.env.ZOHO_BASE_URL || 'https://mail.zoho.com/api';
    this.accountsUrl = process.env.ZOHO_ACCOUNTS_URL || 'https://accounts.zoho.com';
    this.fromAddress = 'support@smartprocessflow.com';
    this.fromName = process.env.EMAIL_FROM_NAME || 'Smart Process Flow';
    this.accessToken = null;
    this.tokenExpiry = 0;
    this.rateLimitStore = new Map();

    if (!this.clientId || !this.clientSecret || !this.refreshToken || !this.accountId) {
      console.warn('⚠️ Zoho Mail API not configured properly.');
    } else {
      console.log('✅ Zoho Mail API service initialized.');
    }
  }

  async refreshAccessToken(retryCount = 0) {
    const maxRetries = 2;
    const tokenUrl = `${this.accountsUrl}/oauth/v2/token`;

    console.log(`🔑 Refreshing Zoho access token from: ${tokenUrl}`);

    try {
      const response = await axios.post(
        tokenUrl,
        qs.stringify({
          refresh_token: this.refreshToken,
          client_id: this.clientId,
          client_secret: this.clientSecret,
          grant_type: 'refresh_token',
        }),
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
      );

      this.accessToken = response.data.access_token;
      this.tokenExpiry = Date.now() + (response.data.expires_in - 60) * 1000;

      console.log('✅ Zoho access token refreshed successfully.');
      console.log('⏰ Token valid until:', new Date(this.tokenExpiry).toLocaleString());

      // Save token to file (optional)
      try {
        const tokenPath = path.join('/var/www/smart-process-flow', '.zoho_token');
        fs.writeFileSync(tokenPath, this.accessToken, 'utf8');
        console.log(`💾 Access token saved to ${tokenPath}`);
      } catch (err) {
        console.warn('⚠️ Could not save access token locally:', err.message);
      }

      return true;
    } catch (error) {
      console.error('❌ Failed to refresh Zoho token:', error.response?.data || error.message);

      if (retryCount < maxRetries) {
        console.log(`🔄 Retrying token refresh (${retryCount + 1}/${maxRetries})...`);
        await new Promise(resolve => setTimeout(resolve, 2000));
        return await this.refreshAccessToken(retryCount + 1);
      }

      throw new Error('Failed to refresh access token after retries.');
    }
  }

  async ensureValidToken() {
    if (!this.accessToken || Date.now() >= this.tokenExpiry) {
      console.log('🔄 Token missing or expired, refreshing...');
      await this.refreshAccessToken();
    }
  }

  generateToken(bytes = 32) {
    return crypto.randomBytes(bytes).toString('hex');
  }

  getBaseUrl() {
    return process.env.BASE_URL || 'http://localhost:5173';
  }

  checkRateLimit(email, type = 'general') {
    const key = `${email}_${type}`;
    const now = Date.now();
    const maxAttempts = parseInt(process.env.EMAIL_RATE_LIMIT_MAX || '3');
    const windowMs = parseInt(process.env.EMAIL_RATE_LIMIT_WINDOW || '3600000');

    if (!this.rateLimitStore.has(key)) this.rateLimitStore.set(key, []);

    const attempts = this.rateLimitStore.get(key);
    const recent = attempts.filter(ts => now - ts < windowMs);

    if (recent.length >= maxAttempts) {
      const wait = Math.ceil((windowMs - (now - Math.min(...recent))) / 60000);
      return { allowed: false, waitMinutes: wait };
    }

    recent.push(now);
    this.rateLimitStore.set(key, recent);
    return { allowed: true };
  }

  // --- Template helper methods ---
getVerificationEmailTemplate(userName, link) {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verify Your Email</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
        <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f5f5f5;">
          <tr>
            <td align="center" style="padding: 40px 20px;">
              <table role="presentation" style="max-width: 600px; width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">

                <!-- Header -->
                <tr>
                  <td style="padding: 40px 40px 20px 40px; text-align: center; background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); border-radius: 8px 8px 0 0;">
                    <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">Verify Your Email</h1>
                  </td>
                </tr>

                <!-- Content -->
                <tr>
                  <td style="padding: 40px;">
                    <p style="margin: 0 0 20px 0; color: #374151; font-size: 16px; line-height: 1.6;">
                      Hi ${userName},
                    </p>
                    <p style="margin: 0 0 20px 0; color: #374151; font-size: 16px; line-height: 1.6;">
                      Thank you for registering with Smart Process Flow! To complete your registration and start using our automation services, please verify your email address by clicking the button below:
                    </p>

                    <!-- CTA Button -->
                    <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 30px 0;">
                      <tr>
                        <td align="center">
                          <a href="${link}" style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 6px rgba(59, 130, 246, 0.3);">
                            Verify Email Address
                          </a>
                        </td>
                      </tr>
                    </table>

                    <p style="margin: 20px 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                      Or copy and paste this link into your browser:
                    </p>
                    <p style="margin: 0 0 20px 0; color: #3b82f6; font-size: 14px; word-break: break-all;">
                      ${link}
                    </p>

                    <!-- Important Notice -->
                    <div style="margin: 30px 0; padding: 20px; background-color: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 4px;">
                      <p style="margin: 0; color: #92400e; font-size: 14px; line-height: 1.6;">
                        <strong>⏰ Important:</strong> This verification link will expire in 24 hours. If you don't verify your email within this time, you'll need to request a new verification email.
                      </p>
                    </div>

                    <p style="margin: 20px 0 0 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                      If you didn't create an account with Smart Process Flow, you can safely ignore this email.
                    </p>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="padding: 30px 40px; background-color: #f9fafb; border-radius: 0 0 8px 8px; border-top: 1px solid #e5e7eb;">
                    <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 12px; line-height: 1.5; text-align: center;">
                      This email was sent by Smart Process Flow
                    </p>
                    <p style="margin: 0; color: #9ca3af; font-size: 12px; line-height: 1.5; text-align: center;">
                      If you have any questions, please contact our support team.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    const text = `
Hi ${userName},

Thank you for registering with Smart Process Flow!

To complete your registration, please verify your email address by clicking the link below:
${link}

This verification link will expire in 24 hours.

If you didn't create an account with Smart Process Flow, you can safely ignore this email.

Best regards,
Smart Process Flow Team
    `;

    return { html, text };
  }

  getPasswordResetEmailTemplate(userName, link) {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reset Your Password</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
        <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f5f5f5;">
          <tr>
            <td align="center" style="padding: 40px 20px;">
              <table role="presentation" style="max-width: 600px; width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">

                <!-- Header -->
                <tr>
                  <td style="padding: 40px 40px 20px 40px; text-align: center; background: linear-gradient(135deg, #dc2626 0%, #f59e0b 100%); border-radius: 8px 8px 0 0;">
                    <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">Reset Your Password</h1>
                  </td>
                </tr>

                <!-- Content -->
                <tr>
                  <td style="padding: 40px;">
                    <p style="margin: 0 0 20px 0; color: #374151; font-size: 16px; line-height: 1.6;">
                      Hi ${userName},
                    </p>
                    <p style="margin: 0 0 20px 0; color: #374151; font-size: 16px; line-height: 1.6;">
                      We received a request to reset your password for your Smart Process Flow account. Click the button below to create a new password:
                    </p>

                    <!-- CTA Button -->
                    <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 30px 0;">
                      <tr>
                        <td align="center">
                          <a href="${link}" style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #dc2626 0%, #f59e0b 100%); color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 6px rgba(220, 38, 38, 0.3);">
                            Reset Password
                          </a>
                        </td>
                      </tr>
                    </table>

                    <p style="margin: 20px 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                      Or copy and paste this link into your browser:
                    </p>
                    <p style="margin: 0 0 20px 0; color: #dc2626; font-size: 14px; word-break: break-all;">
                      ${link}
                    </p>

                    <!-- Security Warning -->
                    <div style="margin: 30px 0; padding: 20px; background-color: #fee2e2; border-left: 4px solid #dc2626; border-radius: 4px;">
                      <p style="margin: 0 0 10px 0; color: #7f1d1d; font-size: 14px; line-height: 1.6;">
                        <strong>🔒 Security Notice:</strong>
                      </p>
                      <p style="margin: 0; color: #991b1b; font-size: 14px; line-height: 1.6;">
                        This password reset link will expire in 1 hour for security reasons. If you don't reset your password within this time, you'll need to request a new reset link.
                      </p>
                    </div>

                    <p style="margin: 20px 0 0 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                      <strong>If you didn't request a password reset,</strong> please ignore this email. Your password will remain unchanged, and your account is secure.
                    </p>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="padding: 30px 40px; background-color: #f9fafb; border-radius: 0 0 8px 8px; border-top: 1px solid #e5e7eb;">
                    <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 12px; line-height: 1.5; text-align: center;">
                      This email was sent by Smart Process Flow
                    </p>
                    <p style="margin: 0; color: #9ca3af; font-size: 12px; line-height: 1.5; text-align: center;">
                      If you have any questions, please contact our support team.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    const text = `
Hi ${userName},

We received a request to reset your password for your Smart Process Flow account.

To reset your password, click the link below:
${link}

This password reset link will expire in 1 hour for security reasons.

If you didn't request a password reset, please ignore this email. Your password will remain unchanged.

Best regards,
Smart Process Flow Team
    `;

    return { html, text };
  }

  getWelcomeEmailTemplate(userName) {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to Smart Process Flow</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
        <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f5f5f5;">
          <tr>
            <td align="center" style="padding: 40px 20px;">
              <table role="presentation" style="max-width: 600px; width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">

                <!-- Header -->
                <tr>
                  <td style="padding: 40px 40px 20px 40px; text-align: center; background: linear-gradient(135deg, #059669 0%, #10b981 100%); border-radius: 8px 8px 0 0;">
                    <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">Welcome to Smart Process Flow!</h1>
                  </td>
                </tr>

                <!-- Content -->
                <tr>
                  <td style="padding: 40px;">
                    <p style="margin: 0 0 20px 0; color: #374151; font-size: 16px; line-height: 1.6;">
                      Hi ${userName},
                    </p>
                    <p style="margin: 0 0 20px 0; color: #374151; font-size: 16px; line-height: 1.6;">
                      Thank you for verifying your email! Your account is now active and you can start using our automation services.
                    </p>

                    <div style="margin: 30px 0; padding: 20px; background-color: #d1fae5; border-left: 4px solid #10b981; border-radius: 4px;">
                      <p style="margin: 0 0 10px 0; color: #065f46; font-size: 16px; font-weight: 600;">
                        Your Trial Credits: 100 credits
                      </p>
                      <p style="margin: 0; color: #047857; font-size: 14px; line-height: 1.6;">
                        Start exploring our services with your free trial credits!
                      </p>
                    </div>

                    <p style="margin: 20px 0 10px 0; color: #374151; font-size: 16px; font-weight: 600;">
                      What's Next?
                    </p>
                    <ul style="margin: 10px 0 20px 20px; padding: 0; color: #6b7280; font-size: 14px; line-height: 1.8;">
                      <li>Explore our automation services</li>
                      <li>Upload your first document</li>
                      <li>Check out our tutorials and guides</li>
                      <li>Contact support if you need any help</li>
                    </ul>

                    <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 30px 0;">
                      <tr>
                        <td align="center">
                          <a href="${this.getBaseUrl()}/dashboard" style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #059669 0%, #10b981 100%); color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 6px rgba(5, 150, 105, 0.3);">
                            Go to Dashboard
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="padding: 30px 40px; background-color: #f9fafb; border-radius: 0 0 8px 8px; border-top: 1px solid #e5e7eb;">
                    <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 12px; line-height: 1.5; text-align: center;">
                      This email was sent by Smart Process Flow
                    </p>
                    <p style="margin: 0; color: #9ca3af; font-size: 12px; line-height: 1.5; text-align: center;">
                      If you have any questions, please contact our support team.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    const text = `
Hi ${userName},

Thank you for verifying your email! Your account is now active and you can start using our automation services.

Your Trial Credits: 100 credits

Start exploring our services with your free trial credits!

Visit your dashboard: ${this.getBaseUrl()}/dashboard

Best regards,
Smart Process Flow Team
    `;

    return { html, text };
  }

  getPasswordChangeConfirmationTemplate(userName) {
   const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Changed Successfully</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
        <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f5f5f5;">
          <tr>
            <td align="center" style="padding: 40px 20px;">
              <table role="presentation" style="max-width: 600px; width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">

                <!-- Header -->
                <tr>
                  <td style="padding: 40px 40px 20px 40px; text-align: center; background: linear-gradient(135deg, #059669 0%, #10b981 100%); border-radius: 8px 8px 0 0;">
                    <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">Password Changed</h1>
                  </td>
                </tr>

                <!-- Content -->
                <tr>
                  <td style="padding: 40px;">
                    <p style="margin: 0 0 20px 0; color: #374151; font-size: 16px; line-height: 1.6;">
                      Hi ${userName},
                    </p>
                    <p style="margin: 0 0 20px 0; color: #374151; font-size: 16px; line-height: 1.6;">
                      This email confirms that your password was successfully changed.
                    </p>

                    <div style="margin: 30px 0; padding: 20px; background-color: #fee2e2; border-left: 4px solid #dc2626; border-radius: 4px;">
                      <p style="margin: 0 0 10px 0; color: #7f1d1d; font-size: 14px; line-height: 1.6;">
                        <strong>🔒 Security Alert:</strong>
                      </p>
                      <p style="margin: 0; color: #991b1b; font-size: 14px; line-height: 1.6;">
                        If you didn't make this change, please contact our support team immediately. Your account security is our top priority.
                      </p>
                    </div>

                    <p style="margin: 20px 0 0 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                      Time of change: ${new Date().toLocaleString()}
                    </p>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="padding: 30px 40px; background-color: #f9fafb; border-radius: 0 0 8px 8px; border-top: 1px solid #e5e7eb;">
                    <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 12px; line-height: 1.5; text-align: center;">
                      This email was sent by Smart Process Flow
                    </p>
                    <p style="margin: 0; color: #9ca3af; font-size: 12px; line-height: 1.5; text-align: center;">
                      If you have any questions, please contact our support team.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    const text = `
Hi ${userName},

This email confirms that your password was successfully changed.

If you didn't make this change, please contact our support team immediately.

Time of change: ${new Date().toLocaleString()}

Best regards,
Smart Process Flow Team
    `;

    return { html, text };
  }
//--sending email
  async sendEmail(to, subject, { html, text }) {
    if (!this.clientId || !this.clientSecret || !this.refreshToken || !this.accountId) {
      console.error('❌ Zoho Mail API not configured. Cannot send email.');
      return { success: false, error: 'Zoho Mail API not configured' };
    }

    if (!this.accessToken) {
      try {
        await this.refreshAccessToken();
      } catch (error) {
        return { success: false, error: 'Failed to obtain access token' };
      }
    }

    const payload = {
      fromAddress: this.fromAddress,
      toAddress: to,
      subject,
      content: html || text,
      mailFormat: html ? 'html' : 'plaintext',
      askReceipt: 'no',
    };

    try {
      const response = await axios.post(
        `${this.baseUrl}/accounts/${this.accountId}/messages`,
        payload,
        {
          headers: {
            Authorization: `Zoho-oauthtoken ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      console.log('✅ Email sent successfully:', response.data.status?.description || 'Success');
      return { success: true, data: response.data };
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('🔄 Access token expired, refreshing and retrying...');
        try {
          await this.refreshAccessToken();

          const retryResponse = await axios.post(
            `${this.baseUrl}/accounts/${this.accountId}/messages`,
            payload,
            {
              headers: {
                Authorization: `Zoho-oauthtoken ${this.accessToken}`,
                'Content-Type': 'application/json',
              },
            }
          );

          console.log('✅ Email sent successfully after token refresh:', retryResponse.data.status?.description || 'Success');
          return { success: true, data: retryResponse.data };
        } catch (retryError) {
          console.error('❌ Failed to send email after token refresh:', retryError.response?.data || retryError.message);
          return { success: false, error: retryError.response?.data || retryError.message };
        }
      }

      console.error('❌ Failed to send email:', error.response?.data || error.message);
      return { success: false, error: error.response?.data || error.message };
    }
  }

  // --- Sending shortcuts ---
  async sendVerificationEmail(email, userName, token) {
    const check = this.checkRateLimit(email, 'verify');
    if (!check.allowed) {
      return {
        success: false,
        error: `Rate limit exceeded. Please try again in ${check.waitMinutes} minutes.`
      };
    }

    const link = `${this.getBaseUrl()}/verify-email?token=${token}`;
    const template = this.getVerificationEmailTemplate(userName, link);

    return await this.sendEmail(
      email,
      'Verify Your Email - Smart Process Flow',
      template
    );
  
  }

  async sendPasswordResetEmail(email, userName, token) {
    const check = this.checkRateLimit(email, 'reset');
    if (!check.allowed) {
      return {
        success: false,
        error: `Rate limit exceeded. Please try again in ${check.waitMinutes} minutes.`
      };
    }

    const link = `${this.getBaseUrl()}/reset-password?token=${token}`;
    const template = this.getPasswordResetEmailTemplate(userName, link);

    return await this.sendEmail(
      email,
      'Reset Your Password - Smart Process Flow',
      template
    );
  
  }

  async sendWelcomeEmail(email, userName) {
    const template = this.getWelcomeEmailTemplate(userName);

		return await this.sendEmail(
		  email,
		  'Welcome to Smart Process Flow!',
		  template
		);
	}

  async sendPasswordChangeConfirmation(email, userName) {
    const template = this.getPasswordChangeConfirmationTemplate(userName);

    return await this.sendEmail(
      email,
      'Password Changed - Smart Process Flow',
      template
    );
  }

  getContactFormNotificationTemplate(formData) {
    const { name, email, company, subject, message, submittedAt } = formData;
    const formattedDate = new Date(submittedAt).toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short'
    });

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New Contact Form Submission</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
        <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f5f5f5;">
          <tr>
            <td align="center" style="padding: 40px 20px;">
              <table role="presentation" style="max-width: 600px; width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">

                <!-- Header -->
                <tr>
                  <td style="padding: 40px 40px 20px 40px; text-align: center; background: linear-gradient(135deg, #2563eb 0%, #7c3aed 100%); border-radius: 8px 8px 0 0;">
                    <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">New Contact Form Submission</h1>
                  </td>
                </tr>

                <!-- Content -->
                <tr>
                  <td style="padding: 40px;">
                    <p style="margin: 0 0 20px 0; color: #374151; font-size: 16px; line-height: 1.6;">
                      You have received a new contact form submission from your website.
                    </p>

                    <!-- Contact Details -->
                    <div style="margin: 30px 0; padding: 20px; background-color: #f9fafb; border-radius: 6px; border-left: 4px solid #2563eb;">
                      <table role="presentation" style="width: 100%; border-collapse: collapse;">
                        <tr>
                          <td style="padding: 8px 0;">
                            <strong style="color: #1f2937; font-size: 14px;">Name:</strong>
                          </td>
                          <td style="padding: 8px 0;">
                            <span style="color: #4b5563; font-size: 14px;">${name}</span>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding: 8px 0;">
                            <strong style="color: #1f2937; font-size: 14px;">Email:</strong>
                          </td>
                          <td style="padding: 8px 0;">
                            <a href="mailto:${email}" style="color: #2563eb; font-size: 14px; text-decoration: none;">${email}</a>
                          </td>
                        </tr>
                        ${company ? `
                        <tr>
                          <td style="padding: 8px 0;">
                            <strong style="color: #1f2937; font-size: 14px;">Company:</strong>
                          </td>
                          <td style="padding: 8px 0;">
                            <span style="color: #4b5563; font-size: 14px;">${company}</span>
                          </td>
                        </tr>
                        ` : ''}
                        <tr>
                          <td style="padding: 8px 0;">
                            <strong style="color: #1f2937; font-size: 14px;">Subject:</strong>
                          </td>
                          <td style="padding: 8px 0;">
                            <span style="color: #4b5563; font-size: 14px;">${subject}</span>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding: 8px 0;">
                            <strong style="color: #1f2937; font-size: 14px;">Submitted:</strong>
                          </td>
                          <td style="padding: 8px 0;">
                            <span style="color: #4b5563; font-size: 14px;">${formattedDate}</span>
                          </td>
                        </tr>
                      </table>
                    </div>

                    <!-- Message -->
                    <div style="margin: 30px 0;">
                      <p style="margin: 0 0 10px 0; color: #1f2937; font-size: 16px; font-weight: 600;">
                        Message:
                      </p>
                      <div style="padding: 20px; background-color: #f9fafb; border-radius: 6px; border: 1px solid #e5e7eb;">
                        <p style="margin: 0; color: #374151; font-size: 14px; line-height: 1.6; white-space: pre-wrap;">${message}</p>
                      </div>
                    </div>

                    <!-- Reply Button -->
                    <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 30px 0;">
                      <tr>
                        <td align="center">
                          <a href="mailto:${email}?subject=Re: ${encodeURIComponent(subject)}" style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #2563eb 0%, #7c3aed 100%); color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 6px rgba(37, 99, 235, 0.3);">
                            Reply to ${name}
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="padding: 30px 40px; background-color: #f9fafb; border-radius: 0 0 8px 8px; border-top: 1px solid #e5e7eb;">
                    <p style="margin: 0; color: #6b7280; font-size: 12px; line-height: 1.5; text-align: center;">
                      This is an automated notification from your Smart Process Flow contact form.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    const text = `
New Contact Form Submission

Name: ${name}
Email: ${email}
${company ? `Company: ${company}\n` : ''}Subject: ${subject}
Submitted: ${formattedDate}

Message:
${message}

---
Reply to this inquiry: mailto:${email}
    `;

    return { html, text };
  }

  async sendContactFormNotification(formData) {
    try {
      const template = this.getContactFormNotificationTemplate(formData);

      return await this.sendEmail(
        'support@smartprocessflow.com',
        `New Contact: ${formData.subject}`,
        template
      );
    } catch (error) {
      console.error('❌ Failed to send contact form notification:', error);
      return { success: false, error: error.message };
    }
  }
}

const emailService = new EmailService();
module.exports = emailService;
