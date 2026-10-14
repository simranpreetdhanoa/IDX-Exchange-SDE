const express = require('express');
const router = express.Router();
const pool = require('../db'); // Connection pool created in Week 2

// (week 4) Id validation
// Listing IDs are digits only (9–10 in our data); allow up to 20 so longer future IDs still work (week 4)
function validateListingId(req, res, next) {
  const { id } = req.params;

  if (!/^\d{1,20}$/.test(id)) {
    return res.status(400).json({
      error: 'Invalid listing ID. It must contain only digits (max 20 characters).'
    });
  }

  next();
}

router.get('/', async (req, res) => {
  try {
    const { city, zipcode, minPrice, maxPrice, beds, baths, limit = 20, offset = 0 } = req.query;

    // -------------------------------------------------------------
    // 1. INPUT VALIDATION (Return 400 with helpful error messages)
    // -------------------------------------------------------------
    if (minPrice !== undefined && minPrice !== '') {
      const parsedMin = Number(minPrice);
      if (isNaN(parsedMin) || parsedMin < 0) {
        return res.status(400).json({ error: 'minPrice must be a valid non-negative number' });
      }
    }

    if (maxPrice !== undefined && maxPrice !== '') {
      const parsedMax = Number(maxPrice);
      if (isNaN(parsedMax) || parsedMax < 0) {
        return res.status(400).json({ error: 'maxPrice must be a valid non-negative number' });
      }
    }

    if (minPrice && maxPrice && Number(minPrice) > Number(maxPrice)) {
      return res.status(400).json({ error: 'minPrice cannot be greater than maxPrice' });
    }

    if (beds !== undefined && beds !== '') {
      const parsedBeds = Number(beds);
      if (isNaN(parsedBeds) || !Number.isInteger(parsedBeds) || parsedBeds < 0) {
        return res.status(400).json({ error: 'beds must be a valid non-negative integer' });
      }
    }

    if (baths !== undefined && baths !== '') {
      const parsedBaths = Number(baths);
      if (isNaN(parsedBaths) || parsedBaths < 0) {
        return res.status(400).json({ error: 'baths must be a valid non-negative number' });
      }
    }

    // Pagination bounds check
    const parsedLimit = parseInt(limit, 10);
    const parsedOffset = parseInt(offset, 10);

    if (isNaN(parsedLimit) || parsedLimit < 1 || parsedLimit > 100) {
      return res.status(400).json({ error: 'limit must be an integer between 1 and 100' });
    }

    if (isNaN(parsedOffset) || parsedOffset < 0) {
      return res.status(400).json({ error: 'offset must be a non-negative integer' });
    }

    // -------------------------------------------------------------
    // 2. DYNAMIC QUERY BUILDING & DEBUG CHALLENGE PREVENTION
    // -------------------------------------------------------------
    const whereClauses = [];
    const filterParams = [];

    if (city && city.trim() !== '') {
      whereClauses.push('LOWER(TRIM(L_City)) = LOWER(TRIM(?))');
      filterParams.push(city.trim());
    }

    if (zipcode && zipcode.trim() !== '') {
      whereClauses.push('L_Zip = ?');
      filterParams.push(zipcode.trim());
    }

    if (minPrice && minPrice !== '') {
      whereClauses.push('L_SystemPrice >= ?');
      filterParams.push(Number(minPrice));
    }

    if (maxPrice && maxPrice !== '') {
      whereClauses.push('L_SystemPrice <= ?');
      filterParams.push(Number(maxPrice));
    }

    // RETS Mapping: beds -> L_Keyword2
    if (beds && beds !== '') {
      whereClauses.push('L_Keyword2 >= ?');
      filterParams.push(parseInt(beds, 10));
    }

    // RETS Mapping: baths -> LM_Dec_3
    if (baths && baths !== '') {
      whereClauses.push('LM_Dec_3 >= ?');
      filterParams.push(Number(baths));
    }

    const whereSQL = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    // -------------------------------------------------------------
    // 3. EXECUTE QUERIES (COUNT & RESULTS)
    // -------------------------------------------------------------

    // Query 1: Total matching records count
    const countSql = `SELECT COUNT(*) AS total FROM rets_property ${whereSQL}`;
    const [countRows] = await pool.query(countSql, filterParams);
    const total = countRows[0].total;

    // Query 2: Fetch paginated record set
    const dataSql = `SELECT * FROM rets_property ${whereSQL} LIMIT ? OFFSET ?`;
    
    // IMPORTANT: Spread filterParams to avoid mutating original array
    const queryParams = [...filterParams, parsedLimit, parsedOffset];
    const [results] = await pool.query(dataSql, queryParams);

    // -------------------------------------------------------------
    // 4. API CONTRACT RESPONSE
    // -------------------------------------------------------------
    return res.status(200).json({
      total,
      limit: parsedLimit,
      offset: parsedOffset,
      results
    });

  } catch (error) {
    console.error('Property endpoint error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;