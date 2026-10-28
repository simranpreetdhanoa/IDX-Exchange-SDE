// Tests for the filter helpers (plain functions, no React needed)
import { EMPTY_FILTERS, removeEmptyFilters } from './filters';

test('a blank form becomes an empty object (nothing sent to the API)', () => {
  expect(removeEmptyFilters(EMPTY_FILTERS)).toEqual({});
});

test('keeps only the filled-in values', () => {
  expect(removeEmptyFilters({ ...EMPTY_FILTERS, city: 'Irvine', beds: '3' })).toEqual({ city: 'Irvine', beds: '3' });
});

test('trims spaces, and treats spaces-only as empty', () => {
  expect(removeEmptyFilters({ city: '  Irvine ', zipcode: '   ' })).toEqual({ city: 'Irvine' });
});

test('handles null and undefined without crashing', () => {
  expect(removeEmptyFilters({ city: null, zipcode: undefined, beds: 2 })).toEqual({ beds: '2' });
});
