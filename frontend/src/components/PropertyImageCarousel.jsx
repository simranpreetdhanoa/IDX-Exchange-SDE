import usePhotoList from '../hooks/usePhotoList';
import './PropertyImageCarousel.css';

// Photo carousel for a property card (Week 8): one photo at a time, ‹ › arrows, "X / Y" counter
// photos: a list of URLs from getPhotos(); alt: text for screen readers
export default function PropertyImageCarousel({ photos, alt }) {
  // Which photo is showing + skipping broken links lives in a shared hook (also used by the gallery)
  const { working, current, position, showNext, showPrevious, markFailed } = usePhotoList(photos);

  // The placeholder sits INSIDE the 200px box, so its "height: 100%" means 100% of 200px, not of the whole card
  if (current === null) {
    return (
      <div className="carousel">
        <div className="carousel-placeholder">No photo available</div>
      </div>
    );
  }

  const hasMany = working.length > 1;

  // Arrows: stopPropagation keeps the click from reaching the card (which would open the detail page)
  function handlePrevious(event) {
    event.stopPropagation();
    showPrevious();
  }

  function handleNext(event) {
    event.stopPropagation();
    showNext();
  }

  return (
    <div className="carousel">
      <img className="carousel-photo" src={current} alt={alt} loading="lazy" onError={() => markFailed(current)} />

      {hasMany && (
        <>
          <button
            type="button"
            className="carousel-arrow carousel-prev"
            aria-label="Previous photo"
            onClick={handlePrevious}
          >
            ‹
          </button>
          <button
            type="button"
            className="carousel-arrow carousel-next"
            aria-label="Next photo"
            onClick={handleNext}
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
