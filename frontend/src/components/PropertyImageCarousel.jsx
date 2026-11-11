import { useState } from 'react';
import './PropertyImageCarousel.css';

// Photo carousel for a property card (Week 8): one photo at a time, ‹ › arrows, "X / Y" counter
// photos: a list of URLs from getPhotos(); alt: text for screen readers
export default function PropertyImageCarousel({ photos, alt }) {
  const [index, setIndex] = useState(0); // which working photo is showing (0 = first)
  const [failed, setFailed] = useState(() => new Set()); // photos that failed to load (Week 5 protection B)

  // Week 8: only photos that haven't failed. Many old photo links answer 404 "Media record not found!"
  const working = photos.filter((url) => !failed.has(url));

  // The placeholder sits INSIDE the 200px box, so its "height: 100%" means 100% of 200px, not of the whole card
  if (working.length === 0) {
    return (
      <div className="carousel">
        <div className="carousel-placeholder">No photo available</div>
      </div>
    );
  }

  // If the list got shorter and we were at the end, wrap back to the start
  const position = index % working.length;
  const current = working[position];
  const hasMany = working.length > 1;

  // Arrows: stopPropagation keeps the click from reaching the card (which would open the detail page)
  function showPrevious(event) {
    event.stopPropagation();
    setIndex((position - 1 + working.length) % working.length); // from the first photo, wrap to the last
  }

  function showNext(event) {
    event.stopPropagation();
    setIndex((position + 1) % working.length); // from the last photo, wrap to the first
  }

  // A broken photo leaves the list; the same position now holds the next photo, so we skip forward
  function markFailed() {
    setFailed((old) => new Set(old).add(current));
  }

  return (
    <div className="carousel">
      <img className="carousel-photo" src={current} alt={alt} loading="lazy" onError={markFailed} />

      {hasMany && (
        <>
          <button
            type="button"
            className="carousel-arrow carousel-prev"
            aria-label="Previous photo"
            onClick={showPrevious}
          >
            ‹
          </button>
          <button
            type="button"
            className="carousel-arrow carousel-next"
            aria-label="Next photo"
            onClick={showNext}
          >
            ›
          </button>
          <span className="carousel-counter">
            {position + 1} / {working.length}
          </span>
        </>
      )}
    </div>
  );
}
