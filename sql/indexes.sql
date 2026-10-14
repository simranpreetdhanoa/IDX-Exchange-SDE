-- ============================================================
-- rets_property indexes — Week 3
-- Run this file once after importing rets_property.sql into
-- a fresh database:
--   docker exec -i idx-mysql-local mysql -u root -p rets < backend/sql/indexes.sql
--
-- All statements use IF NOT EXISTS so the file is safe to
-- re-run without dropping existing indexes first.
-- ============================================================

-- City (plain column, case-sensitive equality / range scans)
-- Kept for any raw L_City comparisons and as the leading
-- column of the composite index below.
CREATE INDEX IF NOT EXISTS idx_city
  ON rets_property (L_City);

-- City (functional index on LOWER(TRIM(L_City)))
-- Required so the API filter  WHERE LOWER(TRIM(L_City)) = LOWER(TRIM(?))
-- resolves as a ref lookup (type: ref) rather than a full
-- index scan (type: index).  Without this, wrapping the
-- column in a function defeats the plain idx_city index.
CREATE INDEX IF NOT EXISTS idx_city_lower
  ON rets_property ((LOWER(TRIM(L_City))));

-- ZIP code  (L_Zip)
-- Used by the ?zipcode= filter:  WHERE L_Zip = ?
CREATE INDEX IF NOT EXISTS idx_zip
  ON rets_property (L_Zip);

-- Listing price  (L_SystemPrice)
-- Used by the ?minPrice= / ?maxPrice= range filters:
--   WHERE L_SystemPrice >= ? AND L_SystemPrice <= ?
CREATE INDEX IF NOT EXISTS idx_price
  ON rets_property (L_SystemPrice);

-- Bedrooms  (L_Keyword2)
-- RETS column that maps to the beds field.
-- Used by the ?beds= filter:  WHERE L_Keyword2 >= ?
CREATE INDEX IF NOT EXISTS idx_beds
  ON rets_property (L_Keyword2);

-- Bathrooms  (LM_Dec_3)
-- RETS column that maps to the baths field (stored as DECIMAL).
-- Used by the ?baths= filter:  WHERE LM_Dec_3 >= ?
CREATE INDEX IF NOT EXISTS idx_baths
  ON rets_property (LM_Dec_3);

-- Composite: city + price
-- Covers the common combined query  ?city=X&minPrice=Y
-- without MySQL having to merge two separate index scans.
-- Column order matters: city first (equality), then price
-- (range), matching the query's WHERE clause evaluation order.
CREATE INDEX IF NOT EXISTS idx_city_price
  ON rets_property (L_City, L_SystemPrice);
