import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router';
import { fetchPropertyDetail } from '../api/client';
import {
  formatPrice,
  formatAddress,
  formatCityState,
  formatCount,
  formatSqft,
  formatYear,
  formatFeatureList,
  formatLotSize,
  formatDays,
} from '../utils/property';
import './PropertyDetailPage.css';

// Property detail page (Week 8): one home, chosen by the :id in the address
export default function PropertyDetailPage() {
  const { id } = useParams();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch the home when the page opens (and again if the id in the address changes)
  useEffect(() => {
    let cancelled = false; // same protection as the listings page (Week 6)

    async function load() {
      try {
        const data = await fetchPropertyDetail(id);
        if (!cancelled) setProperty(data);
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();

    return () => {
      cancelled = true;
    };
  }, [id]);

  const backLink = (
    <Link className="detail-back" to="/">
      ← Back to listings
    </Link>
  );

  if (loading) {
    return (
      <section className="detail-page">
        {backLink}
        <p className="detail-status">Loading property…</p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="detail-page">
        {backLink}
        <div className="detail-status detail-error" role="alert">
          <strong>Couldn't load this property.</strong> {error}
        </div>
      </section>
    );
  }

  // Week 8: label + value for each detail; rows without a value are left out
  const details = [
    ['MLS #', property.L_DisplayId],
    ['Property type', formatFeatureList(property.L_Type_)],
    ['Status', property.L_Status],
    ['Lot size', formatLotSize(property.LotSizeAcres, property.LotSizeSquareFeet)],
    ['Stories', property.StoriesTotal],
    ['Architectural style', formatFeatureList(property.ArchitecturalStyle)],
    ['View', formatFeatureList(property.View)],
    ['Heating', formatFeatureList(property.Heating)],
    ['Cooling', formatFeatureList(property.Cooling)],
    ['Flooring', formatFeatureList(property.Flooring)],
    ['Appliances', formatFeatureList(property.Appliances)],
    ['Interior features', formatFeatureList(property.InteriorFeatures)],
    ['Pool', formatFeatureList(property.PoolFeatures)],
    ['Days on market', formatDays(property.DaysOnMarket)],
    ['County', property.CountyOrParish],
  ].filter(([, value]) => value !== null && value !== undefined && String(value).trim() !== '');

  const description = typeof property.L_Remarks === 'string' ? property.L_Remarks.trim() : '';

  return (
    <section className="detail-page">
      {backLink}
      <header className="detail-header">
        <p className="detail-price">{formatPrice(property.L_SystemPrice)}</p>
        <h1 className="detail-address">{formatAddress(property.L_Address)}</h1>
        <p className="detail-location">
          {formatCityState(property.L_City, property.L_State)} {property.L_Zip}
        </p>
      </header>

      <dl className="detail-stats">
        <div>
          <dt>Beds</dt>
          <dd>{formatCount(property.L_Keyword2)}</dd>
        </div>
        <div>
          <dt>Baths</dt>
          <dd>{formatCount(property.LM_Dec_3)}</dd>
        </div>
        <div>
          <dt>Living area</dt>
          <dd>{formatSqft(property.LM_Int2_3)}</dd>
        </div>
        <div>
          <dt>Year built</dt>
          <dd>{formatYear(property.YearBuilt)}</dd>
        </div>
      </dl>

      <h2 className="detail-heading">About this home</h2>
      <p className="detail-description">{description || 'No description provided.'}</p>

      {details.length > 0 && (
        <>
          <h2 className="detail-heading">Property details</h2>
          <dl className="detail-list">
            {details.map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
        </>
      )}
    </section>
  );
}
