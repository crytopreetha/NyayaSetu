import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Explicitly resolve backend project directory: src/config -> src -> backend root
export const backendDir = path.resolve(__dirname, '../..');
export const backendEnvPath = path.resolve(backendDir, '.env');
export const workspaceEnvPath = path.resolve(backendDir, '..', '.env');

let loadedEnvPath: string | null = null;

if (fs.existsSync(backendEnvPath)) {
  dotenv.config({ path: backendEnvPath, override: true });
  loadedEnvPath = backendEnvPath;
} else if (fs.existsSync(workspaceEnvPath)) {
  dotenv.config({ path: workspaceEnvPath, override: true });
  loadedEnvPath = workspaceEnvPath;
} else {
  dotenv.config();
}

export function getLoadedEnvInfo() {
  return {
    loadedEnvPath,
    hasDatabaseUrl: Boolean(process.env.DATABASE_URL && process.env.DATABASE_URL.trim().length > 0),
    hasSupabaseUrl: Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_URL.trim().length > 0),
  };
}
