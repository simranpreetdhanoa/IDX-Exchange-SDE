// ListingsPage tests: the API client is replaced by a mock, so no backend is needed
import { render, screen } from '@testing-library/react';
import ListingsPage from './ListingsPage';
import { fetchProperties } from '../api/client';

jest.mock('../api/client'); // every function in client.js becomes a mock

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

test('shows "No properties found." when there are no results', async () => {
  fetchProperties.mockResolvedValue({ total: 0, limit: 20, offset: 0, results: [] });
  render(<ListingsPage />);
  expect(await screen.findByText('No properties found.')).toBeInTheDocument();
  expect(screen.getByText('Showing 0 of 0 properties')).toBeInTheDocument();
});
