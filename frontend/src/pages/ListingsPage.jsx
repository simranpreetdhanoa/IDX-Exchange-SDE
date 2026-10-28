import { useEffect, useState } from 'react';
import { fetchProperties } from '../api/client';
import PropertyCard from '../components/PropertyCard';
import PropertyFilters from '../components/PropertyFilters';
import { removeEmptyFilters } from '../utils/filters';
import './ListingsPage.css';

const PAGE_SIZE = 20;

// Listings page (Week 5, filters added Week 6): filter form, then loading, error, count and the card grid
export default function ListingsPage() {
  const [properties, setProperties] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState({}); // filters of the latest search ({} = all properties)

  // Runs when the page first appears, and again every time "search" changes
  useEffect(() => {
    let cancelled = false; // becomes true when a newer search starts (see the cleanup below)

    async function load() {
      try {
        const data = await fetchProperties({ ...removeEmptyFilters(search), limit: PAGE_SIZE });
        if (cancelled) return; // an old answer that arrived late: ignore it (Week 6 debug challenge)
        setProperties(data.results);
        setTotal(data.total);
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();

    // Cleanup: React runs this just before the next search starts (or when the page closes)
    return () => {
      cancelled = true;
    };
  }, [search]);

  // Search and Clear: show "Loading…" and start a new search (a new object, so it always re-runs)
  function startSearch(filters) {
    setLoading(true);
    setError(null);
    setSearch({ ...filters });
  }

  // The form stays on screen in every state, so what the user typed is never lost
  let content;
  if (loading) {
    content = <p className="listings-status">Loading properties…</p>;
  } else if (error) {
    content = (
      <div className="listings-status listings-error" role="alert">
        <strong>Couldn't load properties.</strong> {error}
      </div>
    );
  } else if (properties.length === 0) {
    content = (
      <div className="listings-status listings-empty">
        <p><strong>No properties found.</strong></p>
        <p>Try another city or ZIP code, widen the price range, or choose fewer beds or baths.</p>
        <p>Or click <strong>Clear Filters</strong> to see all properties.</p>
      </div>
    );
  } else {
    content = (
      <>
        <p className="listings-count">
          Showing {properties.length.toLocaleString('en-US')} of {total.toLocaleString('en-US')} properties
        </p>
        <div className="listings-grid">
          {properties.map((property) => (
            // id (row number) is unique; L_ListingID isn't — 3 listings appear twice (Week 4)
            <PropertyCard key={property.id} property={property} />
          ))}
        </div>
      </>
    );
  }

  return (
    <section className="listings-page">
      <h1 className="listings-title">Properties for sale</h1>
      <PropertyFilters onSearch={startSearch} onClear={() => startSearch({})} />
      {content}
    </section>
  );
}
