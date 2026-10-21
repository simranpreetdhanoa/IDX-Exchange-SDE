// PropertyCard tests (React Testing Library): check what the user sees on one card
import { render, screen, fireEvent } from '@testing-library/react';
import PropertyCard from './PropertyCard';

const house = {
  L_Photos: '["https://example.com/first.jpg","https://example.com/second.jpg"]',
  L_SystemPrice: 1122426,
  L_Address: '349 E Gobind Blvd',
  L_City: 'Mountain House',
  L_State: 'CA',
  L_Keyword2: 5,
  LM_Dec_3: '4.0',
  LM_Int2_3: 2992,
};

test('shows all 7 items: photo, price, address, city/state, beds, baths, sqft', () => {
  render(<PropertyCard property={house} />);
  expect(screen.getByRole('img', { name: 'Photo of 349 E Gobind Blvd' })).toHaveAttribute(
    'src',
    'https://example.com/first.jpg', // the FIRST photo
  );
  expect(screen.getByText('$1,122,426')).toBeInTheDocument();
  expect(screen.getByText('349 E Gobind Blvd')).toBeInTheDocument();
  expect(screen.getByText('Mountain House, CA')).toBeInTheDocument();
  expect(screen.getByText('5 beds · 4 baths · 2,992 sqft')).toBeInTheDocument();
});

test('shows the placeholder when L_Photos is an empty string (protection A)', () => {
  render(<PropertyCard property={{ ...house, L_Photos: '' }} />);
  expect(screen.queryByRole('img')).not.toBeInTheDocument();
  expect(screen.getByText('No photo available')).toBeInTheDocument();
  expect(screen.getByText('$1,122,426')).toBeInTheDocument(); // the rest of the card still shows
});

test('swaps to the placeholder when the photo fails to load (protection B)', () => {
  render(<PropertyCard property={house} />);
  fireEvent.error(screen.getByRole('img')); // pretend the photo was a 404 or a PDF
  expect(screen.queryByRole('img')).not.toBeInTheDocument();
  expect(screen.getByText('No photo available')).toBeInTheDocument();
});

test('shows friendly text when everything is missing', () => {
  render(<PropertyCard property={{}} />);
  expect(screen.getByText('Price not listed')).toBeInTheDocument();
  expect(screen.getByText('Address not listed')).toBeInTheDocument();
  expect(screen.getByText('Location not listed')).toBeInTheDocument();
  expect(screen.getByText('— beds · — baths · — sqft')).toBeInTheDocument();
});
