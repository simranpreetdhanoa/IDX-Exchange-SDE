// Pagination tests: onPageChange is a mock (jest.fn), so we can check which page each click asks for
import { render, screen, fireEvent } from '@testing-library/react';
import Pagination from './Pagination';

// Renders the controls with a fresh mock and returns it
function renderPagination(currentPage, totalPages) {
  const onPageChange = jest.fn();
  render(<Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={onPageChange} />);
  return onPageChange;
}

// The row as the user reads it, e.g. "Previous 1 ... 4 5 6 ... 24 Next"
function rowText() {
  return Array.from(screen.getByRole('navigation', { name: 'Pagination' }).children)
    .map((item) => item.textContent)
    .join(' ');
}

test('first page: Previous is disabled, Next works', () => {
  const onPageChange = renderPagination(1, 24);
  expect(screen.getByRole('button', { name: 'Previous' })).toBeDisabled();
  expect(screen.getByRole('button', { name: 'Next' })).toBeEnabled();

  fireEvent.click(screen.getByRole('button', { name: 'Next' }));
  expect(onPageChange).toHaveBeenCalledWith(2);
});

test('last page: Next is disabled, Previous works', () => {
  const onPageChange = renderPagination(24, 24);
  expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled();
  expect(screen.getByRole('button', { name: 'Previous' })).toBeEnabled();

  fireEvent.click(screen.getByRole('button', { name: 'Previous' }));
  expect(onPageChange).toHaveBeenCalledWith(23);
});

test('middle page: both buttons work, and move one page each way', () => {
  const onPageChange = renderPagination(5, 24);
  fireEvent.click(screen.getByRole('button', { name: 'Previous' }));
  expect(onPageChange).toHaveBeenLastCalledWith(4);
  fireEvent.click(screen.getByRole('button', { name: 'Next' }));
  expect(onPageChange).toHaveBeenLastCalledWith(6);
});

test('clicking a page number asks for that page', () => {
  const onPageChange = renderPagination(5, 24);
  fireEvent.click(screen.getByRole('button', { name: 'Page 24' }));
  expect(onPageChange).toHaveBeenCalledTimes(1);
  expect(onPageChange).toHaveBeenCalledWith(24);
});

test('marks the current page, and clicking it does nothing', () => {
  const onPageChange = renderPagination(5, 24);
  const current = screen.getByRole('button', { name: 'Page 5' });
  expect(current).toHaveAttribute('aria-current', 'page');
  expect(screen.getByRole('button', { name: 'Page 6' })).not.toHaveAttribute('aria-current');

  fireEvent.click(current);
  expect(onPageChange).not.toHaveBeenCalled();
});

test('ellipsis on both sides for a middle page', () => {
  renderPagination(5, 24);
  expect(rowText()).toBe('Previous 1 ... 4 5 6 ... 24 Next');
});

test('one ellipsis near the start', () => {
  renderPagination(2, 24);
  expect(rowText()).toBe('Previous 1 2 3 4 5 ... 24 Next');
});

test('one ellipsis near the end', () => {
  renderPagination(23, 24);
  expect(rowText()).toBe('Previous 1 ... 20 21 22 23 24 Next');
});

test('no ellipsis when all the pages fit', () => {
  renderPagination(2, 5);
  expect(rowText()).toBe('Previous 1 2 3 4 5 Next');
});

test('an ellipsis is plain text, not a button', () => {
  renderPagination(5, 24);
  expect(screen.getAllByText('...')).toHaveLength(2);
  expect(screen.queryByRole('button', { name: '...' })).not.toBeInTheDocument();
});

test('is hidden when there is only one page', () => {
  renderPagination(1, 1);
  expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
});

test('is hidden when there are no pages', () => {
  renderPagination(1, 0);
  expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
});

test('shows two pages with no ellipsis (the smallest row that appears)', () => {
  renderPagination(1, 2);
  expect(rowText()).toBe('Previous 1 2 Next');
});
