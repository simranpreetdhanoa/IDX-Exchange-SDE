// Pagination helpers (Week 7)

const MAX_VISIBLE_PAGES = 7; // up to this many pages fit without an ellipsis
const EDGE_PAGES = 5; // how many pages in a row to show near the start or the end

// The list of buttons to draw, e.g. page 5 of 24 → [1, '...', 4, 5, 6, '...', 24]
export function getPageNumbers(currentPage, totalPages) {
  // Case 1: everything fits, no ellipsis needed
  if (totalPages <= MAX_VISIBLE_PAGES) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  // Case 2: near the start → 1 2 3 4 5 ... 24
  if (currentPage < EDGE_PAGES) {
    const firstPages = Array.from({ length: EDGE_PAGES }, (_, index) => index + 1);
    return [...firstPages, '...', totalPages];
  }

  // Case 3: near the end → 1 ... 20 21 22 23 24
  if (currentPage > totalPages - EDGE_PAGES + 1) {
    const lastPages = Array.from({ length: EDGE_PAGES }, (_, index) => totalPages - EDGE_PAGES + 1 + index);
    return [1, '...', ...lastPages];
  }

  // Case 4: in the middle → 1 ... 4 5 6 ... 24
  return [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages];
}

// Rounds up: 41 homes at 20 per page need 3 pages
export function getTotalPages(total, itemsPerPage) {
  return Math.ceil(total / itemsPerPage);
}
