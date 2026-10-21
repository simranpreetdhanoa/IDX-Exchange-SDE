// Tests for the property helpers (Week 5 debug challenge: L_Photos is not always valid JSON)
import {
  getFirstPhoto,
  formatPrice,
  formatSqft,
  formatCount,
  formatAddress,
  formatCityState,
} from './property';

describe('getFirstPhoto', () => {
  test('returns the first URL of a valid JSON array', () => {
    expect(getFirstPhoto('["https://example.com/a.jpg","https://example.com/b.jpg"]')).toBe(
      'https://example.com/a.jpg',
    );
  });

  // Every bad value must give null (→ placeholder), never throw
  test.each([
    ['empty string (the 211 real properties)', ''],
    ['only spaces', '   '],
    ['null', null],
    ['undefined', undefined],
    ['broken JSON', 'broken['],
    ['JSON null', 'null'],
    ['JSON object, not an array', '{}'],
    ['empty array', '[]'],
    ['first item is a number', '[1]'],
    ['first item is an empty string', '[""]'],
    ['JSON text, not an array', '"just text"'],
    ['a number instead of text', 42],
  ])('returns null for %s', (_label, input) => {
    expect(getFirstPhoto(input)).toBeNull();
  });
});

describe('formatPrice', () => {
  test.each([
    [1122426, '$1,122,426'],
    ['950000', '$950,000'],
    [0, 'Price not listed'],
    [null, 'Price not listed'],
    ['abc', 'Price not listed'],
    [-5, 'Price not listed'],
  ])('formatPrice(%p) → %p', (input, expected) => {
    expect(formatPrice(input)).toBe(expected);
  });
});

describe('formatSqft', () => {
  test.each([
    [2992, '2,992 sqft'],
    [0, '— sqft'],
    [null, '— sqft'],
    ['', '— sqft'],
  ])('formatSqft(%p) → %p', (input, expected) => {
    expect(formatSqft(input)).toBe(expected);
  });
});

describe('formatCount', () => {
  test.each([
    [5, '5'],
    ['4.0', '4'],
    ['2.5', '2.5'],
    [0, '0'],
    [null, '—'],
    ['', '—'],
    ['x', '—'],
  ])('formatCount(%p) → %p', (input, expected) => {
    expect(formatCount(input)).toBe(expected);
  });
});

describe('formatAddress', () => {
  test.each([
    ['349 E Gobind Blvd', '349 E Gobind Blvd'],
    ['  12 Main St ', '12 Main St'],
    ['', 'Address not listed'],
    [null, 'Address not listed'],
  ])('formatAddress(%p) → %p', (input, expected) => {
    expect(formatAddress(input)).toBe(expected);
  });
});

describe('formatCityState', () => {
  test.each([
    ['Mountain House', 'CA', 'Mountain House, CA'],
    ['Fresno', '', 'Fresno'],
    [null, 'CA', 'CA'],
    ['', null, 'Location not listed'],
    [' Irvine ', ' CA ', 'Irvine, CA'],
  ])('formatCityState(%p, %p) → %p', (city, state, expected) => {
    expect(formatCityState(city, state)).toBe(expected);
  });
});
