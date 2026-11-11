// Lightbox tests (Week 8, Step 6b): opening, ‹ ›, closing with × or a click outside
import { render, screen, fireEvent, within } from '@testing-library/react';
import PropertyImageGallery from './PropertyImageGallery';

const three = ['https://a.com/1.jpg', 'https://a.com/2.jpg', 'https://a.com/3.jpg'];

function renderGallery(photos = three) {
  render(<PropertyImageGallery photos={photos} alt="Photo of a house" />);
}

// The main photo on the page (not the one inside the lightbox)
function mainPhoto() {
  return document.querySelector('.gallery-main-photo');
}

function openLightbox() {
  fireEvent.click(mainPhoto());
  return screen.getByRole('dialog', { name: 'Photo viewer' });
}

test('the lightbox is closed at first', () => {
  renderGallery();
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
});

test('clicking the main photo opens the lightbox on the same photo', () => {
  renderGallery();
  fireEvent.click(screen.getAllByRole('button', { name: 'Next photo' })[0]); // gallery on photo 2
  const lightbox = openLightbox();
  expect(within(lightbox).getByRole('img')).toHaveAttribute('src', 'https://a.com/2.jpg');
  expect(within(lightbox).getByText('2 / 3')).toBeInTheDocument();
});

test('‹ › in the lightbox change the photo, wrap around, and do not close it', () => {
  renderGallery();
  const lightbox = openLightbox();
  fireEvent.click(within(lightbox).getByRole('button', { name: 'Next photo' }));
  expect(within(lightbox).getByRole('img')).toHaveAttribute('src', 'https://a.com/2.jpg');
  fireEvent.click(within(lightbox).getByRole('button', { name: 'Previous photo' }));
  fireEvent.click(within(lightbox).getByRole('button', { name: 'Previous photo' })); // before the first → the last
  expect(within(lightbox).getByRole('img')).toHaveAttribute('src', 'https://a.com/3.jpg');
  expect(within(lightbox).getByText('3 / 3')).toBeInTheDocument();
  expect(screen.getByRole('dialog')).toBeInTheDocument(); // still open
});

test('the × button closes it', () => {
  renderGallery();
  const lightbox = openLightbox();
  fireEvent.click(within(lightbox).getByRole('button', { name: 'Close photo viewer' }));
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
});

test('clicking the dark area outside the photo closes it', () => {
  renderGallery();
  const lightbox = openLightbox();
  fireEvent.click(lightbox); // the dark background itself
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
});

test('clicking the photo inside the lightbox does not close it', () => {
  renderGallery();
  const lightbox = openLightbox();
  fireEvent.click(within(lightbox).getByRole('img'));
  expect(screen.getByRole('dialog')).toBeInTheDocument();
});

test('after closing, the gallery shows the photo you ended on', () => {
  renderGallery();
  const lightbox = openLightbox();
  fireEvent.click(within(lightbox).getByRole('button', { name: 'Next photo' }));
  fireEvent.click(within(lightbox).getByRole('button', { name: 'Next photo' }));
  fireEvent.click(within(lightbox).getByRole('button', { name: 'Close photo viewer' }));
  expect(mainPhoto()).toHaveAttribute('src', 'https://a.com/3.jpg');
  expect(screen.getByText('3 / 3')).toBeInTheDocument();
});

test('a single photo opens without arrows or a counter', () => {
  renderGallery(['https://a.com/only.jpg']);
  const lightbox = openLightbox();
  expect(within(lightbox).queryByRole('button', { name: 'Next photo' })).not.toBeInTheDocument();
  expect(within(lightbox).queryByText('1 / 1')).not.toBeInTheDocument();
  expect(within(lightbox).getByRole('button', { name: 'Close photo viewer' })).toBeInTheDocument();
});

test('a broken photo inside the lightbox is skipped', () => {
  renderGallery();
  const lightbox = openLightbox();
  fireEvent.error(within(lightbox).getByRole('img')); // photo 1 broken
  expect(within(screen.getByRole('dialog')).getByRole('img')).toHaveAttribute('src', 'https://a.com/2.jpg');
  expect(within(screen.getByRole('dialog')).getByText('1 / 2')).toBeInTheDocument();
});

// Debug challenge 2: key presses go to the FOCUSED element. A plain <div> can't take focus,
// so the lightbox needs tabIndex={-1} AND .focus() when it opens.
describe('keyboard (debug challenge 2)', () => {
  test('the lightbox gets the focus as soon as it opens', () => {
    renderGallery();
    const lightbox = openLightbox();
    expect(lightbox).toHaveAttribute('tabindex', '-1');
    expect(document.activeElement).toBe(lightbox);
  });

  // Like a real key press: sent to whatever has the focus
  function pressKey(key) {
    fireEvent.keyDown(document.activeElement, { key });
  }

  test('Escape closes it', () => {
    renderGallery();
    openLightbox();
    pressKey('Escape');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  test('→ shows the next photo and ← the previous one, wrapping around', () => {
    renderGallery();
    openLightbox();
    pressKey('ArrowRight');
    expect(within(screen.getByRole('dialog')).getByRole('img')).toHaveAttribute('src', 'https://a.com/2.jpg');
    pressKey('ArrowLeft');
    pressKey('ArrowLeft'); // before the first → the last
    expect(within(screen.getByRole('dialog')).getByRole('img')).toHaveAttribute('src', 'https://a.com/3.jpg');
    expect(within(screen.getByRole('dialog')).getByText('3 / 3')).toBeInTheDocument();
  });

  test('other keys do nothing', () => {
    renderGallery();
    openLightbox();
    pressKey('a');
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(within(screen.getByRole('dialog')).getByText('1 / 3')).toBeInTheDocument();
  });
});
