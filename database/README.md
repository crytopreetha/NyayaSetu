# NyayaSetu Database Architecture & Supabase Setup Guide

This directory manages the PostgreSQL database schema, migrations, and demo seed data for **NyayaSetu**.

---

## Directory Structure

```
database/
├── migrations/
│   ├── 001_create_extensions_and_enums.sql   # Enums: user_role, verification_state, case_status, etc.
│   ├── 002_create_users_and_lawyers.sql       # users and lawyers tables
│   ├── 003_create_cases_and_documents.sql     # cases and documents tables
│   ├── 004_create_ai_analysis_and_deadlines.sql # ai_analysis and case_deadlines tables
│   ├── 005_create_events_messages_notifications.sql # case_events, messages, notifications tables
│   └── 006_create_indexes_and_triggers.sql    # Indexes (user_id, lawyer_id, status, location, GIN) & triggers
├── seeds/
│   └── 001_demo_data.sql                      # Multilingual demo records across all 9 tables
└── README.md
```

---

## Where to Copy Your Supabase Credentials

Follow these steps to configure your environment:

### Step 1: Obtain Keys from Supabase Dashboard
1. Log in to your [Supabase Dashboard](https://supabase.com/dashboard) and select your project.
2. Go to **Project Settings** (gear icon at the bottom left) -> **API**:
   - **Project URL**: `https://<your-project-ref>.supabase.co`
   - **Project API Keys (anon / public)**: `eyJhbGciOi...`
   - **Project API Keys (service_role / secret)**: `eyJhbGciOi...` *(Keep secret! Never share or expose to frontend)*
3. Go to **Project Settings** -> **Database** -> **Connection string**:
   - Select **URI** or **Connection Pooling (Transaction / Port 6543)**.
   - Example format:
     ```
     postgresql://postgres.[YOUR-PROJECT-REF]:[YOUR-DB-PASSWORD]@aws-0-[YOUR-REGION].pooler.supabase.com:6543/postgres
     ```

### Step 2: Paste Credentials into `.env` Files

#### In `backend/.env`:
```env
PORT=5000
NODE_ENV=development

# 1. Supabase PostgreSQL Connection URL (for migrations & pg client)
DATABASE_URL=postgresql://postgres.[YOUR-PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres

# 2. Supabase API Configuration
SUPABASE_URL=https://[YOUR-PROJECT-REF].supabase.co
SUPABASE_ANON_KEY=eyJhbGciOi...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...

# 3. AI & Language Credentials (Future phases)
GEMINI_API_KEY=
BHASHINI_API_KEY=
```

#### In `frontend/.env`:
```env
VITE_API_BASE_URL=http://localhost:5000
VITE_SUPABASE_URL=https://[YOUR-PROJECT-REF].supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi...
```

---

## Running Migrations on Supabase

You can apply the migrations using either the CLI runner or the Supabase Web Console:

### Option A: Via Command Line (Recommended)
From the `backend/` directory, run:
```bash
# Apply migrations to live Supabase database
npm run db:migrate

# Populate demo multilingual seed data
npm run db:seed
```

### Option B: Via Supabase SQL Editor
1. Open your project in the Supabase Dashboard.
2. Click on the **SQL Editor** tab in the left sidebar.
3. Open each file in `database/migrations/` sequentially (`001` through `006`) and click **Run**.
4. (Optional) Run `database/seeds/001_demo_data.sql` to populate demo data.

---

## Running Automated Database Tests Locally

You can test the entire schema, constraints, indexes, triggers, and CRUD workflows anytime without needing a live internet connection:

```bash
cd backend
npm run db:test
```
This runs an embedded PostgreSQL 15 engine, executes all migrations, tests unique and foreign key violations, verifies multi-table joins, and validates cascading deletes.
