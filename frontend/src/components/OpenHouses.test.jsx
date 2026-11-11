// OpenHouses tests (Week 8): the API client is replaced by a mock, so no backend is needed
import { render, screen } from '@testing-library/react';
import OpenHouses from './OpenHouses';
import { fetchOpenHouses } from '../api/client';

jest.mock('../api/client');

beforeEach(() => {
  jest.resetAllMocks();
});

const sunday = {
  id: 7,
  L_ListingID: '1175978785',
  OH_StartDate: '2026-09-20T07:00:00.000Z',
  OH_StartTime: '13:00:00',
  OH_EndTime: '16:00:00',
};

test('asks the API for this home\'s open houses', async () => {
  fetchOpenHouses.mockResolvedValue([]);
  render(<OpenHouses listingId="1175978785" />);
  await screen.findByText('No open houses scheduled');
  expect(fetchOpenHouses).toHaveBeenCalledWith('1175978785');
});

test('shows "Loading open houses…" first, then the date and formatted times', async () => {
  fetchOpenHouses.mockResolvedValue([sunday]);
  render(<OpenHouses listingId="1175978785" />);
  expect(screen.getByText('Loading open houses…')).toBeInTheDocument();
  expect(await screen.findByText('Sun, Sep 20, 2026')).toBeInTheDocument();
  expect(screen.getByText('· 1:00 PM – 4:00 PM')).toBeInTheDocument();
  expect(screen.queryByText('Loading open houses…')).not.toBeInTheDocument();
});

test('an empty list shows "No open houses scheduled"', async () => {
  fetchOpenHouses.mockResolvedValue([]);
  render(<OpenHouses listingId="1118422731" />);
  expect(await screen.findByText('No open houses scheduled')).toBeInTheDocument();
});

test('a missing date and time show a fallback instead of crashing', async () => {
  fetchOpenHouses.mockResolvedValue([{ id: 8, OH_StartDate: null, OH_StartTime: null, OH_EndTime: '16:00:00' }]);
  render(<OpenHouses listingId="1" />);
  expect(await screen.findByText('Date not listed')).toBeInTheDocument();
  expect(screen.getByText('· 4:00 PM')).toBeInTheDocument();
});

test('an API error shows a message in this section only', async () => {
  fetchOpenHouses.mockRejectedValue(new Error('Request failed (500): Internal Server Error'));
  render(<OpenHouses listingId="1175978785" />);
  expect(await screen.findByRole('alert')).toHaveTextContent(
    "Couldn't load open houses. Request failed (500): Internal Server Error"
  );
});
