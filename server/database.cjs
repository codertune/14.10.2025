const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto'); // Still needed for reset token generation

let pool;

// Initialize PostgreSQL database connection pool
async function initDatabase() {
  try {
    if (!process.env.DB_HOST || !process.env.DB_USER || !process.env.DB_NAME) {
      throw new Error('Missing required database environment variables. Please check your .env file.');
    }

    const dbConfig = {
      user: process.env.DB_USER,
      host: process.env.DB_HOST,
      database: process.env.DB_NAME,
      password: process.env.DB_PASSWORD || '',
      port: parseInt(process.env.DB_PORT || '5432'),
      ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
    };

    console.log('Connecting to database:', {
      host: dbConfig.host,
      database: dbConfig.database,
      user: dbConfig.user,
      port: dbConfig.port,
      ssl: !!dbConfig.ssl
    });

    pool = new Pool(dbConfig);

    const client = await pool.connect();
    console.log('✅ PostgreSQL database connected successfully');
    client.release();

  } catch (error) {
    console.error('❌ Database connection error:', error);
    console.error('Error details:', error.message);
    console.error('');
    console.error('Troubleshooting:');
    console.error('1. Verify your .env file has DB_HOST, DB_USER, DB_NAME, and DB_PASSWORD');
    console.error('2. Check that your database server is running and accessible');
    console.error('3. Verify firewall settings allow database connections');
    console.error('4. For Supabase: Ensure DB_SSL=true and credentials are correct');
    throw error;
  }
}

// Database service functions
const DatabaseService = {
  async authenticateUser(email, password) {
    try {
      if (!email || !password) {
        throw new Error('Email and password are required');
      }

      const result = await pool.query("SELECT * FROM users WHERE email = $1", [email]);

      if (result.rows.length === 0) {
        throw new Error('Invalid email or password');
      }

      const user = result.rows[0];
      const isValidPassword = await bcrypt.compare(password, user.password_hash);

      if (!isValidPassword) {
        throw new Error('Invalid email or password');
      }

      if (!user.email_verified) {
        const error = new Error('Email not verified. Please check your email for the verification link.');
        error.code = 'EMAIL_NOT_VERIFIED';
        error.email = user.email;
        throw error;
      }

      // Map to frontend compatible format
      return {
        id: user.id,
        email: user.email,
        name: user.name,
        company: user.company,
        mobile: user.mobile,
        credits: user.is_admin ? 999999 : parseFloat(user.credits) || 0, // Admin gets unlimited credits
        isAdmin: user.is_admin,
        emailVerified: user.email_verified,
        memberSince: user.member_since,
        trialEndsAt: user.trial_ends_at,
        status: user.status,
        totalSpent: parseFloat(user.total_spent) || 0,
        lastActivity: user.last_activity,
        createdAt: user.created_at,
        updatedAt: user.updated_at,
        workHistory: [] // Will be fetched separately if needed
      };

    } catch (error) {
      console.error('? Authentication error:', error.message);
      throw error;
    }
  },

  async createUser(email, password, name, company, mobile) {
    try {
      // Check if user already exists
      const existingResult = await pool.query("SELECT id FROM users WHERE email = $1", [email]);
      if (existingResult.rows.length > 0) {
        throw new Error('User with this email already exists');
      }

      const hashedPassword = await bcrypt.hash(password, 10); // Hash password with bcrypt
      const initialCredits = 100; // Default for new users

      const result = await pool.query(
        `INSERT INTO users (email, name, company, mobile, password_hash, credits, is_admin, email_verified, member_since, trial_ends_at, status)
         VALUES ($1, $2, $3, $4, $5, $6, FALSE, FALSE, CURRENT_DATE, CURRENT_DATE + INTERVAL '30 days', 'active')
         RETURNING id, email, name, company, mobile, credits, is_admin, email_verified, member_since, trial_ends_at, status, created_at, updated_at`,
        [email, name, company, mobile, hashedPassword, initialCredits]
      );

      const user = result.rows[0];

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        company: user.company,
        mobile: user.mobile,
        credits: user.credits,
        isAdmin: user.is_admin,
        emailVerified: user.email_verified,
        memberSince: user.member_since,
        trialEndsAt: user.trial_ends_at,
        status: user.status,
        createdAt: user.created_at,
        updatedAt: user.updated_at,
        workHistory: []
      };

    } catch (error) {
      console.error('? Error creating user:', error);
      throw error;
    }
  },

  async getAllUsers() {
    try {
      const result = await pool.query("SELECT * FROM users ORDER BY created_at DESC");

      return result.rows.map(user => ({
        id: user.id,
        email: user.email,
        name: user.name,
        company: user.company,
        mobile: user.mobile,
        credits: user.is_admin ? 999999 : parseFloat(user.credits) || 0,
        isAdmin: user.is_admin,
        emailVerified: user.email_verified,
        memberSince: user.member_since,
        trialEndsAt: user.trial_ends_at,
        status: user.status,
        totalSpent: parseFloat(user.total_spent) || 0,
        lastActivity: user.last_activity,
        createdAt: user.created_at,
        updatedAt: user.updated_at,
        workHistory: []
      }));

    } catch (error) {
      console.error('? Error getting all users:', error);
      throw error;
    }
  },

  async getUserById(id) {
    try {
      const result = await pool.query("SELECT * FROM users WHERE id = $1", [id]);

      if (result.rows.length === 0) {
        return null;
      }

      const user = result.rows[0];
      return {
        id: user.id,
        email: user.email,
        name: user.name,
        company: user.company,
        mobile: user.mobile,
        credits: user.is_admin ? 999999 : parseFloat(user.credits) || 0,
        isAdmin: user.is_admin,
        emailVerified: user.email_verified,
        memberSince: user.member_since,
        trialEndsAt: user.trial_ends_at,
        status: user.status,
        totalSpent: parseFloat(user.total_spent) || 0,
        lastActivity: user.last_activity,
        createdAt: user.created_at,
        updatedAt: user.updated_at,
        workHistory: []
      };

    } catch (error) {
      console.error('? Error getting user by ID:', error);
      throw error;
    }
  },

  async updateUser(id, updates) {
    try {
      const fields = [];
      const values = [];
      let queryIndex = 1;

      if (updates.credits !== undefined) {
        fields.push(`credits = $${queryIndex++}`);
        values.push(updates.credits);
      }
      if (updates.is_admin !== undefined) {
        fields.push(`is_admin = $${queryIndex++}`);
        values.push(updates.is_admin);
      }
      if (updates.status !== undefined) {
        fields.push(`status = $${queryIndex++}`);
        values.push(updates.status);
      }
      if (updates.name !== undefined) {
        fields.push(`name = $${queryIndex++}`);
        values.push(updates.name);
      }
      if (updates.company !== undefined) {
        fields.push(`company = $${queryIndex++}`);
        values.push(updates.company);
      }
      if (updates.mobile !== undefined) {
        fields.push(`mobile = $${queryIndex++}`);
        values.push(updates.mobile);
      }
      if (updates.totalSpent !== undefined) {
        fields.push(`total_spent = $${queryIndex++}`);
        values.push(updates.totalSpent);
      }
      if (updates.lastActivity !== undefined) {
        fields.push(`last_activity = $${queryIndex++}`);
        values.push(updates.lastActivity);
      }
      // Add other fields as needed

      if (fields.length === 0) {
        console.warn(`⚠️ No valid fields to update for user ${id}`);
        return await this.getUserById(id);
      }

      values.push(id); // Add ID for WHERE clause
      const result = await pool.query(
        `UPDATE users SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${queryIndex} RETURNING *`,
        values
      );

      const user = result.rows[0];
      return {
        id: user.id,
        email: user.email,
        name: user.name,
        company: user.company,
        mobile: user.mobile,
        credits: user.is_admin ? 999999 : parseFloat(user.credits) || 0,
        isAdmin: user.is_admin,
        emailVerified: user.email_verified,
        memberSince: user.member_since,
        trialEndsAt: user.trial_ends_at,
        status: user.status,
        totalSpent: parseFloat(user.total_spent) || 0,
        lastActivity: user.last_activity,
        createdAt: user.created_at,
        updatedAt: user.updated_at,
        workHistory: []
      };

    } catch (error) {
      console.error('? Error updating user:', error);
      throw error;
    }
  },

  async deleteUser(id) {
    try {
      const result = await pool.query("DELETE FROM users WHERE id = $1 RETURNING email", [id]);

      if (result.rows.length === 0) {
        throw new Error('User not found');
      }

      console.log(`? User ${result.rows[0].email} deleted successfully`);
      return true;

    } catch (error) {
      console.error('? Error deleting user:', error);
      throw error;
    }
  },

  async updateCredits(userId, credits, operation = 'add') {
    try {
      const userResult = await pool.query("SELECT credits, is_admin FROM users WHERE id = $1", [userId]);
      if (userResult.rows.length === 0) {
        throw new Error('User not found');
      }

      const user = userResult.rows[0];

      // Admin always has unlimited credits
      if (user.is_admin) {
        return { newCredits: 999999, oldCredits: 999999 };
      }

      const currentCredits = parseFloat(user.credits) || 0;
      let newCredits;
      if (operation === 'add') {
        newCredits = currentCredits + credits;
      } else if (operation === 'deduct') {
        newCredits = Math.max(0, currentCredits - credits);
      } else {
        throw new Error('Invalid operation. Use "add" or "deduct"');
      }

      const updateResult = await pool.query(
        "UPDATE users SET credits = $1, updated_at = NOW() WHERE id = $2 RETURNING credits",
        [newCredits, userId]
      );

      return { newCredits: parseFloat(updateResult.rows[0].credits) || 0, oldCredits: currentCredits };

    } catch (error) {
      console.error('? Error updating credits:', error);
      throw error;
    }
  },

  async deductCredits(userId, credits) {
    try {
      return await this.updateCredits(userId, credits, 'deduct');
    } catch (error) {
      console.error('? Error deducting credits:', error);
      throw error;
    }
  },

  async addCredits(userId, credits) {
    try {
      return await this.updateCredits(userId, credits, 'add');
    } catch (error) {
      console.error('? Error adding credits:', error);
      throw error;
    }
  },

  async promoteToAdmin(email) {
    try {
      const result = await pool.query(
        "UPDATE users SET is_admin = TRUE, updated_at = NOW() WHERE email = $1 RETURNING id",
        [email]
      );

      if (result.rows.length === 0) {
        throw new Error('User not found');
      }

      console.log(`? User ${email} promoted to admin`);
      return true;

    } catch (error) {
      console.error('? Error promoting user to admin:', error);
      throw error;
    }
  },

  async createAdminUser(email, password) {
    try {
      const existingResult = await pool.query("SELECT id, is_admin FROM users WHERE email = $1", [email]);

      if (existingResult.rows.length > 0) {
        // User exists, promote to admin if not already
        if (!existingResult.rows[0].is_admin) {
          return this.promoteToAdmin(email);
        }
        return { id: existingResult.rows[0].id, email, isAdmin: true, message: 'User is already an admin.' };
      } else {
        // Create new admin user
        const hashedPassword = await bcrypt.hash(password, 10);
        const result = await pool.query(
          `INSERT INTO users (email, name, company, mobile, password_hash, credits, is_admin, email_verified, member_since, trial_ends_at, status)
           VALUES ($1, 'Admin User', 'Smart Process Flow', '', $2, 999999, TRUE, TRUE, CURRENT_DATE, CURRENT_DATE + INTERVAL '365 days', 'active')
           RETURNING id, email, is_admin`,
          [email, hashedPassword]
        );
        return { id: result.rows[0].id, email, isAdmin: result.rows[0].is_admin, message: 'Admin user created successfully.' };
      }

    } catch (error) {
      console.error('? Error creating admin user:', error);
      throw error;
    }
  },

  async generatePasswordResetToken(email) {
    try {
      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

      const result = await pool.query(
        "UPDATE users SET reset_password_token = $1, reset_password_expires_at = $2, updated_at = NOW() WHERE email = $3 RETURNING id",
        [token, expiresAt, email]
      );

      if (result.rows.length === 0) {
        throw new Error('User not found');
      }

      return { token, email, expiresAt };

    } catch (error) {
      console.error('? Error generating password reset token:', error);
      throw error;
    }
  },

  async resetPassword(token, newPassword) {
    try {
      const result = await pool.query(
        "SELECT id, email FROM users WHERE reset_password_token = $1 AND reset_password_expires_at > NOW()",
        [token]
      );

      if (result.rows.length === 0) {
        throw new Error('Invalid or expired reset token');
      }

      const user = result.rows[0];
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      await pool.query(
        "UPDATE users SET password_hash = $1, reset_password_token = NULL, reset_password_expires_at = NULL, updated_at = NOW() WHERE id = $2",
        [hashedPassword, user.id]
      );

      return { id: user.id, email: user.email, message: 'Password reset successfully' };

    } catch (error) {
      console.error('? Error resetting password:', error);
      throw error;
    }
  },

  async getSystemSettings() {
    try {
      const result = await pool.query("SELECT * FROM system_settings ORDER BY created_at DESC LIMIT 1");

      if (result.rows.length === 0) {
        // Return default settings if none exist and insert them
        const defaultSettings = {
          credits_per_bdt: 2.0,
          free_trial_credits: 100,
          min_purchase_credits: 200,
          enabled_services: JSON.stringify([
            'pdf-excel-converter', 'webcontainer-demo', 'ctg-port-tracking', 'exp-issue', 'exp-correction',
            'exp-duplicate-reporting', 'exp-search', 'damco-booking', 'damco-booking-download',
            'damco-fcr-submission', 'damco-fcr-extractor', 'damco-edoc-upload', 'hm-einvoice-create',
            'hm-einvoice-download', 'hm-einvoice-correction', 'hm-packing-list', 'bepza-ep-issue',
            'bepza-ep-submission', 'bepza-ep-download', 'bepza-ip-issue', 'bepza-ip-submit',
            'bepza-ip-download', 'cash-incentive-application', 'damco-tracking-maersk',
            'myshipment-tracking', 'egm-download', 'custom-tracking'
          ]),
          service_credits_config: JSON.stringify({
            'pdf-excel-converter': 1, 'ctg-port-tracking': 1, 'exp-issue': 2, 'exp-correction': 1.5,
            'exp-duplicate-reporting': 2, 'exp-search': 0.5, 'damco-booking': 3, 'damco-booking-download': 1,
            'damco-fcr-submission': 2, 'damco-fcr-extractor': 1.5, 'damco-edoc-upload': 1,
            'hm-einvoice-create': 2, 'hm-einvoice-download': 1, 'hm-einvoice-correction': 1.5,
            'hm-packing-list': 1, 'bepza-ep-issue': 2.5, 'bepza-ep-submission': 2, 'bepza-ep-download': 1,
            'bepza-ip-issue': 2.5, 'bepza-ip-submit': 2, 'bepza-ip-download': 1,
            'cash-incentive-application': 3, 'damco-tracking-maersk': 1, 'myshipment-tracking': 1,
            'egm-download': 1, 'custom-tracking': 1.5
          }),
          system_notification: JSON.stringify({ enabled: false, message: '', type: 'info', showToAll: true })
        };

        await pool.query(
          `INSERT INTO system_settings (credits_per_bdt, free_trial_credits, min_purchase_credits, enabled_services, service_credits_config, system_notification)
           VALUES ($1, $2, $3, $4::jsonb, $5::jsonb, $6::jsonb)`,
          [
            defaultSettings.credits_per_bdt, defaultSettings.free_trial_credits,
            defaultSettings.min_purchase_credits, defaultSettings.enabled_services,
            defaultSettings.service_credits_config, defaultSettings.system_notification
          ]
        );
        return {
          creditsPerBDT: defaultSettings.credits_per_bdt,
          freeTrialCredits: defaultSettings.free_trial_credits,
          minPurchaseCredits: defaultSettings.min_purchase_credits,
          enabledServices: JSON.parse(defaultSettings.enabled_services),
          serviceCreditsConfig: JSON.parse(defaultSettings.service_credits_config),
          systemNotification: JSON.parse(defaultSettings.system_notification)
        };
      }

      const settings = result.rows[0];
      return {
        creditsPerBDT: parseFloat(settings.credits_per_bdt),
        freeTrialCredits: settings.free_trial_credits,
        minPurchaseCredits: settings.min_purchase_credits,
        enabledServices: settings.enabled_services, // Already JSONB, so parsed by pg
        serviceCreditsConfig: settings.service_credits_config, // Already JSONB
        systemNotification: settings.system_notification // Already JSONB
      };

    } catch (error) {
      console.error('? Error getting system settings:', error);
      throw error;
    }
  },

  async updateSystemSettings(settings) {
    try {
      // Check if settings exist
      const existingResult = await pool.query("SELECT COUNT(*) FROM system_settings");
      const hasSettings = parseInt(existingResult.rows[0].count) > 0;

      if (hasSettings) {
        // Get current settings first to merge with updates
        const currentSettings = await this.getSystemSettings();

        // Merge current settings with updates
        const mergedSettings = {
          creditsPerBDT: settings.creditsPerBDT !== undefined ? settings.creditsPerBDT : currentSettings.creditsPerBDT,
          freeTrialCredits: settings.freeTrialCredits !== undefined ? settings.freeTrialCredits : currentSettings.freeTrialCredits,
          minPurchaseCredits: settings.minPurchaseCredits !== undefined ? settings.minPurchaseCredits : currentSettings.minPurchaseCredits,
          enabledServices: settings.enabledServices !== undefined ? settings.enabledServices : currentSettings.enabledServices,
          serviceCreditsConfig: settings.serviceCreditsConfig !== undefined ? settings.serviceCreditsConfig : currentSettings.serviceCreditsConfig,
          systemNotification: settings.systemNotification !== undefined ? settings.systemNotification : currentSettings.systemNotification
        };

        // Update existing settings
        await pool.query(
          `UPDATE system_settings SET
            credits_per_bdt = $1,
            free_trial_credits = $2,
            min_purchase_credits = $3,
            enabled_services = $4::jsonb,
            service_credits_config = $5::jsonb,
            system_notification = $6::jsonb,
            updated_at = NOW()
          WHERE id = (SELECT id FROM system_settings ORDER BY created_at DESC LIMIT 1)`,
          [
            mergedSettings.creditsPerBDT,
            mergedSettings.freeTrialCredits,
            mergedSettings.minPurchaseCredits,
            JSON.stringify(mergedSettings.enabledServices),
            JSON.stringify(mergedSettings.serviceCreditsConfig),
            JSON.stringify(mergedSettings.systemNotification)
          ]
        );
      } else {
        // Insert new settings with defaults
        await pool.query(
          `INSERT INTO system_settings (
            credits_per_bdt, free_trial_credits,
            min_purchase_credits, enabled_services, service_credits_config, system_notification
          ) VALUES ($1, $2, $3, $4::jsonb, $5::jsonb, $6::jsonb)`,
          [
            settings.creditsPerBDT || 2.0,
            settings.freeTrialCredits || 100,
            settings.minPurchaseCredits || 200,
            JSON.stringify(settings.enabledServices || []),
            JSON.stringify(settings.serviceCreditsConfig || {}),
            JSON.stringify(settings.systemNotification || { enabled: false, message: '', type: 'info', showToAll: true })
          ]
        );
      }

      console.log('? System settings updated successfully');
      return this.getSystemSettings(); // Return updated settings

    } catch (error) {
      console.error('? Error updating system settings:', error);
      throw error;
    }
  },

  isReportFile(filename) {
    if (!filename) return false;
    const lowerFilename = filename.toLowerCase();
    // Only exclude intermediate files like individual PDFs in subdirectories
    // Report PDFs are final deliverables and should be counted
    const excludePatterns = ['pdfs/', '/pdfs/', '\\pdfs\\'];
    return excludePatterns.some(pattern => lowerFilename.includes(pattern));
  },

  async addWorkHistory(userId, workItem) {
    try {
      const resultFilesJson = typeof workItem.resultFiles === 'string'
        ? workItem.resultFiles
        : JSON.stringify(workItem.resultFiles || []);

      let filesCount = 0;

      // If filesGeneratedCount is explicitly provided (from job queue), use it
      if (workItem.filesGeneratedCount !== undefined) {
        filesCount = workItem.filesGeneratedCount;
        console.log(`📊 Using explicit filesGeneratedCount: ${filesCount}`);
      } else {
        // Fallback: count from result_files array for backward compatibility
        if (Array.isArray(workItem.resultFiles)) {
          // Count all files except those in subdirectories (intermediate files)
          filesCount = workItem.resultFiles.filter(file => !this.isReportFile(file)).length;
        } else if (workItem.resultFiles) {
          // Single file: count it unless it's an intermediate file
          filesCount = this.isReportFile(workItem.resultFiles) ? 0 : 1;
        }

        // Ensure at least 1 if there are any result files
        if (filesCount === 0 && workItem.resultFiles &&
            (Array.isArray(workItem.resultFiles) ? workItem.resultFiles.length > 0 : true)) {
          filesCount = 1;
        }
        console.log(`⚠️ Using fallback filesGeneratedCount calculation: ${filesCount}`);
      }

      console.log('💾 Adding work history to database:', {
        userId,
        serviceId: workItem.serviceId,
        creditsUsed: workItem.creditsUsed,
        downloadUrl: workItem.downloadUrl,
        totalFiles: Array.isArray(workItem.resultFiles) ? workItem.resultFiles.length : (workItem.resultFiles ? 1 : 0),
        filesGeneratedCount: filesCount,
        bulkUploadId: workItem.bulkUploadId || null,
        rowNumber: workItem.rowNumber || null
      });

      const result = await pool.query(
        `INSERT INTO work_history (user_id, service_id, service_name, file_name, credits_used, status, result_files, download_url, expires_at, files_generated_count, bulk_upload_id, row_number)
         VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8, NOW() + INTERVAL '7 days', $9, $10, $11) RETURNING *`,
        [
          userId,
          workItem.serviceId,
          workItem.serviceName,
          workItem.fileName,
          workItem.creditsUsed,
          workItem.status || 'completed',
          resultFilesJson,
          workItem.downloadUrl || null,
          filesCount,
          workItem.bulkUploadId || null,
          workItem.rowNumber || null
        ]
      );
      const item = result.rows[0];
      console.log('✅ Work history added to database:', {
        id: item.id,
        downloadUrl: item.download_url,
        status: item.status,
        filesGeneratedCount: item.files_generated_count
      });
      return {
        id: item.id,
        userId: item.user_id,
        serviceId: item.service_id,
        serviceName: item.service_name,
        fileName: item.file_name,
        creditsUsed: parseFloat(item.credits_used),
        status: item.status,
        resultFiles: item.result_files,
        downloadUrl: item.download_url,
        createdAt: item.created_at,
        expiresAt: item.expires_at,
        filesGeneratedCount: item.files_generated_count,
        bulkUploadId: item.bulk_upload_id,
        rowNumber: item.row_number
      };
    } catch (error) {
      console.error('? Error adding work history:', error);
      throw error;
    }
  },

  async getWorkHistoryCount(userId) {
    try {
      const result = await pool.query(
        "SELECT COUNT(*) as count FROM work_history WHERE user_id = $1 AND (expires_at IS NULL OR expires_at > NOW())",
        [userId]
      );
      return parseInt(result.rows[0].count);
    } catch (error) {
      console.error('? Error getting work history count:', error);
      throw error;
    }
  },

  async getWorkHistory(userId, pagination = {}) {
    try {
      const { limit = 3, offset = 0, sortBy = 'created_at', sortOrder = 'DESC' } = pagination;

      console.log(`📖 Fetching work history from database for user: ${userId}`, { limit, offset });

      const countResult = await pool.query(
        "SELECT COUNT(*) as count FROM work_history WHERE user_id = $1 AND (expires_at IS NULL OR expires_at > NOW())",
        [userId]
      );
      const totalCount = parseInt(countResult.rows[0].count);

      const result = await pool.query(
        `SELECT * FROM work_history
         WHERE user_id = $1 AND (expires_at IS NULL OR expires_at > NOW())
         ORDER BY ${sortBy} ${sortOrder}
         LIMIT $2 OFFSET $3`,
        [userId, limit, offset]
      );

      console.log(`📊 Found ${result.rows.length} of ${totalCount} work history items`);

      const workHistory = result.rows.map(item => ({
        id: item.id,
        userId: item.user_id,
        serviceId: item.service_id,
        serviceName: item.service_name,
        fileName: item.file_name,
        creditsUsed: parseFloat(item.credits_used),
        status: item.status,
        resultFiles: item.result_files,
        downloadUrl: item.download_url,
        createdAt: item.created_at,
        expiresAt: item.expires_at,
        filesGeneratedCount: item.files_generated_count || 0,
        bulkUploadId: item.bulk_upload_id,
        rowNumber: item.row_number
      }));

      if (workHistory.length > 0) {
        console.log('📝 Latest work history item:', {
          id: workHistory[0].id,
          status: workHistory[0].status,
          creditsUsed: workHistory[0].creditsUsed,
          downloadUrl: workHistory[0].downloadUrl,
          hasDownloadUrl: !!workHistory[0].downloadUrl,
          filesGeneratedCount: workHistory[0].filesGeneratedCount
        });
      }

      return {
        workHistory,
        totalCount,
        limit,
        offset,
        totalPages: Math.ceil(totalCount / limit),
        currentPage: Math.floor(offset / limit) + 1,
        hasMore: offset + limit < totalCount
      };
    } catch (error) {
      console.error('? Error getting work history:', error);
      throw error;
    }
  },

  async updateWorkHistoryFiles(workId, resultFiles) {
    try {
      const result = await pool.query(
        `UPDATE work_history SET result_files = $1::jsonb, updated_at = NOW() WHERE id = $2 RETURNING *`,
        [JSON.stringify(resultFiles), workId]
      );
      return result.rows[0];
    } catch (error) {
      console.error('? Error updating work history files:', error);
      throw error;
    }
  },

  // Blog Posts - Placeholder implementations
  async getBlogPosts() {
    try {
      const result = await pool.query("SELECT * FROM blog_posts ORDER BY published_at DESC");
      return result.rows.map(post => ({
        id: post.id,
        title: post.title,
        slug: post.slug,
        content: post.content,
        excerpt: post.excerpt,
        author: post.author,
        tags: post.tags,
        featured: post.featured,
        status: post.status,
        views: post.views,
        metaTitle: post.meta_title,
        metaDescription: post.meta_description,
        metaKeywords: post.meta_keywords,
        publishedAt: post.published_at,
        createdAt: post.created_at,
        updatedAt: post.updated_at,
      }));
    } catch (error) {
      console.error('? Error getting blog posts:', error);
      throw error;
    }
  },

  async addBlogPost(postData) {
    try {
      const result = await pool.query(
        `INSERT INTO blog_posts (title, slug, content, excerpt, author, tags, featured, status, views, meta_title, meta_description, meta_keywords, published_at)
         VALUES ($1, $2, $3, $4, $5, $6::text[], $7, $8, $9, $10, $11, $12, $13) RETURNING *`,
        [
          postData.title, postData.slug, postData.content, postData.excerpt, postData.author,
          postData.tags, postData.featured, postData.status, postData.views, postData.metaTitle,
          postData.metaDescription, postData.metaKeywords, postData.publishedAt || new Date()
        ]
      );
      return result.rows[0];
    } catch (error) {
      console.error('? Error adding blog post:', error);
      throw error;
    }
  },

  async updateBlogPost(id, updates) {
    try {
      const fields = [];
      const values = [];
      let queryIndex = 1;

      if (updates.title !== undefined) { fields.push(`title = $${queryIndex++}`); values.push(updates.title); }
      if (updates.slug !== undefined) { fields.push(`slug = $${queryIndex++}`); values.push(updates.slug); }
      if (updates.content !== undefined) { fields.push(`content = $${queryIndex++}`); values.push(updates.content); }
      if (updates.excerpt !== undefined) { fields.push(`excerpt = $${queryIndex++}`); values.push(updates.excerpt); }
      if (updates.author !== undefined) { fields.push(`author = $${queryIndex++}`); values.push(updates.author); }
      if (updates.tags !== undefined) { fields.push(`tags = $${queryIndex++}::text[]`); values.push(updates.tags); }
      if (updates.featured !== undefined) { fields.push(`featured = $${queryIndex++}`); values.push(updates.featured); }
      if (updates.status !== undefined) { fields.push(`status = $${queryIndex++}`); values.push(updates.status); }
      if (updates.views !== undefined) { fields.push(`views = $${queryIndex++}`); values.push(updates.views); }
      if (updates.metaTitle !== undefined) { fields.push(`meta_title = $${queryIndex++}`); values.push(updates.metaTitle); }
      if (updates.metaDescription !== undefined) { fields.push(`meta_description = $${queryIndex++}`); values.push(updates.metaDescription); }
      if (updates.metaKeywords !== undefined) { fields.push(`meta_keywords = $${queryIndex++}`); values.push(updates.metaKeywords); }
      if (updates.publishedAt !== undefined) { fields.push(`published_at = $${queryIndex++}`); values.push(updates.publishedAt); }

      if (fields.length === 0) {
        throw new Error('No fields to update');
      }

      values.push(id);
      const result = await pool.query(
        `UPDATE blog_posts SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${queryIndex} RETURNING *`,
        values
      );
      return result.rows[0];
    } catch (error) {
      console.error('? Error updating blog post:', error);
      throw error;
    }
  },

  async deleteBlogPost(id) {
    try {
      const result = await pool.query("DELETE FROM blog_posts WHERE id = $1 RETURNING id", [id]);
      if (result.rows.length === 0) {
        throw new Error('Blog post not found');
      }
      return true;
    } catch (error) {
      console.error('? Error deleting blog post:', error);
      throw error;
    }
  },

  async getServiceTemplates() {
    try {
      const result = await pool.query(
        "SELECT * FROM service_templates WHERE is_active = true ORDER BY category, service_name"
      );
      return result.rows;
    } catch (error) {
      console.error('? Error getting service templates:', error);
      throw error;
    }
  },

  async getServiceTemplate(serviceId) {
    try {
      const result = await pool.query(
        "SELECT * FROM service_templates WHERE service_id = $1",
        [serviceId]
      );
      return result.rows[0];
    } catch (error) {
      console.error('? Error getting service template:', error);
      throw error;
    }
  },

  async createBulkUpload(userId, serviceId, serviceName, originalFileName, totalRows) {
    try {
      const result = await pool.query(
        `INSERT INTO bulk_uploads (user_id, service_id, service_name, original_file_name, total_rows, status, expires_at, created_at)
         VALUES ($1, $2, $3, $4, $5, 'pending', NOW() + INTERVAL '7 days', NOW()) RETURNING *`,
        [userId, serviceId, serviceName, originalFileName, totalRows]
      );
      return result.rows[0];
    } catch (error) {
      console.error('? Error creating bulk upload:', error);
      throw error;
    }
  },

  async updateBulkUpload(bulkUploadId, updates) {
    try {
      const fields = [];
      const values = [];
      let queryIndex = 1;

      if (updates.processedRows !== undefined) { fields.push(`processed_rows = $${queryIndex++}`); values.push(updates.processedRows); }
      if (updates.successfulRows !== undefined) { fields.push(`successful_rows = $${queryIndex++}`); values.push(updates.successfulRows); }
      if (updates.failedRows !== undefined) { fields.push(`failed_rows = $${queryIndex++}`); values.push(updates.failedRows); }
      if (updates.status !== undefined) { fields.push(`status = $${queryIndex++}`); values.push(updates.status); }
      if (updates.creditsUsed !== undefined) { fields.push(`credits_used = $${queryIndex++}`); values.push(updates.creditsUsed); }
      if (updates.errorMessage !== undefined) { fields.push(`error_message = $${queryIndex++}`); values.push(updates.errorMessage); }
      if (updates.resultZipPath !== undefined) { fields.push(`result_zip_path = $${queryIndex++}`); values.push(updates.resultZipPath); }
      if (updates.expiresAt !== undefined) { fields.push(`expires_at = $${queryIndex++}`); values.push(updates.expiresAt); }
      if (updates.completedAt !== undefined) { fields.push(`completed_at = $${queryIndex++}`); values.push(updates.completedAt); }

      if (fields.length === 0) {
        throw new Error('No fields to update');
      }

      values.push(bulkUploadId);
      const result = await pool.query(
        `UPDATE bulk_uploads SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${queryIndex} RETURNING *`,
        values
      );
      return result.rows[0];
    } catch (error) {
      console.error('? Error updating bulk upload:', error);
      throw error;
    }
  },

  async getBulkUploads(userId) {
    try {
      const result = await pool.query(
        "SELECT * FROM bulk_uploads WHERE user_id = $1 ORDER BY created_at DESC",
        [userId]
      );
      return result.rows;
    } catch (error) {
      console.error('? Error getting bulk uploads:', error);
      throw error;
    }
  },

  async getBulkUpload(bulkUploadId) {
    try {
      const result = await pool.query(
        "SELECT * FROM bulk_uploads WHERE id = $1",
        [bulkUploadId]
      );
      return result.rows[0];
    } catch (error) {
      console.error('? Error getting bulk upload:', error);
      throw error;
    }
  },

  async createBulkUploadItem(bulkUploadId, rowNumber, rowData) {
    try {
      const result = await pool.query(
        `INSERT INTO bulk_upload_items (bulk_upload_id, row_number, row_data, status, created_at)
         VALUES ($1, $2, $3, 'pending', NOW()) RETURNING *`,
        [bulkUploadId, rowNumber, JSON.stringify(rowData)]
      );
      return result.rows[0];
    } catch (error) {
      console.error('? Error creating bulk upload item:', error);
      throw error;
    }
  },

  async updateBulkUploadItem(itemId, updates) {
    try {
      const fields = [];
      const values = [];
      let queryIndex = 1;

      if (updates.workHistoryId !== undefined) { fields.push(`work_history_id = $${queryIndex++}`); values.push(updates.workHistoryId); }
      if (updates.status !== undefined) { fields.push(`status = $${queryIndex++}`); values.push(updates.status); }
      if (updates.creditsUsed !== undefined) { fields.push(`credits_used = $${queryIndex++}`); values.push(updates.creditsUsed); }
      if (updates.errorMessage !== undefined) { fields.push(`error_message = $${queryIndex++}`); values.push(updates.errorMessage); }
      if (updates.resultFilePath !== undefined) { fields.push(`result_file_path = $${queryIndex++}`); values.push(updates.resultFilePath); }
      if (updates.processedAt !== undefined) { fields.push(`processed_at = $${queryIndex++}`); values.push(updates.processedAt); }

      if (fields.length === 0) {
        throw new Error('No fields to update');
      }

      values.push(itemId);
      const result = await pool.query(
        `UPDATE bulk_upload_items SET ${fields.join(', ')} WHERE id = $${queryIndex} RETURNING *`,
        values
      );
      return result.rows[0];
    } catch (error) {
      console.error('? Error updating bulk upload item:', error);
      throw error;
    }
  },

  async getBulkUploadItems(bulkUploadId) {
    try {
      const result = await pool.query(
        "SELECT * FROM bulk_upload_items WHERE bulk_upload_id = $1 ORDER BY row_number",
        [bulkUploadId]
      );
      return result.rows;
    } catch (error) {
      console.error('? Error getting bulk upload items:', error);
      throw error;
    }
  },

  async getExpiredWorkHistory() {
    try {
      const result = await pool.query(
        "SELECT * FROM work_history WHERE expires_at < NOW() AND result_files IS NOT NULL"
      );
      return result.rows;
    } catch (error) {
      console.error('? Error getting expired work history:', error);
      throw error;
    }
  },

  async getExpiredBulkUploads() {
    try {
      const result = await pool.query(
        "SELECT * FROM bulk_uploads WHERE expires_at < NOW() AND result_zip_path IS NOT NULL"
      );
      return result.rows;
    } catch (error) {
      console.error('? Error getting expired bulk uploads:', error);
      throw error;
    }
  },

  async logCleanup(cleanupData) {
    try {
      const result = await pool.query(
        `INSERT INTO cleanup_logs (cleanup_date, files_deleted, space_freed_mb, work_history_ids, bulk_upload_ids, status, error_message, created_at)
         VALUES (NOW(), $1, $2, $3, $4, $5, $6, NOW()) RETURNING *`,
        [
          cleanupData.filesDeleted,
          cleanupData.spaceFreedMb,
          cleanupData.workHistoryIds,
          cleanupData.bulkUploadIds,
          cleanupData.status,
          cleanupData.errorMessage || null
        ]
      );
      return result.rows[0];
    } catch (error) {
      console.error('? Error logging cleanup:', error);
      throw error;
    }
  },

  async getCleanupLogs(limit = 50) {
    try {
      const result = await pool.query(
        "SELECT * FROM cleanup_logs ORDER BY cleanup_date DESC LIMIT $1",
        [limit]
      );
      return result.rows;
    } catch (error) {
      console.error('? Error getting cleanup logs:', error);
      throw error;
    }
  },

  async changeUserPassword(userId, currentPassword, newPassword) {
    try {
      const result = await pool.query("SELECT * FROM users WHERE id = $1", [userId]);

      if (result.rows.length === 0) {
        throw new Error('User not found');
      }

      const user = result.rows[0];
      const isValidPassword = await bcrypt.compare(currentPassword, user.password_hash);

      if (!isValidPassword) {
        throw new Error('Current password is incorrect');
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await pool.query(
        "UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2",
        [hashedPassword, userId]
      );

      return { success: true, message: 'Password updated successfully' };
    } catch (error) {
      console.error('? Error changing password:', error);
      throw error;
    }
  },

  async createTransaction(transactionData) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const result = await client.query(
        `INSERT INTO transactions (user_id, transaction_type, amount_bdt, credits_amount, payment_method, payment_status, transaction_id, gateway_reference, payment_date, notes, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW()) RETURNING *`,
        [
          transactionData.userId,
          transactionData.transactionType || 'credit_purchase',
          transactionData.amountBdt,
          transactionData.creditsAmount,
          transactionData.paymentMethod,
          transactionData.paymentStatus || 'pending',
          transactionData.transactionId,
          transactionData.gatewayReference || null,
          transactionData.paymentDate || null,
          transactionData.notes || null
        ]
      );

      if (transactionData.paymentStatus === 'completed') {
        await client.query(
          "UPDATE users SET credits = credits + $1, total_spent = total_spent + $2, updated_at = NOW() WHERE id = $3",
          [transactionData.creditsAmount, transactionData.amountBdt, transactionData.userId]
        );
      }

      await client.query('COMMIT');
      return result.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('? Error creating transaction:', error);
      throw error;
    } finally {
      client.release();
    }
  },

  async getUserTransactions(userId, filters = {}, pagination = {}) {
    try {
      const { dateFrom, dateTo, transactionType, paymentStatus } = filters;
      const { limit = 10, offset = 0, sortBy = 'created_at', sortOrder = 'DESC' } = pagination;

      let query = "SELECT * FROM transactions WHERE user_id = $1";
      const params = [userId];
      let paramIndex = 2;

      if (dateFrom) {
        query += ` AND created_at >= $${paramIndex}`;
        params.push(dateFrom);
        paramIndex++;
      }

      if (dateTo) {
        query += ` AND created_at <= $${paramIndex}`;
        params.push(dateTo);
        paramIndex++;
      }

      if (transactionType) {
        query += ` AND transaction_type = $${paramIndex}`;
        params.push(transactionType);
        paramIndex++;
      }

      if (paymentStatus) {
        query += ` AND payment_status = $${paramIndex}`;
        params.push(paymentStatus);
        paramIndex++;
      }

      const countQuery = query.replace('SELECT *', 'SELECT COUNT(*)');
      const countResult = await pool.query(countQuery, params);
      const totalCount = parseInt(countResult.rows[0].count);

      query += ` ORDER BY ${sortBy} ${sortOrder} LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      params.push(limit, offset);

      const result = await pool.query(query, params);

      return {
        transactions: result.rows,
        totalCount,
        limit,
        offset
      };
    } catch (error) {
      console.error('? Error getting user transactions:', error);
      throw error;
    }
  },

  async getTransactionSummary(userId) {
    try {
      const result = await pool.query(
        `SELECT
          COUNT(*) as total_transactions,
          COALESCE(SUM(amount_bdt), 0) as total_spent,
          COALESCE(SUM(credits_amount), 0) as total_credits_purchased
         FROM transactions
         WHERE user_id = $1 AND payment_status = 'completed'`,
        [userId]
      );

      return result.rows[0];
    } catch (error) {
      console.error('? Error getting transaction summary:', error);
      throw error;
    }
  },

  async getCreditUsageByService(userId, dateRange = {}) {
    try {
      console.log(`[getCreditUsageByService] Fetching for userId: ${userId}, dateRange:`, dateRange);

      const { dateFrom, dateTo } = dateRange;
      let query = `
        SELECT
          service_id,
          service_name,
          COUNT(*) as times_used,
          SUM(credits_used) as total_credits_spent,
          MAX(created_at) as last_used
        FROM work_history
        WHERE user_id = $1`;

      const params = [userId];
      let paramIndex = 2;

      if (dateFrom) {
        query += ` AND created_at >= $${paramIndex}`;
        params.push(dateFrom);
        paramIndex++;
      }

      if (dateTo) {
        query += ` AND created_at <= $${paramIndex}`;
        params.push(dateTo);
        paramIndex++;
      }

      query += ` GROUP BY service_id, service_name ORDER BY total_credits_spent DESC`;

      const result = await pool.query(query, params);

      // Build total credits query with same date filters as main query
      let totalCreditsQuery = `SELECT COALESCE(SUM(credits_used), 0) as total FROM work_history WHERE user_id = $1`;
      const totalParams = [userId];
      let totalParamIndex = 2;

      if (dateFrom) {
        totalCreditsQuery += ` AND created_at >= $${totalParamIndex}`;
        totalParams.push(dateFrom);
        totalParamIndex++;
      }

      if (dateTo) {
        totalCreditsQuery += ` AND created_at <= $${totalParamIndex}`;
        totalParams.push(dateTo);
      }

      const totalResult = await pool.query(totalCreditsQuery, totalParams);
      const totalCredits = parseInt(totalResult.rows[0].total);

      console.log(`[getCreditUsageByService] Found ${result.rows.length} services, total credits: ${totalCredits}`);

      const usageWithPercentage = result.rows.map(row => ({
        serviceId: row.service_id,
        serviceName: row.service_name,
        timesUsed: parseInt(row.times_used),
        totalCreditsSpent: parseInt(row.total_credits_spent),
        lastUsed: row.last_used,
        percentage: totalCredits > 0 ? ((parseInt(row.total_credits_spent) / totalCredits) * 100).toFixed(2) : 0
      }));

      return {
        services: usageWithPercentage,
        totalCreditsSpent: totalCredits
      };
    } catch (error) {
      console.error('❌ Error getting credit usage by service:', error);
      throw error;
    }
  },

  async getCreditHistory(userId, filters = {}, pagination = {}) {
    try {
      const { dateFrom, dateTo, transactionType, serviceId, search } = filters;
      const { limit = 20, offset = 0, sortBy = 'date', sortOrder = 'DESC' } = pagination;

      const creditHistory = [];

      let purchasesQuery = `
        SELECT
          id,
          created_at as date,
          'purchase' as type,
          CONCAT('Credit Purchase - ', payment_method) as description,
          credits_amount as credits_change,
          amount_bdt,
          payment_method,
          transaction_id::text as reference_id,
          payment_status as status,
          NULL as job_id
        FROM transactions
        WHERE user_id = $1 AND payment_status = 'completed'`;

      let usageQuery = `
        SELECT
          id,
          created_at as date,
          'usage' as type,
          CONCAT('Service: ', service_name, ' - ', file_name) as description,
          -credits_used as credits_change,
          null as amount_bdt,
          service_name as payment_method,
          id::text as reference_id,
          status,
          id::text as job_id
        FROM work_history
        WHERE user_id = $1`;

      const params = [userId];
      let paramIndex = 2;

      if (dateFrom) {
        purchasesQuery += ` AND created_at >= $${paramIndex}`;
        usageQuery += ` AND created_at >= $${paramIndex}`;
        params.push(dateFrom);
        paramIndex++;
      }

      if (dateTo) {
        purchasesQuery += ` AND created_at <= $${paramIndex}`;
        usageQuery += ` AND created_at <= $${paramIndex}`;
        params.push(dateTo);
        paramIndex++;
      }

      if (transactionType) {
        if (transactionType === 'purchase') {
          usageQuery = `SELECT
            NULL::uuid as id,
            NULL::timestamptz as date,
            NULL::text as type,
            NULL::text as description,
            NULL::numeric as credits_change,
            NULL::numeric as amount_bdt,
            NULL::text as payment_method,
            NULL::text as reference_id,
            NULL::text as status,
            NULL::text as job_id
            WHERE FALSE`;
        } else if (transactionType === 'usage') {
          purchasesQuery = `SELECT
            NULL::uuid as id,
            NULL::timestamptz as date,
            NULL::text as type,
            NULL::text as description,
            NULL::numeric as credits_change,
            NULL::numeric as amount_bdt,
            NULL::text as payment_method,
            NULL::text as reference_id,
            NULL::text as status,
            NULL::text as job_id
            WHERE FALSE`;
        }
      }

      if (serviceId && transactionType !== 'purchase') {
        usageQuery += ` AND service_id = $${paramIndex}`;
        params.push(serviceId);
        paramIndex++;
      }

      const combinedQuery = `
        SELECT * FROM (
          ${purchasesQuery}
          UNION ALL
          ${usageQuery}
        ) combined
        ${search ? `WHERE description ILIKE $${paramIndex}` : ''}
        ORDER BY date ${sortOrder}
        LIMIT $${search ? paramIndex + 1 : paramIndex} OFFSET $${search ? paramIndex + 2 : paramIndex + 1}
      `;

      const queryParams = [...params];
      if (search) {
        queryParams.push(`%${search}%`);
      }
      queryParams.push(limit, offset);

      const countQuery = `
        SELECT COUNT(*) as total FROM (
          ${purchasesQuery}
          UNION ALL
          ${usageQuery}
        ) combined
        ${search ? `WHERE description ILIKE $${paramIndex}` : ''}
      `;

      const countParams = [...params];
      if (search) {
        countParams.push(`%${search}%`);
      }

      const [historyResult, countResult] = await Promise.all([
        pool.query(combinedQuery, queryParams),
        pool.query(countQuery, countParams)
      ]);

      const totalCount = parseInt(countResult.rows[0].total);

      const currentUserResult = await pool.query(
        'SELECT credits FROM users WHERE id = $1',
        [userId]
      );
      const currentBalance = parseFloat(currentUserResult.rows[0]?.credits || 0);

      // Calculate previous balance for each transaction (reverse chronological)
      let runningBalance = currentBalance;
      const historyWithBalance = historyResult.rows.map((row, index) => {
        const previousCredit = runningBalance;
        const creditsChange = parseFloat(row.credits_change);
        runningBalance = runningBalance - creditsChange;

        return {
          id: row.id,
          date: row.date,
          type: row.type,
          description: row.description,
          creditsChange: creditsChange,
          amountBdt: row.amount_bdt ? parseFloat(row.amount_bdt) : null,
          paymentMethod: row.payment_method,
          referenceId: row.reference_id,
          status: row.status,
          jobId: row.job_id || null,
          previousCredit: parseFloat(previousCredit.toFixed(2))
        };
      });

      const summaryQuery = `
        SELECT
          COALESCE(SUM(CASE WHEN type = 'purchase' THEN credits_change ELSE 0 END), 0) as total_purchased,
          COALESCE(SUM(CASE WHEN type = 'usage' THEN ABS(credits_change) ELSE 0 END), 0) as total_used,
          COALESCE(SUM(credits_change), 0) as net_change
        FROM (
          ${purchasesQuery}
          UNION ALL
          ${usageQuery}
        ) combined
      `;

      const summaryResult = await pool.query(summaryQuery, params);
      const summary = {
        totalPurchased: parseFloat(summaryResult.rows[0].total_purchased),
        totalUsed: parseFloat(summaryResult.rows[0].total_used),
        netChange: parseFloat(summaryResult.rows[0].net_change),
        currentBalance
      };

      return {
        history: historyWithBalance,
        summary,
        totalCount,
        limit,
        offset,
        currentPage: Math.floor(offset / limit) + 1,
        totalPages: Math.ceil(totalCount / limit)
      };
    } catch (error) {
      console.error('❌ Error getting credit history:', error);
      throw error;
    }
  },

  async updateUserProfile(userId, updates) {
    try {
      const fields = [];
      const values = [];
      let queryIndex = 1;

      if (updates.name !== undefined) { fields.push(`name = $${queryIndex++}`); values.push(updates.name); }
      if (updates.company !== undefined) { fields.push(`company = $${queryIndex++}`); values.push(updates.company); }
      if (updates.mobile !== undefined) { fields.push(`mobile = $${queryIndex++}`); values.push(updates.mobile); }

      if (fields.length === 0) {
        throw new Error('No fields to update');
      }

      values.push(userId);
      const result = await pool.query(
        `UPDATE users SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${queryIndex} RETURNING *`,
        values
      );

      if (result.rows.length === 0) {
        throw new Error('User not found');
      }

      const user = result.rows[0];
      return {
        id: user.id,
        email: user.email,
        name: user.name,
        company: user.company,
        mobile: user.mobile,
        credits: user.is_admin ? 999999 : user.credits,
        isAdmin: user.is_admin,
        emailVerified: user.email_verified,
        memberSince: user.member_since,
        trialEndsAt: user.trial_ends_at,
        status: user.status,
        totalSpent: parseFloat(user.total_spent),
        lastActivity: user.last_activity,
        createdAt: user.created_at,
        updatedAt: user.updated_at
      };
    } catch (error) {
      console.error('? Error updating user profile:', error);
      throw error;
    }
  },

  async createJob(jobData) {
    try {
      const result = await pool.query(
        `INSERT INTO automation_jobs (
          id, user_id, service_id, service_name, status, priority,
          input_file_path, input_file_name, output_directory,
          credits_used, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
        RETURNING *`,
        [
          jobData.id,
          jobData.user_id,
          jobData.service_id,
          jobData.service_name,
          jobData.status,
          jobData.priority || 0,
          jobData.input_file_path,
          jobData.input_file_name,
          jobData.output_directory,
          jobData.credits_used
        ]
      );
      return result.rows[0];
    } catch (error) {
      console.error('? Error creating job:', error);
      throw error;
    }
  },

  async getJob(jobId) {
    try {
      const result = await pool.query(
        "SELECT * FROM automation_jobs WHERE id = $1",
        [jobId]
      );
      return result.rows[0];
    } catch (error) {
      console.error('? Error getting job:', error);
      throw error;
    }
  },

  async updateJobStatus(jobId, status, updates = {}) {
    try {
      const fields = ['status = $2'];
      const values = [jobId, status];
      let queryIndex = 3;

      if (updates.started_at !== undefined) {
        fields.push(`started_at = $${queryIndex++}`);
        values.push(updates.started_at);
      }
      if (updates.completed_at !== undefined) {
        fields.push(`completed_at = $${queryIndex++}`);
        values.push(updates.completed_at);
      }
      if (updates.result_files !== undefined) {
        fields.push(`result_files = $${queryIndex++}`);
        values.push(JSON.stringify(updates.result_files));
      }
      if (updates.download_url !== undefined) {
        fields.push(`download_url = $${queryIndex++}`);
        values.push(updates.download_url);
      }
      if (updates.error_message !== undefined) {
        fields.push(`error_message = $${queryIndex++}`);
        values.push(updates.error_message);
      }

      const result = await pool.query(
        `UPDATE automation_jobs SET ${fields.join(', ')} WHERE id = $1 RETURNING *`,
        values
      );
      return result.rows[0];
    } catch (error) {
      console.error('? Error updating job status:', error);
      throw error;
    }
  },

  async getNextQueuedJob(serviceId) {
    try {
      const result = await pool.query(
        `SELECT * FROM automation_jobs
         WHERE service_id = $1 AND status = 'queued'
         ORDER BY priority DESC, created_at ASC
         LIMIT 1`,
        [serviceId]
      );
      return result.rows[0];
    } catch (error) {
      console.error('? Error getting next queued job:', error);
      throw error;
    }
  },

  async getQueuePosition(jobId) {
    try {
      const jobResult = await pool.query(
        "SELECT service_id, priority, created_at FROM automation_jobs WHERE id = $1",
        [jobId]
      );

      if (jobResult.rows.length === 0) {
        return 0;
      }

      const job = jobResult.rows[0];

      const countResult = await pool.query(
        `SELECT COUNT(*) as position FROM automation_jobs
         WHERE service_id = $1 AND status = 'queued'
         AND (priority > $2 OR (priority = $2 AND created_at < $3))`,
        [job.service_id, job.priority, job.created_at]
      );

      return parseInt(countResult.rows[0].position) + 1;
    } catch (error) {
      console.error('? Error getting queue position:', error);
      throw error;
    }
  },

  async getUserJobs(userId, limit = 20) {
    try {
      const result = await pool.query(
        `SELECT * FROM automation_jobs
         WHERE user_id = $1
         ORDER BY created_at DESC
         LIMIT $2`,
        [userId, limit]
      );
      return result.rows;
    } catch (error) {
      console.error('? Error getting user jobs:', error);
      throw error;
    }
  },

  async refundCredits(userId, credits) {
    try {
      const result = await pool.query(
        `UPDATE users SET credits = credits + $1
         WHERE id = $2
         RETURNING credits`,
        [credits, userId]
      );
      console.log(`? Refunded ${credits} credits to user ${userId}`);
      return result.rows[0];
    } catch (error) {
      console.error('? Error refunding credits:', error);
      throw error;
    }
  },

  async setVerificationToken(userId, token, expiresInHours = 24) {
    try {
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + expiresInHours);

      await pool.query(
        `UPDATE users
         SET verification_token = $1, verification_token_expires = $2
         WHERE id = $3`,
        [token, expiresAt, userId]
      );

      console.log(`✅ Verification token set for user ${userId}, expires at ${expiresAt.toISOString()}`);
      return { token, expiresAt };
    } catch (error) {
      console.error('❌ Error setting verification token:', error);
      throw error;
    }
  },

  async verifyEmailToken(token) {
    try {
      const result = await pool.query(
        `SELECT id, email, name, verification_token_expires
         FROM users
         WHERE verification_token = $1`,
        [token]
      );

      if (result.rows.length === 0) {
        throw new Error('Invalid verification token');
      }

      const user = result.rows[0];
      const now = new Date();
      const expiresAt = new Date(user.verification_token_expires);

      if (now > expiresAt) {
        throw new Error('Verification token has expired');
      }

      await pool.query(
        `UPDATE users
         SET email_verified = TRUE,
             verification_token = NULL,
             verification_token_expires = NULL
         WHERE id = $1`,
        [user.id]
      );

      console.log(`✅ Email verified for user ${user.email}`);
      return {
        id: user.id,
        email: user.email,
        name: user.name
      };
    } catch (error) {
      console.error('❌ Error verifying email token:', error);
      throw error;
    }
  },

  async getUserByEmail(email) {
    try {
      const result = await pool.query(
        `SELECT id, email, name, email_verified
         FROM users
         WHERE email = $1`,
        [email]
      );

      if (result.rows.length === 0) {
        return null;
      }

      return result.rows[0];
    } catch (error) {
      console.error('❌ Error getting user by email:', error);
      throw error;
    }
  },

  async setPasswordResetToken(userId, token, expiresInHours = 1) {
    try {
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + expiresInHours);

      await pool.query(
        `UPDATE users
         SET password_reset_token = $1, password_reset_token_expires = $2
         WHERE id = $3`,
        [token, expiresAt, userId]
      );

      console.log(`✅ Password reset token set for user ${userId}, expires at ${expiresAt.toISOString()}`);
      return { token, expiresAt };
    } catch (error) {
      console.error('❌ Error setting password reset token:', error);
      throw error;
    }
  },

  async resetPasswordWithToken(token, newPassword) {
    try {
      const result = await pool.query(
        `SELECT id, email, name, password_reset_token_expires
         FROM users
         WHERE password_reset_token = $1`,
        [token]
      );

      if (result.rows.length === 0) {
        throw new Error('Invalid password reset token');
      }

      const user = result.rows[0];
      const now = new Date();
      const expiresAt = new Date(user.password_reset_token_expires);

      if (now > expiresAt) {
        throw new Error('Password reset token has expired');
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);

      await pool.query(
        `UPDATE users
         SET password_hash = $1,
             password_reset_token = NULL,
             password_reset_token_expires = NULL
         WHERE id = $2`,
        [hashedPassword, user.id]
      );

      console.log(`✅ Password reset for user ${user.email}`);
      return {
        id: user.id,
        email: user.email,
        name: user.name
      };
    } catch (error) {
      console.error('❌ Error resetting password:', error);
      throw error;
    }
  },

  async cleanupExpiredTokens() {
    try {
      const now = new Date();

      const verificationResult = await pool.query(
        `UPDATE users
         SET verification_token = NULL, verification_token_expires = NULL
         WHERE verification_token_expires < $1 AND verification_token IS NOT NULL`,
        [now]
      );

      const resetResult = await pool.query(
        `UPDATE users
         SET password_reset_token = NULL, password_reset_token_expires = NULL
         WHERE password_reset_token_expires < $1 AND password_reset_token IS NOT NULL`,
        [now]
      );

      console.log(`🧹 Cleaned up ${verificationResult.rowCount} expired verification tokens and ${resetResult.rowCount} expired reset tokens`);
      return {
        verificationTokensCleared: verificationResult.rowCount,
        resetTokensCleared: resetResult.rowCount
      };
    } catch (error) {
      console.error('❌ Error cleaning up expired tokens:', error);
      throw error;
    }
  },

  async manualVerifyEmail(userId) {
    try {
      await pool.query(
        `UPDATE users
         SET email_verified = TRUE,
             verification_token = NULL,
             verification_token_expires = NULL,
             updated_at = NOW()
         WHERE id = $1`,
        [userId]
      );

      console.log(`✅ Email manually verified by admin for user ${userId}`);
      return { success: true };
    } catch (error) {
      console.error('❌ Error manually verifying email:', error);
      throw error;
    }
  },

  async createContactMessage({ name, email, company, subject, message, ipAddress }) {
    try {
      const result = await pool.query(
        `INSERT INTO contact_messages (name, email, company, subject, message, ip_address, status)
         VALUES ($1, $2, $3, $4, $5, $6, 'new')
         RETURNING id, submitted_at`,
        [name, email, company || null, subject, message, ipAddress || null]
      );

      console.log(`✅ Contact message created from ${email}`);
      return result.rows[0];
    } catch (error) {
      console.error('❌ Error creating contact message:', error);
      throw error;
    }
  },

  async getContactMessages({ limit = 50, offset = 0, status = null, search = null }) {
    try {
      let query = `
        SELECT id, name, email, company, subject, message, submitted_at, status
        FROM contact_messages
      `;
      const params = [];
      const conditions = [];

      if (status) {
        conditions.push(`status = $${params.length + 1}`);
        params.push(status);
      }

      if (search) {
        conditions.push(`(name ILIKE $${params.length + 1} OR email ILIKE $${params.length + 1} OR subject ILIKE $${params.length + 1} OR message ILIKE $${params.length + 1})`);
        params.push(`%${search}%`);
      }

      if (conditions.length > 0) {
        query += ` WHERE ${conditions.join(' AND ')}`;
      }

      query += ` ORDER BY submitted_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
      params.push(limit, offset);

      const result = await pool.query(query, params);

      const countQuery = `SELECT COUNT(*) as total FROM contact_messages` +
        (conditions.length > 0 ? ` WHERE ${conditions.join(' AND ')}` : '');
      const countResult = await pool.query(countQuery, params.slice(0, params.length - 2));

      return {
        messages: result.rows,
        total: parseInt(countResult.rows[0].total),
        limit,
        offset
      };
    } catch (error) {
      console.error('❌ Error fetching contact messages:', error);
      throw error;
    }
  },

  async updateContactMessageStatus(messageId, status) {
    try {
      const result = await pool.query(
        `UPDATE contact_messages
         SET status = $1
         WHERE id = $2
         RETURNING id, status`,
        [status, messageId]
      );

      if (result.rows.length === 0) {
        throw new Error('Contact message not found');
      }

      console.log(`✅ Contact message ${messageId} status updated to ${status}`);
      return result.rows[0];
    } catch (error) {
      console.error('❌ Error updating contact message status:', error);
      throw error;
    }
  },

  async checkContactFormRateLimit(email) {
    try {
      const oneHourAgo = new Date(Date.now() - 3600000);
      const result = await pool.query(
        `SELECT COUNT(*) as count
         FROM contact_messages
         WHERE email = $1 AND submitted_at > $2`,
        [email, oneHourAgo]
      );

      const count = parseInt(result.rows[0].count);
      return {
        allowed: count < 3,
        remaining: Math.max(0, 3 - count),
        count
      };
    } catch (error) {
      console.error('❌ Error checking contact form rate limit:', error);
      throw error;
    }
  },

  async savePortalCredentials(userId, portalName, username, password) {
    try {
      const encryptionKey = process.env.CREDENTIAL_ENCRYPTION_KEY || 'default-encryption-key-change-in-production';

      const result = await pool.query(
        `INSERT INTO portal_credentials (user_id, portal_name, username, encrypted_password)
         VALUES ($1, $2, $3, pgp_sym_encrypt($4, $5))
         ON CONFLICT (user_id, portal_name)
         DO UPDATE SET
           username = EXCLUDED.username,
           encrypted_password = EXCLUDED.encrypted_password,
           updated_at = NOW()
         RETURNING id, user_id, portal_name, username, created_at, updated_at`,
        [userId, portalName, username, password, encryptionKey]
      );

      console.log(`✅ Saved credentials for user ${userId} - portal: ${portalName}`);
      return result.rows[0];
    } catch (error) {
      console.error('❌ Error saving portal credentials:', error);
      throw error;
    }
  },

  async getPortalCredentials(userId, portalName) {
    try {
      const encryptionKey = process.env.CREDENTIAL_ENCRYPTION_KEY || 'default-encryption-key-change-in-production';

      const result = await pool.query(
        `SELECT id, user_id, portal_name, username,
                pgp_sym_decrypt(encrypted_password, $3) as password,
                created_at, updated_at
         FROM portal_credentials
         WHERE user_id = $1 AND portal_name = $2`,
        [userId, portalName, encryptionKey]
      );

      if (result.rows.length === 0) {
        return null;
      }

      return result.rows[0];
    } catch (error) {
      console.error('❌ Error getting portal credentials:', error);
      throw error;
    }
  },

  async hasPortalCredentials(userId, portalName) {
    try {
      const result = await pool.query(
        `SELECT EXISTS(
           SELECT 1 FROM portal_credentials
           WHERE user_id = $1 AND portal_name = $2
         ) as exists`,
        [userId, portalName]
      );

      return result.rows[0].exists;
    } catch (error) {
      console.error('❌ Error checking portal credentials:', error);
      throw error;
    }
  },

  async deletePortalCredentials(userId, portalName) {
    try {
      const result = await pool.query(
        `DELETE FROM portal_credentials
         WHERE user_id = $1 AND portal_name = $2
         RETURNING id`,
        [userId, portalName]
      );

      console.log(`✅ Deleted credentials for user ${userId} - portal: ${portalName}`);
      return result.rows.length > 0;
    } catch (error) {
      console.error('❌ Error deleting portal credentials:', error);
      throw error;
    }
  },

  async getUserPortalCredentials(userId) {
    try {
      const result = await pool.query(
        `SELECT id, user_id, portal_name, username, created_at, updated_at
         FROM portal_credentials
         WHERE user_id = $1
         ORDER BY portal_name`,
        [userId]
      );

      return result.rows;
    } catch (error) {
      console.error('❌ Error getting user portal credentials:', error);
      throw error;
    }
  },

  async updateCredentialTestResult(userId, portalName, success) {
    try {
      const result = await pool.query(
        `UPDATE portal_credentials
         SET last_test_at = NOW(),
             last_test_success = $3,
             failure_count = CASE WHEN $3 = true THEN 0 ELSE COALESCE(failure_count, 0) + 1 END,
             last_failure_at = CASE WHEN $3 = false THEN NOW() ELSE last_failure_at END
         WHERE user_id = $1 AND portal_name = $2
         RETURNING id, last_test_at, last_test_success, failure_count`,
        [userId, portalName, success]
      );

      return result.rows[0];
    } catch (error) {
      console.error('❌ Error updating credential test result:', error);
      throw error;
    }
  },

  async createNotification(userId, type, title, message, options = {}) {
    try {
      const { portalName, jobId, actionUrl, actionLabel } = options;

      const result = await pool.query(
        `INSERT INTO notifications (user_id, type, title, message, portal_name, job_id, action_url, action_label)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING *`,
        [userId, type, title, message, portalName || null, jobId || null, actionUrl || null, actionLabel || null]
      );

      console.log(`✅ Created notification for user ${userId}: ${type}`);
      return result.rows[0];
    } catch (error) {
      console.error('❌ Error creating notification:', error);
      throw error;
    }
  },

  async getUserNotifications(userId, limit = 50, unreadOnly = false) {
    try {
      let query = `
        SELECT *
        FROM notifications
        WHERE user_id = $1
      `;

      if (unreadOnly) {
        query += ` AND is_read = false`;
      }

      query += ` ORDER BY created_at DESC LIMIT $2`;

      const result = await pool.query(query, [userId, limit]);
      return result.rows;
    } catch (error) {
      console.error('❌ Error getting user notifications:', error);
      throw error;
    }
  },

  async getUnreadNotificationCount(userId) {
    try {
      const result = await pool.query(
        `SELECT COUNT(*) as count
         FROM notifications
         WHERE user_id = $1 AND is_read = false`,
        [userId]
      );

      return parseInt(result.rows[0].count);
    } catch (error) {
      console.error('❌ Error getting unread notification count:', error);
      throw error;
    }
  },

  async markNotificationAsRead(notificationId, userId) {
    try {
      const result = await pool.query(
        `UPDATE notifications
         SET is_read = true, read_at = NOW()
         WHERE id = $1 AND user_id = $2
         RETURNING *`,
        [notificationId, userId]
      );

      return result.rows[0];
    } catch (error) {
      console.error('❌ Error marking notification as read:', error);
      throw error;
    }
  },

  async markAllNotificationsAsRead(userId) {
    try {
      await pool.query(
        `UPDATE notifications
         SET is_read = true, read_at = NOW()
         WHERE user_id = $1 AND is_read = false`,
        [userId]
      );

      console.log(`✅ Marked all notifications as read for user ${userId}`);
      return true;
    } catch (error) {
      console.error('❌ Error marking all notifications as read:', error);
      throw error;
    }
  },

  async deleteNotification(notificationId, userId) {
    try {
      const result = await pool.query(
        `DELETE FROM notifications
         WHERE id = $1 AND user_id = $2
         RETURNING id`,
        [notificationId, userId]
      );

      return result.rows.length > 0;
    } catch (error) {
      console.error('❌ Error deleting notification:', error);
      throw error;
    }
  },

  async getUserNotificationPreferences(userId) {
    try {
      let result = await pool.query(
        `SELECT * FROM notification_preferences WHERE user_id = $1`,
        [userId]
      );

      if (result.rows.length === 0) {
        result = await pool.query(
          `INSERT INTO notification_preferences (user_id)
           VALUES ($1)
           RETURNING *`,
          [userId]
        );
      }

      return result.rows[0];
    } catch (error) {
      console.error('❌ Error getting notification preferences:', error);
      throw error;
    }
  },

  async updateNotificationPreferences(userId, preferences) {
    try {
      const { emailOnCredentialFailure, emailOnJobComplete, emailOnCreditLow, inAppNotifications } = preferences;

      const result = await pool.query(
        `INSERT INTO notification_preferences (user_id, email_on_credential_failure, email_on_job_complete, email_on_credit_low, in_app_notifications)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (user_id)
         DO UPDATE SET
           email_on_credential_failure = EXCLUDED.email_on_credential_failure,
           email_on_job_complete = EXCLUDED.email_on_job_complete,
           email_on_credit_low = EXCLUDED.email_on_credit_low,
           in_app_notifications = EXCLUDED.in_app_notifications,
           updated_at = NOW()
         RETURNING *`,
        [userId, emailOnCredentialFailure, emailOnJobComplete, emailOnCreditLow, inAppNotifications]
      );

      console.log(`✅ Updated notification preferences for user ${userId}`);
      return result.rows[0];
    } catch (error) {
      console.error('❌ Error updating notification preferences:', error);
      throw error;
    }
  },

  // Ads Settings Methods
  async getAdsSettings() {
    try {
      const result = await pool.query(
        `SELECT * FROM ads_settings ORDER BY page_name, placement_location`
      );
      return result.rows;
    } catch (error) {
      console.error('❌ Error fetching ads settings:', error);
      throw error;
    }
  },

  async getAdSettingByLocation(location) {
    try {
      const result = await pool.query(
        `SELECT * FROM ads_settings WHERE placement_location = $1`,
        [location]
      );
      return result.rows[0] || null;
    } catch (error) {
      console.error('❌ Error fetching ad setting by location:', error);
      throw error;
    }
  },

  async updateAdSetting(id, updates) {
    try {
      const fields = [];
      const values = [];
      let paramCount = 1;

      if (updates.ad_client_id !== undefined) {
        fields.push(`ad_client_id = $${paramCount++}`);
        values.push(updates.ad_client_id);
      }
      if (updates.ad_slot_id !== undefined) {
        fields.push(`ad_slot_id = $${paramCount++}`);
        values.push(updates.ad_slot_id);
      }
      if (updates.ad_format !== undefined) {
        fields.push(`ad_format = $${paramCount++}`);
        values.push(updates.ad_format);
      }
      if (updates.full_width_responsive !== undefined) {
        fields.push(`full_width_responsive = $${paramCount++}`);
        values.push(updates.full_width_responsive);
      }
      if (updates.enabled !== undefined) {
        fields.push(`enabled = $${paramCount++}`);
        values.push(updates.enabled);
      }

      if (fields.length === 0) {
        throw new Error('No fields to update');
      }

      values.push(id);

      const result = await pool.query(
        `UPDATE ads_settings SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${paramCount} RETURNING *`,
        values
      );

      console.log(`✅ Updated ad setting ${id}`);
      return result.rows[0];
    } catch (error) {
      console.error('❌ Error updating ad setting:', error);
      throw error;
    }
  },

  async toggleAdSetting(id, enabled) {
    try {
      const result = await pool.query(
        `UPDATE ads_settings SET enabled = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
        [enabled, id]
      );

      console.log(`✅ Toggled ad setting ${id} to ${enabled}`);
      return result.rows[0];
    } catch (error) {
      console.error('❌ Error toggling ad setting:', error);
      throw error;
    }
  }
};

module.exports = {
  initDatabase,
  DatabaseService
};
