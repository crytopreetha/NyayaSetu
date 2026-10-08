import '../config/load-env.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runSeed() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl || databaseUrl.trim() === '') {
    console.error('❌ Error: DATABASE_URL is not set.');
    console.error('👉 Make sure DATABASE_URL is configured in backend/.env to run live seeds.');
    process.exit(1);
  }

  console.log('🌱 Connecting to PostgreSQL database to apply seeds...');

  const pool = new pg.Pool({
    connectionString: databaseUrl,
    ssl: databaseUrl.includes('supabase.co') ? { rejectUnauthorized: false } : undefined,
  });

  const seedsDir = path.resolve(__dirname, '../../../database/seeds');
  const files = fs
    .readdirSync(seedsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  try {
    for (const file of files) {
      console.log(`  Applying seed: ${file}...`);
      const sql = fs.readFileSync(path.join(seedsDir, file), 'utf-8');
      await pool.query(sql);
      console.log(`  ✅ Seed applied: ${file}`);
    }
    console.log('\n🎉 Demo seed data populated successfully!');
  } catch (err: any) {
    const safeError = err?.message || 'Unknown database error';
    console.error('\n❌ Seeding failed:', safeError);
    if (err?.code) {
      console.error(`   Error code: ${err.code}`);
    }
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runSeed();
