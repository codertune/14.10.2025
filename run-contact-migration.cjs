require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

async function runContactMigration() {
  const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD || '',
    port: parseInt(process.env.DB_PORT || '5432'),
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  });

  try {
    console.log('🔄 Running migration: Create contact_messages table...');

    const migrationPath = path.join(__dirname, 'database', 'migration_contact_messages.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    await pool.query(migrationSQL);

    console.log('✅ Migration completed successfully!');

    const result = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'contact_messages'
      ORDER BY ordinal_position;
    `);

    console.log('\n📊 Contact Messages Table Structure:');
    result.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
    });

    const indexResult = await pool.query(`
      SELECT indexname, indexdef
      FROM pg_indexes
      WHERE tablename = 'contact_messages';
    `);

    console.log('\n📇 Indexes Created:');
    indexResult.rows.forEach(row => {
      console.log(`  - ${row.indexname}`);
    });

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    throw error;
  } finally {
    await pool.end();
  }
}

runContactMigration();
