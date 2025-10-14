#!/usr/bin/env node

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function runMigration() {
  const client = new Client({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  });

  try {
    console.log('🔗 Connecting to database...');
    await client.connect();
    console.log('✅ Connected to database successfully');

    const migrationPath = path.join(__dirname, 'database', 'migration_notifications_system.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('📝 Running notifications system migration...');
    await client.query(migrationSQL);

    console.log('✅ Migration completed successfully!');
    console.log('');
    console.log('📋 Created/Updated:');
    console.log('   - notifications table');
    console.log('   - notification_preferences table');
    console.log('   - Enhanced portal_credentials table with test tracking');
    console.log('   - Indexes for performance');
    console.log('   - Triggers for automatic timestamp updates');
    console.log('');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await client.end();
    console.log('👋 Database connection closed');
  }
}

runMigration();
