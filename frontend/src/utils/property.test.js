// Tests for the property helpers (Week 5 debug challenge: L_Photos is not always valid JSON)
import {
  getPhotos,
  getFirstPhoto,
  formatPrice,
  formatSqft,
  formatCount,
  formatAddress,
  formatCityState,
  formatYear,
  formatFeatureList,
  formatLotSize,
  formatDays,
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

// Week 8: year built on the detail page
describe('formatYear', () => {
  test.each([
    [1973, '1973'],
    ['2005', '2005'],
    [null, '—'],
    [undefined, '—'],
    ['', '—'],
    [0, '—'],
    [3025, '—'],
    [1973.5, '—'],
    ['abc', '—'],
  ])('formatYear(%p) → %p', (value, expected) => {
    expect(formatYear(value)).toBe(expected);
  });
});

// Week 8: tidy CamelCase lists for the property details
describe('formatFeatureList', () => {
  test.each([
    ['SingleFamilyResidence', 'Single Family Residence'],
    ['CityLights,Coastline', 'City Lights, Coastline'],
    [' Carpet , Tile ', 'Carpet, Tile'],
    ['Central', 'Central'],
    ['HOA', 'HOA'], // a run of capitals is left alone
    ['Carpet,,', 'Carpet'],
    ['', null],
    [' , ', null],
    [null, null],
    [undefined, null],
  ])('formatFeatureList(%p) → %p', (value, expected) => {
    expect(formatFeatureList(value)).toBe(expected);
  });
});

describe('formatLotSize', () => {
  test.each([
    [0.4261, '18562.00', '0.43 acres (18,562 sqft)'],
    ['0.1220', null, '0.12 acres'],
    [null, '5314.00', '5,314 sqft'],
    [0.001, 50, '50 sqft'], // too small to show in acres
    [null, null, null],
    ['', '0', null],
  ])('formatLotSize(%p, %p) → %p', (acres, sqft, expected) => {
    expect(formatLotSize(acres, sqft)).toBe(expected);
  });
});

describe('formatDays', () => {
  test.each([
    [245, '245 days'],
    ['1', '1 day'],
    [0, '0 days'],
    [1500, '1,500 days'],
    [-3, null],
    [null, null],
    ['', null],
  ])('formatDays(%p) → %p', (value, expected) => {
    expect(formatDays(value)).toBe(expected);
  });
});

// Week 8: the list of photos for the carousel and the gallery
describe('getPhotos', () => {
  test('returns every URL of a valid JSON array, in order', () => {
    expect(getPhotos('["https://a.com/1.jpg","https://a.com/2.jpg","https://a.com/3.jpg"]')).toEqual([
      'https://a.com/1.jpg',
      'https://a.com/2.jpg',
      'https://a.com/3.jpg',
    ]);
  });

  test('works with a single photo', () => {
    expect(getPhotos('["https://a.com/only.jpg"]')).toEqual(['https://a.com/only.jpg']);
  });

  test('reads escaped slashes like the real data', () => {
    expect(getPhotos('["https:\\/\\/a.com\\/1.jpg"]')).toEqual(['https://a.com/1.jpg']);
  });

  test.each([
    ['empty text', ''],
    ['only spaces', '   '],
    ['null', null],
    ['undefined', undefined],
    ['broken JSON', '["https://a.com/1.jpg"'],
    ['not a list', '{"url":"https://a.com/1.jpg"}'],
    ['an empty list', '[]'],
    ['a number', 42],
  ])('%s → []', (_label, value) => {
    expect(getPhotos(value)).toEqual([]);
  });

  test('skips blanks and non-text items, and trims spaces', () => {
    expect(getPhotos('["", " https://a.com/1.jpg ", null, 7, "https://a.com/2.jpg"]')).toEqual([
      'https://a.com/1.jpg',
      'https://a.com/2.jpg',
    ]);
  });
});
