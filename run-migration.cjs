require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD || '',
    port: parseInt(process.env.DB_PORT || '5432'),
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  });

  try {
    console.log('🔄 Running migration: Add work history details...');

    const migrationPath = path.join(__dirname, 'database', 'migration_add_work_history_details.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    await pool.query(migrationSQL);

    console.log('✅ Migration completed successfully!');

    const result = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'work_history'
      AND column_name IN ('files_generated_count', 'bulk_upload_id', 'row_number')
      ORDER BY column_name;
    `);

    console.log('\n📊 New columns added:');
    result.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
    });

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    throw error;
  } finally {
    await pool.end();
  }
}

runMigration();
