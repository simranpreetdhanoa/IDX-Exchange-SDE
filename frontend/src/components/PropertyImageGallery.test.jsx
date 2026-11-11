// PropertyImageGallery tests (Week 8): main photo, thumbnail strip, broken photos
import { render, screen, fireEvent } from '@testing-library/react';
import PropertyImageGallery from './PropertyImageGallery';

const three = ['https://a.com/1.jpg', 'https://a.com/2.jpg', 'https://a.com/3.jpg'];

function mainSrc() {
  return screen.getByRole('img', { name: 'Photo of a house' }).getAttribute('src');
}

function thumb(number) {
  return screen.getByRole('button', { name: `Show photo ${number}` });
}

test('starts with photo 1 as the main photo, a counter, and one thumbnail per photo', () => {
  render(<PropertyImageGallery photos={three} alt="Photo of a house" />);
  expect(mainSrc()).toBe('https://a.com/1.jpg');
  expect(screen.getByText('1 / 3')).toBeInTheDocument();
  expect(screen.getAllByRole('button', { name: /Show photo/ })).toHaveLength(3);
});

test('the selected thumbnail is highlighted', () => {
  render(<PropertyImageGallery photos={three} alt="Photo of a house" />);
  expect(thumb(1)).toHaveClass('is-selected');
  expect(thumb(1)).toHaveAttribute('aria-pressed', 'true');
  expect(thumb(2)).not.toHaveClass('is-selected');
});

test('clicking a thumbnail makes it the main photo', () => {
  render(<PropertyImageGallery photos={three} alt="Photo of a house" />);
  fireEvent.click(thumb(3));
  expect(mainSrc()).toBe('https://a.com/3.jpg');
  expect(screen.getByText('3 / 3')).toBeInTheDocument();
  expect(thumb(3)).toHaveClass('is-selected');
  expect(thumb(1)).not.toHaveClass('is-selected');
});

test('a single photo shows the main photo only: no thumbnails, no counter', () => {
  render(<PropertyImageGallery photos={['https://a.com/only.jpg']} alt="Photo of a house" />);
  expect(mainSrc()).toBe('https://a.com/only.jpg');
  expect(screen.queryByRole('button')).not.toBeInTheDocument();
  expect(screen.queryByText('1 / 1')).not.toBeInTheDocument();
});

test('no photos shows a placeholder', () => {
  render(<PropertyImageGallery photos={[]} alt="Photo of a house" />);
  expect(screen.getByText('No photos available')).toBeInTheDocument();
  expect(screen.queryByRole('img')).not.toBeInTheDocument();
});

test('a broken main photo is skipped: the next one becomes the main photo', () => {
  render(<PropertyImageGallery photos={three} alt="Photo of a house" />);
  fireEvent.error(screen.getByRole('img', { name: 'Photo of a house' }));
  expect(mainSrc()).toBe('https://a.com/2.jpg');
  expect(screen.getByText('1 / 2')).toBeInTheDocument();
  expect(screen.getAllByRole('button', { name: /Show photo/ })).toHaveLength(2);
});

test('a broken thumbnail disappears without changing the main photo', () => {
  render(<PropertyImageGallery photos={three} alt="Photo of a house" />);
  fireEvent.click(thumb(3)); // main photo = 3
  const thumbImage = thumb(2).querySelector('img');
  fireEvent.error(thumbImage); // thumbnail 2 is broken
  expect(mainSrc()).toBe('https://a.com/3.jpg'); // still photo 3
  expect(screen.getByText('2 / 2')).toBeInTheDocument();
  expect(screen.getAllByRole('button', { name: /Show photo/ })).toHaveLength(2);
});

test('if every photo is broken, the placeholder shows', () => {
  render(<PropertyImageGallery photos={['https://a.com/1.jpg', 'https://a.com/2.jpg']} alt="Photo of a house" />);
  fireEvent.error(screen.getByRole('img', { name: 'Photo of a house' }));
  fireEvent.error(screen.getByRole('img', { name: 'Photo of a house' }));
  expect(screen.getByText('No photos available')).toBeInTheDocument();
});

// Week 8: arrows on the main photo
test('Next and Previous move through the photos and wrap around; the counter and thumbnail follow', () => {
  render(<PropertyImageGallery photos={three} alt="Photo of a house" />);
  const next = screen.getByRole('button', { name: 'Next photo' });
  const previous = screen.getByRole('button', { name: 'Previous photo' });

  fireEvent.click(next);
  expect(mainSrc()).toBe('https://a.com/2.jpg');
  expect(screen.getByText('2 / 3')).toBeInTheDocument();
  expect(thumb(2)).toHaveClass('is-selected');

  fireEvent.click(next);
  fireEvent.click(next); // past the last → back to the first
  expect(mainSrc()).toBe('https://a.com/1.jpg');
  expect(thumb(1)).toHaveClass('is-selected');

  fireEvent.click(previous); // before the first → the last
  expect(mainSrc()).toBe('https://a.com/3.jpg');
  expect(screen.getByText('3 / 3')).toBeInTheDocument();
});

test('a single photo has no arrows', () => {
  render(<PropertyImageGallery photos={['https://a.com/only.jpg']} alt="Photo of a house" />);
  expect(screen.queryByRole('button', { name: 'Next photo' })).not.toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Previous photo' })).not.toBeInTheDocument();
});

test('the strip scrolls to the selected thumbnail when the photo changes', () => {
  render(<PropertyImageGallery photos={three} alt="Photo of a house" />);
  const strip = thumb(1).parentElement;
  strip.scrollTo = jest.fn(); // pretend the strip can scroll, and record the calls
  fireEvent.click(screen.getByRole('button', { name: 'Next photo' }));
  expect(strip.scrollTo).toHaveBeenCalledTimes(1);
  expect(strip.scrollTo).toHaveBeenCalledWith(expect.objectContaining({ behavior: 'smooth' }));
});
