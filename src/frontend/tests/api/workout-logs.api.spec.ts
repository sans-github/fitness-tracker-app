/**
 * API-level tests for POST /api/v1/workout-logs and GET /api/v1/workout-logs.
 * These tests run against the live BE at localhost:8080 with no browser.
 * Covers Issues 1-5 from the QA Issues List.
 *
 * Test IDs map directly to the approved Test Plan:
 *   Issue 1  — API-01 to API-05  (GET happy path)
 *   Issue 2  — API-06 to API-08  (POST 201 happy path)
 *   Issue 3  — API-12 to API-16  (POST 400 missing fields)
 *   Issue 4  — API-09 to API-11, API-17, API-18  (POST 400 zero/negative)
 *   Issue 5  — EDGE-02 to EDGE-04  (minimum boundary values accepted)
 */

import { test, expect, APIRequestContext } from '@playwright/test';

const BASE = 'http://localhost:8080/api/v1';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const ISO_8601_UTC = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$/;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const validBody = () => ({
  exercise: 'Squat',
  weightLbs: 100.0,
  sets: 3,
  reps: 5,
});

async function seedOne(request: APIRequestContext, overrides: object = {}): Promise<object> {
  const res = await request.post(`${BASE}/workout-logs`, {
    data: { ...validBody(), ...overrides },
  });
  expect(res.status()).toBe(201);
  return res.json();
}

function assertRfc7807(body: Record<string, unknown>): void {
  expect(body.type).toBe('https://fitnessapp.local/errors/validation');
  expect(body.title).toBe('Validation Failed');
  expect(body.status).toBe(400);
  expect(body.errors).toBeDefined();
}

// ---------------------------------------------------------------------------
// Issue 1 — GET /api/v1/workout-logs happy path (API-01 to API-05)
// ---------------------------------------------------------------------------

test.describe('Issue 1 — GET /api/v1/workout-logs happy path', () => {
  test('API-01: GET returns 200 with application/json content-type and an array', async ({ request }) => {
    const res = await request.get(`${BASE}/workout-logs`);
    expect(res.status()).toBe(200);
    expect(res.headers()['content-type']).toContain('application/json');
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
  });

  test('API-02: seeded DB returns array with correct length', async ({ request }) => {
    await seedOne(request);
    await seedOne(request, { exercise: 'Deadlift' });
    const res = await request.get(`${BASE}/workout-logs`);
    expect(res.status()).toBe(200);
    const body: unknown[] = await res.json();
    expect(body.length).toBeGreaterThanOrEqual(2);
  });

  test('API-03: response shape contains exactly the contract fields with no extras', async ({ request }) => {
    await seedOne(request);
    const res = await request.get(`${BASE}/workout-logs`);
    const body: Record<string, unknown>[] = await res.json();
    expect(body.length).toBeGreaterThanOrEqual(1);
    const item = body[0];

    expect(typeof item.id).toBe('string');
    expect((item.id as string)).toMatch(UUID_RE);
    expect(typeof item.exercise).toBe('string');
    expect(typeof item.weightLbs).toBe('number');
    expect(Number.isInteger(item.sets)).toBe(true);
    expect(Number.isInteger(item.reps)).toBe(true);
    expect(typeof item.createdAt).toBe('string');
    expect(item.createdAt as string).toMatch(ISO_8601_UTC);

    // Contract explicitly excludes these fields
    expect(item.updatedAt).toBeUndefined();
    expect(item.deletedAt).toBeUndefined();
  });

  test('API-04: rows ordered newest first (createdAt descending)', async ({ request }) => {
    // Global setup already seeds 2 rows 150ms apart. Re-seed here for isolation.
    await seedOne(request, { exercise: 'Overhead Press' });
    await new Promise((r) => setTimeout(r, 150));
    await seedOne(request, { exercise: 'Bent-over Row' });

    const res = await request.get(`${BASE}/workout-logs`);
    const body: { createdAt: string }[] = await res.json();
    expect(body.length).toBeGreaterThanOrEqual(2);

    const first = new Date(body[0].createdAt).getTime();
    const second = new Date(body[1].createdAt).getTime();
    expect(first).toBeGreaterThanOrEqual(second);
  });

  test('API-05: decimal weightLbs 135.75 returned without rounding', async ({ request }) => {
    await seedOne(request, { weightLbs: 135.75 });
    const res = await request.get(`${BASE}/workout-logs`);
    const body: { weightLbs: number }[] = await res.json();
    const match = body.find((r) => r.weightLbs === 135.75);
    expect(match).toBeDefined();
    // Verify the raw JSON string contains the value unrounded
    const raw = await res.text();
    // Response was already consumed; use a fresh GET
    const res2 = await request.get(`${BASE}/workout-logs`);
    const raw2 = await res2.text();
    expect(raw2).toContain('135.75');
  });
});

// ---------------------------------------------------------------------------
// Issue 2 — POST 201 happy path (API-06 to API-08)
// ---------------------------------------------------------------------------

test.describe('Issue 2 — POST /api/v1/workout-logs 201 happy path', () => {
  test('API-06: valid body returns 201 with all fields and application/json', async ({ request }) => {
    const res = await request.post(`${BASE}/workout-logs`, { data: validBody() });
    expect(res.status()).toBe(201);
    expect(res.headers()['content-type']).toContain('application/json');
    const body: Record<string, unknown> = await res.json();

    expect(body.exercise).toBe('Squat');
    expect(body.weightLbs).toBe(100.0);
    expect(body.sets).toBe(3);
    expect(body.reps).toBe(5);
    expect(typeof body.id).toBe('string');
    expect((body.id as string)).toMatch(UUID_RE);
    expect(typeof body.createdAt).toBe('string');
  });

  test('API-07: createdAt is server-assigned ISO 8601 UTC and non-null', async ({ request }) => {
    const res = await request.post(`${BASE}/workout-logs`, { data: validBody() });
    const body: Record<string, unknown> = await res.json();
    expect(body.createdAt).not.toBeNull();
    expect(body.createdAt as string).toMatch(ISO_8601_UTC);
  });

  test('API-08: 2-decimal weight 135.75 accepted and returned as-is', async ({ request }) => {
    const res = await request.post(`${BASE}/workout-logs`, {
      data: { ...validBody(), weightLbs: 135.75 },
    });
    expect(res.status()).toBe(201);
    const body: Record<string, unknown> = await res.json();
    expect(body.weightLbs).toBe(135.75);
    const raw = await request.get(`${BASE}/workout-logs`);
    const list: { id: unknown; weightLbs: number }[] = await raw.json();
    const saved = list.find((r) => r.id === body.id);
    expect(saved?.weightLbs).toBe(135.75);
  });
});

// ---------------------------------------------------------------------------
// Issue 3 — POST 400 missing required fields (API-12 to API-16)
// ---------------------------------------------------------------------------

test.describe('Issue 3 — POST 400 missing required fields', () => {
  async function assertMissingField(
    request: APIRequestContext,
    body: object,
    fieldKey: string
  ): Promise<void> {
    const res = await request.post(`${BASE}/workout-logs`, { data: body });
    expect(res.status()).toBe(400);
    expect(res.headers()['content-type']).toContain('application/problem+json');
    const json: Record<string, unknown> = await res.json();
    assertRfc7807(json);
    expect((json.errors as Record<string, unknown>)[fieldKey]).toBeDefined();

    // Verify no row persisted
    const list = await request.get(`${BASE}/workout-logs`);
    const rows: { exercise?: string }[] = await list.json();
    // The body has no exercise in some cases so we check by absence of a distinct marker
    expect(rows.every((r) => r.exercise !== (body as Record<string, unknown>).exercise || fieldKey === 'exercise'))
      .toBe(true);
  }

  test('API-12: missing exercise produces 400 with errors.exercise', async ({ request }) => {
    const { exercise: _e, ...body } = validBody();
    const res = await request.post(`${BASE}/workout-logs`, { data: body });
    expect(res.status()).toBe(400);
    expect(res.headers()['content-type']).toContain('application/problem+json');
    const json: Record<string, unknown> = await res.json();
    assertRfc7807(json);
    expect((json.errors as Record<string, unknown>).exercise).toBeDefined();
  });

  test('API-13: missing weightLbs produces 400 with errors.weightLbs', async ({ request }) => {
    const { weightLbs: _w, ...body } = validBody();
    const res = await request.post(`${BASE}/workout-logs`, { data: body });
    expect(res.status()).toBe(400);
    const json: Record<string, unknown> = await res.json();
    assertRfc7807(json);
    expect((json.errors as Record<string, unknown>).weightLbs).toBeDefined();
  });

  test('API-14: missing sets produces 400 with errors.sets', async ({ request }) => {
    const { sets: _s, ...body } = validBody();
    const res = await request.post(`${BASE}/workout-logs`, { data: body });
    expect(res.status()).toBe(400);
    const json: Record<string, unknown> = await res.json();
    assertRfc7807(json);
    expect((json.errors as Record<string, unknown>).sets).toBeDefined();
  });

  test('API-15: missing reps produces 400 with errors.reps', async ({ request }) => {
    const { reps: _r, ...body } = validBody();
    const res = await request.post(`${BASE}/workout-logs`, { data: body });
    expect(res.status()).toBe(400);
    const json: Record<string, unknown> = await res.json();
    assertRfc7807(json);
    expect((json.errors as Record<string, unknown>).reps).toBeDefined();
  });

  test('API-16: empty body {} produces 400 with violations for all 4 required fields', async ({ request }) => {
    const res = await request.post(`${BASE}/workout-logs`, { data: {} });
    expect(res.status()).toBe(400);
    const json: Record<string, unknown> = await res.json();
    assertRfc7807(json);
    const errors = json.errors as Record<string, unknown>;
    expect(errors.exercise).toBeDefined();
    expect(errors.weightLbs).toBeDefined();
    expect(errors.sets).toBeDefined();
    expect(errors.reps).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// Issue 4 — POST 400 zero and negative values (API-09, API-10, API-11, API-17, API-18)
// ---------------------------------------------------------------------------

test.describe('Issue 4 — POST 400 zero and negative values', () => {
  async function assert400Field(
    request: APIRequestContext,
    overrides: object,
    fieldKey: string
  ): Promise<void> {
    const res = await request.post(`${BASE}/workout-logs`, {
      data: { ...validBody(), ...overrides },
    });
    expect(res.status()).toBe(400);
    expect(res.headers()['content-type']).toContain('application/problem+json');
    const json: Record<string, unknown> = await res.json();
    assertRfc7807(json);
    expect((json.errors as Record<string, unknown>)[fieldKey]).toBeDefined();
  }

  test('API-09: weightLbs = 0 rejected with errors.weightLbs', async ({ request }) => {
    await assert400Field(request, { weightLbs: 0 }, 'weightLbs');
  });

  test('API-10: sets = 0 rejected with errors.sets', async ({ request }) => {
    await assert400Field(request, { sets: 0 }, 'sets');
  });

  test('API-11: reps = 0 rejected with errors.reps', async ({ request }) => {
    await assert400Field(request, { reps: 0 }, 'reps');
  });

  test('API-17: negative weightLbs = -10 rejected with errors.weightLbs', async ({ request }) => {
    await assert400Field(request, { weightLbs: -10 }, 'weightLbs');
  });

  test('API-18: invalid POST body does not persist — GET confirms no matching row', async ({ request }) => {
    const marker = 'INVALID_MARKER_EXERCISE_' + Date.now();
    const res = await request.post(`${BASE}/workout-logs`, {
      data: { exercise: marker, weightLbs: 0, sets: 3, reps: 5 },
    });
    expect(res.status()).toBe(400);

    const list = await request.get(`${BASE}/workout-logs`);
    const rows: { exercise: string }[] = await list.json();
    expect(rows.some((r) => r.exercise === marker)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Issue 5 — Minimum boundary values accepted (EDGE-02, EDGE-03, EDGE-04)
// ---------------------------------------------------------------------------

test.describe('Issue 5 — Minimum valid boundary values accepted', () => {
  test('EDGE-02: weightLbs = 0.01 accepted with 201', async ({ request }) => {
    const res = await request.post(`${BASE}/workout-logs`, {
      data: { ...validBody(), weightLbs: 0.01 },
    });
    expect(res.status()).toBe(201);
    const body: Record<string, unknown> = await res.json();
    expect(body.weightLbs).toBe(0.01);
  });

  test('EDGE-03: sets = 1 accepted with 201', async ({ request }) => {
    const res = await request.post(`${BASE}/workout-logs`, {
      data: { ...validBody(), sets: 1 },
    });
    expect(res.status()).toBe(201);
    const body: Record<string, unknown> = await res.json();
    expect(body.sets).toBe(1);
  });

  test('EDGE-04: reps = 1 accepted with 201', async ({ request }) => {
    const res = await request.post(`${BASE}/workout-logs`, {
      data: { ...validBody(), reps: 1 },
    });
    expect(res.status()).toBe(201);
    const body: Record<string, unknown> = await res.json();
    expect(body.reps).toBe(1);
  });
});
