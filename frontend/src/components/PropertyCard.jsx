import { useNavigate } from 'react-router';
import {
  getPhotos,
  formatPrice,
  formatSqft,
  formatCount,
  formatAddress,
  formatCityState,
} from '../utils/property';
import PropertyImageCarousel from './PropertyImageCarousel';
import './PropertyCard.css';

// One property card (Week 5): photos (carousel, Week 8), price, address, city/state, beds, baths, sqft
export default function PropertyCard({ property }) {
  const navigate = useNavigate();
  const address = formatAddress(property.L_Address);

  // Week 8: clicking the card opens this home's detail page
  function openDetail() {
    navigate(`/property/${property.L_ListingID}`);
  }

  return (
    <article className="property-card" onClick={openDetail}>
      <PropertyImageCarousel photos={getPhotos(property.L_Photos)} alt={`Photo of ${address}`} />

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
