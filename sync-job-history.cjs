require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
});

async function syncJobHistory() {
  console.log('🔄 Starting job history sync...\n');

  try {
    const result = await pool.query(`
      SELECT
        aj.id as job_id,
        aj.user_id,
        aj.service_id,
        aj.service_name,
        aj.input_file_name,
        aj.credits_used,
        aj.result_files,
        aj.download_url,
        aj.status,
        aj.completed_at
      FROM automation_jobs aj
      LEFT JOIN work_history wh ON wh.user_id = aj.user_id
        AND wh.service_id = aj.service_id
        AND wh.file_name = aj.input_file_name
        AND wh.created_at >= aj.created_at - INTERVAL '1 minute'
        AND wh.created_at <= aj.completed_at + INTERVAL '1 minute'
      WHERE aj.status = 'completed'
        AND aj.completed_at IS NOT NULL
        AND wh.id IS NULL
      ORDER BY aj.completed_at DESC
    `);

    console.log(`Found ${result.rows.length} completed jobs without work history entries\n`);

    let synced = 0;
    let failed = 0;

    for (const job of result.rows) {
      try {
        const resultFiles = job.result_files || [];
        const pdfFiles = resultFiles.filter(f => f.startsWith('pdfs/') && f.endsWith('.pdf'));
        const filesGeneratedCount = pdfFiles.length;

        await pool.query(
          `INSERT INTO work_history (
            user_id, service_id, service_name, file_name,
            credits_used, status, result_files, download_url,
            expires_at, files_generated_count, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8, $9, $10, $11)`,
          [
            job.user_id,
            job.service_id,
            job.service_name,
            job.input_file_name,
            job.credits_used,
            job.status,
            JSON.stringify(resultFiles),
            job.download_url,
            new Date(job.completed_at.getTime() + 7 * 24 * 60 * 60 * 1000),
            filesGeneratedCount,
            job.completed_at
          ]
        );

        console.log(`✅ Synced job ${job.job_id} - ${job.service_name} - ${filesGeneratedCount} files`);
        synced++;
      } catch (error) {
        console.error(`❌ Failed to sync job ${job.job_id}:`, error.message);
        failed++;
      }
    }

    console.log(`\n📊 Sync Summary:`);
    console.log(`   Total found: ${result.rows.length}`);
    console.log(`   Successfully synced: ${synced}`);
    console.log(`   Failed: ${failed}`);
    console.log(`\n✅ Job history sync completed`);

  } catch (error) {
    console.error('❌ Sync error:', error);
  } finally {
    await pool.end();
  }
}

syncJobHistory();
