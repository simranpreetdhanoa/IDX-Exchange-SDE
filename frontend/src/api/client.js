// API client (Week 5): every call to the backend goes through this file.
// Paths start with /api; the Vite proxy forwards them to http://localhost:5000.

// Sends a GET request and returns the JSON body.
// Throws an Error with a clear message if the server can't be reached
// or answers with an error status (400, 404, 500...).
async function request(path) {
  let response;
  try {
    response = await fetch(path);
  } catch {
    throw new Error('Cannot reach the server. Is the frontend dev server running?');
  }

  let body = null;
  try {
    body = await response.json();
  } catch {
    // Not JSON (e.g. the proxy's own error page); keep body as null
  }

  if (!response.ok) {
    if (body === null && response.status >= 500) {
      throw new Error('Cannot reach the backend. Is the API running on port 5000?');
    }
    const detail = body?.error || body?.message || response.statusText;
    throw new Error(`Request failed (${response.status}): ${detail}`);
  }

  return body;
}

// Search properties. params can include: city, zipcode, minPrice, maxPrice, beds, baths, limit, offset
// Returns { total, limit, offset, results }
export function fetchProperties(params = {}) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      query.append(key, value);
    }
  }
  const queryString = query.toString();
  return request(`/api/properties${queryString ? `?${queryString}` : ''}`);
}

// One property by its listing ID (L_ListingID). Returns the full property object.
export function fetchPropertyDetail(id) {
  return request(`/api/properties/${encodeURIComponent(id)}`);
}
