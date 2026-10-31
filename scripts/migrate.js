const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres.kacgsuabfdqcskjonzkl:Mdazimkhan2@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true';

async function runMigrations() {
  console.log('Connecting to Supabase PostgreSQL database...');
  const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
  
  try {
    await client.connect();
    console.log('Connected successfully!');

    // Create migration tracking table
    await client.query(`
      CREATE TABLE IF NOT EXISTS _schema_migrations (
        version TEXT PRIMARY KEY,
        executed_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    const { rows } = await client.query('SELECT version FROM _schema_migrations;');
    const executed = new Set(rows.map(r => r.version));

    const migrationsDir = path.join(__dirname, '..', 'supabase', 'migrations');
    const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();

    console.log(`Found ${files.length} migration file(s).`);

    let appliedCount = 0;
    for (const file of files) {
      if (!executed.has(file)) {
        console.log(`Applying: ${file}...`);
        const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
        try {
          await client.query(sql);
          await client.query('INSERT INTO _schema_migrations (version) VALUES ($1);', [file]);
          console.log(`Successfully applied: ${file}`);
          appliedCount++;
        } catch (err) {
          console.error(`Failed to apply ${file}:`, err.message);
          throw err;
        }
      } else {
        console.log(`Skipped (already applied): ${file}`);
      }
    }

    console.log(`Migration complete! Applied ${appliedCount} new migration(s). Database is up to date.`);
  } catch (err) {
    console.error('Migration aborted due to error:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigrations();

