/**
 * MedLedger — Staging Database Migration Runner
 *
 * Connects to the confirmed Supabase PostgreSQL database using DATABASE_URL
 * and applies all migrations in sequential order.
 */

const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

async function main() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error('ERROR: DATABASE_URL environment variable is missing.');
    process.exit(1);
  }

  console.log('Connecting to remote PostgreSQL database...');
  const client = new Client({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    console.log('Successfully connected to remote PostgreSQL!');

    const migrationsDir = path.join(__dirname, '..', 'supabase', 'migrations');
    const files = fs
      .readdirSync(migrationsDir)
      .filter((f) => f.endsWith('.sql'))
      .sort();

    console.log(`Found ${files.length} migration files in execution sequence:`);
    files.forEach((f, idx) => console.log(`  [${idx + 1}] ${f}`));

    // Create migrations tracking table if not exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS _medledger_migrations (
        id SERIAL PRIMARY KEY,
        filename VARCHAR(255) UNIQUE NOT NULL,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    const { rows: applied } = await client.query('SELECT filename FROM _medledger_migrations');
    const appliedSet = new Set(applied.map((r) => r.filename));

    const reapplyTarget = process.argv.find((a, i) => process.argv[i - 1] === '--reapply');
    const forceAll = process.argv.includes('--force');

    for (const file of files) {
      if (appliedSet.has(file) && !forceAll && reapplyTarget !== file) {
        console.log(`Skipping already applied: ${file}`);
        continue;
      }

      console.log(`Applying migration: ${file}...`);
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf8');

      await client.query('BEGIN');
      try {
        await client.query(sql);
        await client.query('INSERT INTO _medledger_migrations (filename) VALUES ($1) ON CONFLICT (filename) DO UPDATE SET applied_at = NOW()', [file]);
        await client.query('COMMIT');
        console.log(`  ✓ Applied: ${file}`);
      } catch (err) {
        await client.query('ROLLBACK');
        console.error(`  ✗ Error in ${file}:`, err.message);
        throw err;
      }
    }

    console.log('\nAll migrations successfully applied!');

    // Verify tables created in public schema
    const { rows: tables } = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);

    console.log(`\nVerified ${tables.length} tables/views in public schema:`);
    tables.forEach((t) => console.log(`  - ${t.table_name}`));

  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
