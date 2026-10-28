// ListingsPage tests: the API client is replaced by a mock, so no backend is needed
import { render, screen, fireEvent, act } from '@testing-library/react';
import ListingsPage from './ListingsPage';
import { fetchProperties } from '../api/client';

jest.mock('../api/client'); // every function in client.js becomes a mock

beforeEach(() => {
  jest.resetAllMocks(); // forget calls and answers from the previous test
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

  expect(await screen.findByText('Showing 2 of 55,212 properties')).toBeInTheDocument();
  expect(screen.getAllByRole('article')).toHaveLength(2);
  expect(screen.getByText('1461 Laurel Way')).toBeInTheDocument();
  expect(screen.queryByText('Loading properties…')).not.toBeInTheDocument();
  expect(fetchProperties).toHaveBeenCalledWith({ limit: 20 });
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

  expect(fetchProperties).toHaveBeenLastCalledWith({ city: 'Irvine', beds: '3', limit: 20 });
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
  expect(fetchProperties).toHaveBeenLastCalledWith({ limit: 20 });
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
  expect(screen.getByText('Showing 1 of 723 properties')).toBeInTheDocument();
});
