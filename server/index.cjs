require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');
const { initDatabase, DatabaseService } = require('./database.cjs');
const BulkUploadService = require('./bulkUploadService.cjs');
const JobQueue = require('./services/jobQueue.cjs');
const emailService = require('./emailService.cjs');
const { RexSooService, setPool } = require('./rexSooService.cjs');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  }
});

const upload = multer({ storage });

initDatabase().catch(console.error);

app.get('/ads.txt', (req, res) => {
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=86400');

  const adsContent = `google.com, pub-4617878161064725, DIRECT, f08c47fec0942fa0`;

  res.send(adsContent);
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    const user = await DatabaseService.authenticateUser(email, password);

    res.json({
      success: true,
      message: 'Login successful',
      user
    });
  } catch (error) {
    console.error('Login error:', error);

    if (error.code === 'EMAIL_NOT_VERIFIED') {
      return res.status(403).json({
        success: false,
        message: error.message,
        code: 'EMAIL_NOT_VERIFIED',
        email: error.email
      });
    }

    res.status(401).json({
      success: false,
      message: error.message || 'Invalid email or password'
    });
  }
});

app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, name, company, mobile } = req.body;

    if (!email || !password || !name || !company || !mobile) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }

    const user = await DatabaseService.createUser(email, password, name, company, mobile);

    const verificationToken = emailService.generateToken();
    await DatabaseService.setVerificationToken(user.id, verificationToken, 24);

    const emailResult = await emailService.sendVerificationEmail(email, name, verificationToken);

    if (!emailResult.success) {
      console.warn('⚠️  Failed to send verification email:', emailResult.error);
    }

    res.json({
      success: true,
      message: 'Account created successfully. Please check your email to verify your account before logging in.',
      requiresVerification: true,
      emailSent: emailResult.success
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Registration failed'
    });
  }
});

app.post('/api/auth/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    const user = await DatabaseService.getUserByEmail(email);

    if (user) {
      const resetToken = emailService.generateToken();
      await DatabaseService.setPasswordResetToken(user.id, resetToken, 1);

      const emailResult = await emailService.sendPasswordResetEmail(email, user.name, resetToken);

      if (!emailResult.success) {
        console.warn('⚠️  Failed to send password reset email:', emailResult.error);
      }
    }

    res.json({
      success: true,
      message: 'If an account exists with this email, password reset instructions have been sent.'
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.json({
      success: true,
      message: 'If an account exists with this email, password reset instructions have been sent.'
    });
  }
});

app.post('/api/auth/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Token and new password are required'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long'
      });
    }

    const user = await DatabaseService.resetPasswordWithToken(token, newPassword);

    await emailService.sendPasswordChangeConfirmation(user.email, user.name);

    res.json({
      success: true,
      message: 'Password reset successfully. You can now login with your new password.'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to reset password'
    });
  }
});

app.post('/api/auth/verify-email', async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Verification token is required'
      });
    }

    const user = await DatabaseService.verifyEmailToken(token);

    await emailService.sendWelcomeEmail(user.email, user.name);

    res.json({
      success: true,
      message: 'Email verified successfully! You can now login to your account.',
      user: {
        email: user.email,
        name: user.name
      }
    });
  } catch (error) {
    console.error('Email verification error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to verify email'
    });
  }
});

app.post('/api/auth/resend-verification', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    const user = await DatabaseService.getUserByEmail(email);

    if (!user) {
      return res.json({
        success: true,
        message: 'If an account exists with this email, a verification email has been sent.'
      });
    }

    if (user.email_verified) {
      return res.status(400).json({
        success: false,
        message: 'Email is already verified. You can login to your account.'
      });
    }

    const verificationToken = emailService.generateToken();
    await DatabaseService.setVerificationToken(user.id, verificationToken, 24);

    const emailResult = await emailService.sendVerificationEmail(email, user.name, verificationToken);

    if (!emailResult.success) {
      return res.status(500).json({
        success: false,
        message: emailResult.error || 'Failed to send verification email'
      });
    }

    res.json({
      success: true,
      message: 'Verification email sent successfully. Please check your inbox.'
    });
  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to resend verification email'
    });
  }
});

app.post('/api/contact', async (req, res) => {
  try {
    const { name, email, company, subject, message } = req.body;

    if (!name || !email || !subject || !message) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, subject, and message are required'
      });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address'
      });
    }

    const rateLimit = await DatabaseService.checkContactFormRateLimit(email);

    if (!rateLimit.allowed) {
      return res.status(429).json({
        success: false,
        message: 'You have reached the maximum number of submissions. Please try again in one hour.',
        remainingSubmissions: 0
      });
    }

    const ipAddress = req.ip || req.connection.remoteAddress;

    const contactMessage = await DatabaseService.createContactMessage({
      name,
      email,
      company: company || null,
      subject,
      message,
      ipAddress
    });

    const emailResult = await emailService.sendContactFormNotification({
      name,
      email,
      company,
      subject,
      message,
      submittedAt: contactMessage.submitted_at
    });

    if (!emailResult.success) {
      console.error('Failed to send contact form notification email:', emailResult.error);
    }

    res.json({
      success: true,
      message: 'Your message has been sent successfully. We will get back to you soon!',
      remainingSubmissions: rateLimit.remaining - 1
    });
  } catch (error) {
    console.error('Contact form submission error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit your message. Please try again later.'
    });
  }
});

app.get('/api/contact-messages', async (req, res) => {
  try {
    const { limit = 50, offset = 0, status, search } = req.query;

    const result = await DatabaseService.getContactMessages({
      limit: parseInt(limit),
      offset: parseInt(offset),
      status: status || null,
      search: search || null
    });

    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('Get contact messages error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch contact messages'
    });
  }
});

app.patch('/api/contact-messages/:messageId/status', async (req, res) => {
  try {
    const { messageId } = req.params;
    const { status } = req.body;

    if (!status || !['new', 'read', 'resolved'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be: new, read, or resolved'
      });
    }

    const result = await DatabaseService.updateContactMessageStatus(messageId, status);

    res.json({
      success: true,
      message: result
    });
  } catch (error) {
    console.error('Update contact message status error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update message status'
    });
  }
});

app.get('/api/users', async (req, res) => {
  try {
    const users = await DatabaseService.getAllUsers();
    res.json({
      success: true,
      users
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users'
    });
  }
});

app.get('/api/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const user = await DatabaseService.getUserById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      user
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user'
    });
  }
});

app.put('/api/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const rawUpdates = req.body;

    const validFields = ['credits', 'is_admin', 'status', 'name', 'company', 'mobile', 'totalSpent', 'lastActivity'];
    const updates = Object.keys(rawUpdates)
      .filter(key => validFields.includes(key))
      .reduce((obj, key) => {
        obj[key] = rawUpdates[key];
        return obj;
      }, {});

    if (Object.keys(updates).length === 0) {
      const user = await DatabaseService.getUserById(id);
      return res.json({
        success: true,
        message: 'No valid fields to update',
        user
      });
    }

    const user = await DatabaseService.updateUser(id, updates);

    res.json({
      success: true,
      message: 'User updated successfully',
      user
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update user'
    });
  }
});

app.delete('/api/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await DatabaseService.deleteUser(id);

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete user'
    });
  }
});

app.post('/api/users/:userId/credits', async (req, res) => {
  try {
    const { userId } = req.params;
    const { credits, operation } = req.body;

    if (!credits || !operation) {
      return res.status(400).json({
        success: false,
        message: 'Credits and operation are required'
      });
    }

    const result = await DatabaseService.updateCredits(userId, credits, operation);

    res.json({
      success: true,
      message: 'Credits updated successfully',
      newCredits: result.newCredits,
      oldCredits: result.oldCredits
    });
  } catch (error) {
    console.error('Update credits error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update credits'
    });
  }
});

app.get('/api/settings', async (req, res) => {
  try {
    const settings = await DatabaseService.getSystemSettings();
    res.json({
      success: true,
      settings
    });
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch settings'
    });
  }
});

app.get('/api/system-settings', async (req, res) => {
  try {
    const settings = await DatabaseService.getSystemSettings();
    res.json({
      success: true,
      settings
    });
  } catch (error) {
    console.error('Get system settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch system settings'
    });
  }
});

app.put('/api/settings', async (req, res) => {
  try {
    const settings = req.body;
    const updatedSettings = await DatabaseService.updateSystemSettings(settings);

    res.json({
      success: true,
      message: 'Settings updated successfully',
      settings: updatedSettings
    });
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update settings'
    });
  }
});

app.get('/api/work-history/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const limit = parseInt(req.query.limit) || 3;
    const page = parseInt(req.query.page) || 1;
    const offset = (page - 1) * limit;

    const result = await DatabaseService.getWorkHistory(userId, {
      limit,
      offset,
      sortBy: req.query.sortBy || 'created_at',
      sortOrder: req.query.sortOrder || 'DESC'
    });

    console.log(`📋 Fetching work history for user ${userId}:`, {
      page,
      limit,
      totalCount: result.totalCount,
      withDownloadUrl: result.workHistory.filter(w => w.downloadUrl).length,
      sample: result.workHistory[0] ? {
        id: result.workHistory[0].id,
        status: result.workHistory[0].status,
        creditsUsed: result.workHistory[0].creditsUsed,
        filesGeneratedCount: result.workHistory[0].filesGeneratedCount,
        downloadUrl: result.workHistory[0].downloadUrl
      } : null
    });

    res.json({
      success: true,
      workHistory: result.workHistory,
      pagination: {
        totalCount: result.totalCount,
        currentPage: result.currentPage,
        totalPages: result.totalPages,
        limit: result.limit,
        hasMore: result.hasMore
      }
    });
  } catch (error) {
    console.error('Get work history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch work history'
    });
  }
});

app.post('/api/work-history', async (req, res) => {
  try {
    const { userId, ...workItem } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    const workHistory = await DatabaseService.addWorkHistory(userId, workItem);

    res.json({
      success: true,
      message: 'Work history added successfully',
      workHistory
    });
  } catch (error) {
    console.error('Add work history error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to add work history'
    });
  }
});

app.put('/api/work-history/:workId/files', async (req, res) => {
  try {
    const { workId } = req.params;
    const { resultFiles } = req.body;

    if (!resultFiles) {
      return res.status(400).json({
        success: false,
        message: 'Result files are required'
      });
    }

    const workHistory = await DatabaseService.updateWorkHistoryFiles(workId, resultFiles);

    res.json({
      success: true,
      message: 'Work history files updated successfully',
      workHistory
    });
  } catch (error) {
    console.error('Update work history files error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update work history files'
    });
  }
});

app.get('/api/blog', async (req, res) => {
  try {
    const posts = await DatabaseService.getBlogPosts();
    res.json({
      success: true,
      posts
    });
  } catch (error) {
    console.error('Get blog posts error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch blog posts'
    });
  }
});

app.get('/api/blog/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const posts = await DatabaseService.getBlogPosts();
    const post = posts.find(p => p.id === id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Blog post not found'
      });
    }

    res.json({
      success: true,
      post
    });
  } catch (error) {
    console.error('Get blog post error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch blog post'
    });
  }
});

app.post('/api/blog', async (req, res) => {
  try {
    const postData = req.body;
    const post = await DatabaseService.addBlogPost(postData);

    res.json({
      success: true,
      message: 'Blog post created successfully',
      post
    });
  } catch (error) {
    console.error('Add blog post error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create blog post'
    });
  }
});

app.put('/api/blog/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const post = await DatabaseService.updateBlogPost(id, updates);

    res.json({
      success: true,
      message: 'Blog post updated successfully',
      post
    });
  } catch (error) {
    console.error('Update blog post error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update blog post'
    });
  }
});

app.delete('/api/blog/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await DatabaseService.deleteBlogPost(id);

    res.json({
      success: true,
      message: 'Blog post deleted successfully'
    });
  } catch (error) {
    console.error('Delete blog post error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete blog post'
    });
  }
});

app.post('/api/credentials/save', async (req, res) => {
  try {
    const { userId, portalName, username, password } = req.body;

    if (!userId || !portalName || !username || !password) {
      return res.status(400).json({
        success: false,
        message: 'User ID, portal name, username, and password are required'
      });
    }

    const result = await DatabaseService.savePortalCredentials(userId, portalName, username, password);

    res.json({
      success: true,
      message: 'Credentials saved successfully',
      data: {
        id: result.id,
        portalName: result.portal_name,
        username: result.username
      }
    });
  } catch (error) {
    console.error('Save credentials error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to save credentials'
    });
  }
});

app.get('/api/credentials/:portalName', async (req, res) => {
  try {
    const { portalName } = req.params;
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    const credentials = await DatabaseService.getPortalCredentials(userId, portalName);

    if (!credentials) {
      return res.status(404).json({
        success: false,
        message: 'Credentials not found'
      });
    }

    res.json({
      success: true,
      data: {
        portalName: credentials.portal_name,
        username: credentials.username,
        password: credentials.password
      }
    });
  } catch (error) {
    console.error('Get credentials error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to retrieve credentials'
    });
  }
});

app.get('/api/credentials/check/:portalName', async (req, res) => {
  try {
    const { portalName } = req.params;
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    const exists = await DatabaseService.hasPortalCredentials(userId, portalName);

    res.json({
      success: true,
      exists,
      portalName
    });
  } catch (error) {
    console.error('Check credentials error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to check credentials'
    });
  }
});

app.delete('/api/credentials/:portalName', async (req, res) => {
  try {
    const { portalName } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    const deleted = await DatabaseService.deletePortalCredentials(userId, portalName);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Credentials not found'
      });
    }

    res.json({
      success: true,
      message: 'Credentials deleted successfully'
    });
  } catch (error) {
    console.error('Delete credentials error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete credentials'
    });
  }
});

app.get('/api/credentials/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const credentials = await DatabaseService.getUserPortalCredentials(userId);

    res.json({
      success: true,
      data: credentials
    });
  } catch (error) {
    console.error('Get user credentials error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to retrieve user credentials'
    });
  }
});

app.post('/api/credentials/test', async (req, res) => {
  try {
    const { userId, portalName } = req.body;

    if (!userId || !portalName) {
      return res.status(400).json({
        success: false,
        message: 'User ID and portal name are required'
      });
    }

    const credentials = await DatabaseService.getPortalCredentials(userId, portalName);

    if (!credentials) {
      return res.status(404).json({
        success: false,
        message: 'Credentials not found for this portal'
      });
    }

    const { spawn } = require('child_process');
    const path = require('path');

    const scriptPath = path.join(__dirname, '..', 'automation_scripts', 'bb_exp_search.py');
    const tempDir = path.join(__dirname, '..', 'temp_test');
    const fs = require('fs');

    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const testCsvPath = path.join(tempDir, 'test.csv');
    fs.writeFileSync(testCsvPath, 'ADSCODE2,EXP_SERIAL2,EXP_YEAR2\n');

    const pythonProcess = spawn('python3', [
      scriptPath,
      testCsvPath,
      tempDir,
      'test',
      credentials.username,
      credentials.password,
      '--test-only'
    ], { timeout: 60000 });

    let output = '';
    let errorOutput = '';

    pythonProcess.stdout.on('data', (data) => {
      output += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    pythonProcess.on('close', async (code) => {
      try {
        fs.rmSync(tempDir, { recursive: true, force: true });
      } catch (e) {
        console.error('Failed to clean up test directory:', e);
      }

      const success = code === 0;

      await DatabaseService.updateCredentialTestResult(userId, portalName, success);

      if (success) {
        res.json({
          success: true,
          message: 'Credentials are valid and working',
          testResult: {
            valid: true,
            testedAt: new Date().toISOString()
          }
        });
      } else {
        let errorMessage = 'Invalid credentials';
        if (code === 2) {
          errorMessage = 'Invalid username or password';
        } else if (errorOutput.includes('CONNECTION')) {
          errorMessage = 'Connection error - please check your internet connection';
        } else if (errorOutput.includes('timeout')) {
          errorMessage = 'Connection timeout - portal may be slow or unreachable';
        }

        res.json({
          success: false,
          message: errorMessage,
          testResult: {
            valid: false,
            errorCode: code,
            errorMessage
          }
        });
      }
    });

    pythonProcess.on('error', (error) => {
      console.error('Test credentials process error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to test credentials',
        error: error.message
      });
    });

  } catch (error) {
    console.error('Test credentials error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to test credentials'
    });
  }
});

app.get('/api/notifications/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit, unreadOnly } = req.query;

    const notifications = await DatabaseService.getUserNotifications(
      userId,
      limit ? parseInt(limit) : 50,
      unreadOnly === 'true'
    );

    res.json({
      success: true,
      data: notifications
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to retrieve notifications'
    });
  }
});

app.get('/api/notifications/:userId/unread-count', async (req, res) => {
  try {
    const { userId } = req.params;

    const count = await DatabaseService.getUnreadNotificationCount(userId);

    res.json({
      success: true,
      count
    });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get unread count'
    });
  }
});

app.put('/api/notifications/:notificationId/read', async (req, res) => {
  try {
    const { notificationId } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    const notification = await DatabaseService.markNotificationAsRead(notificationId, userId);

    res.json({
      success: true,
      data: notification
    });
  } catch (error) {
    console.error('Mark notification as read error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to mark notification as read'
    });
  }
});

app.put('/api/notifications/:userId/read-all', async (req, res) => {
  try {
    const { userId } = req.params;

    await DatabaseService.markAllNotificationsAsRead(userId);

    res.json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (error) {
    console.error('Mark all notifications as read error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to mark all notifications as read'
    });
  }
});

app.delete('/api/notifications/:notificationId', async (req, res) => {
  try {
    const { notificationId } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    const deleted = await DatabaseService.deleteNotification(notificationId, userId);

    if (deleted) {
      res.json({
        success: true,
        message: 'Notification deleted'
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete notification'
    });
  }
});

app.get('/api/notification-preferences/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const preferences = await DatabaseService.getUserNotificationPreferences(userId);

    res.json({
      success: true,
      data: preferences
    });
  } catch (error) {
    console.error('Get notification preferences error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get notification preferences'
    });
  }
});

app.put('/api/notification-preferences/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const preferences = req.body;

    const updated = await DatabaseService.updateNotificationPreferences(userId, preferences);

    res.json({
      success: true,
      data: updated
    });
  } catch (error) {
    console.error('Update notification preferences error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update notification preferences'
    });
  }
});

app.post('/api/process-automation', upload.single('file'), async (req, res) => {
  try {
    const { serviceId, userId, totalCredits } = req.body;
    const uploadedFile = req.file;

    console.log('=== Process Automation Request ===');
    console.log('Service ID:', serviceId);
    console.log('User ID:', userId);
    console.log('File:', uploadedFile?.originalname);
    console.log('Total Credits:', totalCredits);

    if (!uploadedFile) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    if (!serviceId) {
      return res.status(400).json({ success: false, message: 'Service ID is required' });
    }

    const serviceName = getServiceName(serviceId);
    const creditsUsed = totalCredits ? parseFloat(totalCredits) : getServiceCredits(serviceId);

    console.log('💳 Credits to deduct:', creditsUsed);

    const creditResult = await DatabaseService.deductCredits(userId, creditsUsed);
    console.log('✅ Credits deducted. New balance:', creditResult.newCredits);

    const result = await JobQueue.submitJob(
      userId,
      serviceId,
      uploadedFile,
      serviceName,
      creditsUsed
    );

    res.json({
      success: true,
      jobId: result.jobId,
      status: result.status,
      immediate: result.immediate,
      queuePosition: result.queuePosition,
      newCredits: creditResult.newCredits,
      message: result.immediate
        ? 'Job started immediately'
        : `Job queued at position ${result.queuePosition}`
    });

  } catch (error) {
    console.error('Automation error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post('/api/process-rex-submission', upload.fields([
  { name: 'csvFile', maxCount: 1 },
  { name: 'zipFile', maxCount: 1 }
]), async (req, res) => {
  try {
    const { userId, totalCredits } = req.body;
    const csvFile = req.files?.csvFile?.[0];
    const zipFile = req.files?.zipFile?.[0];

    console.log('=== REX SOO Submission Request ===');
    console.log('User ID:', userId);
    console.log('CSV File:', csvFile?.originalname);
    console.log('ZIP File:', zipFile?.originalname);
    console.log('Total Credits:', totalCredits);

    if (!csvFile) {
      return res.status(400).json({ success: false, message: 'CSV file is required' });
    }

    if (!zipFile) {
      return res.status(400).json({ success: false, message: 'ZIP file with PDFs is required' });
    }

    const serviceId = 'rex-soo-submission';
    const serviceName = 'REX/SOO Submission';
    const creditsUsed = totalCredits ? parseFloat(totalCredits) : 10;

    console.log('💳 Credits to deduct:', creditsUsed);

    const creditResult = await DatabaseService.deductCredits(userId, creditsUsed);
    console.log('✅ Credits deducted. New balance:', creditResult.newCredits);

    const result = await JobQueue.submitJob(
      userId,
      serviceId,
      csvFile,
      serviceName,
      creditsUsed,
      { zipFile }
    );

    res.json({
      success: true,
      jobId: result.jobId,
      status: result.status,
      immediate: result.immediate,
      queuePosition: result.queuePosition,
      newCredits: creditResult.newCredits,
      message: result.immediate
        ? 'REX submission job started immediately'
        : `REX submission job queued at position ${result.queuePosition}`
    });

  } catch (error) {
    console.error('REX submission error:', error);

    if (error.message.includes('deduct credits')) {
      try {
        const user = await DatabaseService.getUserById(req.body.userId);
        return res.status(400).json({
          success: false,
          message: 'Insufficient credits',
          currentCredits: user?.credits || 0
        });
      } catch (userError) {
        console.error('Error fetching user:', userError);
      }
    }

    res.status(500).json({ success: false, message: error.message });
  }
});

app.get('/api/download/:filename', (req, res) => {
  const { filename } = req.params;
  const filePath = path.join(__dirname, '../results', filename);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'File not found' });
  }

  res.download(filePath);
});

app.get('/api/download/pdf/:filename', (req, res) => {
  const { filename } = req.params;
  const filePath = path.join(__dirname, '../results/pdfs', filename);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'File not found or has expired' });
  }

  res.download(filePath);
});

app.get('/api/download/job/:jobId/:filename', async (req, res) => {
  try {
    const { jobId, filename } = req.params;
    const job = await DatabaseService.getJob(jobId);

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    const filePath = path.join(job.output_directory, filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found' });
    }

    res.download(filePath);
  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/jobs/:jobId/status', async (req, res) => {
  try {
    const { jobId } = req.params;
    const job = await DatabaseService.getJob(jobId);

    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }

    let queuePosition = null;
    if (job.status === 'queued') {
      queuePosition = await DatabaseService.getQueuePosition(jobId);
    }

    let progress = 0;
    if (job.status === 'processing') {
      if (job.started_at) {
        const elapsedSeconds = Math.floor((Date.now() - new Date(job.started_at).getTime()) / 1000);
        const estimatedDuration = 30;
        progress = Math.min(Math.floor((elapsedSeconds / estimatedDuration) * 100), 95);
      }
    } else if (job.status === 'completed') {
      progress = 100;
    }

    res.json({
      success: true,
      job: {
        id: job.id,
        status: job.status,
        queuePosition,
        progress,
        serviceName: job.service_name,
        fileName: job.input_file_name,
        resultFiles: job.result_files,
        downloadUrl: job.download_url,
        errorMessage: job.error_message,
        createdAt: job.created_at,
        startedAt: job.started_at,
        completedAt: job.completed_at
      }
    });
  } catch (error) {
    console.error('Job status error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

app.get('/api/jobs/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const jobs = await DatabaseService.getUserJobs(userId);

    res.json({
      success: true,
      jobs
    });
  } catch (error) {
    console.error('Get jobs error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

app.get('/api/queue/status', (req, res) => {
  try {
    const status = JobQueue.getStatus();
    res.json({
      success: true,
      status
    });
  } catch (error) {
    console.error('Queue status error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post('/api/track-container', async (req, res) => {
  try {
    const { trackingNumber, userId } = req.body;

    if (!trackingNumber) {
      return res.status(400).json({ success: false, message: 'Tracking number required' });
    }

    const tempFile = path.join(__dirname, '../uploads', `temp-${Date.now()}.csv`);
    fs.writeFileSync(tempFile, `FCR Number\n${trackingNumber}`);

    const scriptPath = path.join(__dirname, '..', 'automation_scripts/damco_tracking_maersk.py');
    const pythonProcess = spawn('python3', [scriptPath, tempFile]);

    let outputData = '';
    let errorData = '';

    pythonProcess.stdout.on('data', (data) => {
      outputData += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      errorData += data.toString();
    });

    pythonProcess.on('close', async (code) => {
      fs.unlinkSync(tempFile);

      if (code === 0) {
        const resultsDir = path.join(__dirname, '../results/pdfs');
        const resultFiles = fs.existsSync(resultsDir)
          ? fs.readdirSync(resultsDir).filter(f => f.includes(trackingNumber))
          : [];

        const downloadUrl = resultFiles.length > 0
          ? `/api/download/pdf/${resultFiles[0]}`
          : null;

        await DatabaseService.addWorkHistory(userId, {
          serviceId: 'damco-tracking-maersk',
          serviceName: 'Damco (APM) Tracking',
          fileName: trackingNumber,
          creditsUsed: 1,
          status: 'completed',
          resultFiles: resultFiles,
          downloadUrl
        });

        res.json({
          success: true,
          trackingData: {
            containerNumber: trackingNumber,
            bookingNumber: trackingNumber,
            vessel: 'Retrieved from Maersk',
            voyage: 'N/A',
            status: 'In Transit',
            location: 'Retrieved from tracking',
            estimatedArrival: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString(),
            events: []
          },
          downloadUrl
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Tracking failed',
          error: errorData
        });
      }
    });

  } catch (error) {
    console.error('Tracking error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Ads Settings API Endpoints
app.get('/api/ads/settings', async (req, res) => {
  try {
    const settings = await DatabaseService.getAdsSettings();
    res.json({
      success: true,
      settings
    });
  } catch (error) {
    console.error('Get ads settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch ads settings'
    });
  }
});

app.get('/api/ads/settings/:location', async (req, res) => {
  try {
    const { location } = req.params;
    const setting = await DatabaseService.getAdSettingByLocation(location);

    if (!setting) {
      return res.status(404).json({
        success: false,
        message: 'Ad setting not found'
      });
    }

    res.json({
      success: true,
      setting
    });
  } catch (error) {
    console.error('Get ad setting error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch ad setting'
    });
  }
});

app.put('/api/ads/settings/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Validate admin access (simple check - you can enhance this)
    const { userId } = req.body;
    if (userId) {
      const user = await DatabaseService.getUserById(userId);
      if (!user || !user.isAdmin) {
        return res.status(403).json({
          success: false,
          message: 'Admin access required'
        });
      }
    }

    await DatabaseService.updateAdSetting(id, updates);

    res.json({
      success: true,
      message: 'Ad setting updated successfully'
    });
  } catch (error) {
    console.error('Update ad setting error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update ad setting'
    });
  }
});

app.patch('/api/ads/toggle/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { enabled, userId } = req.body;

    // Validate admin access
    if (userId) {
      const user = await DatabaseService.getUserById(userId);
      if (!user || !user.isAdmin) {
        return res.status(403).json({
          success: false,
          message: 'Admin access required'
        });
      }
    }

    await DatabaseService.toggleAdSetting(id, enabled);

    res.json({
      success: true,
      message: `Ad ${enabled ? 'enabled' : 'disabled'} successfully`
    });
  } catch (error) {
    console.error('Toggle ad setting error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to toggle ad setting'
    });
  }
});

function getServiceName(serviceId) {
  const names = {
    'damco-tracking-maersk': 'Damco (APM) Tracking',
    'ctg-port-tracking': 'CTG Port Authority Tracking',
    'egm-download': 'EGM Download (Bill Tracking)',
    'pdf-excel-converter': 'PDF to Excel Converter',
    'exp-search': 'Search EXP Detail Information'
  };
  return names[serviceId] || serviceId;
}

function getServiceCredits(serviceId) {
  const credits = {
    'damco-tracking-maersk': 1,
    'ctg-port-tracking': 1,
    'egm-download': 1,
    'pdf-excel-converter': 1,
    'exp-search': 0.5
  };
  return credits[serviceId] || 1;
}

app.get('/api/templates', async (req, res) => {
  try {
    const templates = await DatabaseService.getServiceTemplates();
    res.json({
      success: true,
      templates
    });
  } catch (error) {
    console.error('Get templates error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch templates'
    });
  }
});

app.get('/api/templates/:serviceId', async (req, res) => {
  try {
    const { serviceId } = req.params;
    const template = await DatabaseService.getServiceTemplate(serviceId);

    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Template not found'
      });
    }

    res.json({
      success: true,
      template
    });
  } catch (error) {
    console.error('Get template error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch template'
    });
  }
});

app.get('/api/templates/:serviceId/download', (req, res) => {
  try {
    const { serviceId } = req.params;
    const filePath = path.join(__dirname, '../public/templates', `${serviceId}-template.csv`);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: 'Template file not found'
      });
    }

    res.download(filePath);
  } catch (error) {
    console.error('Download template error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to download template'
    });
  }
});

app.post('/api/bulk-upload', upload.single('file'), async (req, res) => {
  try {
    const { serviceId, userId } = req.body;
    const uploadedFile = req.file;

    if (!uploadedFile) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    if (!serviceId || !userId) {
      return res.status(400).json({
        success: false,
        message: 'Service ID and User ID are required'
      });
    }

    const template = await DatabaseService.getServiceTemplate(serviceId);
    if (!template) {
      return res.status(400).json({
        success: false,
        message: 'Invalid service ID'
      });
    }

    const rows = await BulkUploadService.parseUploadedFile(uploadedFile.path);

    if (!rows || rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'File is empty or invalid format'
      });
    }

    const bulkUpload = await DatabaseService.createBulkUpload(
      userId,
      serviceId,
      template.service_name,
      uploadedFile.originalname,
      rows.length
    );

    for (let i = 0; i < rows.length; i++) {
      await DatabaseService.createBulkUploadItem(
        bulkUpload.id,
        i + 1,
        rows[i]
      );
    }

    res.json({
      success: true,
      message: 'Bulk upload created successfully',
      bulkUpload: {
        id: bulkUpload.id,
        totalRows: rows.length,
        serviceName: template.service_name,
        fileName: uploadedFile.originalname
      }
    });

    setImmediate(() => {
      processBulkUploadAsync(bulkUpload.id, serviceId, userId, rows);
    });

  } catch (error) {
    console.error('Bulk upload error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Bulk upload failed'
    });
  }
});

async function processBulkUploadAsync(bulkUploadId, serviceId, userId, rows) {
  try {
    await DatabaseService.updateBulkUpload(bulkUploadId, { status: 'processing' });

    let successCount = 0;
    let failCount = 0;
    let totalCredits = 0;
    const resultFiles = [];

    const items = await DatabaseService.getBulkUploadItems(bulkUploadId);

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const rowData = typeof item.row_data === 'string' ? JSON.parse(item.row_data) : item.row_data;

      await DatabaseService.updateBulkUploadItem(item.id, { status: 'processing' });

      const result = await BulkUploadService.processRow(
        serviceId,
        rowData,
        item.row_number,
        userId,
        DatabaseService
      );

      if (result.success) {
        const template = await DatabaseService.getServiceTemplate(serviceId);
        const creditsUsed = template.credit_cost || 1;

        const workHistory = await DatabaseService.addWorkHistory(userId, {
          serviceId,
          serviceName: template.service_name,
          fileName: `Row ${item.row_number}`,
          creditsUsed,
          status: 'completed',
          resultFiles: result.resultFiles || [],
          downloadUrl: result.resultFiles && result.resultFiles[0]
            ? `/api/download/pdf/${result.resultFiles[0]}`
            : null,
          bulkUploadId: bulkUploadId,
          rowNumber: item.row_number
        });

        await DatabaseService.updateBulkUploadItem(item.id, {
          status: 'completed',
          workHistoryId: workHistory.id,
          creditsUsed,
          resultFilePath: result.resultFiles && result.resultFiles[0] || null,
          processedAt: new Date()
        });

        await DatabaseService.updateCredits(userId, creditsUsed, 'subtract');

        successCount++;
        totalCredits += creditsUsed;

        if (result.resultFiles && result.resultFiles.length > 0) {
          resultFiles.push(...result.resultFiles.map(f => ({
            path: path.join(__dirname, '../results/pdfs', f),
            name: f
          })));
        }
      } else {
        await DatabaseService.updateBulkUploadItem(item.id, {
          status: 'failed',
          errorMessage: result.error,
          creditsUsed: 0,
          processedAt: new Date()
        });
        failCount++;
      }

      await DatabaseService.updateBulkUpload(bulkUploadId, {
        processedRows: i + 1,
        successfulRows: successCount,
        failedRows: failCount,
        creditsUsed: totalCredits
      });
    }

    let zipPath = null;
    if (resultFiles.length > 0) {
      const zipFileName = `bulk_${bulkUploadId}_results.zip`;
      zipPath = path.join(__dirname, '../results', zipFileName);
      await BulkUploadService.createResultZip(resultFiles, zipPath);
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await DatabaseService.updateBulkUpload(bulkUploadId, {
      status: 'completed',
      successfulRows: successCount,
      failedRows: failCount,
      creditsUsed: totalCredits,
      resultZipPath: zipPath ? `results/${path.basename(zipPath)}` : null,
      expiresAt,
      completedAt: new Date()
    });

    console.log(`Bulk upload ${bulkUploadId} completed: ${successCount} success, ${failCount} failed`);

  } catch (error) {
    console.error(`Error processing bulk upload ${bulkUploadId}:`, error);
    await DatabaseService.updateBulkUpload(bulkUploadId, {
      status: 'failed',
      errorMessage: error.message
    });
  }
}

app.get('/api/bulk-uploads/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const bulkUploads = await DatabaseService.getBulkUploads(userId);

    const uploadsWithExpiration = bulkUploads.map(upload => {
      let progress = 0;
      if (upload.status === 'processing' && upload.total_rows > 0) {
        progress = Math.floor((upload.processed_rows / upload.total_rows) * 100);
      } else if (upload.status === 'completed') {
        progress = 100;
      }

      return {
        ...upload,
        progress,
        daysUntilExpiration: BulkUploadService.getDaysUntilExpiration(upload.expires_at),
        expirationStatus: BulkUploadService.getExpirationStatus(upload.expires_at)
      };
    });

    res.json({
      success: true,
      bulkUploads: uploadsWithExpiration
    });
  } catch (error) {
    console.error('Get bulk uploads error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch bulk uploads'
    });
  }
});

app.get('/api/bulk-uploads/:bulkUploadId/details', async (req, res) => {
  try {
    const { bulkUploadId } = req.params;
    const bulkUpload = await DatabaseService.getBulkUpload(bulkUploadId);

    if (!bulkUpload) {
      return res.status(404).json({
        success: false,
        message: 'Bulk upload not found'
      });
    }

    const items = await DatabaseService.getBulkUploadItems(bulkUploadId);

    res.json({
      success: true,
      bulkUpload: {
        ...bulkUpload,
        daysUntilExpiration: BulkUploadService.getDaysUntilExpiration(bulkUpload.expires_at),
        expirationStatus: BulkUploadService.getExpirationStatus(bulkUpload.expires_at)
      },
      items
    });
  } catch (error) {
    console.error('Get bulk upload details error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch bulk upload details'
    });
  }
});

app.get('/api/bulk-uploads/:bulkUploadId/download', async (req, res) => {
  try {
    const { bulkUploadId } = req.params;
    const bulkUpload = await DatabaseService.getBulkUpload(bulkUploadId);

    if (!bulkUpload) {
      return res.status(404).json({
        success: false,
        message: 'Bulk upload not found'
      });
    }

    if (!bulkUpload.result_zip_path) {
      return res.status(404).json({
        success: false,
        message: 'No results available for download'
      });
    }

    const zipPath = path.join(__dirname, '..', bulkUpload.result_zip_path);

    if (!fs.existsSync(zipPath)) {
      return res.status(404).json({
        success: false,
        message: 'Result file not found or has expired'
      });
    }

    res.download(zipPath);
  } catch (error) {
    console.error('Download bulk upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to download results'
    });
  }
});

app.post('/api/cleanup/run', async (req, res) => {
  try {
    const result = await BulkUploadService.cleanupExpiredFiles(DatabaseService);
    res.json({
      success: true,
      message: 'Cleanup completed successfully',
      result
    });
  } catch (error) {
    console.error('Cleanup error:', error);
    res.status(500).json({
      success: false,
      message: 'Cleanup failed',
      error: error.message
    });
  }
});

app.get('/api/cleanup/logs', async (req, res) => {
  try {
    const logs = await DatabaseService.getCleanupLogs(50);
    res.json({
      success: true,
      logs
    });
  } catch (error) {
    console.error('Get cleanup logs error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch cleanup logs'
    });
  }
});

app.post('/api/users/:userId/change-password', async (req, res) => {
  try {
    const { userId } = req.params;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long'
      });
    }

    const result = await DatabaseService.changeUserPassword(userId, currentPassword, newPassword);

    res.json({
      success: true,
      message: result.message
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to change password'
    });
  }
});

app.post('/api/transactions', async (req, res) => {
  try {
    const transactionData = req.body;

    if (!transactionData.userId || !transactionData.amountBdt || !transactionData.creditsAmount || !transactionData.paymentMethod || !transactionData.transactionId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required transaction fields'
      });
    }

    const transaction = await DatabaseService.createTransaction(transactionData);

    res.json({
      success: true,
      message: 'Transaction created successfully',
      transaction
    });
  } catch (error) {
    console.error('Create transaction error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create transaction'
    });
  }
});

app.get('/api/transactions/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const filters = {
      dateFrom: req.query.dateFrom,
      dateTo: req.query.dateTo,
      transactionType: req.query.transactionType,
      paymentStatus: req.query.paymentStatus
    };
    const pagination = {
      limit: parseInt(req.query.limit) || 10,
      offset: parseInt(req.query.offset) || 0,
      sortBy: req.query.sortBy || 'created_at',
      sortOrder: req.query.sortOrder || 'DESC'
    };

    const result = await DatabaseService.getUserTransactions(userId, filters, pagination);

    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch transactions'
    });
  }
});

app.get('/api/transactions/:userId/summary', async (req, res) => {
  try {
    const { userId } = req.params;
    const summary = await DatabaseService.getTransactionSummary(userId);

    res.json({
      success: true,
      summary
    });
  } catch (error) {
    console.error('Get transaction summary error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch transaction summary'
    });
  }
});

app.get('/api/analytics/credit-usage/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    const dateRange = {
      dateFrom: req.query.dateFrom,
      dateTo: req.query.dateTo
    };

    console.log(`Fetching credit usage for user: ${userId}, dateRange:`, dateRange);

    const result = await DatabaseService.getCreditUsageByService(userId, dateRange);

    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('Get credit usage error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch credit usage analytics'
    });
  }
});

app.get('/api/users/:userId/credit-history', async (req, res) => {
  try {
    const { userId } = req.params;
    const filters = {
      dateFrom: req.query.dateFrom,
      dateTo: req.query.dateTo,
      transactionType: req.query.transactionType,
      serviceId: req.query.serviceId,
      search: req.query.search
    };
    const pagination = {
      limit: parseInt(req.query.limit) || 20,
      offset: parseInt(req.query.offset) || 0,
      sortBy: req.query.sortBy || 'date',
      sortOrder: req.query.sortOrder || 'DESC'
    };

    const result = await DatabaseService.getCreditHistory(userId, filters, pagination);

    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('Get credit history error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch credit history'
    });
  }
});

app.put('/api/users/:userId/profile', async (req, res) => {
  try {
    const { userId } = req.params;
    const updates = {
      name: req.body.name,
      company: req.body.company,
      mobile: req.body.mobile
    };

    const user = await DatabaseService.updateUserProfile(userId, updates);

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to update profile'
    });
  }
});

app.put('/api/admin/users/:userId/verify-email', async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await DatabaseService.getUserById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.emailVerified) {
      return res.status(400).json({
        success: false,
        message: 'Email is already verified'
      });
    }

    await DatabaseService.manualVerifyEmail(userId);

    res.json({
      success: true,
      message: 'Email verified successfully by admin'
    });
  } catch (error) {
    console.error('Admin verify email error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to verify email'
    });
  }
});

setInterval(async () => {
  try {
    console.log('🧹 Running job cleanup...');

    const { Pool } = require('pg');
    const pool = new Pool({
      user: process.env.DB_USER,
      host: process.env.DB_HOST,
      database: process.env.DB_NAME,
      password: process.env.DB_PASSWORD,
      port: parseInt(process.env.DB_PORT || '5432'),
      ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
    });

    const stuckJobsResult = await pool.query(
      `SELECT * FROM automation_jobs
       WHERE status = 'processing'
       AND started_at < NOW() - INTERVAL '10 minutes'`
    );

    for (const job of stuckJobsResult.rows) {
      console.log(`⚠️  Marking stuck job ${job.id} as failed`);
      await DatabaseService.updateJobStatus(job.id, 'failed', {
        error_message: 'Job timeout - exceeded 10 minutes',
        completed_at: new Date()
      });
      await DatabaseService.refundCredits(job.user_id, job.credits_used);
      JobQueue.processNextInQueue(job.service_id);
    }

    await pool.query(
      `DELETE FROM automation_jobs
       WHERE status = 'completed'
       AND completed_at < NOW() - INTERVAL '7 days'`
    );

    await pool.end();

    const resultsDir = path.join(__dirname, '../results');
    if (fs.existsSync(resultsDir)) {
      const dirs = fs.readdirSync(resultsDir, { withFileTypes: true })
        .filter(d => d.isDirectory());

      for (const dir of dirs) {
        const dirPath = path.join(resultsDir, dir.name);
        const stats = fs.statSync(dirPath);
        const age = Date.now() - stats.mtimeMs;

        if (age > 24 * 60 * 60 * 1000) {
          console.log(`🗑️  Cleaning old results directory: ${dir.name}`);
          fs.rmSync(dirPath, { recursive: true, force: true });
        }
      }
    }

    console.log('✅ Job cleanup completed');
  } catch (error) {
    console.error('❌ Cleanup error:', error);
  }
}, 60 * 60 * 1000);

app.post('/api/rex-soo/upload-zip', upload.single('zipFile'), async (req, res) => {
  try {
    const { userId } = req.body;
    const zipFile = req.file;

    if (!zipFile) {
      return res.status(400).json({
        success: false,
        message: 'ZIP file is required'
      });
    }

    const extractResult = await RexSooService.extractZipFile(zipFile.path, userId);

    res.json({
      success: true,
      uploadId: extractResult.uploadId,
      extractPath: extractResult.extractPath,
      files: extractResult.files,
      totalFiles: extractResult.totalFiles,
      message: `Extracted ${extractResult.totalFiles} PDF files`
    });

  } catch (error) {
    console.error('ZIP upload error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to process ZIP file'
    });
  }
});

app.post('/api/rex-soo/upload-csv', upload.single('csvFile'), async (req, res) => {
  try {
    const csvFile = req.file;

    if (!csvFile) {
      return res.status(400).json({
        success: false,
        message: 'CSV file is required'
      });
    }

    const parseResult = await RexSooService.parseCSVFile(csvFile.path);

    res.json({
      success: true,
      rows: parseResult.rows,
      totalRows: parseResult.totalRows,
      errors: parseResult.errors,
      message: `Parsed ${parseResult.totalRows} rows from CSV`
    });

  } catch (error) {
    console.error('CSV upload error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to process CSV file'
    });
  }
});

app.post('/api/rex-soo/match-documents', async (req, res) => {
  try {
    const { csvRows, pdfFiles } = req.body;

    if (!csvRows || !pdfFiles) {
      return res.status(400).json({
        success: false,
        message: 'CSV rows and PDF files are required'
      });
    }

    const matches = RexSooService.matchDocuments(csvRows, pdfFiles);

    const matchedCount = matches.filter(m => m.hasAllDocuments).length;
    const missingCount = matches.length - matchedCount;

    res.json({
      success: true,
      matches,
      matchedCount,
      missingCount,
      message: `Matched ${matchedCount} rows, ${missingCount} rows have missing documents`
    });

  } catch (error) {
    console.error('Document matching error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to match documents'
    });
  }
});

app.post('/api/rex-soo/submit', async (req, res) => {
  try {
    const { userId, csvFileName, zipFileName, matches, creditCost } = req.body;

    if (!userId || !matches) {
      return res.status(400).json({
        success: false,
        message: 'User ID and matches are required'
      });
    }

    const cost = creditCost || 2.0;

    const user = await DatabaseService.getUserById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const matchedSubmissions = matches.filter(m => m.hasAllDocuments);
    const totalCost = matchedSubmissions.length * cost;

    if (user.credits < totalCost && !user.isAdmin) {
      return res.status(400).json({
        success: false,
        message: `Insufficient credits. Required: ${totalCost}, Available: ${user.credits}`
      });
    }

    const result = await RexSooService.saveSubmission(
      userId,
      csvFileName,
      zipFileName,
      matchedSubmissions,
      cost
    );

    if (req.body.extractPath) {
      RexSooService.cleanupTempFiles(req.body.extractPath);
    }

    res.json({
      success: true,
      totalSubmissions: result.totalSubmissions,
      totalCreditsUsed: result.totalCreditsUsed,
      submissions: result.submissions,
      message: `Successfully submitted ${result.totalSubmissions} REX SOO entries`
    });

  } catch (error) {
    console.error('REX SOO submission error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to submit REX SOO data'
    });
  }
});

app.get('/api/rex-soo/submissions/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;

    const result = await RexSooService.getSubmissions(userId, limit, offset);

    res.json({
      success: true,
      submissions: result.submissions,
      total: result.total
    });

  } catch (error) {
    console.error('Get submissions error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch submissions'
    });
  }
});

app.get('/api/rex-soo/submission/:submissionId', async (req, res) => {
  try {
    const { submissionId } = req.params;
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    const result = await RexSooService.getSubmissionById(submissionId, userId);

    res.json({
      success: true,
      submission: result.submission
    });

  } catch (error) {
    console.error('Get submission error:', error);
    res.status(404).json({
      success: false,
      message: error.message || 'Submission not found'
    });
  }
});

app.get('/api/rex-soo/document/:documentId/download', async (req, res) => {
  try {
    const { documentId } = req.params;
    const { Pool } = require('pg');
    const pool = new Pool({
      user: process.env.DB_USER,
      host: process.env.DB_HOST,
      database: process.env.DB_NAME,
      password: process.env.DB_PASSWORD,
      port: parseInt(process.env.DB_PORT || '5432'),
      ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
    });

    const result = await pool.query(
      'SELECT file_path, original_filename FROM rex_documents WHERE id = $1',
      [documentId]
    );

    await pool.end();

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    const doc = result.rows[0];

    if (!fs.existsSync(doc.file_path)) {
      return res.status(404).json({
        success: false,
        message: 'Document file not found'
      });
    }

    res.download(doc.file_path, doc.original_filename);

  } catch (error) {
    console.error('Download document error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to download document'
    });
  }
});

app.delete('/api/rex-soo/submission/:submissionId', async (req, res) => {
  try {
    const { submissionId } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    await RexSooService.deleteSubmission(submissionId, userId);

    res.json({
      success: true,
      message: 'Submission deleted successfully'
    });

  } catch (error) {
    console.error('Delete submission error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete submission'
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);

  const { Pool } = require('pg');
  const dbPool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: parseInt(process.env.DB_PORT || '5432'),
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  });
  setPool(dbPool);
});

module.exports = app;