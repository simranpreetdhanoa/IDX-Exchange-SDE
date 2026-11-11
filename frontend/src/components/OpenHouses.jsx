import { useEffect, useState } from 'react';
import { fetchOpenHouses } from '../api/client';
import { formatOpenHouseDate, formatTime } from '../utils/property';
import './OpenHouses.css';

// Open houses for one home (Week 8). It fetches its own data, like a mini page,
// so if this part fails, only this section shows an error and the rest of the detail page still works.
export default function OpenHouses({ listingId }) {
  const [openHouses, setOpenHouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false; // same protection as the detail page

    async function load() {
      try {
        const data = await fetchOpenHouses(listingId);
        if (!cancelled) setOpenHouses(Array.isArray(data) ? data : []);
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
  }, [listingId]);

  if (loading) return <p className="open-houses-status">Loading open houses…</p>;

  if (error) {
    return (
      <p className="open-houses-status open-houses-error" role="alert">
        Couldn't load open houses. {error}
      </p>
    );
  }

  if (openHouses.length === 0) return <p className="open-houses-status">No open houses scheduled</p>;

  return (
    <ul className="open-houses">
      {openHouses.map((openHouse) => {
        const start = formatTime(openHouse.OH_StartTime);
        const end = formatTime(openHouse.OH_EndTime);
        // "1:00 PM – 4:00 PM"; if one time is missing, show just the other
        const times = start && end ? `${start} – ${end}` : start || end;

        return (
          <li key={openHouse.id} className="open-house">
            <p className="open-house-when">
              <strong>{formatOpenHouseDate(openHouse.OH_StartDate) ?? 'Date not listed'}</strong>
              {times && <span> · {times}</span>}
            </p>
            {openHouse.OpenHouseRemarks && <p className="open-house-remarks">{openHouse.OpenHouseRemarks}</p>}
          </li>
        );
      })}
    </ul>
  );
}
