require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: parseInt(process.env.DB_PORT || '5432'),
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  });

  try {
    console.log('🔄 Connecting to database...');
    const client = await pool.connect();
    console.log('✅ Connected to database');

    const migrationPath = path.join(__dirname, 'database', 'migration_rex_soo_submissions.sql');
    console.log('📄 Reading migration file:', migrationPath);

    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('🚀 Running REX SOO Submissions migration...');
    await client.query(migrationSQL);

    console.log('✅ Migration completed successfully!');
    console.log('\nCreated tables:');
    console.log('  - rex_submissions');
    console.log('  - rex_documents');
    console.log('\nAdded service template:');
    console.log('  - rex-soo-submission (2.0 credits per submission)');

    client.release();
    await pool.end();

    console.log('\n✨ All done! You can now use the REX SOO Submission feature.');
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('\nError details:', error);
    process.exit(1);
  }
}

runMigration();
