// PropertyImageCarousel tests (Week 8): arrows, counter, wrap-around, one photo, no photos, failed photos
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import PropertyImageCarousel from './PropertyImageCarousel';
import PropertyCard from './PropertyCard';

const three = ['https://a.com/1.jpg', 'https://a.com/2.jpg', 'https://a.com/3.jpg'];

function photoSrc() {
  return screen.getByRole('img', { name: 'Photo of a house' }).getAttribute('src');
}

test('starts on the first photo with the counter at 1 / 3', () => {
  render(<PropertyImageCarousel photos={three} alt="Photo of a house" />);
  expect(photoSrc()).toBe('https://a.com/1.jpg');
  expect(screen.getByText('1 / 3')).toBeInTheDocument();
});

test('Next goes forward and wraps from the last photo to the first', () => {
  render(<PropertyImageCarousel photos={three} alt="Photo of a house" />);
  const next = screen.getByRole('button', { name: 'Next photo' });

  fireEvent.click(next);
  expect(photoSrc()).toBe('https://a.com/2.jpg');
  expect(screen.getByText('2 / 3')).toBeInTheDocument();

  fireEvent.click(next);
  expect(screen.getByText('3 / 3')).toBeInTheDocument();

  fireEvent.click(next); // past the end → back to the start
  expect(photoSrc()).toBe('https://a.com/1.jpg');
  expect(screen.getByText('1 / 3')).toBeInTheDocument();
});

test('Previous on the first photo wraps to the last one', () => {
  render(<PropertyImageCarousel photos={three} alt="Photo of a house" />);
  fireEvent.click(screen.getByRole('button', { name: 'Previous photo' }));
  expect(photoSrc()).toBe('https://a.com/3.jpg');
  expect(screen.getByText('3 / 3')).toBeInTheDocument();
});

test('a single photo shows no arrows and no counter', () => {
  render(<PropertyImageCarousel photos={['https://a.com/only.jpg']} alt="Photo of a house" />);
  expect(photoSrc()).toBe('https://a.com/only.jpg');
  expect(screen.queryByRole('button')).not.toBeInTheDocument();
  expect(screen.queryByText('1 / 1')).not.toBeInTheDocument();
});

test('no photos shows the placeholder', () => {
  render(<PropertyImageCarousel photos={[]} alt="Photo of a house" />);
  expect(screen.getByText('No photo available')).toBeInTheDocument();
  expect(screen.queryByRole('img')).not.toBeInTheDocument();
});

// Week 8: broken photo links (404 "Media record not found!") are skipped instead of shown as grey boxes
test('a photo that fails to load is skipped: the next one shows and the counter shrinks', () => {
  render(<PropertyImageCarousel photos={three} alt="Photo of a house" />);
  fireEvent.error(screen.getByRole('img')); // pretend photo 1 was a 404
  expect(photoSrc()).toBe('https://a.com/2.jpg');
  expect(screen.getByText('1 / 2')).toBeInTheDocument();
  expect(screen.queryByText('No photo available')).not.toBeInTheDocument();
});

test('a broken photo found while clicking Next is skipped too', () => {
  render(<PropertyImageCarousel photos={three} alt="Photo of a house" />);
  fireEvent.click(screen.getByRole('button', { name: 'Next photo' })); // now on photo 2
  fireEvent.error(screen.getByRole('img')); // photo 2 is broken
  expect(photoSrc()).toBe('https://a.com/3.jpg');
  expect(screen.getByText('2 / 2')).toBeInTheDocument();
});

test('if the last photo fails, it wraps to the first', () => {
  render(<PropertyImageCarousel photos={three} alt="Photo of a house" />);
  fireEvent.click(screen.getByRole('button', { name: 'Previous photo' })); // wrap to photo 3
  fireEvent.error(screen.getByRole('img')); // photo 3 is broken
  expect(photoSrc()).toBe('https://a.com/1.jpg');
  expect(screen.getByText('1 / 2')).toBeInTheDocument();
});

test('when only one working photo is left, the arrows and counter disappear', () => {
  render(<PropertyImageCarousel photos={three} alt="Photo of a house" />);
  fireEvent.error(screen.getByRole('img')); // photo 1 broken → photo 2 shows
  fireEvent.error(screen.getByRole('img')); // photo 2 broken → photo 3 shows
  expect(photoSrc()).toBe('https://a.com/3.jpg');
  expect(screen.queryByRole('button')).not.toBeInTheDocument();
  expect(screen.queryByText(/\d+ \/ \d+/)).not.toBeInTheDocument();
});

test('if every photo fails, the placeholder shows', () => {
  render(<PropertyImageCarousel photos={three} alt="Photo of a house" />);
  fireEvent.error(screen.getByRole('img'));
  fireEvent.error(screen.getByRole('img'));
  fireEvent.error(screen.getByRole('img'));
  expect(screen.queryByRole('img')).not.toBeInTheDocument();
  expect(screen.getByText('No photo available')).toBeInTheDocument();
});

// stopPropagation: inside a real card, the arrows must not open the detail page
describe('inside a property card', () => {
  const house = {
    L_ListingID: '1118422731',
    L_Address: '1461 Laurel Way',
    L_SystemPrice: 3950000,
    L_Photos: JSON.stringify(three),
  };

  function renderCard() {
    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/" element={<PropertyCard property={house} />} />
          <Route path="/property/:id" element={<p>Detail page</p>} />
        </Routes>
      </MemoryRouter>
    );
  }

  test('clicking the arrows does not navigate to the detail page', () => {
    renderCard();
    fireEvent.click(screen.getByRole('button', { name: 'Next photo' }));
    fireEvent.click(screen.getByRole('button', { name: 'Previous photo' }));
    expect(screen.queryByText('Detail page')).not.toBeInTheDocument();
    expect(screen.getByText('1461 Laurel Way')).toBeInTheDocument(); // still on the card
  });

  // Bug found in Chrome: with no photos, the placeholder grew to the whole card and hid the details.
  // Jest can't measure layout, so this checks the structure: the placeholder is inside the 200px box.
  test('a home with no photos still shows its details, and the placeholder sits inside the photo box', () => {
    render(
      <MemoryRouter>
        <PropertyCard property={{ ...house, L_Photos: '' }} />
      </MemoryRouter>
    );
    const placeholder = screen.getByText('No photo available');
    expect(placeholder).not.toHaveClass('carousel');
    expect(placeholder.parentElement).toHaveClass('carousel');
    expect(screen.getByText('$3,950,000')).toBeInTheDocument();
    expect(screen.getByText('1461 Laurel Way')).toBeInTheDocument();
  });

  test('clicking the photo itself still opens the detail page', () => {
    renderCard();
    fireEvent.click(screen.getByRole('img', { name: 'Photo of 1461 Laurel Way' }));
    expect(screen.getByText('Detail page')).toBeInTheDocument();
  });
});
