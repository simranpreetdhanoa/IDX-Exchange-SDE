import { getPageNumbers } from '../utils/pagination';
import './Pagination.css';

// Page controls (Week 7): Previous, page numbers with ellipsis, Next.
// The page owns the current page; this component only draws it and reports clicks through onPageChange.
export default function Pagination({ currentPage, totalPages, onPageChange }) {
  if (totalPages <= 1) {
    return null; // only one page: nothing to navigate
  }

  return (
    <nav className="pagination" aria-label="Pagination">
      <button
        type="button"
        className="pagination-button"
        disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
      >
        Previous
      </button>

      {getPageNumbers(currentPage, totalPages).map((item, index) =>
        item === '...' ? (
          // index in the key: there can be two ellipses in one row
          <span key={`ellipsis-${index}`} className="pagination-ellipsis">...</span>
        ) : (
          <button
            key={item}
            type="button"
            className={`pagination-button${item === currentPage ? ' pagination-current' : ''}`}
            aria-label={`Page ${item}`}
            aria-current={item === currentPage ? 'page' : undefined}
            disabled={item === currentPage}
            onClick={() => onPageChange(item)}
          >
            {item}
          </button>
        ),
      )}

      <button
        type="button"
        className="pagination-button"
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(currentPage + 1)}
      >
        Next
      </button>
    </nav>
  );
}
