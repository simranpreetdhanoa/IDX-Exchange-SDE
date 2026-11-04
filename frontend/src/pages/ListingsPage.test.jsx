// ListingsPage tests: the API client is replaced by a mock, so no backend is needed
import { render, screen, fireEvent, act } from '@testing-library/react';
import ListingsPage from './ListingsPage';
import { fetchProperties } from '../api/client';

jest.mock('../api/client'); // every function in client.js becomes a mock

beforeEach(() => {
  jest.resetAllMocks(); // forget calls and answers from the previous test
  window.scrollTo = jest.fn(); // the pretend browser page in tests can't really scroll
});

const twoHouses = {
  total: 55212,
  limit: 20,
  offset: 0,
  results: [
    { id: 1, L_Address: '1461 Laurel Way', L_SystemPrice: 3950000, L_Photos: '' },
    { id: 2, L_Address: '582 Pasture Ave', L_SystemPrice: 775000, L_Photos: '' },
  ],
};

test('shows "Loading properties…" first, then the count and the cards', async () => {
  fetchProperties.mockResolvedValue(twoHouses);
  render(<ListingsPage />);
  expect(screen.getByText('Loading properties…')).toBeInTheDocument();

  expect(await screen.findByText('Showing 1-2 of 55,212 properties')).toBeInTheDocument();
  expect(screen.getAllByRole('article')).toHaveLength(2);
  expect(screen.getByText('1461 Laurel Way')).toBeInTheDocument();
  expect(screen.queryByText('Loading properties…')).not.toBeInTheDocument();
  expect(fetchProperties).toHaveBeenCalledWith({ limit: 20, offset: 0 });
});

test('shows the error message when the backend is unreachable', async () => {
  fetchProperties.mockRejectedValue(new Error('Cannot reach the backend. Is the API running on port 5000?'));
  render(<ListingsPage />);
  const alert = await screen.findByRole('alert');
  expect(alert).toHaveTextContent("Couldn't load properties. Cannot reach the backend. Is the API running on port 5000?");
  expect(screen.queryByRole('article')).not.toBeInTheDocument();
});

test('shows a helpful message when there are no results', async () => {
  fetchProperties.mockResolvedValue({ total: 0, limit: 20, offset: 0, results: [] });
  render(<ListingsPage />);
  expect(await screen.findByText('No properties found.')).toBeInTheDocument();
  expect(screen.getByText(/widen the price range/)).toBeInTheDocument();
  expect(screen.queryByRole('article')).not.toBeInTheDocument();
});

// Week 6: the filter form on the page

test('shows the filter form above the grid', async () => {
  fetchProperties.mockResolvedValue(twoHouses);
  render(<ListingsPage />);
  expect(screen.getByRole('form', { name: 'Property filters' })).toBeInTheDocument();
  expect(await screen.findAllByRole('article')).toHaveLength(2);
});

test('Search fetches with only the filled-in filters (empty ones are not sent)', async () => {
  fetchProperties.mockResolvedValue(twoHouses);
  render(<ListingsPage />);
  await screen.findAllByRole('article');

  fireEvent.change(screen.getByLabelText('City'), { target: { value: ' Irvine ' } });
  fireEvent.change(screen.getByLabelText('Beds'), { target: { value: '3' } });
  fireEvent.click(screen.getByRole('button', { name: 'Search' }));

  expect(fetchProperties).toHaveBeenLastCalledWith({ city: 'Irvine', beds: '3', limit: 20, offset: 0 });
  expect(await screen.findAllByRole('article')).toHaveLength(2);
});

test('Clear Filters empties the form and reloads all properties', async () => {
  fetchProperties.mockResolvedValue(twoHouses);
  render(<ListingsPage />);
  await screen.findAllByRole('article');

  fireEvent.change(screen.getByLabelText('City'), { target: { value: 'Irvine' } });
  fireEvent.click(screen.getByRole('button', { name: 'Search' }));
  await screen.findAllByRole('article');
  fireEvent.click(screen.getByRole('button', { name: 'Clear Filters' }));

  expect(screen.getByLabelText('City')).toHaveValue('');
  expect(fetchProperties).toHaveBeenLastCalledWith({ limit: 20, offset: 0 });
  expect(fetchProperties).toHaveBeenCalledTimes(3); // first load, search, clear
  expect(await screen.findAllByRole('article')).toHaveLength(2);
});

test('keeps what the user typed when a search fails', async () => {
  fetchProperties.mockResolvedValueOnce(twoHouses);
  fetchProperties.mockRejectedValueOnce(new Error('Request failed (400): minPrice cannot be greater than maxPrice'));
  render(<ListingsPage />);
  await screen.findAllByRole('article');

  fireEvent.change(screen.getByLabelText('Min price'), { target: { value: '900000' } });
  fireEvent.change(screen.getByLabelText('Max price'), { target: { value: '100000' } });
  fireEvent.click(screen.getByRole('button', { name: 'Search' }));

  expect(await screen.findByRole('alert')).toHaveTextContent('minPrice cannot be greater than maxPrice');
  expect(screen.getByLabelText('Min price')).toHaveValue(900000);
});

// Week 6 debug challenge: an old answer that arrives late must not replace the newer one
test('ignores a slow old answer that arrives after a newer search (race condition)', async () => {
  const allHomes = { total: 55212, limit: 20, offset: 0, results: [{ id: 1, L_Address: 'Old: all homes', L_Photos: '' }] };
  const irvine = { total: 723, limit: 20, offset: 0, results: [{ id: 2, L_Address: 'New: Irvine home', L_Photos: '' }] };

  // The first load answers straight away; then we hold the next two answers and release them by hand
  let answerClear;
  let answerIrvine;
  fetchProperties
    .mockResolvedValueOnce(twoHouses)
    .mockReturnValueOnce(new Promise((resolve) => { answerClear = resolve; }))
    .mockReturnValueOnce(new Promise((resolve) => { answerIrvine = resolve; }));

  render(<ListingsPage />);
  await screen.findAllByRole('article');

  fireEvent.click(screen.getByRole('button', { name: 'Clear Filters' })); // request A: all homes
  fireEvent.change(screen.getByLabelText('City'), { target: { value: 'Irvine' } });
  fireEvent.click(screen.getByRole('button', { name: 'Search' })); // request B: Irvine

  await act(async () => answerIrvine(irvine)); // B arrives first...
  expect(screen.getByText('New: Irvine home')).toBeInTheDocument();

  await act(async () => answerClear(allHomes)); // ...then A arrives late
  expect(screen.getByText('New: Irvine home')).toBeInTheDocument();
  expect(screen.queryByText('Old: all homes')).not.toBeInTheDocument();
  expect(screen.getByText('Showing 1-1 of 723 properties')).toBeInTheDocument();
});

// Week 7: pagination on the page

// A pretend answer for one page: the right number of homes, with ids that follow the offset
function pageOf(total, { limit, offset }) {
  const count = Math.min(limit, total - offset);
  const results = Array.from({ length: count }, (_, index) => ({
    id: offset + index + 1,
    L_Address: `Home ${offset + index + 1}`,
    L_Photos: '',
  }));
  return Promise.resolve({ total, limit, offset, results });
}

test('the controls appear below the property grid', async () => {
  fetchProperties.mockImplementation((params) => pageOf(50, params));
  render(<ListingsPage />);
  await screen.findAllByRole('article');

  const grid = screen.getAllByRole('article')[0].parentElement;
  const controls = screen.getByRole('navigation', { name: 'Pagination' });
  expect(grid.compareDocumentPosition(controls)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
});

test('the summary shows the range of the current page', async () => {
  fetchProperties.mockImplementation((params) => pageOf(50, params));
  render(<ListingsPage />);
  expect(await screen.findByText('Showing 1-20 of 50 properties')).toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: 'Page 2' }));
  expect(await screen.findByText('Showing 21-40 of 50 properties')).toBeInTheDocument();
});

test('the summary on a part-full last page stops at the total', async () => {
  fetchProperties.mockImplementation((params) => pageOf(50, params));
  render(<ListingsPage />);
  await screen.findAllByRole('article');

  fireEvent.click(screen.getByRole('button', { name: 'Page 3' }));
  expect(await screen.findByText('Showing 41-50 of 50 properties')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled();
});

test('changing page fetches the right offset and scrolls to the top', async () => {
  fetchProperties.mockImplementation((params) => pageOf(50, params));
  render(<ListingsPage />);
  await screen.findAllByRole('article');
  expect(window.scrollTo).not.toHaveBeenCalled(); // not on the first load

  fireEvent.click(screen.getByRole('button', { name: 'Next' }));

  expect(fetchProperties).toHaveBeenLastCalledWith({ limit: 20, offset: 20 });
  expect(window.scrollTo).toHaveBeenCalledWith(0, 0);
  expect(await screen.findByText('Home 21')).toBeInTheDocument();
});

test('changing page keeps the active filters', async () => {
  fetchProperties.mockImplementation((params) => pageOf(50, params));
  render(<ListingsPage />);
  await screen.findAllByRole('article');

  fireEvent.change(screen.getByLabelText('City'), { target: { value: 'Irvine' } });
  fireEvent.click(screen.getByRole('button', { name: 'Search' }));
  await screen.findAllByRole('article');
  fireEvent.click(screen.getByRole('button', { name: 'Page 3' }));

  expect(fetchProperties).toHaveBeenLastCalledWith({ city: 'Irvine', limit: 20, offset: 40 });
  await screen.findAllByRole('article');
  expect(screen.getByLabelText('City')).toHaveValue('Irvine');
});

test('changing page ignores text that was typed but not searched yet', async () => {
  fetchProperties.mockImplementation((params) => pageOf(50, params));
  render(<ListingsPage />);
  await screen.findAllByRole('article');

  fireEvent.change(screen.getByLabelText('City'), { target: { value: 'Irvine' } });
  fireEvent.click(screen.getByRole('button', { name: 'Next' }));

  expect(fetchProperties).toHaveBeenLastCalledWith({ limit: 20, offset: 20 });
  await screen.findAllByRole('article');
});

test('applying new filters goes back to page 1, with one request', async () => {
  fetchProperties.mockImplementation((params) => pageOf(50, params));
  render(<ListingsPage />);
  await screen.findAllByRole('article');
  fireEvent.click(screen.getByRole('button', { name: 'Page 3' }));
  await screen.findByText('Showing 41-50 of 50 properties');
  fetchProperties.mockClear();

  fireEvent.change(screen.getByLabelText('City'), { target: { value: 'Irvine' } });
  fireEvent.click(screen.getByRole('button', { name: 'Search' }));

  expect(fetchProperties).toHaveBeenCalledTimes(1); // the page and the filters change together
  expect(fetchProperties).toHaveBeenCalledWith({ city: 'Irvine', limit: 20, offset: 0 });
  expect(await screen.findByText('Showing 1-20 of 50 properties')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Page 1' })).toHaveAttribute('aria-current', 'page');
});

test('Clear Filters also goes back to page 1', async () => {
  fetchProperties.mockImplementation((params) => pageOf(50, params));
  render(<ListingsPage />);
  await screen.findAllByRole('article');
  fireEvent.click(screen.getByRole('button', { name: 'Page 3' }));
  await screen.findByText('Showing 41-50 of 50 properties');

  fireEvent.click(screen.getByRole('button', { name: 'Clear Filters' }));

  expect(fetchProperties).toHaveBeenLastCalledWith({ limit: 20, offset: 0 });
  expect(await screen.findByText('Showing 1-20 of 50 properties')).toBeInTheDocument();
});

test('the controls are hidden when all the results fit on one page', async () => {
  fetchProperties.mockImplementation((params) => pageOf(20, params));
  render(<ListingsPage />);
  expect(await screen.findByText('Showing 1-20 of 20 properties')).toBeInTheDocument();
  expect(screen.queryByRole('navigation', { name: 'Pagination' })).not.toBeInTheDocument();
});

test('ignores a slow page that arrives after a newer page was chosen', async () => {
  let answerPage2;
  fetchProperties.mockImplementation((params) => {
    if (params.offset === 20) {
      return new Promise((resolve) => { answerPage2 = resolve; });
    }
    return pageOf(50, params);
  });
  render(<ListingsPage />);
  await screen.findAllByRole('article');

  fireEvent.click(screen.getByRole('button', { name: 'Page 2' })); // slow
  fireEvent.click(screen.getByRole('button', { name: 'Clear Filters' })); // back to page 1, answers straight away
  await screen.findByText('Showing 1-20 of 50 properties');

  await act(async () => answerPage2({ total: 50, limit: 20, offset: 20, results: [{ id: 99, L_Address: 'Late home', L_Photos: '' }] }));
  expect(screen.queryByText('Late home')).not.toBeInTheDocument();
  expect(screen.getByText('Showing 1-20 of 50 properties')).toBeInTheDocument();
});
