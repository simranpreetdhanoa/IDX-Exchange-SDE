// PropertyCard tests (React Testing Library): check what the user sees on one card
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useParams } from 'react-router';
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
  render(<PropertyCard property={house} />, { wrapper: MemoryRouter });
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
  render(<PropertyCard property={{ ...house, L_Photos: '' }} />, { wrapper: MemoryRouter });
  expect(screen.queryByRole('img')).not.toBeInTheDocument();
  expect(screen.getByText('No photo available')).toBeInTheDocument();
  expect(screen.getByText('$1,122,426')).toBeInTheDocument(); // the rest of the card still shows
});

// Week 8: a broken photo is skipped, so the placeholder shows only when every photo fails
test('swaps to the placeholder when the photos fail to load (protection B)', () => {
  render(<PropertyCard property={house} />, { wrapper: MemoryRouter });
  fireEvent.error(screen.getByRole('img')); // pretend photo 1 was a 404 or a PDF
  expect(screen.getByRole('img')).toHaveAttribute('src', 'https://example.com/second.jpg'); // skipped to photo 2
  fireEvent.error(screen.getByRole('img')); // photo 2 is broken too
  expect(screen.queryByRole('img')).not.toBeInTheDocument();
  expect(screen.getByText('No photo available')).toBeInTheDocument();
});

test('shows friendly text when everything is missing', () => {
  render(<PropertyCard property={{}} />, { wrapper: MemoryRouter });
  expect(screen.getByText('Price not listed')).toBeInTheDocument();
  expect(screen.getByText('Address not listed')).toBeInTheDocument();
  expect(screen.getByText('Location not listed')).toBeInTheDocument();
  expect(screen.getByText('— beds · — baths · — sqft')).toBeInTheDocument();
});

// Week 8: clicking anywhere on the card opens /property/<its listing ID>
test('clicking the card navigates to its detail page', () => {
  render(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route path="/" element={<PropertyCard property={{ ...house, L_ListingID: '1118422731' }} />} />
        <Route path="/property/:id" element={<p>Detail page for the clicked home</p>} />
      </Routes>
    </MemoryRouter>
  );
  fireEvent.click(screen.getByText('349 E Gobind Blvd'));
  expect(screen.getByText('Detail page for the clicked home')).toBeInTheDocument();
});

// Week 8: the address must use the card's own L_ListingID
test('the detail page address uses the listing ID', () => {
  function ShowId() {
    const { id } = useParams();
    return <p>Opened listing {id}</p>;
  }
  render(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route path="/" element={<PropertyCard property={{ ...house, L_ListingID: '1118422731' }} />} />
        <Route path="/property/:id" element={<ShowId />} />
      </Routes>
    </MemoryRouter>
  );
  fireEvent.click(screen.getByText('$1,122,426'));
  expect(screen.getByText('Opened listing 1118422731')).toBeInTheDocument();
});
