# Deployment Checklist - Credential Management System

## Pre-Deployment

### 1. Database Migration

- [ ] **Backup existing database**
  ```bash
  pg_dump -h $DB_HOST -U $DB_USER -d $DB_NAME > backup_$(date +%Y%m%d).sql
  ```

- [ ] **Run the migration**
  ```bash
  node run-notifications-migration.cjs
  ```

- [ ] **Verify tables created**
  - Check `notifications` table exists
  - Check `notification_preferences` table exists
  - Check `portal_credentials` has new columns

- [ ] **Test migration rollback plan** (if needed)
  ```sql
  -- Rollback commands (if something goes wrong)
  DROP TABLE IF EXISTS notifications CASCADE;
  DROP TABLE IF EXISTS notification_preferences CASCADE;
  ALTER TABLE portal_credentials DROP COLUMN IF EXISTS last_test_at;
  ALTER TABLE portal_credentials DROP COLUMN IF EXISTS last_test_success;
  ALTER TABLE portal_credentials DROP COLUMN IF EXISTS failure_count;
  ALTER TABLE portal_credentials DROP COLUMN IF EXISTS last_failure_at;
  ```

### 2. Environment Check

- [ ] Python 3.x installed
- [ ] Chrome/Chromium browser installed
- [ ] ChromeDriver installed
- [ ] Selenium dependencies installed
- [ ] Node.js dependencies up to date (`npm install`)
- [ ] Database connection working
- [ ] Temp directory writable

### 3. Code Review

- [ ] All new files are committed
- [ ] No debugging console.logs remaining
- [ ] Error handling is comprehensive
- [ ] Security best practices followed
- [ ] API endpoints have proper validation

## Deployment Steps

### 1. Stop Services

```bash
# Stop the running application
pm2 stop all
# or
killall node
```

### 2. Pull Latest Code

```bash
git pull origin main
# or copy files if not using git
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Run Database Migration

```bash
node run-notifications-migration.cjs
```

**Expected Output:**
```
🔗 Connecting to database...
✅ Connected to database successfully
📝 Running notifications system migration...
✅ Migration completed successfully!

📋 Created/Updated:
   - notifications table
   - notification_preferences table
   - Enhanced portal_credentials table with test tracking
   - Indexes for performance
   - Triggers for automatic timestamp updates

👋 Database connection closed
```

### 5. Build Frontend

```bash
npm run build
```

**Expected Output:**
```
✓ 1559 modules transformed.
dist/index.html                   1.36 kB
dist/assets/index-xxx.css        48.70 kB
dist/assets/index-xxx.js        513.98 kB
✓ built in 5.67s
```

### 6. Restart Services

```bash
# If using PM2
pm2 restart all
pm2 save

# Or start normally
npm start
```

### 7. Verify Services Running

```bash
# Check process
pm2 status
# or
ps aux | grep node

# Check logs
pm2 logs
# or
tail -f logs/app.log
```

## Post-Deployment Testing

### 1. Basic Health Checks

- [ ] Application loads successfully
- [ ] Login works correctly
- [ ] Dashboard displays properly
- [ ] No console errors in browser

### 2. Credential Management Tests

- [ ] Navigate to Account Settings > Portal Access
- [ ] See Bangladesh Bank EXP Portal card
- [ ] Click "Configure" button opens modal
- [ ] Enter test credentials
- [ ] Click "Test Credentials" works (15-60 seconds)
- [ ] See appropriate success/error message
- [ ] Click "Save Credentials" works
- [ ] Credentials persist after save
- [ ] Click "Update" shows saved username
- [ ] Click "Delete" removes credentials

### 3. Notification System Tests

- [ ] Bell icon appears in header (when logged in)
- [ ] Bell icon doesn't appear when logged out
- [ ] Click bell opens notification dropdown
- [ ] Empty state shows correctly
- [ ] Click outside closes dropdown
- [ ] Notification count shows in badge

### 4. Integration Tests

**Test Invalid Credentials:**
1. Set up invalid Bangladesh Bank credentials
2. Run exp-search automation
3. Wait for job to fail
4. Check that:
   - [ ] Job status shows "failed"
   - [ ] Credits were refunded
   - [ ] Notification was created
   - [ ] Bell icon shows unread count
   - [ ] Notification has "Update Credentials" button
   - [ ] Clicking button goes to credentials page

**Test Valid Credentials:**
1. Set up valid Bangladesh Bank credentials
2. Click "Test Credentials"
3. Wait for success message
4. Save credentials
5. Run exp-search automation
6. Check that:
   - [ ] Job completes successfully
   - [ ] Files are downloaded
   - [ ] No error notifications created

### 5. API Endpoint Tests

Test with curl or Postman:

```bash
# Test credential test endpoint
curl -X POST http://localhost:3001/api/credentials/test \
  -H "Content-Type: application/json" \
  -d '{"userId": "USER_ID", "portalName": "bangladesh_bank_exp"}'

# Test get notifications
curl http://localhost:3001/api/notifications/USER_ID

# Test unread count
curl http://localhost:3001/api/notifications/USER_ID/unread-count

# Test mark as read
curl -X PUT http://localhost:3001/api/notifications/NOTIFICATION_ID/read \
  -H "Content-Type: application/json" \
  -d '{"userId": "USER_ID"}'
```

### 6. Performance Tests

- [ ] Notification polling doesn't slow down app
- [ ] Test credentials completes in reasonable time
- [ ] Database queries are fast (< 100ms)
- [ ] No memory leaks in long-running processes
- [ ] Concurrent users don't cause issues

## Monitoring

### What to Monitor

**Immediately After Deployment:**
- Application errors in logs
- Database connection issues
- Failed credential tests
- User complaints or issues

**First 24 Hours:**
- Notification creation rate
- Credential test success/failure ratio
- Database table sizes
- API response times
- User adoption of new features

**Ongoing:**
- Weekly notification analytics
- Monthly credential test patterns
- Quarterly database cleanup needed
- User feedback and feature requests

### Log Files to Watch

```bash
# Application logs
tail -f logs/app.log

# PM2 logs
pm2 logs

# Database logs (if enabled)
tail -f /var/log/postgresql/postgresql-XX-main.log

# Nginx/Apache logs
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

### Key Metrics

Track these in your monitoring dashboard:

1. **Credential Test Success Rate**
   - Target: > 95% success for valid credentials

2. **Notification Delivery**
   - Target: < 1 second from creation to display

3. **API Response Times**
   - Test credentials: < 60 seconds
   - Get notifications: < 200ms
   - Create notification: < 100ms

4. **Database Performance**
   - Query time: < 100ms average
   - Connection pool: < 80% utilized

## Rollback Plan

If issues occur after deployment:

### Quick Rollback (Keep New Features)

1. **If migration is the problem:**
   ```bash
   # Rollback migration
   psql -h $DB_HOST -U $DB_USER -d $DB_NAME << EOF
   DROP TABLE IF EXISTS notifications CASCADE;
   DROP TABLE IF EXISTS notification_preferences CASCADE;
   ALTER TABLE portal_credentials DROP COLUMN IF EXISTS last_test_at;
   ALTER TABLE portal_credentials DROP COLUMN IF EXISTS last_test_success;
   ALTER TABLE portal_credentials DROP COLUMN IF EXISTS failure_count;
   ALTER TABLE portal_credentials DROP COLUMN IF EXISTS last_failure_at;
   EOF
   ```

2. **Restart with old code:**
   ```bash
   git checkout PREVIOUS_COMMIT_HASH
   npm install
   npm run build
   pm2 restart all
   ```

### Full Rollback

```bash
# Stop services
pm2 stop all

# Restore database backup
psql -h $DB_HOST -U $DB_USER -d $DB_NAME < backup_YYYYMMDD.sql

# Restore old code
git checkout PREVIOUS_COMMIT_HASH
npm install
npm run build

# Restart services
pm2 restart all
pm2 save
```

## Common Issues and Solutions

### Issue: Migration Fails

**Error:** "relation 'portal_credentials' does not exist"

**Solution:**
1. Check if you need to run portal credentials migration first
2. Run: `node run-portal-credentials-migration.cjs`
3. Then run notifications migration

### Issue: Test Credentials Times Out

**Error:** Test never completes or takes > 60 seconds

**Solutions:**
1. Check Python is installed: `python3 --version`
2. Check Selenium works: `python3 -c "import selenium"`
3. Check ChromeDriver: `chromedriver --version`
4. Check network access to Bangladesh Bank portal
5. Increase timeout in API endpoint if needed

### Issue: Notifications Don't Appear

**Error:** Bell icon shows 0 but should have notifications

**Solutions:**
1. Check browser console for errors
2. Verify API endpoints are accessible
3. Check database migration completed
4. Test API manually with curl
5. Check user is properly logged in

### Issue: Build Fails

**Error:** `npm run build` fails with errors

**Solutions:**
1. Check Node version: `node --version` (should be 16+)
2. Clear node_modules: `rm -rf node_modules && npm install`
3. Clear dist: `rm -rf dist`
4. Try build again: `npm run build`

## Success Criteria

Deployment is successful when:

- [x] Migration completed without errors
- [x] Build completed successfully
- [x] Application starts without errors
- [x] Users can log in normally
- [x] Credential management modal works
- [x] Test credentials feature works
- [x] Notifications appear correctly
- [x] Failed jobs create notifications
- [x] No errors in logs
- [x] Performance is acceptable

## Post-Deployment Tasks

### Within 1 Hour

- [ ] Monitor logs for errors
- [ ] Check with test user account
- [ ] Verify all features work
- [ ] Post announcement to users (optional)

### Within 24 Hours

- [ ] Review any user feedback
- [ ] Check error logs
- [ ] Monitor system performance
- [ ] Document any issues found

### Within 1 Week

- [ ] Analyze usage patterns
- [ ] Review notification creation rate
- [ ] Check for any edge cases
- [ ] Plan improvements based on feedback

## Documentation Updates

After successful deployment:

- [ ] Update main README if needed
- [ ] Share USER_GUIDE_CREDENTIALS.md with users
- [ ] Update internal wiki/docs
- [ ] Train support team on new features
- [ ] Create video tutorial (optional)

## Conclusion

Follow this checklist carefully to ensure a smooth deployment. If you encounter any issues not covered here, document them for future reference.

**Remember:**
- Always backup before migration
- Test in staging environment first (if available)
- Monitor closely after deployment
- Have rollback plan ready
- Document all changes

Good luck with your deployment! 🚀
