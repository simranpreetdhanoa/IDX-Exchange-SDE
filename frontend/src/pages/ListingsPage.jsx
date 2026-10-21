import { useEffect, useState } from 'react';
import { fetchProperties } from '../api/client';
import PropertyCard from '../components/PropertyCard';
import './ListingsPage.css';

const PAGE_SIZE = 20;

// Listings page (Week 5): fetches properties and shows loading, error, count and the card grid
export default function ListingsPage() {
  const [properties, setProperties] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Runs once, when the page first appears
  useEffect(() => {
    async function load() {
      try {
        const data = await fetchProperties({ limit: PAGE_SIZE });
        setProperties(data.results);
        setTotal(data.total);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return <p className="listings-status">Loading properties…</p>;
  }

  if (error) {
    return (
      <div className="listings-status listings-error" role="alert">
        <strong>Couldn't load properties.</strong> {error}
      </div>
    );
  }

  return (
    <section className="listings-page">
      <h1 className="listings-title">Properties for sale</h1>
      <p className="listings-count">
        Showing {properties.length.toLocaleString('en-US')} of {total.toLocaleString('en-US')} properties
      </p>
      {properties.length === 0 ? (
        <p className="listings-status">No properties found.</p>
      ) : (
        <div className="listings-grid">
          {properties.map((property) => (
            // id (row number) is unique; L_ListingID isn't — 3 listings appear twice (Week 4)
            <PropertyCard key={property.id} property={property} />
          ))}
        </div>
      )}
    </section>
  );
}
