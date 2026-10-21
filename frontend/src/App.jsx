import React, { useState, useEffect } from 'react';
import { Home, Bed, Bath, MapPin, DollarSign, Search, RefreshCw, Activity, ChevronLeft, ChevronRight, ImageOff } from 'lucide-react';
import './App.css';

const API_BASE_URL = 'http://localhost:5000/api';

const getPropertyPrice = (prop) => {
  if (!prop) return 0;
  const rawPrice = 
    prop.L_SystemPrice ?? 
    prop.L_ListPrice ?? 
    prop.L_AskingPrice ?? 
    prop.PreviousListPrice ?? 
    prop.list_price ?? 
    prop.price ?? 
    0;
  return parseFloat(rawPrice) || 0;
};

const getPropertyBeds = (prop) => {
  if (!prop) return 0;
  const beds = 
    prop.L_Keyword2 ?? 
    prop.L_Beds ?? 
    prop.L_Bedrooms ?? 
    prop.L_BedroomsTotal ?? 
    prop.bedrooms ?? 
    prop.beds ?? 
    0;
  return parseInt(beds, 10) || 0;
};

const getPropertyBaths = (prop) => {
  if (!prop) return 0;
  const fullBaths = parseFloat(prop.LM_Dec_3 ?? prop.L_Baths ?? prop.L_BathsFull ?? prop.bathrooms ?? 0) || 0;
  const halfBaths = parseFloat(prop.BathroomsHalf ?? 0) > 0 ? 0.5 : 0;
  return fullBaths + halfBaths;
};

const getPropertyImage = (prop) => {
  if (!prop || !prop.L_Photos) return null;
  try {
    const photos = typeof prop.L_Photos === 'string' ? JSON.parse(prop.L_Photos) : prop.L_Photos;
    return Array.isArray(photos) && photos.length > 0 ? photos[0] : null;
  } catch (err) {
    return null;
  }
};

const getPropertyAddress = (prop) => {
  if (!prop) return 'N/A';
  return prop.L_Address || prop.address || `Property ID: #${prop.id}`;
};

const getPropertyCity = (prop) => {
  if (!prop) return 'MLS Listing';
  return prop.L_City || prop.PostalCity || prop.city || 'MLS Listing';
};

// Reliable Fallback Image Component
const PropertyImage = ({ src, alt, style, className }) => {
  const [imgError, setImgError] = useState(false);

  if (!src || imgError) {
    return (
      <div 
        style={{
          ...style,
          backgroundColor: '#e2e8f0',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#64748b',
          fontSize: '13px',
          fontWeight: '500',
          gap: '6px'
        }}
        className={className}
      >
        <ImageOff size={24} />
        <span>No Image Available</span>
      </div>
    );
  }

  return (
    <img 
      src={src} 
      alt={alt} 
      className={className} 
      style={style} 
      onError={() => setImgError(true)} 
    />
  );
};

export default function App() {
  const [properties, setProperties] = useState([]);
  const [totalProperties, setTotalProperties] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [health, setHealth] = useState({ status: 'checking', database: 'unknown' });
  const [loading, setLoading] = useState(false);

  const [filters, setFilters] = useState({
    city: '',
    minPrice: '',
    maxPrice: '',
    bedrooms: ''
  });

  const checkHealth = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/health`);
      const data = await res.json();
      setHealth(data);
    } catch (err) {
      setHealth({ status: 'error', database: 'disconnected' });
    }
  };

  const fetchProperties = async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', '50');

      if (filters.city) params.append('city', filters.city);
      if (filters.minPrice) params.append('minPrice', filters.minPrice);
      if (filters.maxPrice) params.append('maxPrice', filters.maxPrice);
      if (filters.bedrooms) params.append('bedrooms', filters.bedrooms);

      const res = await fetch(`${API_BASE_URL}/properties?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setProperties(data.data);
        setTotalProperties(data.total);
        setTotalPages(data.totalPages || 1);
        setCurrentPage(data.currentPage || page);
      }
    } catch (err) {
      console.error('Error fetching properties:', err);
    } finally {
      setLoading(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const fetchPropertyById = async (id) => {
    try {
      const res = await fetch(`${API_BASE_URL}/properties/${id}`);
      const data = await res.json();
      if (data.success) {
        setSelectedProperty(data.data);
      }
    } catch (err) {
      console.error('Error fetching property detail:', err);
    }
  };

  useEffect(() => {
    checkHealth();
    fetchProperties(1);
  }, []);

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchProperties(1);
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      fetchProperties(newPage);
    }
  };

  return (
    <div className="app-container">
      <header className="header">
        <div className="logo-group">
          <Home className="brand-icon" size={28} />
          <h1>IDX Real Estate Platform</h1>
        </div>
        
        <div className={`health-badge ${health.database}`}>
          <Activity size={16} />
          <span>API: {health.database === 'connected' ? 'Connected (Port 5000)' : 'Disconnected'}</span>
        </div>
      </header>

      <form className="search-bar" onSubmit={handleSearch}>
        <div className="input-group">
          <MapPin size={18} />
          <input 
            type="text" 
            name="city" 
            placeholder="City" 
            value={filters.city} 
            onChange={handleFilterChange} 
          />
        </div>

        <div className="input-group">
          <Bed size={18} />
          <input 
            type="number" 
            name="bedrooms" 
            placeholder="Min Beds" 
            value={filters.bedrooms} 
            onChange={handleFilterChange} 
          />
        </div>

        <div className="input-group">
          <DollarSign size={18} />
          <input 
            type="number" 
            name="minPrice" 
            placeholder="Min Price" 
            value={filters.minPrice} 
            onChange={handleFilterChange} 
          />
        </div>

        <div className="input-group">
          <DollarSign size={18} />
          <input 
            type="number" 
            name="maxPrice" 
            placeholder="Max Price" 
            value={filters.maxPrice} 
            onChange={handleFilterChange} 
          />
        </div>

        <button type="submit" className="search-btn">
          <Search size={18} /> Search
        </button>
      </form>

      <main className="content">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2>Available Properties ({totalProperties} Total)</h2>
          {totalPages > 1 && (
            <span style={{ fontSize: '14px', color: '#666', fontWeight: 500 }}>
              Page {currentPage} of {totalPages}
            </span>
          )}
        </div>

        {loading ? (
          <div className="loading"><RefreshCw className="spin" /> Loading properties...</div>
        ) : (
          <>
            <div className="property-grid">
              {properties.map((prop) => {
                const price = getPropertyPrice(prop);
                const address = getPropertyAddress(prop);
                const city = getPropertyCity(prop);
                const beds = getPropertyBeds(prop);
                const baths = getPropertyBaths(prop);
                const image = getPropertyImage(prop);

                return (
                  <div key={prop.id} className="card" onClick={() => fetchPropertyById(prop.id)}>
                    <div className="card-image-container">
                      <PropertyImage 
                        src={image} 
                        alt={address} 
                        className="card-image" 
                        style={{ width: '100%', height: '180px', objectFit: 'cover', borderRadius: '8px 8px 0 0' }} 
                      />
                    </div>
                    <div className="card-header" style={{ padding: '12px 16px 0 16px' }}>
                      <span className="price">${price.toLocaleString()}</span>
                      <span className="city-tag">{city}</span>
                    </div>
                    <p className="address" style={{ padding: '0 16px' }}><MapPin size={14} /> {address}</p>
                    <div className="specs" style={{ padding: '0 16px 12px 16px' }}>
                      <span><Bed size={16} /> {beds} Beds</span>
                      <span><Bath size={16} /> {baths} Baths</span>
                    </div>
                    <button className="details-btn">View Details</button>
                  </div>
                );
              })}
            </div>

            {totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px', margin: '32px 0 16px 0' }}>
                <button 
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '8px 16px',
                    borderRadius: '6px',
                    border: '1px solid #ccc',
                    backgroundColor: currentPage === 1 ? '#f5f5f5' : '#fff',
                    cursor: currentPage === 1 ? 'not-allowed' : 'pointer'
                  }}
                >
                  <ChevronLeft size={16} /> Previous
                </button>

                <span style={{ fontWeight: 600, fontSize: '14px' }}>
                  Page {currentPage} of {totalPages}
                </span>

                <button 
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '8px 16px',
                    borderRadius: '6px',
                    border: '1px solid #ccc',
                    backgroundColor: currentPage === totalPages ? '#f5f5f5' : '#fff',
                    cursor: currentPage === totalPages ? 'not-allowed' : 'pointer'
                  }}
                >
                  Next <ChevronRight size={16} />
                </button>
              </div>
            )}
          </>
        )}
      </main>

      {selectedProperty && (
        <div className="modal-overlay" onClick={() => setSelectedProperty(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <PropertyImage 
              src={getPropertyImage(selectedProperty)} 
              alt="Property detail" 
              style={{ width: '100%', height: '220px', objectFit: 'cover', borderRadius: '8px', marginBottom: '15px' }} 
            />
            <h3>{getPropertyAddress(selectedProperty)}</h3>
            <p className="modal-price">
              ${getPropertyPrice(selectedProperty).toLocaleString()}
            </p>
            <p><strong>City:</strong> {getPropertyCity(selectedProperty)}</p>
            <p><strong>Bedrooms:</strong> {getPropertyBeds(selectedProperty)}</p>
            <p><strong>Bathrooms:</strong> {getPropertyBaths(selectedProperty)}</p>
            <p><strong>Listing Agent:</strong> {selectedProperty.ListAgentFullName || 'N/A'}</p>
            {selectedProperty.L_Remarks && (
              <p style={{ marginTop: '10px', fontSize: '13px', color: '#555', maxHeight: '100px', overflowY: 'auto' }}>
                <strong>Remarks:</strong> {selectedProperty.L_Remarks}
              </p>
            )}
            <button className="close-btn" onClick={() => setSelectedProperty(null)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}