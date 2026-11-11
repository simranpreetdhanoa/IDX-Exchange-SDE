// PropertyDetailPage tests (Week 8): the API client is replaced by a mock, so no backend is needed
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import PropertyDetailPage from './PropertyDetailPage';
import { fetchPropertyDetail } from '../api/client';

jest.mock('../api/client'); // every function in client.js becomes a mock

beforeEach(() => {
  jest.resetAllMocks(); // forget calls and answers from the previous test
});

const laurelWay = {
  L_ListingID: '1118422731',
  L_SystemPrice: 3950000,
  L_Address: '1461 Laurel Way',
  L_City: 'Beverly Hills',
  L_State: 'CA',
  L_Zip: '90210',
  L_Keyword2: 4,
  LM_Dec_3: '5.0',
  LM_Int2_3: 3677,
  YearBuilt: 1973,
  L_Remarks: "Opportunity to reimagine a Classic 70's Architectural property.",
  L_DisplayId: '1118422731',
  L_Type_: 'SingleFamilyResidence',
  L_Status: 'Active',
  LotSizeAcres: '0.4261',
  LotSizeSquareFeet: '18562.00',
  View: 'CityLights,Coastline',
  ArchitecturalStyle: '', // empty: its row must be hidden
  DaysOnMarket: 245,
};

// Opens the detail page at /property/<id>, the same way the real app does
function renderAt(id) {
  render(
    <MemoryRouter initialEntries={[`/property/${id}`]}>
      <Routes>
        <Route path="/" element={<p>Listings page</p>} />
        <Route path="/property/:id" element={<PropertyDetailPage />} />
      </Routes>
    </MemoryRouter>
  );
}

test('asks the API for the id in the address', async () => {
  fetchPropertyDetail.mockResolvedValue(laurelWay);
  renderAt('1118422731');
  await screen.findByText('$3,950,000');
  expect(fetchPropertyDetail).toHaveBeenCalledTimes(1);
  expect(fetchPropertyDetail).toHaveBeenCalledWith('1118422731');
});

test('shows "Loading property…" first, then price, address and the 4 stats', async () => {
  fetchPropertyDetail.mockResolvedValue(laurelWay);
  renderAt('1118422731');

  expect(screen.getByText('Loading property…')).toBeInTheDocument();

  expect(await screen.findByText('$3,950,000')).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: '1461 Laurel Way' })).toBeInTheDocument();
  expect(screen.getByText('Beverly Hills, CA 90210')).toBeInTheDocument();
  expect(screen.getByText('4')).toBeInTheDocument(); // beds
  expect(screen.getByText('5')).toBeInTheDocument(); // baths ("5.0" → "5")
  expect(screen.getByText('3,677 sqft')).toBeInTheDocument();
  expect(screen.getByText('1973')).toBeInTheDocument();
  expect(screen.queryByText('Loading property…')).not.toBeInTheDocument();
});

test('missing values show fallbacks instead of crashing', async () => {
  fetchPropertyDetail.mockResolvedValue({ L_ListingID: '1' });
  renderAt('1');
  expect(await screen.findByText('Price not listed')).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: 'Address not listed' })).toBeInTheDocument();
  expect(screen.getByText('— sqft')).toBeInTheDocument();
});

test('an invalid id shows an error and the Back link, not a crash', async () => {
  fetchPropertyDetail.mockRejectedValue(
    new Error('Request failed (400): Invalid listing ID. It must contain only digits (max 20 characters).')
  );
  renderAt('invalid-id');

  const alert = await screen.findByRole('alert');
  expect(alert).toHaveTextContent("Couldn't load this property.");
  expect(alert).toHaveTextContent('Invalid listing ID');
  expect(screen.getByRole('link', { name: '← Back to listings' })).toBeInTheDocument();
});

test('a listing that does not exist shows the 404 message', async () => {
  fetchPropertyDetail.mockRejectedValue(new Error('Request failed (404): No property found with listing ID 999'));
  renderAt('999');
  expect(await screen.findByRole('alert')).toHaveTextContent('No property found with listing ID 999');
});

test('the Back link returns to the listings page', async () => {
  fetchPropertyDetail.mockResolvedValue(laurelWay);
  renderAt('1118422731');
  await screen.findByText('$3,950,000');
  screen.getByRole('link', { name: '← Back to listings' }).click();
  expect(await screen.findByText('Listings page')).toBeInTheDocument();
});

// Week 8 (3b): description and property details
test('shows the description and the tidied property details', async () => {
  fetchPropertyDetail.mockResolvedValue(laurelWay);
  renderAt('1118422731');
  expect(await screen.findByRole('heading', { name: 'About this home' })).toBeInTheDocument();
  expect(screen.getByText("Opportunity to reimagine a Classic 70's Architectural property.")).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: 'Property details' })).toBeInTheDocument();
  expect(screen.getByText('Single Family Residence')).toBeInTheDocument();
  expect(screen.getByText('City Lights, Coastline')).toBeInTheDocument();
  expect(screen.getByText('0.43 acres (18,562 sqft)')).toBeInTheDocument();
  expect(screen.getByText('245 days')).toBeInTheDocument();
});

test('hides detail rows that have no value', async () => {
  fetchPropertyDetail.mockResolvedValue(laurelWay);
  renderAt('1118422731');
  await screen.findByText('Property details');
  expect(screen.getByText('View')).toBeInTheDocument(); // has a value
  expect(screen.queryByText('Architectural style')).not.toBeInTheDocument(); // empty string
  expect(screen.queryByText('Heating')).not.toBeInTheDocument(); // missing
});

test('a home with no description or details shows a fallback and no empty list', async () => {
  fetchPropertyDetail.mockResolvedValue({ L_ListingID: '1' });
  renderAt('1');
  expect(await screen.findByText('No description provided.')).toBeInTheDocument();
  expect(screen.queryByRole('heading', { name: 'Property details' })).not.toBeInTheDocument();
});
