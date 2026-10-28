// PropertyFilters tests: onSearch and onClear are mocks (jest.fn), so we can check what the form sends
import { render, screen, fireEvent } from '@testing-library/react';
import PropertyFilters from './PropertyFilters';

// Renders the form with fresh mocks and returns them
function renderFilters() {
  const onSearch = jest.fn();
  const onClear = jest.fn();
  render(<PropertyFilters onSearch={onSearch} onClear={onClear} />);
  return { onSearch, onClear };
}

// Types into (or picks from) the input with this label
function fill(label, value) {
  fireEvent.change(screen.getByLabelText(label), { target: { value } });
}

test('shows all six inputs, both buttons, and starts empty', () => {
  renderFilters();
  for (const label of ['City', 'ZIP code', 'Min price', 'Max price', 'Beds', 'Baths']) {
    expect(screen.getByLabelText(label)).toHaveValue(label.endsWith('price') ? null : '');
  }
  expect(screen.getByRole('button', { name: 'Search' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Clear Filters' })).toBeInTheDocument();
});

test('beds and baths are dropdowns with "Any" plus "at least" options', () => {
  renderFilters();
  expect(screen.getByLabelText('Beds')).toHaveDisplayValue('Any');
  const bedOptions = Array.from(screen.getByLabelText('Beds').options).map((o) => o.textContent);
  expect(bedOptions).toEqual(['Any', '1+', '2+', '3+', '4+', '5+']);
  const bathOptions = Array.from(screen.getByLabelText('Baths').options).map((o) => o.textContent);
  expect(bathOptions).toEqual(['Any', '1+', '2+', '3+', '4+']);
});

test('Search sends every filter, combined, in one object', () => {
  const { onSearch } = renderFilters();
  fill('City', 'Irvine');
  fill('ZIP code', '92618');
  fill('Min price', '500000');
  fill('Max price', '900000');
  fill('Beds', '3');
  fill('Baths', '2');
  fireEvent.click(screen.getByRole('button', { name: 'Search' }));

  expect(onSearch).toHaveBeenCalledTimes(1);
  expect(onSearch).toHaveBeenCalledWith({
    city: 'Irvine',
    zipcode: '92618',
    minPrice: '500000',
    maxPrice: '900000',
    beds: '3',
    baths: '2',
  });
});

test('typing in one input keeps the others (spread operator)', () => {
  const { onSearch } = renderFilters();
  fill('City', 'Irvine');
  fill('Beds', '4');
  fireEvent.click(screen.getByRole('button', { name: 'Search' }));
  expect(onSearch).toHaveBeenCalledWith(expect.objectContaining({ city: 'Irvine', beds: '4', zipcode: '' }));
});

test('pressing Enter in a box also searches', () => {
  const { onSearch } = renderFilters();
  fill('City', 'Irvine');
  fireEvent.submit(screen.getByRole('form', { name: 'Property filters' }));
  expect(onSearch).toHaveBeenCalledWith(expect.objectContaining({ city: 'Irvine' }));
});

test('Clear Filters empties every input and calls onClear (not onSearch)', () => {
  const { onSearch, onClear } = renderFilters();
  fill('City', 'Irvine');
  fill('Max price', '900000');
  fill('Baths', '2');
  fireEvent.click(screen.getByRole('button', { name: 'Clear Filters' }));

  expect(onClear).toHaveBeenCalledTimes(1);
  expect(onSearch).not.toHaveBeenCalled();
  expect(screen.getByLabelText('City')).toHaveValue('');
  expect(screen.getByLabelText('Max price')).toHaveValue(null); // empty number box
  expect(screen.getByLabelText('Baths')).toHaveDisplayValue('Any');
});
