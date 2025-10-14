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
    console.log('🔄 Running migration: Convert credits to decimal...');

    const migrationPath = path.join(__dirname, 'database', 'migration_credits_to_decimal.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    await pool.query(migrationSQL);

    console.log('✅ Migration completed successfully!');

    const result = await pool.query(`
      SELECT
        table_name,
        column_name,
        data_type,
        numeric_precision,
        numeric_scale
      FROM information_schema.columns
      WHERE (table_name = 'users' AND column_name = 'credits')
         OR (table_name = 'work_history' AND column_name = 'credits_used')
         OR (table_name = 'automation_jobs' AND column_name = 'credits_used')
      ORDER BY table_name, column_name;
    `);

    console.log('\n📊 Credit columns after migration:');
    result.rows.forEach(row => {
      console.log(`  - ${row.table_name}.${row.column_name}: ${row.data_type}(${row.numeric_precision},${row.numeric_scale})`);
    });

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    throw error;
  } finally {
    await pool.end();
  }
}

runMigration();
