import { useEffect, useRef, useState } from 'react';
import usePhotoList from '../hooks/usePhotoList';
import PhotoLightbox from './PhotoLightbox';
import './PropertyImageGallery.css';

// Photo gallery for the detail page (Week 8): a big main photo and a thumbnail strip that scrolls sideways
// photos: a list of URLs from getPhotos(); alt: text for screen readers
export default function PropertyImageGallery({ photos, alt }) {
  const { working, current, position, showNext, showPrevious, showPhoto, markFailed } = usePhotoList(photos);
  const stripRef = useRef(null); // a handle on the thumbnail strip, so we can scroll it from code
  const [lightboxOpen, setLightboxOpen] = useState(false); // Week 8 (6b): is the full-screen viewer showing?

  // When the main photo changes, scroll the strip (only the strip, never the page) so the selected thumbnail is in the middle
  useEffect(() => {
    const strip = stripRef.current;
    const selected = strip?.querySelector('.is-selected');
    if (!strip || !selected || typeof strip.scrollTo !== 'function') return; // Jest's pretend browser can't scroll
    strip.scrollTo({
      left: selected.offsetLeft - strip.clientWidth / 2 + selected.clientWidth / 2,
      behavior: 'smooth',
    });
  }, [current]);

  if (current === null) {
    return (
      <div className="gallery">
        <div className="gallery-main gallery-placeholder">No photos available</div>
      </div>
    );
  }

  const hasMany = working.length > 1;

  return (
    <div className="gallery">
      <div className="gallery-main">
        {/* Clicking the main photo opens the lightbox on the same photo */}
        <img
          className="gallery-main-photo"
          src={current}
          alt={alt}
          onClick={() => setLightboxOpen(true)}
          onError={() => markFailed(current)}
        />
        {hasMany && (
          <>
            {/* Arrows (Week 8): move through the photos; they wrap around like the carousel */}
            <button
              type="button"
              className="gallery-arrow gallery-prev"
              aria-label="Previous photo"
              onClick={showPrevious}
            >
              ‹
            </button>
            <button type="button" className="gallery-arrow gallery-next" aria-label="Next photo" onClick={showNext}>
              ›
            </button>
            <span className="gallery-counter">
              {position + 1} / {working.length}
            </span>
          </>
        )}
      </div>

      {/* Thumbnail strip: one small button per working photo; the selected one is highlighted */}
      {hasMany && (
        <div className="gallery-thumbs" ref={stripRef}>
          {working.map((url, i) => (
            <button
              key={`${i}:${url}`}
              type="button"
              className={url === current ? 'gallery-thumb is-selected' : 'gallery-thumb'}
              aria-label={`Show photo ${i + 1}`}
              aria-pressed={url === current}
              onClick={() => showPhoto(url)}
            >
              <img src={url} alt="" loading="lazy" onError={() => markFailed(url)} />
            </button>
          ))}
        </div>
      )}

      {lightboxOpen && (
        <PhotoLightbox
          current={current}
          position={position}
          total={working.length}
          alt={alt}
          onPrevious={showPrevious}
          onNext={showNext}
          onClose={() => setLightboxOpen(false)}
          onFailed={() => markFailed(current)}
        />
      )}
    </div>
  );
}
