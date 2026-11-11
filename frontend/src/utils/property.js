// Helper functions (Week 5): turn raw database values into safe, readable text for the cards.
// Every function accepts any value (null, '', bad data) and never throws.

// Week 8: L_Photos is a JSON array of URLs (or "" for 211 homes).
// Returns every usable photo URL, or [] if there are none. Never throws.
export function getPhotos(rawPhotos) {
  if (typeof rawPhotos !== 'string' || rawPhotos.trim() === '') return [];
  try {
    const photos = JSON.parse(rawPhotos);
    if (!Array.isArray(photos)) return [];
    return photos
      .filter((url) => typeof url === 'string' && url.trim() !== '')
      .map((url) => url.trim());
  } catch {
    return []; // broken JSON
  }
}

// Week 5 debug challenge (now built on getPhotos): the first photo URL, or null if there isn't a usable one
export function getFirstPhoto(rawPhotos) {
  return getPhotos(rawPhotos)[0] ?? null;
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

// Week 8: 1973 → "1973"; missing or impossible years (0, 3025) → "—"
export function formatYear(value) {
  const year = toNumber(value);
  const thisYear = new Date().getFullYear();
  const valid = year !== null && Number.isInteger(year) && year >= 1800 && year <= thisYear + 1;
  return valid ? String(year) : '—';
}

// Week 8: "SingleFamilyResidence" → "Single Family Residence"; "CityLights,Coastline" → "City Lights, Coastline"
// Missing or empty → null (so the detail row can be hidden)
export function formatFeatureList(value) {
  if (value === null || value === undefined) return null;
  const words = String(value)
    .split(',')
    .map((item) => item.trim().replace(/([a-z])([A-Z])/g, '$1 $2'))
    .filter((item) => item !== '');
  return words.length > 0 ? words.join(', ') : null;
}

// Week 8: (0.4261, 18562) → "0.43 acres (18,562 sqft)"; one of them → just that one; neither → null
export function formatLotSize(acres, squareFeet) {
  const acreValue = toNumber(acres);
  const sqftValue = toNumber(squareFeet);
  // Below 0.01 the acres would round to "0", so leave them out
  const acreText =
    acreValue !== null && acreValue >= 0.01
      ? `${acreValue.toLocaleString('en-US', { maximumFractionDigits: 2 })} acres`
      : null;
  const sqftText =
    sqftValue !== null && sqftValue > 0
      ? `${Math.round(sqftValue).toLocaleString('en-US')} sqft`
      : null;
  if (acreText && sqftText) return `${acreText} (${sqftText})`;
  return acreText || sqftText;
}

// Week 8: 245 → "245 days", 1 → "1 day"; missing or negative → null
export function formatDays(value) {
  const days = toNumber(value);
  if (days === null || days < 0 || !Number.isInteger(days)) return null;
  return days === 1 ? '1 day' : `${days.toLocaleString('en-US')} days`;
}
