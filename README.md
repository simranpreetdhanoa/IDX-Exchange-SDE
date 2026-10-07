# IDX Real Estate Platform

Welcome to my IDX Real Estate project! Here is my progress week by week:

## 🟢 Week 1: Database Setup
- Set up MySQL database in Docker.
- Configured connection pool (`db.js`).

## 🟢 Week 2: Express Server & Health Check
- Created the Express server in `server.js`.
- Built the `/api/health` endpoint to check if the database is connected.

## 🟢 Week 3: Property Search & Performance
- Built `GET /api/properties` route with search filters (`city`, `minPrice`, `beds`, etc.).
- Added server-side pagination (`limit` and `offset`).
- Added input validation for `400 Bad Request` errors.
- Created database indexes on `rets_property` table and tested with `EXPLAIN`.
