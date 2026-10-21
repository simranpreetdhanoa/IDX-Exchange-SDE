// Tests for the API client: a pretend fetch (a "mock") lets us test every answer,
// including "backend down", without the real backend.
import { fetchProperties, fetchPropertyDetail } from './client';

// Builds a pretend response like the one fetch returns
function fakeResponse(status, body) {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: `Status ${status}`,
    json: () =>
      body === undefined
        ? Promise.reject(new SyntaxError('Unexpected end of JSON input')) // no JSON body
        : Promise.resolve(body),
  };
}

beforeEach(() => {
  global.fetch = jest.fn();
});

describe('fetchProperties', () => {
  test('builds the URL from the params and skips empty ones', async () => {
    fetch.mockResolvedValue(fakeResponse(200, { total: 0, results: [] }));
    await fetchProperties({ city: 'Los Angeles', beds: 3, minPrice: '', zipcode: null });
    expect(fetch).toHaveBeenCalledWith('/api/properties?city=Los+Angeles&beds=3');
  });

  test('calls /api/properties with no "?" when there are no params', async () => {
    fetch.mockResolvedValue(fakeResponse(200, { total: 0, results: [] }));
    await fetchProperties();
    expect(fetch).toHaveBeenCalledWith('/api/properties');
  });

  test('returns the JSON body on success', async () => {
    const body = { total: 55212, limit: 20, offset: 0, results: [{ L_ListingID: '1' }] };
    fetch.mockResolvedValue(fakeResponse(200, body));
    await expect(fetchProperties({ limit: 20 })).resolves.toEqual(body);
  });

  test("passes on the backend's own message for a 400", async () => {
    fetch.mockResolvedValue(fakeResponse(400, { error: 'limit must be an integer between 1 and 100' }));
    await expect(fetchProperties({ limit: 500 })).rejects.toThrow(
      'Request failed (400): limit must be an integer between 1 and 100',
    );
  });

  test('says "Cannot reach the backend" when the proxy answers 502 with no JSON', async () => {
    fetch.mockResolvedValue(fakeResponse(502));
    await expect(fetchProperties()).rejects.toThrow(
      'Cannot reach the backend. Is the API running on port 5000?',
    );
  });

  test('keeps a real Express 500 message (it has JSON)', async () => {
    fetch.mockResolvedValue(fakeResponse(500, { error: 'Internal Server Error' }));
    await expect(fetchProperties()).rejects.toThrow('Request failed (500): Internal Server Error');
  });

  test('says "Cannot reach the server" when fetch itself fails', async () => {
    fetch.mockRejectedValue(new TypeError('Failed to fetch'));
    await expect(fetchProperties()).rejects.toThrow(
      'Cannot reach the server. Is the frontend dev server running?',
    );
  });
});

describe('fetchPropertyDetail', () => {
  test('returns one property', async () => {
    fetch.mockResolvedValue(fakeResponse(200, { L_ListingID: '1118381441' }));
    await expect(fetchPropertyDetail('1118381441')).resolves.toEqual({ L_ListingID: '1118381441' });
    expect(fetch).toHaveBeenCalledWith('/api/properties/1118381441');
  });

  test('throws the 404 message for an unknown ID', async () => {
    fetch.mockResolvedValue(
      fakeResponse(404, { error: 'No property found with listing ID 999999999. Check the ID and try again.' }),
    );
    await expect(fetchPropertyDetail('999999999')).rejects.toThrow(
      'Request failed (404): No property found with listing ID 999999999',
    );
  });

  test('uses the 404 handler\'s "message" field when there is no "error"', async () => {
    fetch.mockResolvedValue(fakeResponse(404, { success: false, message: 'Route /api/x not found' }));
    await expect(fetchPropertyDetail('1')).rejects.toThrow('Request failed (404): Route /api/x not found');
  });

  test('encodes the ID so a "/" cannot change the route', async () => {
    fetch.mockResolvedValue(fakeResponse(400, { error: 'Invalid listing ID' }));
    await expect(fetchPropertyDetail('12/34')).rejects.toThrow();
    expect(fetch).toHaveBeenCalledWith('/api/properties/12%2F34');
  });
});
