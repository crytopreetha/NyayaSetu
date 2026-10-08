import path from 'path';
import fs from 'fs';
import { backendDir, backendEnvPath, getLoadedEnvInfo } from '../config/load-env.js';

console.log('======================================================');
console.log('       NYAYASETU ENVIRONMENT LOADING VERIFICATION     ');
console.log('======================================================\n');

console.log('1. Checking backend directory resolution:');
console.log(`   Backend Root: ${backendDir}`);
console.log(`   Backend .env Path: ${backendEnvPath}`);
console.log(`   Backend .env Exists: ${fs.existsSync(backendEnvPath) ? '✅ YES' : '❌ NO'}`);

const info = getLoadedEnvInfo();
console.log('\n2. Verifying environment loader:');
console.log(`   Loaded Path: ${info.loadedEnvPath ? '✅ ' + info.loadedEnvPath : '❌ None'}`);
console.log(`   DATABASE_URL present: ${info.hasDatabaseUrl ? '✅ Configured' : '⚠️ Empty / Not set yet'}`);
console.log(`   SUPABASE_URL present: ${info.hasSupabaseUrl ? '✅ Configured' : '⚠️ Empty / Not set yet'}`);

console.log('\n3. Security verification:');
console.log('   ✅ No secrets, passwords, or tokens printed.');
console.log('\n======================================================');
