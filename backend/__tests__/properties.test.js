// Backend API tests (Week 5 tooling): Supertest sends pretend requests to the Express app
// without starting a server. Needs MySQL (Docker) running with the rets data.
const request = require('supertest');
const app = require('../app');
const pool = require('../db');

// Hide the request logger's lines so the test output stays readable
beforeAll(() => jest.spyOn(console, 'log').mockImplementation(() => {}));

// Close the database connections at the end, or Jest keeps waiting for them
afterAll(async () => {
  console.log.mockRestore();
  await pool.end();
});

describe('GET /api/health', () => {
  test('says the database is connected', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok', database: 'connected' });
  });
});

describe('GET /api/properties/:id', () => {
  test('returns one full property', async () => {
    const res = await request(app).get('/api/properties/1118381441');
    expect(res.status).toBe(200);
    expect(res.body.L_ListingID).toBe('1118381441');
    expect(res.body.L_Address).toBe('349 E Gobind Blvd');
  });

  test('returns 404 with a helpful message for an unknown ID', async () => {
    const res = await request(app).get('/api/properties/999999999');
    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/No property found with listing ID 999999999/);
  });

  test.each(['abc123', '-5', '12.5', '123456789012345678901'])('returns 400 for a bad ID: %s', async (id) => {
    const res = await request(app).get(`/api/properties/${id}`);
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Invalid listing ID/);
  });
});

describe('GET /api/properties/:id/openhouses', () => {
  test('returns the open houses as an array', async () => {
    const res = await request(app).get('/api/properties/1118381441/openhouses');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
    res.body.forEach((openHouse) => expect(openHouse.L_ListingID).toBe('1118381441'));
  });

  test('returns [] (not an error) when there are no open houses', async () => {
    const res = await request(app).get('/api/properties/1118422731/openhouses');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  test('returns 404 for an orphan open house (its property is missing)', async () => {
    const res = await request(app).get('/api/properties/1021795007/openhouses');
    expect(res.status).toBe(404);
  });
});

describe('GET /api/properties (search)', () => {
  test('every result matches the filters', async () => {
    const res = await request(app)
      .get('/api/properties')
      .query({ city: 'Los Angeles', minPrice: 300000, beds: 3 });
    expect(res.status).toBe(200);
    expect(res.body.total).toBeGreaterThan(0);
    expect(res.body.results.length).toBeLessThanOrEqual(20);
    res.body.results.forEach((p) => {
      expect(p.L_City.trim().toLowerCase()).toBe('los angeles');
      expect(p.L_SystemPrice).toBeGreaterThanOrEqual(300000);
      expect(p.L_Keyword2).toBeGreaterThanOrEqual(3);
    });
  });

  test('rejects limit=500 with 400', async () => {
    const res = await request(app).get('/api/properties').query({ limit: 500 });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('limit must be an integer between 1 and 100');
  });

  test('rejects minPrice greater than maxPrice with 400', async () => {
    const res = await request(app).get('/api/properties').query({ minPrice: 900000, maxPrice: 100000 });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('minPrice cannot be greater than maxPrice');
  });
});

describe('unknown routes', () => {
  test('return 404', async () => {
    const res = await request(app).get('/api/nope');
    expect(res.status).toBe(404);
  });
});
