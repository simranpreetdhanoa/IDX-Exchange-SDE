import { useEffect, useRef } from 'react';
import './PhotoLightbox.css';

// Full-screen photo viewer (Week 8). The gallery owns which photo is showing; the lightbox just displays it.
// current: the photo URL; position/total: for the "X / Y" counter; the on... functions come from the gallery
export default function PhotoLightbox({ current, position, total, alt, onPrevious, onNext, onClose, onFailed }) {
  const lightboxRef = useRef(null); // a handle on the dark <div>

  // Debug challenge 2: when the lightbox opens, give the <div> the focus, so it hears Escape and ← →
  // (tabIndex={-1} below is what ALLOWS a <div> to have focus; .focus() actually GIVES it the focus)
  useEffect(() => {
    lightboxRef.current.focus();
  }, []);

  // Keyboard: Escape closes, ← / → change photos
  function handleKeyDown(event) {
    if (event.key === 'Escape') onClose();
    if (event.key === 'ArrowLeft') onPrevious();
    if (event.key === 'ArrowRight') onNext();
  }

  // The ‹ › buttons sit on top of the dark background: stopPropagation keeps their click from closing the lightbox
  function handlePrevious(event) {
    event.stopPropagation();
    onPrevious();
  }

  function handleNext(event) {
    event.stopPropagation();
    onNext();
  }

  return (
    // The dark background covers the whole screen; clicking it closes the lightbox
    <div
      ref={lightboxRef}
      className="lightbox"
      role="dialog"
      aria-modal="true"
      aria-label="Photo viewer"
      onClick={onClose}
      onKeyDown={handleKeyDown}
      tabIndex={-1} // debug challenge 2: a plain div can't take focus, so it never hears key presses
    >
      <button type="button" className="lightbox-close" aria-label="Close photo viewer" onClick={onClose}>
        ×
      </button>

      <img
        className="lightbox-photo"
        src={current}
        alt={alt}
        onClick={(event) => event.stopPropagation()} // clicking the photo itself doesn't close it
        onError={onFailed}
      />

      {total > 1 && (
        <>
          <button
            type="button"
            className="lightbox-arrow lightbox-prev"
            aria-label="Previous photo"
            onClick={handlePrevious}
          >
            ‹
          </button>
          <button type="button" className="lightbox-arrow lightbox-next" aria-label="Next photo" onClick={handleNext}>
            ›
          </button>
          <span className="lightbox-counter">
            {position + 1} / {total}
          </span>
        </>
      )}
    </div>
  );
}
