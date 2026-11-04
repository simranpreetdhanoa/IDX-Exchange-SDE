import { useEffect, useState } from 'react';
import { fetchProperties } from '../api/client';
import Pagination from '../components/Pagination';
import PropertyCard from '../components/PropertyCard';
import PropertyFilters from '../components/PropertyFilters';
import { removeEmptyFilters } from '../utils/filters';
import { getTotalPages } from '../utils/pagination';
import './ListingsPage.css';

const PAGE_SIZE = 20;

// Listings page (Week 5, filters Week 6, pagination Week 7): filter form, then loading, error, count, the card grid and page controls
export default function ListingsPage() {
  const [properties, setProperties] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState({}); // filters of the latest search ({} = all properties)
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(PAGE_SIZE);

  // How many homes come before this page: page 3 at 20 per page skips 40
  const offset = (currentPage - 1) * itemsPerPage;

  // Runs when the page first appears, and again when the search or the page changes
  useEffect(() => {
    let cancelled = false; // becomes true when a newer request starts (see the cleanup below)

    async function load() {
      try {
        const data = await fetchProperties({ ...removeEmptyFilters(search), limit: itemsPerPage, offset });
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

    // Cleanup: React runs this just before the next request starts (or when the page closes)
    return () => {
      cancelled = true;
    };
  }, [search, offset, itemsPerPage]);

  // Search and Clear: show "Loading…" and start a new search (a new object, so it always re-runs)
  function startSearch(filters) {
    setLoading(true);
    setError(null);
    setCurrentPage(1); // new filters mean a new list, so start from its first page
    setSearch({ ...filters });
  }

  // Page controls: "search" stays as it is, so the active filters are kept
  function goToPage(page) {
    setLoading(true);
    setError(null);
    setCurrentPage(page);
    window.scrollTo(0, 0);
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
          Showing {(offset + 1).toLocaleString('en-US')}-{(offset + properties.length).toLocaleString('en-US')} of {total.toLocaleString('en-US')} properties
        </p>
        <div className="listings-grid">
          {properties.map((property) => (
            // id (row number) is unique; L_ListingID isn't — 3 listings appear twice (Week 4)
            <PropertyCard key={property.id} property={property} />
          ))}
        </div>
        <Pagination
          currentPage={currentPage}
          totalPages={getTotalPages(total, itemsPerPage)}
          onPageChange={goToPage}
        />
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
