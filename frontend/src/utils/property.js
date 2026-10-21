// Helper functions (Week 5): turn raw database values into safe, readable text for the cards.
// Every function accepts any value (null, '', bad data) and never throws.

// Debug challenge: L_Photos is usually a JSON array of URLs, but 211 properties have "".
// Returns the first photo URL, or null if there isn't a usable one.
export function getFirstPhoto(rawPhotos) {
  if (typeof rawPhotos !== 'string' || rawPhotos.trim() === '') return null;
  try {
    const photos = JSON.parse(rawPhotos);
    if (!Array.isArray(photos)) return null;
    const first = photos[0];
    return typeof first === 'string' && first.trim() !== '' ? first : null;
  } catch {
    return null; // broken JSON
  }
}

// Turns a value into a number, or null if it's missing or not a number ("4.0" → 4, "" → null)
function toNumber(value) {
  if (value === null || value === undefined || value === '') return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

// 1122426 → "$1,122,426"
export function formatPrice(value) {
  const price = toNumber(value);
  if (price === null || price <= 0) return 'Price not listed';
  return '$' + price.toLocaleString('en-US');
}

// 2992 → "2,992 sqft" (LM_Int2_3 = living area)
export function formatSqft(value) {
  const sqft = toNumber(value);
  if (sqft === null || sqft <= 0) return '— sqft';
  return `${sqft.toLocaleString('en-US')} sqft`;
}

// Beds or baths: 5 → "5", "4.0" → "4", "2.5" → "2.5", missing → "—"
export function formatCount(value) {
  const count = toNumber(value);
  return count === null ? '—' : String(count);
}

// "349 E Gobind Blvd", or a fallback if it's missing
export function formatAddress(address) {
  return typeof address === 'string' && address.trim() !== '' ? address.trim() : 'Address not listed';
}

// ("Mountain House", "CA") → "Mountain House, CA"; skips whichever part is missing
export function formatCityState(city, state) {
  const parts = [city, state]
    .map((part) => (typeof part === 'string' ? part.trim() : ''))
    .filter((part) => part !== '');
  return parts.length > 0 ? parts.join(', ') : 'Location not listed';
}
