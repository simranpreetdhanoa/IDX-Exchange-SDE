// Filter helpers (Week 6)

// Blank form: an empty string means "any" for that filter
export const EMPTY_FILTERS = {
  city: '',
  zipcode: '',
  minPrice: '',
  maxPrice: '',
  beds: '',
  baths: '',
};

// Returns a copy without empty values, so the API only gets the filters the user filled in.
// Text is trimmed: "  Irvine " → "Irvine", and "   " counts as empty.
export function removeEmptyFilters(filters) {
  const cleaned = {};
  for (const [key, value] of Object.entries(filters)) {
    const text = String(value ?? '').trim();
    if (text !== '') {
      cleaned[key] = text;
    }
  }
  return cleaned;
}
