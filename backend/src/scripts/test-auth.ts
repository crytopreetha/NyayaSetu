/**
 * NyayaSetu — Authentication & Authorization Tests
 * Run: npx tsx src/scripts/test-auth.ts
 */
import '../config/load-env.js';
import { AuthService } from '../services/auth.service.js';
import { logger } from '../utils/logger.js';

const TEST_EMAIL_CITIZEN = `test.citizen.${Date.now()}@nyayasetu-test.com`;
const TEST_EMAIL_LAWYER = `test.lawyer.${Date.now()}@nyayasetu-test.com`;
const TEST_PASSWORD = 'TestPass123!';

let citizenToken = '';
let lawyerToken = '';
let citizenId = '';
let lawyerId = '';
let passed = 0;
let failed = 0;

function assert(condition: boolean, label: string, detail?: string) {
  if (condition) {
    console.log(`  ✅ PASS: ${label}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${label}${detail ? ' — ' + detail : ''}`);
    failed++;
  }
}

async function runTests() {
  console.log('\n═══════════════════════════════════════════════════');
  console.log('  NyayaSetu Authentication & Authorization Tests');
  console.log('═══════════════════════════════════════════════════\n');

  // ── 1. Register Citizen ──────────────────────────────────────────────────
  console.log('[ 1 ] Register Citizen');
  try {
    const result = await AuthService.registerCitizen({
      email: TEST_EMAIL_CITIZEN,
      password: TEST_PASSWORD,
      fullName: 'Ramesh Kumar',
      phone: '9876543210',
      preferredLanguage: 'hi',
    });
    citizenToken = result.token;
    citizenId = result.user.id;
    assert(!!result.token, 'Received JWT token');
    assert(result.user.role === 'CITIZEN', 'Role is CITIZEN');
    assert(result.user.email === TEST_EMAIL_CITIZEN, 'Email matches');
    assert(!('password' in result.user), 'Password NOT in response');
    assert(!('password_hash' in result.user), 'Password hash NOT in response');
  } catch (err: any) {
    assert(false, 'Register citizen should succeed', err.message);
  }

  // ── 2. Duplicate Registration ────────────────────────────────────────────
  console.log('\n[ 2 ] Duplicate Email Registration (should fail)');
  try {
    await AuthService.registerCitizen({
      email: TEST_EMAIL_CITIZEN,
      password: TEST_PASSWORD,
      fullName: 'Duplicate User',
    });
    assert(false, 'Should have thrown ConflictError');
  } catch (err: any) {
    assert(err.statusCode === 409, 'Throws 409 ConflictError', err.message);
  }

  // ── 3. Register Lawyer ───────────────────────────────────────────────────
  console.log('\n[ 3 ] Register Lawyer');
  try {
    const result = await AuthService.registerLawyer({
      email: TEST_EMAIL_LAWYER,
      password: TEST_PASSWORD,
      fullName: 'Adv. Priya Sharma',
      barCouncilNumber: `BCI-TEST-${Date.now()}`,
      city: 'Mumbai',
      state: 'Maharashtra',
      specialization: ['Family Law', 'Civil'],
      experienceYears: 8,
      languagesSpoken: ['en', 'hi', 'mr'],
    });
    lawyerToken = result.token;
    lawyerId = result.user.id;
    assert(!!result.token, 'Received JWT token');
    assert(result.user.role === 'LAWYER', 'Role is LAWYER');
    assert(result.user.email === TEST_EMAIL_LAWYER, 'Email matches');
  } catch (err: any) {
    assert(false, 'Register lawyer should succeed', err.message);
  }

  // ── 4. Valid Login — Citizen ─────────────────────────────────────────────
  console.log('\n[ 4 ] Valid Login — Citizen');
  try {
    const result = await AuthService.login(TEST_EMAIL_CITIZEN, TEST_PASSWORD);
    assert(!!result.token, 'Returns JWT token');
    assert(result.user.role === 'CITIZEN', 'Role is CITIZEN');
    assert(result.user.id === citizenId, 'Correct user ID');
  } catch (err: any) {
    assert(false, 'Valid citizen login should succeed', err.message);
  }

  // ── 5. Valid Login — Lawyer ──────────────────────────────────────────────
  console.log('\n[ 5 ] Valid Login — Lawyer');
  try {
    const result = await AuthService.login(TEST_EMAIL_LAWYER, TEST_PASSWORD);
    assert(!!result.token, 'Returns JWT token');
    assert(result.user.role === 'LAWYER', 'Role is LAWYER');
  } catch (err: any) {
    assert(false, 'Valid lawyer login should succeed', err.message);
  }

  // ── 6. Invalid Password ──────────────────────────────────────────────────
  console.log('\n[ 6 ] Invalid Password (should fail)');
  try {
    await AuthService.login(TEST_EMAIL_CITIZEN, 'WrongPassword999!');
    assert(false, 'Should have thrown UnauthorizedError');
  } catch (err: any) {
    assert(err.statusCode === 401, 'Throws 401 UnauthorizedError', err.message);
  }

  // ── 7. Non-existent Email ────────────────────────────────────────────────
  console.log('\n[ 7 ] Non-existent Email Login (should fail)');
  try {
    await AuthService.login('nobody@nyayasetu-test.com', TEST_PASSWORD);
    assert(false, 'Should have thrown UnauthorizedError');
  } catch (err: any) {
    assert(err.statusCode === 401, 'Throws 401 UnauthorizedError (no email leak)', err.message);
  }

  // ── 8. Token Verification — Citizen ─────────────────────────────────────
  console.log('\n[ 8 ] JWT Token Verification — Citizen');
  try {
    const payload = AuthService.verifyToken(citizenToken);
    assert(payload.sub === citizenId, 'Token sub matches citizen ID');
    assert(payload.role === 'CITIZEN', 'Token role is CITIZEN');
  } catch (err: any) {
    assert(false, 'Token verification should succeed', err.message);
  }

  // ── 9. Token Verification — Lawyer ──────────────────────────────────────
  console.log('\n[ 9 ] JWT Token Verification — Lawyer');
  try {
    const payload = AuthService.verifyToken(lawyerToken);
    assert(payload.sub === lawyerId, 'Token sub matches lawyer ID');
    assert(payload.role === 'LAWYER', 'Token role is LAWYER');
  } catch (err: any) {
    assert(false, 'Lawyer token verification should succeed', err.message);
  }

  // ── 10. Invalid Token ────────────────────────────────────────────────────
  console.log('\n[ 10 ] Invalid JWT Token (should fail)');
  try {
    AuthService.verifyToken('this.is.not.a.valid.token');
    assert(false, 'Should have thrown UnauthorizedError');
  } catch (err: any) {
    assert(err.statusCode === 401, 'Throws 401 for invalid token', err.message);
  }

  // ── 11. Get Profile ───────────────────────────────────────────────────────
  console.log('\n[ 11 ] Get Authenticated Profile');
  try {
    const profile = await AuthService.getProfile(citizenId);
    assert(profile.id === citizenId, 'Profile ID matches');
    assert(profile.email === TEST_EMAIL_CITIZEN, 'Profile email matches');
    assert(!('password_hash' in profile), 'password_hash NOT in profile response');
  } catch (err: any) {
    assert(false, 'Get profile should succeed', err.message);
  }

  // ── Summary ───────────────────────────────────────────────────────────────
  console.log('\n═══════════════════════════════════════════════════');
  console.log(`  Results: ${passed} passed / ${failed} failed`);
  console.log('═══════════════════════════════════════════════════\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  logger.error('Test runner crashed', { error: err.message });
  process.exit(1);
});
