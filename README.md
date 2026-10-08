# NyayaSetu (न्यायसेतु)

Citizen-Centric Multilingual Legal Assistance & Lawyer Collaboration Platform.

## Project Structure

```
nyayasetu/
├── frontend/    # React + Vite + TypeScript + Tailwind CSS + Lucide + Recharts
├── backend/     # Node.js + Express + TypeScript + Zod + Supabase / PostgreSQL
├── database/    # PostgreSQL schema migrations, indexes, triggers, and seeds
│   ├── migrations/
│   │   ├── 001_create_extensions_and_enums.sql
│   │   ├── 002_create_users_and_lawyers.sql
│   │   ├── 003_create_cases_and_documents.sql
│   │   ├── 004_create_ai_analysis_and_deadlines.sql
│   │   ├── 005_create_events_messages_notifications.sql
│   │   └── 006_create_indexes_and_triggers.sql
│   └── seeds/
│       └── 001_demo_data.sql
└── docs/        # Architecture diagrams and API specifications
```

---

## Where to Copy Supabase Credentials

1. Open your [Supabase Dashboard](https://supabase.com/dashboard).
2. Navigate to **Project Settings** -> **API**:
   - Copy **Project URL** and **anon / public** key.
   - Copy **service_role** secret key.
3. Navigate to **Project Settings** -> **Database**:
   - Copy the **Connection string (URI / Transaction pooler)**.
4. Paste the credentials into `backend/.env`:
   ```env
   DATABASE_URL=postgresql://postgres.[YOUR-PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
   SUPABASE_URL=https://[YOUR-PROJECT-REF].supabase.co
   SUPABASE_ANON_KEY=eyJhbGciOi...
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...
   ```
5. Paste the public credentials into `frontend/.env`:
   ```env
   VITE_SUPABASE_URL=https://[YOUR-PROJECT-REF].supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOi...
   ```

> **Security Note:** Never commit `.env` files to git. Never put `SUPABASE_SERVICE_ROLE_KEY`, `GEMINI_API_KEY`, or `BHASHINI_API_KEY` into frontend code.

---

## Running Database Migrations & Verification

To verify all 9 tables, indexes, constraints, triggers, and CRUD operations locally:
```bash
cd backend
npm run db:test
```

To run migrations and seed demo data against your live Supabase database:
```bash
cd backend
npm run db:migrate
npm run db:seed
```

---

## Quick Start (Development Servers)

1. Start backend server:
   ```bash
   cd backend
   npm run dev
   ```

2. Start frontend server:
   ```bash
   cd frontend
   npm run dev
   ```

Visit [http://localhost:5173](http://localhost:5173) to verify that the frontend communicates with the backend via `/api/health`.
