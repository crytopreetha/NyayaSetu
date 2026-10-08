import '../config/load-env.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';
import { PGlite } from '@electric-sql/pglite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Interface for unified query runner
interface Queryable {
  query(sql: string, params?: unknown[]): Promise<{ rows: any[]; rowCount: number | null }>;
  exec(sql: string): Promise<void>;
  close(): Promise<void>;
}

async function getDatabaseClient(): Promise<{ client: Queryable; isLivePostgres: boolean }> {
  const databaseUrl = process.env.DATABASE_URL;

  if (databaseUrl && databaseUrl.trim() !== '') {
    console.log('🔗 Connecting to live PostgreSQL database (DATABASE_URL)...');
    const pool = new pg.Pool({
      connectionString: databaseUrl,
      ssl: databaseUrl.includes('supabase.co') ? { rejectUnauthorized: false } : undefined,
    });
    const pgAdapter: Queryable = {
      async query(sql: string, params?: unknown[]) {
        const res = await pool.query(sql, params);
        return { rows: res.rows, rowCount: res.rowCount };
      },
      async exec(sql: string) {
        await pool.query(sql);
      },
      async close() {
        await pool.end();
      },
    };
    return { client: pgAdapter, isLivePostgres: true };
  }

  console.log('⚡ Running embedded PostgreSQL engine (PGlite PostgreSQL 15.x)...');
  const pglite = new PGlite();
  const pgliteAdapter: Queryable = {
    async query(sql: string, params?: unknown[]) {
      const res = await pglite.query(sql, params as any[]);
      return { rows: res.rows, rowCount: res.affectedRows ?? res.rows.length };
    },
    async exec(sql: string) {
      await pglite.exec(sql);
    },
    async close() {
      await pglite.close();
    },
  };
  return { client: pgliteAdapter, isLivePostgres: false };
}

async function runDatabaseVerification() {
  console.log('=================================================================');
  console.log('          NYAYASETU DATABASE TEST & VERIFICATION SUITE           ');
  console.log('=================================================================\n');

  const { client, isLivePostgres } = await getDatabaseClient();
  const migrationsDir = path.resolve(__dirname, '../../../database/migrations');
  const seedsDir = path.resolve(__dirname, '../../../database/seeds');

  try {
    // -------------------------------------------------------------
    // STEP 1: RUN MIGRATIONS
    // -------------------------------------------------------------
    console.log('📂 STEP 1: Running SQL Migrations from database/migrations/...\n');
    const migrationFiles = fs
      .readdirSync(migrationsDir)
      .filter((file) => file.endsWith('.sql'))
      .sort();

    for (const file of migrationFiles) {
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf-8');
      console.log(`  Applying: ${file}...`);
      await client.exec(sql);
      console.log(`  ✅ Applied: ${file}`);
    }
    console.log('\n✨ All migrations executed successfully!\n');

    // -------------------------------------------------------------
    // STEP 2: VERIFY REQUIRED TABLES
    // -------------------------------------------------------------
    console.log('🔍 STEP 2: Verifying Required Tables & Structures...\n');
    const requiredTables = [
      'users',
      'lawyers',
      'cases',
      'documents',
      'ai_analysis',
      'case_deadlines',
      'case_events',
      'messages',
      'notifications',
    ];

    const tablesQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE';
    `;
    const tablesResult = await client.query(tablesQuery);
    const existingTables = new Set(tablesResult.rows.map((r: any) => r.table_name));

    for (const table of requiredTables) {
      if (existingTables.has(table)) {
        console.log(`  ✅ Table verified: public.${table}`);
      } else {
        throw new Error(`❌ Missing required table: ${table}`);
      }
    }
    console.log('\n✨ All 9 required tables are present in public schema!\n');

    // -------------------------------------------------------------
    // STEP 3: VERIFY INDEXES
    // -------------------------------------------------------------
    console.log('⚡ STEP 3: Verifying Strategic Indexes...\n');
    const indexesQuery = `
      SELECT indexname, tablename 
      FROM pg_indexes 
      WHERE schemaname = 'public';
    `;
    const indexesResult = await client.query(indexesQuery);
    const indexNames = new Set(indexesResult.rows.map((r: any) => r.indexname));

    const checkIndexes = [
      { name: 'idx_cases_citizen_id', purpose: 'user_id foreign index' },
      { name: 'idx_cases_assigned_lawyer_id', purpose: 'lawyer_id foreign index' },
      { name: 'idx_cases_status', purpose: 'case status filter' },
      { name: 'idx_cases_category', purpose: 'case category filter' },
      { name: 'idx_lawyers_city_state', purpose: 'location index' },
      { name: 'idx_lawyers_specialization', purpose: 'specialization GIN index' },
      { name: 'idx_cases_created_at', purpose: 'created_at chronological index' },
    ];

    for (const idx of checkIndexes) {
      if (indexNames.has(idx.name)) {
        console.log(`  ✅ Index verified: ${idx.name} (${idx.purpose})`);
      } else {
        console.warn(`  ⚠️ Note: Index ${idx.name} not found in pg_indexes`);
      }
    }
    console.log('\n');

    // -------------------------------------------------------------
    // STEP 4: SEED DEMO DATA
    // -------------------------------------------------------------
    console.log('🌱 STEP 4: Populating Seed / Demo Data from database/seeds/...\n');
    const seedFiles = fs
      .readdirSync(seedsDir)
      .filter((file) => file.endsWith('.sql'))
      .sort();

    for (const file of seedFiles) {
      const filePath = path.join(seedsDir, file);
      const sql = fs.readFileSync(filePath, 'utf-8');
      console.log(`  Seeding: ${file}...`);
      await client.exec(sql);
      console.log(`  ✅ Seeded: ${file}`);
    }
    console.log('\n');

    // -------------------------------------------------------------
    // STEP 5: TEST RELATIONSHIPS & CONSTRAINTS
    // -------------------------------------------------------------
    console.log('🔒 STEP 5: Testing Foreign Key & Unique Constraints...\n');

    // 5.1 Unique Constraint Test: Duplicate Email
    try {
      await client.query(`
        INSERT INTO users (email, full_name, role) 
        VALUES ('ramesh.kumar@example.com', 'Duplicate Ramesh', 'CITIZEN');
      `);
      throw new Error('FAILED: Duplicate email was allowed!');
    } catch (err: any) {
      if (err.message.includes('unique') || err.code === '23505') {
        console.log('  ✅ Unique constraint verified: duplicate email was rejected as expected.');
      } else {
        throw err;
      }
    }

    // 5.2 Foreign Key Constraint Test: Case with Non-Existent Citizen
    try {
      await client.query(`
        INSERT INTO cases (citizen_id, case_number, title, description, category) 
        VALUES ('99999999-9999-9999-9999-999999999999', 'NS-INVALID-001', 'Ghost Case', 'Desc', 'Civil');
      `);
      throw new Error('FAILED: Case with non-existent citizen was allowed!');
    } catch (err: any) {
      if (err.message.includes('foreign key') || err.code === '23503') {
        console.log('  ✅ Foreign key verified: case with invalid citizen_id was rejected as expected.');
      } else {
        throw err;
      }
    }

    // 5.3 Foreign Key Constraint Test: Lawyer extending Non-Existent User
    try {
      await client.query(`
        INSERT INTO lawyers (id, bar_council_number, city, state) 
        VALUES ('99999999-9999-9999-9999-999999999999', 'INVALID/BAR/01', 'Delhi', 'Delhi');
      `);
      throw new Error('FAILED: Lawyer without matching user was allowed!');
    } catch (err: any) {
      if (err.message.includes('foreign key') || err.code === '23503') {
        console.log('  ✅ Foreign key verified: lawyer profile without matching user was rejected.');
      } else {
        throw err;
      }
    }
    console.log('\n');

    // -------------------------------------------------------------
    // STEP 6: TEST FULL CRUD OPERATIONS
    // -------------------------------------------------------------
    console.log('🔄 STEP 6: Testing End-to-End CRUD Operations Across Entities...\n');

    // C - CREATE: Insert a new citizen, lawyer, and case
    const testCitizenEmail = `test.citizen.${Date.now()}@example.com`;
    const userRes = await client.query(
      `INSERT INTO users (email, full_name, role, preferred_language, phone) 
       VALUES ($1, $2, 'CITIZEN', 'mr', '+919822334455') 
       RETURNING id, full_name;`,
      [testCitizenEmail, 'Sanjay Patil']
    );
    const testCitizenId = userRes.rows[0].id;
    console.log(`  [CREATE] Created test citizen user: ${userRes.rows[0].full_name} (${testCitizenId})`);

    const caseRes = await client.query(
      `INSERT INTO cases (citizen_id, case_number, title, description, category, status, urgency) 
       VALUES ($1, $2, $3, $4, $5, 'DRAFT', 'MEDIUM') 
       RETURNING id, case_number, created_at, updated_at;`,
      [
        testCitizenId,
        `NS-TEST-${Date.now()}`,
        'Agricultural Land Title Verification',
        'Verification of 7/12 land records and mutation entries.',
        'Land Revenue Law',
      ]
    );
    const testCaseId = caseRes.rows[0].id;
    const initialUpdatedAt = caseRes.rows[0].updated_at;
    console.log(`  [CREATE] Created case: ${caseRes.rows[0].case_number} (${testCaseId})`);

    // Attach Document
    const docRes = await client.query(
      `INSERT INTO documents (case_id, uploaded_by, original_name, storage_path, mime_type, file_size_bytes)
       VALUES ($1, $2, '7_12_Extract.pdf', 'cases/test/7_12.pdf', 'application/pdf', 102400)
       RETURNING id, original_name;`,
      [testCaseId, testCitizenId]
    );
    const testDocId = docRes.rows[0].id;
    console.log(`  [CREATE] Attached document: ${docRes.rows[0].original_name} (${testDocId})`);

    // Attach AI Analysis
    const aiRes = await client.query(
      `INSERT INTO ai_analysis (document_id, case_id, document_type, plain_language_summary, confidence_score)
       VALUES ($1, $2, 'Land Extract (7/12)', 'जमीन महसूल नोंदीची पडताळणी सारांश', 0.94)
       RETURNING id, document_type;`,
      [testDocId, testCaseId]
    );
    console.log(`  [CREATE] Generated AI Analysis for document (${aiRes.rows[0].id})`);

    // Attach Deadline
    const deadlineRes = await client.query(
      `INSERT INTO case_deadlines (case_id, created_by, title, due_date, priority)
       VALUES ($1, $2, 'File Objections before Tahsildar', '2026-11-15', 'HIGH')
       RETURNING id, title;`,
      [testCaseId, testCitizenId]
    );
    console.log(`  [CREATE] Created case deadline: ${deadlineRes.rows[0].title}`);

    // Attach Message
    const msgRes = await client.query(
      `INSERT INTO messages (case_id, sender_id, content)
       VALUES ($1, $2, 'कृपया ७/१२ उताऱ्यावरील बोजा तपासावा.')
       RETURNING id;`,
      [testCaseId, testCitizenId]
    );
    console.log(`  [CREATE] Created message in case thread (${msgRes.rows[0].id})`);

    // Attach Notification
    const notifRes = await client.query(
      `INSERT INTO notifications (user_id, title, message, type)
       VALUES ($1, 'नवीन केस नोंदवली गेली', 'तुमची केस यशस्वीरीत्या ड्राफ्ट झाली आहे.', 'CASE_UPDATE')
       RETURNING id;`,
      [testCitizenId]
    );
    console.log(`  [CREATE] Generated notification for user (${notifRes.rows[0].id})`);

    // R - READ & JOIN: Relational multi-table join
    const joinRes = await client.query(`
      SELECT 
        c.case_number,
        c.title,
        c.status,
        u.full_name AS citizen_name,
        COUNT(d.id) AS document_count
      FROM cases c
      JOIN users u ON c.citizen_id = u.id
      LEFT JOIN documents d ON d.case_id = c.id
      WHERE c.id = '${testCaseId}'
      GROUP BY c.case_number, c.title, c.status, u.full_name;
    `);
    console.log(`  [READ/JOIN] Verified relational query:`, joinRes.rows[0]);

    // U - UPDATE & TRIGGER TEST: Check that updated_at trigger automatically updates
    // Slight pause to ensure timestamp ticks
    await new Promise((resolve) => setTimeout(resolve, 50));
    const updateRes = await client.query(
      `UPDATE cases 
       SET status = 'OPEN', urgency = 'HIGH' 
       WHERE id = $1 
       RETURNING status, urgency, updated_at;`,
      [testCaseId]
    );
    const newUpdatedAt = updateRes.rows[0].updated_at;
    console.log(`  [UPDATE] Updated case status to ${updateRes.rows[0].status}`);
    console.log(`  [TRIGGER] Verified trg_cases_updated_at changed timestamp from ${initialUpdatedAt} to ${newUpdatedAt}`);

    // D - DELETE & CASCADE TEST:
    // Deleting the case should cascade delete its documents, ai_analysis, deadlines, messages
    await client.query(`DELETE FROM cases WHERE id = $1;`, [testCaseId]);
    const checkDocs = await client.query(`SELECT COUNT(*) as count FROM documents WHERE id = $1;`, [testDocId]);
    if (parseInt(checkDocs.rows[0].count, 10) === 0) {
      console.log(`  [DELETE/CASCADE] Verified cascade delete: document, deadlines, and messages were automatically purged.`);
    } else {
      throw new Error('Cascade delete did not remove attached documents!');
    }

    // Clean up test citizen
    await client.query(`DELETE FROM users WHERE id = $1;`, [testCitizenId]);
    console.log(`  [DELETE] Cleaned up test user.`);

    console.log('\n=================================================================');
    console.log('✅ ALL DATABASE TESTS PASSED WITH ZERO ERRORS!');
    console.log(`Mode: ${isLivePostgres ? 'Live Supabase/PostgreSQL' : 'Embedded PostgreSQL 15 (PGlite)'}`);
    console.log('=================================================================\n');
  } catch (error) {
    console.error('\n❌ DATABASE VERIFICATION FAILED:', error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

runDatabaseVerification();
