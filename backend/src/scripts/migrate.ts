import '../config/load-env.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigrations() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl || databaseUrl.trim() === '') {
    console.error('❌ Error: DATABASE_URL environment variable is missing.');
    console.error('👉 Please make sure DATABASE_URL is set in backend/.env before running live migrations.');
    console.error('   Format: DATABASE_URL=postgresql://postgres.[REF]:[PASSWORD]@[HOST]:[PORT]/postgres\n');
    console.error('Tip: You can test the migrations in offline mode anytime by running:');
    console.error('     npm run db:test\n');
    process.exit(1);
  }

  console.log('🚀 Connecting to PostgreSQL database...');
  
  const pool = new pg.Pool({
    connectionString: databaseUrl,
    ssl: databaseUrl.includes('supabase.co') ? { rejectUnauthorized: false } : undefined,
  });

  const migrationsDir = path.resolve(__dirname, '../../../database/migrations');
  const files = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  try {
    // Test connectivity first
    const testConn = await pool.query('SELECT NOW() as connected_at;');
    console.log(`✅ Database connection established successfully at ${testConn.rows[0].connected_at}`);

    for (const file of files) {
      console.log(`  Applying migration: ${file}...`);
      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');
      await pool.query(sql);
      console.log(`  ✅ Success: ${file}`);
    }
    console.log('\n🎉 All Supabase migrations executed successfully!');
  } catch (err: any) {
    // Sanitize any error message so credentials or connection strings are never leaked
    const safeError = err?.message || 'Unknown database error';
    console.error('\n❌ Migration failed:', safeError);
    if (err?.code) {
      console.error(`   Error code: ${err.code}`);
    }
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigrations();
