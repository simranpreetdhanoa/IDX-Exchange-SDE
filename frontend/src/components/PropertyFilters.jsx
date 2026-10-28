import { useState } from 'react';
import { EMPTY_FILTERS } from '../utils/filters';
import './PropertyFilters.css';

// Filter form (Week 6): all six inputs live in one state object.
// Search sends the values to onSearch; Clear Filters empties the form and calls onClear.
export default function PropertyFilters({ onSearch, onClear }) {
  const [filters, setFilters] = useState(EMPTY_FILTERS);

  // One handler for every input: the input's "name" says which field to update
  function handleChange(event) {
    const { name, value } = event.target;
    setFilters({ ...filters, [name]: value });
  }

  function handleSubmit(event) {
    event.preventDefault(); // stop the browser reloading the page
    onSearch(filters);
  }

  function handleClear() {
    setFilters(EMPTY_FILTERS);
    onClear();
  }

  return (
    <form className="filters" onSubmit={handleSubmit} aria-label="Property filters">
      <label>
        City
        <input name="city" value={filters.city} onChange={handleChange} placeholder="e.g. Irvine" />
      </label>
      <label>
        ZIP code
        <input name="zipcode" value={filters.zipcode} onChange={handleChange} inputMode="numeric" placeholder="e.g. 92618" />
      </label>
      <label>
        Min price
        <input name="minPrice" type="number" min="0" value={filters.minPrice} onChange={handleChange} placeholder="$ any" />
      </label>
      <label>
        Max price
        <input name="maxPrice" type="number" min="0" value={filters.maxPrice} onChange={handleChange} placeholder="$ any" />
      </label>
      {/* The backend treats beds and baths as "at least", hence 1+, 2+... */}
      <label>
        Beds
        <select name="beds" value={filters.beds} onChange={handleChange}>
          <option value="">Any</option>
          {[1, 2, 3, 4, 5].map((n) => (
            <option key={n} value={n}>{n}+</option>
          ))}
        </select>
      </label>
      <label>
        Baths
        <select name="baths" value={filters.baths} onChange={handleChange}>
          <option value="">Any</option>
          {[1, 2, 3, 4].map((n) => (
            <option key={n} value={n}>{n}+</option>
          ))}
        </select>
      </label>
      <div className="filters-buttons">
        <button type="submit" className="filters-search">Search</button>
        <button type="button" className="filters-clear" onClick={handleClear}>Clear Filters</button>
      </div>
    </form>
  );
}
