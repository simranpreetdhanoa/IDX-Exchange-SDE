import { useState } from 'react';

// Custom hook (Week 8): which photo is showing, and which photos are broken.
// Used by PropertyImageCarousel (cards) and PropertyImageGallery (detail page).
// photos: the list from getPhotos(). Broken links (404 "Media record not found!") are skipped.
export default function usePhotoList(photos) {
  // The bookmark: a spot in the ORIGINAL photos list. If that photo is broken, we show the next good one.
  // (Keeping the spot in the original list means a thumbnail failing elsewhere doesn't move the main photo.)
  const [index, setIndex] = useState(0);
  const [failed, setFailed] = useState(() => new Set()); // photos that failed to load

  const working = photos.filter((url) => !failed.has(url));
  const total = photos.length;

  // From `start`, walk in `step` direction (+1 forward, -1 back), wrapping around, to the first photo that isn't broken.
  // Returns its spot in the original list, or -1 if every photo is broken.
  function findWorking(start, step) {
    for (let k = 0; k < total; k++) {
      const spot = (((start + k * step) % total) + total) % total; // the extra "+ total" keeps it from going negative
      if (!failed.has(photos[spot])) return spot;
    }
    return -1;
  }

  const currentSpot = total > 0 ? findWorking(index, 1) : -1;
  const current = currentSpot >= 0 ? photos[currentSpot] : null; // null = nothing to show
  const position = working.indexOf(current); // for the counter: 0 = first working photo

  return {
    working, // the photos that haven't failed
    current, // the URL to show, or null
    position, // where `current` is in `working`
    showNext: () => setIndex(findWorking(currentSpot + 1, 1)), // wraps from the last to the first
    showPrevious: () => setIndex(findWorking(currentSpot - 1, -1)), // wraps from the first to the last
    showPhoto: (url) => setIndex(photos.indexOf(url)),
    markFailed: (url) => setFailed((old) => new Set(old).add(url)),
  };
}
