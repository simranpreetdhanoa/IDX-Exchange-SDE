import { useState } from 'react';
import {
  getFirstPhoto,
  formatPrice,
  formatSqft,
  formatCount,
  formatAddress,
  formatCityState,
} from '../utils/property';
import './PropertyCard.css';

// One property card (Week 5): photo, price, address, city/state, beds, baths, sqft
export default function PropertyCard({ property }) {
  const photoUrl = getFirstPhoto(property.L_Photos);
  // Debug challenge, protection B: some photo URLs lead to a 404 or a PDF
  const [photoFailed, setPhotoFailed] = useState(false);
  const address = formatAddress(property.L_Address);

  return (
    <article className="property-card">
      {photoUrl && !photoFailed ? (
        <img
          className="property-card-photo"
          src={photoUrl}
          alt={`Photo of ${address}`}
          loading="lazy"
          onError={() => setPhotoFailed(true)}
        />
      ) : (
        <div className="property-card-photo property-card-placeholder">No photo available</div>
      )}

      <div className="property-card-body">
        <p className="property-card-price">{formatPrice(property.L_SystemPrice)}</p>
        <p className="property-card-address">{address}</p>
        <p className="property-card-location">{formatCityState(property.L_City, property.L_State)}</p>
        <p className="property-card-specs">
          {formatCount(property.L_Keyword2)} beds · {formatCount(property.LM_Dec_3)} baths ·{' '}
          {formatSqft(property.LM_Int2_3)}
        </p>
      </div>
    </article>
  );
}
