/**
 * Verify API operations (run with server up): node scripts/verify-api.js
 * Uses admin login to test events CRUD, then cleanup.
 */
const API = process.env.API_URL || 'http://localhost:5001';

async function request(method, path, body, cookie = '') {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json' },
    redirect: 'manual',
  };
  if (cookie) opts.headers.Cookie = cookie;
  if (body && method !== 'GET') opts.body = JSON.stringify(body);
  const res = await fetch(`${API}${path}`, opts);
  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  return { status: res.status, data, headers: res.headers };
}

async function main() {
  const results = [];
  function ok(name, pass, detail = '') {
    results.push({ name, pass, detail });
    console.log(pass ? `  OK: ${name}` : `  FAIL: ${name}${detail ? ' - ' + detail : ''}`);
  }

  console.log('API base:', API);
  console.log('1. Login (admin)...');
  const loginRes = await request('POST', '/api/auth/login', {
    email: 'admin1@sot.edu',
    password: 'password123',
  });
  const cookie = loginRes.headers.get('set-cookie') || '';
  if (loginRes.status !== 200 || !loginRes.data?.user) {
    ok('Login', false, loginRes.data?.message || loginRes.status);
    console.log('   Run seed first: cd server && npm run seed');
    results.forEach((r) => { if (!r.pass) process.exitCode = 1; });
    return;
  }
  ok('Login', true);

  console.log('2. List events...');
  const listRes = await request('GET', '/api/events?past=true', null, cookie);
  ok('List events', listRes.status === 200 && Array.isArray(listRes.data), listRes.status + '');

  console.log('3. Create event...');
  const createRes = await request('POST', '/api/events', {
    title: 'Verify-API Test Event',
    description: 'Delete me',
    venue: 'Test Room',
    date: new Date(Date.now() + 86400000).toISOString(),
    capacity: 10,
    category: 'Other',
    isDraft: true,
  }, cookie);
  const createdId = createRes.data?._id;
  ok('Create event', createRes.status === 201 && createdId, createRes.data?.message || createRes.status + '');

  if (!createdId) {
    console.log('   Skipping update/delete (no created id)');
    results.forEach((r) => { if (!r.pass) process.exitCode = 1; });
    return;
  }

  console.log('4. Update event...');
  const updateRes = await request('PUT', `/api/events/${createdId}`, {
    title: 'Verify-API Test Event (updated)',
    description: 'Delete me',
    venue: 'Test Room',
    date: new Date(Date.now() + 86400000).toISOString(),
    capacity: 20,
    category: 'Workshop',
    isDraft: true,
  }, cookie);
  ok('Update event', updateRes.status === 200 && updateRes.data?.title?.includes('updated'), updateRes.data?.message || updateRes.status + '');

  console.log('5. Delete event...');
  const deleteRes = await request('DELETE', `/api/events/${createdId}`, null, cookie);
  ok('Delete event', deleteRes.status === 200, deleteRes.data?.message || deleteRes.status + '');

  console.log('6. Get deleted (expect 404)...');
  const getRes = await request('GET', `/api/events/${createdId}`, null, cookie);
  ok('Get after delete returns 404', getRes.status === 404);

  const failed = results.filter((r) => !r.pass);
  if (failed.length) {
    console.log('\nFailed:', failed.length);
    process.exit(1);
  }
  console.log('\nAll checks passed.');
}

main().catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});
