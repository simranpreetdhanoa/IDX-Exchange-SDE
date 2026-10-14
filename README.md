# IDX Real Estate Platform

Welcome to my IDX Real Estate project! Here is my progress week by week:

## 🟢 Week 1: Database Setup
- Set up MySQL database in Docker.
- Configured connection pool (`db.js`).
- 📖 Details: [docs/week-1.md](docs/week-1.md)

## 🟢 Week 2: Express Server & Health Check
- Created the Express server in `server.js`.
- Built the `/api/health` endpoint to check if the database is connected.
- 📖 Details: [docs/week-2.md](docs/week-2.md)

## 🟢 Week 3: Property Search & Performance
- Built `GET /api/properties` route with search filters (`city`, `minPrice`, `beds`, etc.).
- Added server-side pagination (`limit` and `offset`).
- Added input validation for `400 Bad Request` errors.
- Created database indexes on `rets_property` table and tested with `EXPLAIN`.
- 📖 Details: [docs/week-3.md](docs/week-3.md)

## 🟢 Week 4: Property Detail & Open House Endpoints
- Added request logging middleware (method, URL, status code, duration).
- Built `GET /api/properties/:id` (one property or 404) and `GET /api/properties/:id/openhouses` (sorted list, `[]` if none).
- Validated listing IDs (digits only, max 20 → otherwise 400).
- Tested route order in Express and documented why it matters.
- Debug challenge: orphan open houses; added a global error handler.
- 📖 Details: [docs/week-4.md](docs/week-4.md)

---

# IDX Real Estate Platform (SDE)

Backend API service and database optimization project for real estate property search and RETS data indexing.

---

# 🏠 IDX Real Estate Platform (SDE)

A robust backend REST API and optimized database architecture for real estate property search, pagination, dynamic filtering, and RETS data indexing.

---

## 📅 Weekly Milestone Summary & Command Log

---

### 🟢 Week 1: Infrastructure & Dockerized MySQL Setup

**Goal:** Provision a containerized MySQL environment, load RETS property dataset, and establish connection pooling in Node.js.

#### Key Achievements:
* Spin up a local MySQL 8.0 instance using Docker (`idx-mysql-local`).
* Imported raw RETS property tables (`rets_property`) into local database.
* Established reusable MySQL connection pooling using `mysql2/promise` in `backend/db.js`.

#### Terminal & SQL Commands:
```bash
# Start MySQL Docker container
docker run --name idx-mysql-local -e MYSQL_ROOT_PASSWORD=<your-password> -p 3306:3306 -d mysql:8.0

# Connect to containerized MySQL interactive shell
docker exec -it idx-mysql-local mysql -u root -p
```

```sql
-- Database creation and verification
CREATE DATABASE IF NOT EXISTS rets;
USE rets;
SHOW TABLES;
```

---

### 🟢 Week 2: Express Server & Health Check Endpoint

**Goal:** Build core Node.js/Express server architecture, configure middleware, set up environment variable handling, and implement a health check endpoint to monitor database connectivity.

#### Key Achievements
* **Server Setup:** Initialized Node.js project and configured Express server with `cors` and `express.json()` parsing middleware.
* **Environment Configuration:** Managed environment variables (`PORT`, `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`) securely using `dotenv`.
* **Database Connection Pooling:** Implemented `mysql2/promise` connection pooling in `backend/db.js` for asynchronous query execution.
* **Health Monitor Route:** Created `/api/health` endpoint to verify live database ping before accepting client queries.

#### Terminal Commands
```bash
# Initialize Node.js package configuration
npm init -y

# Install core backend production dependencies
npm install express mysql2 dotenv cors

# Install development auto-reloader tool
npm install --save-dev nodemon

# Execute backend development server
npm run dev
```

---

# 🟢 Week 3: Property Search API, Pagination, Input Validation & Indexing

**Goal:** Build a performant, paginated, and dynamically filterable `GET /api/properties` endpoint backed by proper database indexes, strict query validation, and protection against SQL injection.

---

### 🔑 Key Achievements

* **Route Architecture & Mounting:** Created `backend/routes/properties.js` and mounted it at `/api/properties` using Express Router.
* **RETS Schema Mapping:** Correctly mapped user-facing query parameters to non-standard database column names in `rets_property`:
  * `beds` $\rightarrow$ `L_Keyword2`
  * `baths` $\rightarrow$ `LM_Dec_3`
  * `minPrice` / `maxPrice` $\rightarrow$ `L_SystemPrice`
  * `zipcode` $\rightarrow$ `L_Zip`
  * `city` $\rightarrow$ `L_City` (handling case inconsistencies with `LOWER(TRIM())`)
* **Input Validation & 400 Bad Request:** Added server-side validation rejecting invalid parameter values with clear error messages:
  * Non-numeric or negative values for `minPrice`, `maxPrice`, `beds`, or `baths`.
  * Cases where `minPrice > maxPrice`.
  * `limit` out of bounds ($< 1$ or $> 100$).
  * Negative `offset` values ($< 0$).
* **Parameterized Query Building:** Constructed dynamic SQL `WHERE` clauses using array pushing and `AND` joining with `?` positional placeholders to prevent SQL injection.
* **Debug Challenge Fix:** Solved the parameter binding offset bug by maintaining pure `filterParams` for the `COUNT(*)` query and creating a shallow array copy (`[...filterParams, parsedLimit, parsedOffset]`) specifically for the paginated `LIMIT` / `OFFSET` query execution.
* **Database Indexing & Performance:** Bypassed MySQL strict mode (`Error 1067`) and created single and composite indexes to ensure efficient search execution.

---

### 🛠️ MySQL Indexing & Execution Performance Scripts

Run these inside the containerized MySQL shell (`docker exec -it idx-mysql-local mysql -u root -p`):

```sql
USE rets;

-- Bypass strict mode for legacy schema defaults
SET SESSION sql_mode = '';

-- Create single-column indexes on filtered attributes
CREATE INDEX idx_city ON rets_property(L_City);
CREATE INDEX idx_price ON rets_property(L_SystemPrice);
CREATE INDEX idx_beds ON rets_property(L_Keyword2);
CREATE INDEX idx_baths ON rets_property(LM_Dec_3);
CREATE INDEX idx_zip ON rets_property(L_Zip);

-- Create composite index for combined search filters
CREATE INDEX idx_city_price ON rets_property(L_City, L_SystemPrice);

-- Verify all created indexes exist
SHOW INDEXES FROM rets_property;

-- Verify query optimization performance (check key column is NOT NULL)
EXPLAIN SELECT * FROM rets_property WHERE LOWER(TRIM(L_City)) = 'irvine' AND L_SystemPrice >= 300000;
```
