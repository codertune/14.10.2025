#!/usr/bin/env node
/**
 * Migration Script: Portal Credentials Table
 * Run this to create the portal_credentials table in your PostgreSQL database
 *
 * Usage: node run-portal-credentials-migration.cjs
 */

require('dotenv').config();
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const client = new Client({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'smart_process_flow',
  user: process.env.DB_USER || 'spf_user',
  password: process.env.DB_PASSWORD,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
});

async function runMigration() {
  try {
    console.log('🔌 Connecting to database...');
    await client.connect();
    console.log('✅ Connected to database successfully\n');

    const migrationPath = path.join(__dirname, 'database', 'migration_portal_credentials.sql');

    if (!fs.existsSync(migrationPath)) {
      throw new Error(`Migration file not found: ${migrationPath}`);
    }

    console.log('📄 Reading migration file...');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('🚀 Running migration...\n');
    await client.query(migrationSQL);

    console.log('✅ Migration completed successfully!\n');

    console.log('📊 Verifying table creation...');
    const result = await client.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'portal_credentials'
      ORDER BY ordinal_position;
    `);

    if (result.rows.length > 0) {
      console.log('✅ portal_credentials table created with columns:');
      result.rows.forEach(row => {
        console.log(`   - ${row.column_name} (${row.data_type})`);
      });
    } else {
      console.log('⚠️  Warning: Could not verify table creation');
    }

    console.log('\n✅ Portal credentials system is ready to use!');
    console.log('\n💡 Next steps:');
    console.log('   1. (Optional) Set CREDENTIAL_ENCRYPTION_KEY in .env');
    console.log('   2. Restart your server');
    console.log('   3. Users can now configure their Bangladesh Bank credentials');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('\nError details:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigration();
