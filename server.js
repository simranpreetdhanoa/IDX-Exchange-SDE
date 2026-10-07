require('dotenv').config();
const express = require('express');
const cors = require('cors');
const pool = require('./db');

const app = express();

app.use(cors());
app.use(express.json());

// 1. Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.status(200).json({ status: 'ok', database: 'connected' });
  } catch (error) {
    res.status(500).json({ 
      status: 'error', 
      database: 'disconnected', 
      message: error.message 
    });
  }
});

// 2. GET /api/properties Endpoint (Week 3 Requirements)
app.get('/api/properties', async (req, res) => {
  try {
    const { city, zipcode, minPrice, maxPrice, beds, bedrooms, baths, limit = 20, offset = 0 } = req.query;

    // -----------------------------------------------------------
    // INPUT VALIDATION (Return 400 with helpful error messages)
    // -----------------------------------------------------------

    // Validate minPrice
    if (minPrice !== undefined && minPrice !== '') {
      const parsedMin = Number(minPrice);
      if (isNaN(parsedMin) || parsedMin < 0) {
        return res.status(400).json({ error: 'minPrice must be a valid non-negative number' });
      }
    }

    // Validate maxPrice
    if (maxPrice !== undefined && maxPrice !== '') {
      const parsedMax = Number(maxPrice);
      if (isNaN(parsedMax) || parsedMax < 0) {
        return res.status(400).json({ error: 'maxPrice must be a valid non-negative number' });
      }
    }

    // Validate minPrice <= maxPrice
    if (minPrice && maxPrice && Number(minPrice) > Number(maxPrice)) {
      return res.status(400).json({ error: 'minPrice cannot be greater than maxPrice' });
    }

    // Validate beds / bedrooms
    const bedVal = beds || bedrooms;
    if (bedVal !== undefined && bedVal !== '') {
      const parsedBeds = Number(bedVal);
      if (isNaN(parsedBeds) || !Number.isInteger(parsedBeds) || parsedBeds < 0) {
        return res.status(400).json({ error: 'beds must be a valid non-negative integer' });
      }
    }

    // Validate baths
    if (baths !== undefined && baths !== '') {
      const parsedBaths = Number(baths);
      if (isNaN(parsedBaths) || parsedBaths < 0) {
        return res.status(400).json({ error: 'baths must be a valid non-negative number' });
      }
    }

    // Validate limit & offset query params
    const parsedLimit = parseInt(limit, 10);
    const parsedOffset = parseInt(offset, 10);

    if (isNaN(parsedLimit) || parsedLimit < 1 || parsedLimit > 100) {
      return res.status(400).json({ error: 'limit must be an integer between 1 and 100' });
    }

    if (isNaN(parsedOffset) || parsedOffset < 0) {
      return res.status(400).json({ error: 'offset must be a non-negative integer' });
    }

    // -----------------------------------------------------------
    // DYNAMIC QUERY BUILDING (Parameterized Queries Only)
    // -----------------------------------------------------------
    const whereClauses = [];
    const filterParams = [];

    // Filter: City (Case-insensitive + string normalization)
    if (city && city.trim() !== '') {
      whereClauses.push('LOWER(TRIM(L_City)) = LOWER(TRIM(?))');
      filterParams.push(city.trim());
    }

    // Filter: Zip Code
    if (zipcode && zipcode.trim() !== '') {
      whereClauses.push('L_Zip = ?');
      filterParams.push(zipcode.trim());
    }

    // Filter: Minimum Price
    if (minPrice && minPrice !== '') {
      whereClauses.push('L_SystemPrice >= ?');
      filterParams.push(Number(minPrice));
    }

    // Filter: Maximum Price
    if (maxPrice && maxPrice !== '') {
      whereClauses.push('L_SystemPrice <= ?');
      filterParams.push(Number(maxPrice));
    }

    // Filter: Beds (using database column L_Keyword2)
    if (bedVal && bedVal !== '') {
      whereClauses.push('L_Keyword2 >= ?');
      filterParams.push(parseInt(bedVal, 10));
    }

    // Filter: Baths (using database column LM_Dec_3)
    if (baths && baths !== '') {
      whereClauses.push('LM_Dec_3 >= ?');
      filterParams.push(Number(baths));
    }

    const whereSQL = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    // -----------------------------------------------------------
    // DATABASE EXECUTION
    // -----------------------------------------------------------

    // 1. Get total matching properties count
    const countSql = `SELECT COUNT(*) AS total FROM rets_property ${whereSQL}`;
    const [countRows] = await pool.query(countSql, filterParams);
    const total = countRows[0].total;

    if (total === 0) {
      return res.status(200).json({
        total: 0,
        limit: parsedLimit,
        offset: parsedOffset,
        results: [],
        data: [],
        message: 'No properties found matching your filter criteria.'
      });
    }

    // 2. Fetch paginated records using LIMIT & OFFSET
    const dataSql = `SELECT * FROM rets_property ${whereSQL} LIMIT ? OFFSET ?`;
    const queryParams = [...filterParams, parsedLimit, parsedOffset];
    const [rows] = await pool.query(dataSql, queryParams);

    // -----------------------------------------------------------
    // API CONTRACT RESPONSE
    // -----------------------------------------------------------
    return res.status(200).json({
      success: true,
      total,
      limit: parsedLimit,
      offset: parsedOffset,
      totalPages: Math.ceil(total / parsedLimit),
      currentPage: Math.floor(parsedOffset / parsedLimit) + 1,
      results: rows,
      data: rows
    });

  } catch (error) {
    console.error('Property query error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error while retrieving properties.' 
    });
  }
});

// 3. Fetch a single property by ID
app.get('/api/properties/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query(
      'SELECT * FROM rets_property WHERE id = ?',
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Property not found'
      });
    }

    res.status(200).json({
      success: true,
      data: rows[0]
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

// 4. Handle 404 Routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});