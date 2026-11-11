// PropertyMap tests (Week 8). src/env.js is swapped for test/envMock.js, so the key here is the fake "test-key".
import { render, screen } from '@testing-library/react';
import PropertyMap from './PropertyMap';
import env from '../env';

afterEach(() => {
  env.googleMapsApiKey = 'test-key'; // put the fake key back after the "no key" test
});

test('shows a Google map iframe at the right place, zoom 15, with the key', () => {
  render(<PropertyMap latitude="34.099106000000000" longitude="-118.418132" address="1461 Laurel Way" />);
  const map = screen.getByTitle('Map of 1461 Laurel Way');
  expect(map.tagName).toBe('IFRAME');
  expect(map).toHaveAttribute(
    'src',
    'https://www.google.com/maps/embed/v1/place?key=test-key&q=34.099106%2C-118.418132&zoom=15'
  );
});

test('Get Directions opens Google Maps in a new tab, safely', () => {
  render(<PropertyMap latitude="34.099106" longitude="-118.418132" address="1461 Laurel Way" />);
  const link = screen.getByRole('link', { name: /get directions/i });
  expect(link).toHaveAttribute(
    'href',
    'https://www.google.com/maps/dir/?api=1&destination=34.099106%2C-118.418132'
  );
  expect(link).toHaveAttribute('target', '_blank');
  expect(link).toHaveAttribute('rel', 'noopener noreferrer');
});

test('no map and no directions when latitude or longitude is missing', () => {
  const { container } = render(<PropertyMap latitude={null} longitude="-118.418132" address="Somewhere" />);
  expect(container.querySelector('iframe')).toBeNull();
  expect(screen.queryByRole('link', { name: /get directions/i })).not.toBeInTheDocument();
  expect(screen.getByText('Map not available for this property.')).toBeInTheDocument();
});

test('no map when the location is 0, 0', () => {
  const { container } = render(<PropertyMap latitude="0" longitude="0" address="Somewhere" />);
  expect(container.querySelector('iframe')).toBeNull();
});

test('no key → "Map unavailable" box instead of the iframe, but directions still work', () => {
  env.googleMapsApiKey = '';
  const { container } = render(<PropertyMap latitude="34.1" longitude="-118.4" address="Somewhere" />);
  expect(container.querySelector('iframe')).toBeNull();
  expect(screen.getByText(/Map unavailable/)).toBeInTheDocument();
  expect(screen.getByRole('link', { name: /get directions/i })).toBeInTheDocument();
});
