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
docker run --name idx-mysql-local -e MYSQL_ROOT_PASSWORD=root -p 3306:3306 -d mysql:8.0

# Connect to containerized MySQL interactive shell
docker exec -it idx-mysql-local mysql -u root -p
**-- Database creation and verification

**CREATE DATABASE IF NOT EXISTS rets;
USE rets;
SHOW TABLES;
**


  
