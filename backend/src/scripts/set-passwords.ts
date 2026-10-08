import '../config/load-env.js';
import bcrypt from 'bcryptjs';
import { db } from '../config/db.js';

async function updatePasswords() {
  const hash = await bcrypt.hash('Password123', 12);
  const emails = [
    'ramesh.kumar@example.com',
    'adv.priya.sharma@example.com',
    'admin@nyayasetu.org',
    'preethamndl@gmail.com',
  ];

  for (const email of emails) {
    const res = await db.query(
      'UPDATE users SET password_hash = $1 WHERE email = $2 RETURNING id, email, role, full_name',
      [hash, email]
    );
    if (res.rows.length > 0) {
      console.log(`✅ Set password for ${email} (${res.rows[0].role}): Password123`);
    } else {
      console.log(`⚠️ User not found: ${email}`);
    }
  }
  process.exit(0);
}

updatePasswords().catch((err) => {
  console.error('❌ Failed:', err);
  process.exit(1);
});
