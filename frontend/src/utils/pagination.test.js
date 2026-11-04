// Tests for the page number logic (a plain function, no React needed)
import { getPageNumbers, getTotalPages } from './pagination';

describe('getPageNumbers', () => {
  test('shows every page when they all fit (no ellipsis)', () => {
    expect(getPageNumbers(1, 1)).toEqual([1]);
    expect(getPageNumbers(3, 5)).toEqual([1, 2, 3, 4, 5]);
    expect(getPageNumbers(7, 7)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  test('current page near the start: one ellipsis before the last page', () => {
    expect(getPageNumbers(1, 24)).toEqual([1, 2, 3, 4, 5, '...', 24]);
    expect(getPageNumbers(4, 24)).toEqual([1, 2, 3, 4, 5, '...', 24]);
  });

  test('current page in the middle: an ellipsis on both sides', () => {
    expect(getPageNumbers(5, 24)).toEqual([1, '...', 4, 5, 6, '...', 24]);
    expect(getPageNumbers(20, 24)).toEqual([1, '...', 19, 20, 21, '...', 24]);
  });

  test('current page near the end: one ellipsis after the first page', () => {
    expect(getPageNumbers(21, 24)).toEqual([1, '...', 20, 21, 22, 23, 24]);
    expect(getPageNumbers(24, 24)).toEqual([1, '...', 20, 21, 22, 23, 24]);
  });

  // Week 7 debug challenge: the same page number must never appear twice
  test('never repeats a page number, for any page of any size', () => {
    for (let totalPages = 1; totalPages <= 30; totalPages++) {
      for (let currentPage = 1; currentPage <= totalPages; currentPage++) {
        const numbers = getPageNumbers(currentPage, totalPages).filter((item) => item !== '...');
        expect(new Set(numbers).size).toBe(numbers.length);
      }
    }
  });

  // The exact output in the assignment needs a current page past the end: page 3 of 1
  test('does not render "1 ... 2 3 4 ... 1" when the current page is past the end', () => {
    expect(getPageNumbers(3, 1)).toEqual([1]);
  });

  test('page 23 of 24 does not show 24 twice', () => {
    expect(getPageNumbers(23, 24)).toEqual([1, '...', 20, 21, 22, 23, 24]);
  });
});

describe('getTotalPages', () => {
  test('rounds up, so a part-full last page still counts', () => {
    expect(getTotalPages(41, 20)).toBe(3);
    expect(getTotalPages(55212, 20)).toBe(2761);
  });

  test('an exact fit does not add an empty page', () => {
    expect(getTotalPages(40, 20)).toBe(2);
  });

  test('no results means no pages', () => {
    expect(getTotalPages(0, 20)).toBe(0);
  });
});
