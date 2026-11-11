import env from '../env';
import { getCoordinates } from '../utils/property';
import './PropertyMap.css';

// Map (Week 8): Google Maps Embed API inside an iframe (a window showing another website), no npm package
// latitude/longitude: LMD_MP_Latitude and LMD_MP_Longitude; address: used to name the map for screen readers
export default function PropertyMap({ latitude, longitude, address }) {
  const coords = getCoordinates(latitude, longitude);

  // No usable location: no map and no directions (we'd be sending people to the wrong place)
  if (!coords) {
    return <p className="map-unavailable">Map not available for this property.</p>;
  }

  const place = `${coords.lat},${coords.lng}`;
  // encodeURIComponent makes text safe to put inside a web address ("," → "%2C")
  const mapUrl =
    `https://www.google.com/maps/embed/v1/place?key=${encodeURIComponent(env.googleMapsApiKey)}` +
    `&q=${encodeURIComponent(place)}&zoom=15`;
  // Directions don't need a key: it's a normal Google Maps link
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(place)}`;

  return (
    <div className="property-map">
      {env.googleMapsApiKey ? (
        <iframe
          className="map-frame"
          title={`Map of ${address}`}
          src={mapUrl}
          loading="lazy" // only load the map when the user scrolls near it
          referrerPolicy="no-referrer-when-downgrade" // tells Google our page address, so it can check the key is allowed here
          allowFullScreen
        />
      ) : (
        <div className="map-frame map-missing-key">
          Map unavailable: no Google Maps API key is set (VITE_GOOGLE_MAPS_API_KEY in frontend/.env).
        </div>
      )}
      {/* target="_blank" = new tab; rel="noopener noreferrer" = the new tab can't control our page */}
      <a className="map-directions" href={directionsUrl} target="_blank" rel="noopener noreferrer">
        Get Directions ↗
      </a>
    </div>
  );
}
